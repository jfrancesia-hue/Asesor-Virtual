import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Patch,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService, AuthTokens } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './auth.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsObject } from 'class-validator';

class UpdateProfileDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsObject() preferences?: object;
}

const ACCESS_COOKIE = 'av_access';
const REFRESH_COOKIE = 'av_refresh';
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000; // 15 min
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 req per min for registration
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    return { user: result.user, tenant: result.tenant };
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 req per min for login
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    return { user: result.user, tenant: result.tenant };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const tokens = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, tokens);
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookies(res);
    return { ok: true };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const origin = this.resolveSafeOrigin(req);
    const redirectTo = `${origin}/auth/reset-password`;
    await this.authService.requestPasswordReset(dto.email, redirectTo);
    return { ok: true };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPasswordWithToken(dto.accessToken, dto.newPassword);
    return { ok: true };
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.sub, dto);
  }

  private setAuthCookies(res: Response, tokens: AuthTokens) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const baseOptions = {
      httpOnly: true,
      secure: isProd,
      // 'lax' es seguro contra CSRF en navegaciones top-level (cubre el redirect
      // de MP de vuelta a /settings?tab=billing) y bloquea cross-site POSTs.
      // 'none' sólo es necesario si el frontend está en un dominio distinto
      // al que sirve cookies — acá el frontend hace rewrites de /api a Render,
      // así que desde el browser todo es same-origin (miasesor.com.ar).
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...baseOptions,
      maxAge: ACCESS_MAX_AGE_MS,
    });

    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...baseOptions,
      maxAge: REFRESH_MAX_AGE_MS,
    });
  }

  private isAllowedOrigin(origin: string): boolean {
    const allowed = new Set([
      'https://www.miasesor.com.ar',
      'https://miasesor.com.ar',
      'https://tuasesor-web.vercel.app',
      'http://localhost:3000',
    ]);
    if (allowed.has(origin)) return true;
    return /^https:\/\/tuasesor-web-[a-z0-9-]+\.vercel\.app$/.test(origin);
  }

  private resolveSafeOrigin(req: Request): string {
    const tryParse = (value: unknown): string | null => {
      if (!value) return null;
      try {
        const url = new URL(value.toString());
        return `${url.protocol}//${url.host}`;
      } catch {
        return null;
      }
    };

    const candidates: (string | null)[] = [
      tryParse(req.headers.origin),
      tryParse(req.headers.referer),
    ];

    const fwdHost = req.headers['x-forwarded-host'];
    const fwdProto = req.headers['x-forwarded-proto'] || 'https';
    if (fwdHost) {
      const host = Array.isArray(fwdHost) ? fwdHost[0] : fwdHost;
      candidates.push(`${fwdProto}://${host}`);
    }

    for (const c of candidates) {
      if (c && this.isAllowedOrigin(c)) return c;
    }

    const fallback =
      this.config.get<string>('FRONTEND_URL') || 'https://www.miasesor.com.ar';
    return fallback.replace(/\/+$/, '');
  }

  private clearAuthCookies(res: Response) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const baseOptions = {
      httpOnly: true,
      secure: isProd,
      // 'lax' es seguro contra CSRF en navegaciones top-level (cubre el redirect
      // de MP de vuelta a /settings?tab=billing) y bloquea cross-site POSTs.
      // 'none' sólo es necesario si el frontend está en un dominio distinto
      // al que sirve cookies — acá el frontend hace rewrites de /api a Render,
      // así que desde el browser todo es same-origin (miasesor.com.ar).
      sameSite: 'lax' as const,
      path: '/',
    };
    res.clearCookie(ACCESS_COOKIE, baseOptions);
    res.clearCookie(REFRESH_COOKIE, baseOptions);
  }
}
