import { BadRequestException } from '@nestjs/common';

// Mock the MP SDK so the service can construct Preference/Payment without
// hitting the network. Each test overrides the mock as needed.
const mockPaymentGet = jest.fn();
const mockPreferenceCreate = jest.fn();

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Preference: jest.fn().mockImplementation(() => ({
    create: (args: any) => mockPreferenceCreate(args),
  })),
  Payment: jest.fn().mockImplementation(() => ({
    get: (args: any) => mockPaymentGet(args),
  })),
}));

import { BillingService } from './billing.service';

type Builder = {
  insert: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  maybeSingle: jest.Mock;
  update: jest.Mock;
  single: jest.Mock;
};

function makeBuilder(overrides: Partial<Record<keyof Builder, any>> = {}): Builder {
  const b: Builder = {
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  b.select.mockReturnValue(b);
  b.eq.mockReturnValue(b);
  Object.assign(b, overrides);
  return b;
}

const DEFAULT_CONFIG: Record<string, string> = {
  MP_ACCESS_TOKEN: 'APP_USR-test-token',
  FRONTEND_URL: 'http://localhost:3000',
  BACKEND_URL: 'http://localhost:3001',
};

function makeConfig(extra: Record<string, string> = {}) {
  const map = { ...DEFAULT_CONFIG, ...extra };
  return {
    get: jest.fn((key: string) => map[key]),
    getOrThrow: jest.fn((key: string) => {
      const v = map[key];
      if (!v) throw new Error(`Missing config: ${key}`);
      return v;
    }),
  };
}

function buildService(opts: {
  buildersByTable?: Record<string, Builder>;
  rpc?: jest.Mock;
} = {}) {
  const { buildersByTable = {}, rpc } = opts;

  const supabase = {
    from: jest.fn((table: string) => {
      if (!buildersByTable[table]) buildersByTable[table] = makeBuilder();
      return buildersByTable[table];
    }),
    rpc: rpc || jest.fn().mockResolvedValue({ data: null, error: null }),
  } as any;

  const config = makeConfig();
  const notifications = { createAlert: jest.fn().mockResolvedValue(undefined) } as any;

  const service = new BillingService(supabase, config as any, notifications);
  return { service, supabase, config, notifications, builders: buildersByTable };
}

beforeEach(() => {
  mockPaymentGet.mockReset();
  mockPreferenceCreate.mockReset();
});

describe('BillingService — webhook idempotency & flow', () => {
  it('ignores events that are not payment-related', async () => {
    const { service } = buildService();
    const result = await service.handleWebhook(
      { type: 'topic_merchant_order', data: { id: '123' } },
      undefined,
      undefined,
    );
    expect(result).toEqual({ received: true, ignored: true });
    expect(mockPaymentGet).not.toHaveBeenCalled();
  });

  it('skips processing on replayed payment (dedup unique violation 23505)', async () => {
    const dedupBuilder = makeBuilder({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      }),
    });
    const rpc = jest.fn();
    const { service } = buildService({
      buildersByTable: { payment_webhook_events: dedupBuilder },
      rpc,
    });

    const result = await service.handleWebhook(
      { type: 'payment', data: { id: 'pay_replay_1' } },
      undefined,
      undefined,
    );

    expect(result).toEqual({ received: true, deduped: true });
    expect(mockPaymentGet).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('does not credit when MP payment is not approved', async () => {
    mockPaymentGet.mockResolvedValue({
      id: 'pay_pending',
      status: 'pending',
      metadata: { tenant_id: 't1', kind: 'credits', target: 'credits_10' },
    });
    const rpc = jest.fn();
    const { service } = buildService({ rpc });

    const result = await service.handleWebhook(
      { type: 'payment', data: { id: 'pay_pending' } },
      undefined,
      undefined,
    );

    expect(result).toMatchObject({ received: true, status: 'pending' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('credits the wallet on a fresh approved credit-pack payment', async () => {
    mockPaymentGet.mockResolvedValue({
      id: 'pay_credits_30',
      status: 'approved',
      metadata: { tenant_id: 'tenant_1', user_id: 'user_1', kind: 'credits', target: 'credits_30' },
    });

    const ledgerBuilder = makeBuilder({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });

    const { service } = buildService({
      buildersByTable: { credit_ledger: ledgerBuilder },
      rpc,
    });

    const result = await service.handleWebhook(
      { type: 'payment', data: { id: 'pay_credits_30' } },
      undefined,
      undefined,
    );

    expect(result).toEqual({ received: true });
    expect(rpc).toHaveBeenCalledWith(
      'add_credits',
      expect.objectContaining({
        p_tenant_id: 'tenant_1',
        p_amount: 30,
        p_reference_id: 'pay_credits_30',
      }),
    );
  });

  it('skips credit RPC if the ledger already has a purchase row for the payment', async () => {
    mockPaymentGet.mockResolvedValue({
      id: 'pay_dup_credits',
      status: 'approved',
      metadata: { tenant_id: 't1', kind: 'credits', target: 'credits_10' },
    });

    const ledgerBuilder = makeBuilder({
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 'ledger_existing' },
        error: null,
      }),
    });
    const rpc = jest.fn();

    const { service } = buildService({
      buildersByTable: { credit_ledger: ledgerBuilder },
      rpc,
    });

    await service.handleWebhook(
      { type: 'payment', data: { id: 'pay_dup_credits' } },
      undefined,
      undefined,
    );

    expect(rpc).not.toHaveBeenCalled();
  });

  it('updates tenant on a fresh approved plan payment', async () => {
    mockPaymentGet.mockResolvedValue({
      id: 'pay_plan_pro',
      status: 'approved',
      metadata: { tenant_id: 'tenant_1', user_id: 'user_1', kind: 'plan', target: 'pro' },
    });

    const tenantBuilder = makeBuilder();
    const { service, notifications } = buildService({
      buildersByTable: { tenants: tenantBuilder },
    });

    const result = await service.handleWebhook(
      { type: 'payment', data: { id: 'pay_plan_pro' } },
      undefined,
      undefined,
    );

    expect(result).toEqual({ received: true });
    expect(tenantBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'pro',
        subscription_status: 'active',
        max_users: 5,
        max_contracts_per_month: 25,
      }),
    );
    expect(notifications.createAlert).toHaveBeenCalled();
  });

  it('rejects webhook with bad MP signature when MP_WEBHOOK_SECRET is set', async () => {
    const supabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    } as any;
    const config = {
      get: jest.fn((k: string) => {
        if (k === 'MP_ACCESS_TOKEN') return 'APP_USR-test';
        if (k === 'MP_WEBHOOK_SECRET') return 'super-secret';
        return undefined;
      }),
      getOrThrow: jest.fn(),
    };
    const service = new BillingService(supabase, config as any, {
      createAlert: jest.fn(),
    } as any);

    await expect(
      service.handleWebhook(
        { type: 'payment', data: { id: 'pay_with_sig' } },
        'ts=999,v1=deadbeef',
        'req-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
