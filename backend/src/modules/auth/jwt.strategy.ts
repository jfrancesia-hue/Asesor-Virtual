import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

const ACCESS_COOKIE = 'av_access';

function cookieExtractor(req: Request): string | null {
  return req?.cookies?.[ACCESS_COOKIE] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
  ) {
    super({
      // Cookie httpOnly primero, fallback a Bearer header (Swagger / tests / dev)
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload & { type?: string }) {
    // Refresh tokens no deben servir como access tokens
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Token de refresh no válido como access');
    }

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
