import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'dev-only-change-this-secret-before-production'),
    });
  }

  async validate(payload: JwtPayload) {
    const { data: user } = await this.supabase
      .from('users')
      .select('id, is_active, role, tenant_id')
      .eq('id', payload.sub)
      .single();

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Sesión inválida o usuario inactivo');
    }

    return payload;
  }
}
