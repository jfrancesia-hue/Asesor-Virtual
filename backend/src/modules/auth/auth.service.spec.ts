import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

type Builder = {
  insert: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
};

function makeBuilder(overrides: Partial<Record<keyof Builder, any>> = {}): Builder {
  const b: Builder = {
    insert: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  b.insert.mockReturnValue(b);
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
    sign: jest.fn((payload, _options) => {
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
    auth: {
      admin: {
        createUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'auth_user_1' } },
          error: null,
        }),
        deleteUser: jest.fn().mockResolvedValue({ error: null }),
      },
      signInWithPassword: jest.fn(),
    },
    from: jest.fn((table: string) => {
      if (!supabaseBuilders[table]) supabaseBuilders[table] = makeBuilder();
      return supabaseBuilders[table];
    }),
  } as any;

  const service = new AuthService(supabase, jwtService as any, config as any);

  return { service, jwtService, config, supabase, builders: supabaseBuilders };
}

describe('AuthService.register', () => {
  it('creates new accounts on the free plan, not Start', async () => {
    const tenantBuilder = makeBuilder({
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'tenant_1',
          name: 'Juan Perez',
          slug: 'juan-perez-abc12',
          plan: 'free',
        },
        error: null,
      }),
    });
    const userBuilder = makeBuilder({
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'auth_user_1',
          email: 'juan@example.com',
          full_name: 'Juan Perez',
          role: 'owner',
        },
        error: null,
      }),
    });

    const { service } = buildService({
      supabaseBuilders: { tenants: tenantBuilder, users: userBuilder },
    });

    const result = await service.register({
      fullName: 'Juan Perez',
      email: 'juan@example.com',
      password: 'password123',
      country: 'AR',
    } as any);

    expect(tenantBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
      plan: 'free',
      subscription_status: 'free',
      max_users: 1,
      max_contracts_per_month: 1,
      max_ai_queries_per_month: 2,
      max_analysis_credits: 1,
    }));
    expect(result.tenant.plan).toBe('free');
  });
});

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
