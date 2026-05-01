import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

const REFRESH_TOKEN_TYPE = 'refresh';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
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

      const tokens = this.issueTokens(user.id, user.email, tenant.id, user.role);

      return {
        ...tokens,
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan },
      };
    } catch (error) {
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

    this.supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)
      .then(() => {}, () => {});

    const tokens = this.issueTokens(user.id, user.email, user.tenant_id, user.role);

    return {
      ...tokens,
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

  async refresh(refreshToken: string | undefined): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token ausente');
    }

    let payload: JwtPayload & { type?: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    if (payload.type !== REFRESH_TOKEN_TYPE) {
      throw new UnauthorizedException('Token no es de refresh');
    }

    const { data: user } = await this.supabase
      .from('users')
      .select('id, email, tenant_id, role, is_active')
      .eq('id', payload.sub)
      .single();

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    return this.issueTokens(user.id, user.email, user.tenant_id, user.role);
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

  private issueTokens(userId: string, email: string, tenantId: string, role: string): AuthTokens {
    const basePayload = { sub: userId, email, tenantId, role };
    const accessToken = this.jwtService.sign(basePayload);
    const refreshToken = this.jwtService.sign(
      { ...basePayload, type: REFRESH_TOKEN_TYPE },
      { expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d') },
    );
    return { accessToken, refreshToken };
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
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
