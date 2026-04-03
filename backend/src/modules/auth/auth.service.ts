import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already')) {
        throw new ConflictException('Ya existe una cuenta con ese email');
      }
      throw new InternalServerErrorException('Error al crear usuario: ' + authError.message);
    }

    const authUserId = authData.user.id;

    try {
      // 2. Create tenant
      const slug = this.generateSlug(dto.companyName || dto.fullName);
      const { data: tenant, error: tenantError } = await this.supabase
        .from('tenants')
        .insert({
          name: dto.companyName || dto.fullName,
          slug,
          plan: 'start',
          country: dto.country || 'AR',
          legal_jurisdiction: this.getJurisdiction(dto.country || 'AR'),
          max_users: 1,
          max_contracts_per_month: 5,
          max_ai_queries_per_month: 20,
          max_analysis_credits: 2,
        })
        .select()
        .single();

      if (tenantError) throw new Error('Error al crear tenant: ' + tenantError.message);

      // 3. Create user record
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .insert({
          id: authUserId,
          tenant_id: tenant.id,
          email: dto.email,
          full_name: dto.fullName,
          role: 'owner',
          is_active: true,
        })
        .select()
        .single();

      if (userError) throw new Error('Error al crear perfil: ' + userError.message);

      const token = this.signToken(user.id, user.email, tenant.id, user.role);

      return {
        token,
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan },
      };
    } catch (error) {
      // Rollback: delete auth user if tenant/user creation failed
      await this.supabase.auth.admin.deleteUser(authUserId).catch(() => {});
      this.logger.error('Register rollback executed', error.message);
      throw new InternalServerErrorException(error.message || 'Error al registrar');
    }
  }

  async login(dto: LoginDto) {
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (authError || !authData.user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('*, tenant:tenants(*)')
      .eq('id', authData.user.id)
      .single();

    if (userError || !user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    // Fire-and-forget last_login update
    this.supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)
      .then(() => {}, () => {});

    const token = this.signToken(user.id, user.email, user.tenant_id, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        preferences: user.preferences,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
        country: user.tenant.country,
      },
    };
  }

  async getProfile(userId: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*, tenant:tenants(*)')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('Perfil no encontrado');
    }

    const { data: wallet } = await this.supabase
      .from('credit_wallets')
      .select('balance')
      .eq('tenant_id', user.tenant_id)
      .single();

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        preferences: user.preferences,
        lastLogin: user.last_login,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
        country: user.tenant.country,
        legalJurisdiction: user.tenant.legal_jurisdiction,
        maxUsers: user.tenant.max_users,
        maxContracts: user.tenant.max_contracts_per_month,
        maxQueries: user.tenant.max_ai_queries_per_month,
        creditBalance: wallet?.balance ?? 0,
        subscriptionStatus: user.tenant.subscription_status,
      },
    };
  }

  async updateProfile(userId: string, updates: { fullName?: string; preferences?: object }) {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        ...(updates.fullName && { full_name: updates.fullName }),
        ...(updates.preferences && { preferences: updates.preferences }),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException('Error al actualizar perfil');
    return { id: data.id, email: data.email, fullName: data.full_name, preferences: data.preferences };
  }

  private signToken(userId: string, email: string, tenantId: string, role: string): string {
    return this.jwtService.sign({ sub: userId, email, tenantId, role });
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    return `${base}-${Math.random().toString(36).substring(2, 7)}`;
  }

  private getJurisdiction(country: string): string {
    const map: Record<string, string> = {
      AR: 'argentina',
      MX: 'mexico',
      CO: 'colombia',
      CL: 'chile',
      PE: 'peru',
    };
    return map[country.toUpperCase()] || 'argentina';
  }
}
