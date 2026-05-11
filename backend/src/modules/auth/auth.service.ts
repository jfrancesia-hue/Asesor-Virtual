import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
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
const FREE_PLAN_LIMITS = {
  max_users: 1,
  max_contracts_per_month: 1,
  max_ai_queries_per_month: 2,
  max_analysis_credits: 1,
};

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
    // Normalizar email: lowercase + trim. Sin esto, "Juan@Email.com" y
    // "juan@email.com" generan dos cuentas distintas, y el segundo no puede
    // loguear con la capitalización del primero.
    const email = dto.email.toLowerCase().trim();

    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email,
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
    let tenantIdToRollback: string | null = null;

    try {
      const slug = this.generateSlug(dto.companyName || dto.fullName);
      const { data: tenant, error: tenantError } = await this.supabase
        .from('tenants')
        .insert({
          name: dto.companyName || dto.fullName,
          slug,
          plan: 'free',
          subscription_status: 'free',
          country: dto.country || 'AR',
          legal_jurisdiction: this.getJurisdiction(dto.country || 'AR'),
          ...FREE_PLAN_LIMITS,
        })
        .select()
        .single();

      if (tenantError) throw new Error('Error al crear tenant: ' + tenantError.message);
      tenantIdToRollback = tenant.id;

      const { data: user, error: userError } = await this.supabase
        .from('users')
        .insert({
          id: authUserId,
          tenant_id: tenant.id,
          email,
          full_name: dto.fullName,
          role: 'owner',
          is_active: true,
          accepted_terms_version: dto.acceptedTermsVersion ?? null,
          accepted_terms_at: dto.acceptedTermsVersion ? new Date().toISOString() : null,
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
      // Rollback completo: borrar tenant huérfano si llegó a crearse, después borrar auth user.
      if (tenantIdToRollback) {
        await this.supabase
          .from('tenants')
          .delete()
          .eq('id', tenantIdToRollback)
          .then(
            (res) => {
              if (res.error) this.logger.warn(`Rollback tenant delete falló: ${res.error.message}`);
            },
            (err) => this.logger.warn(`Rollback tenant delete error: ${err?.message ?? err}`),
          );
      }
      await this.supabase.auth.admin.deleteUser(authUserId).catch((err) =>
        this.logger.warn(`Rollback auth user delete error: ${err?.message ?? err}`),
      );
      this.logger.error('Register rollback executed', error.message);
      throw new InternalServerErrorException(error.message || 'Error al registrar');
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    // Verificamos password con HTTP directo al endpoint anon de Supabase Auth.
    // No usamos this.supabase.auth.signInWithPassword porque ese método mete
    // el JWT authenticated del usuario en el state interno del cliente
    // singleton — y las queries siguientes van con ese JWT, que cae en RLS.
    const authUserId = await this.verifyPasswordViaSupabase(email, dto.password);

    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('*, tenant:tenants(*)')
      .eq('id', authUserId)
      .single();

    if (userError || !user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    if (!user.tenant) {
      this.logger.error(
        `Login bloqueado: user ${user.id} (${user.email}) sin tenant asociado (tenant_id=${user.tenant_id})`,
      );
      throw new UnauthorizedException(
        'Tu cuenta no tiene una organización asociada. Contactanos para restaurarla.',
      );
    }

    this.supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)
      .then(
        (res) => {
          if (res.error) this.logger.warn(`last_login update failed: ${res.error.message}`);
        },
        (err) => this.logger.warn(`last_login update error: ${err?.message ?? err}`),
      );

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

  private async verifyPasswordViaSupabase(email: string, password: string): Promise<string> {
    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL');
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY');
    if (!anonKey) {
      this.logger.error('SUPABASE_ANON_KEY no configurada — login deshabilitado');
      throw new InternalServerErrorException('Auth provider no configurado');
    }

    let res: Response;
    try {
      res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ email, password }),
      });
    } catch (err: any) {
      this.logger.error(`No pude contactar a Supabase Auth: ${err?.message ?? err}`);
      throw new InternalServerErrorException('No pudimos verificar tu cuenta en este momento');
    }

    if (!res.ok) {
      // Supabase devuelve 400 con error_description en casos de creds malas, email no confirmado, etc.
      // No queremos filtrar cuál de los dos para no facilitar enumeración de cuentas.
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const tokenData = (await res.json()) as { user?: { id?: string } };
    const userId = tokenData?.user?.id;
    if (!userId) {
      this.logger.error(`Token response sin user.id: ${JSON.stringify(tokenData).slice(0, 200)}`);
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    return userId;
  }

  async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    const normalized = email.toLowerCase().trim();
    const { error } = await this.supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo,
    });
    if (error) {
      this.logger.warn(`resetPasswordForEmail falló para ${normalized}: ${error.message}`);
    }
  }

  async resetPasswordWithToken(accessToken: string, newPassword: string): Promise<void> {
    let payload: { sub?: string };
    try {
      const part = accessToken.split('.')[1];
      const decoded = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
      payload = JSON.parse(decoded);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Token sin identificador de usuario');
    }

    const { error } = await this.supabase.auth.admin.updateUserById(payload.sub, {
      password: newPassword,
    });

    if (error) {
      this.logger.error(`updateUserById falló para ${payload.sub}: ${error.message}`);
      throw this.mapPasswordError(error.message || '');
    }
  }

  private mapPasswordError(rawMessage: string) {
    const msg = rawMessage.toLowerCase();

    if (msg.includes('one character of each') || msg.includes('required characters')) {
      return new BadRequestException(
        'Tu contraseña debe incluir al menos una letra mayúscula, una minúscula y un número.',
      );
    }

    if (
      (msg.includes('at least') && (msg.includes('characters') || msg.includes('character'))) ||
      msg.includes('too short')
    ) {
      return new BadRequestException('Tu contraseña debe tener al menos 8 caracteres.');
    }

    if (msg.includes('pwned') || msg.includes('breach') || msg.includes('leak') || msg.includes('compromised')) {
      return new BadRequestException(
        'Esa contraseña aparece en filtraciones conocidas de otros sitios. Elegí una distinta.',
      );
    }

    if (msg.includes('weak')) {
      return new BadRequestException('La contraseña es demasiado fácil de adivinar. Probá una distinta.');
    }

    if (msg.includes('same') && msg.includes('password')) {
      return new BadRequestException('La contraseña nueva no puede ser igual a la anterior.');
    }

    if (msg.includes('expired')) {
      return new UnauthorizedException(
        'El link del email expiró. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".',
      );
    }

    if (msg.includes('invalid token') || msg.includes('jwt')) {
      return new UnauthorizedException(
        'El link del email ya no es válido. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".',
      );
    }

    if (msg.includes('not found') || msg.includes('no user')) {
      return new BadRequestException('No encontramos una cuenta asociada a este link.');
    }

    if (msg.includes('rate') || msg.includes('too many')) {
      return new BadRequestException('Probaste muchas veces seguidas. Esperá un minuto y volvé a intentar.');
    }

    return new InternalServerErrorException(
      'No pudimos actualizar tu contraseña. Probá de nuevo en unos minutos o escribinos.',
    );
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
