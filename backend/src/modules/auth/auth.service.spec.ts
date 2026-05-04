import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

type Builder = {
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
};

function makeBuilder(overrides: Partial<Record<keyof Builder, any>> = {}): Builder {
  const b: Builder = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  b.select.mockReturnValue(b);
  b.eq.mockReturnValue(b);
  Object.assign(b, overrides);
  return b;
}

function buildService(opts: {
  jwtMock?: any;
  configMap?: Record<string, string>;
  supabaseBuilders?: Record<string, Builder>;
} = {}) {
  const { jwtMock, configMap = {}, supabaseBuilders = {} } = opts;

  const jwtService = jwtMock || {
    sign: jest.fn((payload, options) => {
      return `jwt_token_${JSON.stringify(payload)}`;
    }),
    verify: jest.fn(),
  };

  const config = {
    getOrThrow: jest.fn((key: string) => {
      const v = configMap[key] || `default_${key}`;
      if (!v) throw new Error(`Missing config: ${key}`);
      return v;
    }),
    get: jest.fn((key: string) => configMap[key] || undefined),
  };

  const supabase = {
    from: jest.fn((table: string) => {
      if (!supabaseBuilders[table]) supabaseBuilders[table] = makeBuilder();
      return supabaseBuilders[table];
    }),
  } as any;

  const service = new AuthService(supabase, jwtService as any, config as any);

  return { service, jwtService, config, supabase, builders: supabaseBuilders };
}

describe('AuthService.refresh', () => {
  it('rejects when refreshToken is undefined', async () => {
    const { service } = buildService();

    await expect(service.refresh(undefined)).rejects.toThrow(
      new UnauthorizedException('Refresh token ausente'),
    );
  });

  it('rejects when refreshToken is invalid (JWT verify fails)', async () => {
    const { service, jwtService } = buildService();

    jwtService.verify.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    await expect(service.refresh('invalid_token')).rejects.toThrow(
      new UnauthorizedException('Refresh token inválido o expirado'),
    );
  });

  it('rejects when token type is not "refresh" (e.g., access token misused)', async () => {
    const { service, jwtService } = buildService();

    // Simular un access token (sin field "type", o type !== 'refresh')
    jwtService.verify.mockReturnValue({
      sub: 'user_1',
      email: 'user@example.com',
      tenantId: 'tenant_1',
      role: 'owner',
      // Sin "type" o type !== 'refresh'
    });

    await expect(service.refresh('access_token')).rejects.toThrow(
      new UnauthorizedException('Token no es de refresh'),
    );
  });

  it('rejects when user is inactive', async () => {
    const userBuilder = makeBuilder({
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'user_1',
          email: 'user@example.com',
          tenant_id: 'tenant_1',
          role: 'owner',
          is_active: false,
        },
        error: null,
      }),
    });

    const { service, jwtService } = buildService({
      supabaseBuilders: { users: userBuilder },
    });

    jwtService.verify.mockReturnValue({
      sub: 'user_1',
      email: 'user@example.com',
      tenantId: 'tenant_1',
      role: 'owner',
      type: 'refresh',
    });

    await expect(service.refresh('valid_refresh_token')).rejects.toThrow(
      new UnauthorizedException('Usuario inactivo o no encontrado'),
    );
  });

  it('rejects when user does not exist', async () => {
    const userBuilder = makeBuilder({
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    const { service, jwtService } = buildService({
      supabaseBuilders: { users: userBuilder },
    });

    jwtService.verify.mockReturnValue({
      sub: 'user_nonexistent',
      email: 'user@example.com',
      tenantId: 'tenant_1',
      role: 'owner',
      type: 'refresh',
    });

    await expect(service.refresh('valid_refresh_token')).rejects.toThrow(
      new UnauthorizedException('Usuario inactivo o no encontrado'),
    );
  });

  it('returns new tokens when refresh token is valid and user is active', async () => {
    const userBuilder = makeBuilder({
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'user_1',
          email: 'user@example.com',
          tenant_id: 'tenant_1',
          role: 'owner',
          is_active: true,
        },
        error: null,
      }),
    });

    const { service, jwtService } = buildService({
      supabaseBuilders: { users: userBuilder },
    });

    jwtService.verify.mockReturnValue({
      sub: 'user_1',
      email: 'user@example.com',
      tenantId: 'tenant_1',
      role: 'owner',
      type: 'refresh',
    });

    const result = await service.refresh('valid_refresh_token');

    // issueTokens debe llamarse con los datos del usuario
    expect(jwtService.sign).toHaveBeenCalled();
    expect(result).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    // Debe haber consultado la BD por el usuario
    expect(userBuilder.select).toHaveBeenCalledWith('id, email, tenant_id, role, is_active');
    expect(userBuilder.eq).toHaveBeenCalledWith('id', 'user_1');
  });
});
