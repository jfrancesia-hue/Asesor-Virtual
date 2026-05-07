import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

const ACCESS_COOKIE = 'av_access';

function cookieExtractor(req: Request): string | null {
  return req?.cookies?.[ACCESS_COOKIE] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
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

    // Confiamos en el access token durante su TTL (15 min). Eliminamos la
    // consulta a Supabase por request — antes ese SELECT era N+1 contra
    // todos los endpoints autenticados y, además, devolvíamos `payload`
    // sin usar los datos frescos. Si necesitás invalidar a un usuario en
    // tiempo real, invalidalo a nivel del refresh token (refresh.ts hace
    // ese lookup) — el próximo refresh de 15 min cierra la ventana.
    return payload;
  }
}
