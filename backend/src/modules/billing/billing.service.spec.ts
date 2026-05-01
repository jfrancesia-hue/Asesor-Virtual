import { BadRequestException } from '@nestjs/common';
import type Stripe from 'stripe';
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
    update: jest.fn(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  // Chain by default: select().eq().eq().maybeSingle()
  b.select.mockReturnValue(b);
  b.eq.mockReturnValue(b);
  b.update.mockReturnValue(b);
  Object.assign(b, overrides);
  return b;
}

const STRIPE_KEYS: Record<string, string> = {
  STRIPE_SECRET_KEY: 'sk_test_xxx',
  STRIPE_WEBHOOK_SECRET: 'whsec_xxx',
  STRIPE_PRICE_CREDITS_10: 'price_credits_10',
  STRIPE_PRICE_CREDITS_30: 'price_credits_30',
  STRIPE_PRICE_CREDITS_100: 'price_credits_100',
  FRONTEND_URL: 'http://localhost:3000',
};

function makeConfig(extra: Record<string, string> = {}) {
  const map = { ...STRIPE_KEYS, ...extra };
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
  configMap?: Record<string, string>;
  stripeMock?: any;
} = {}) {
  const { buildersByTable = {}, rpc, configMap, stripeMock } = opts;

  const supabase = {
    from: jest.fn((table: string) => {
      if (!buildersByTable[table]) buildersByTable[table] = makeBuilder();
      return buildersByTable[table];
    }),
    rpc: rpc || jest.fn().mockResolvedValue({ data: null, error: null }),
  } as any;

  const config = makeConfig(configMap);
  const notifications = { createAlert: jest.fn().mockResolvedValue(undefined) } as any;

  const service = new BillingService(supabase, config as any, notifications);
  // Bypass real Stripe constructor — inject the mock directly
  (service as any).stripe = stripeMock ?? {
    webhooks: { constructEvent: jest.fn() },
    checkout: { sessions: { listLineItems: jest.fn() } },
    subscriptions: { retrieve: jest.fn() },
    customers: { create: jest.fn() },
  };

  return { service, supabase, config, notifications, builders: buildersByTable };
}

describe('BillingService — webhook idempotency', () => {
  it('rejects an invalid Stripe signature with BadRequestException', async () => {
    const { service } = buildService();
    (service as any).stripe.webhooks.constructEvent = jest.fn(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'bad-sig'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('processes a fresh checkout.session.completed event and inserts dedup row', async () => {
    const dedupeBuilder = makeBuilder();
    const ledgerBuilder = makeBuilder({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const event: Stripe.Event = {
      id: 'evt_fresh_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_1',
          mode: 'payment',
          metadata: { tenantId: 'tenant_1', userId: 'user_1' },
        } as any,
      },
    } as any;

    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
    const { service, supabase } = buildService({
      buildersByTable: {
        stripe_webhook_events: dedupeBuilder,
        credit_ledger: ledgerBuilder,
      },
      rpc,
    });
    (service as any).stripe.webhooks.constructEvent = jest.fn().mockReturnValue(event);
    (service as any).stripe.checkout.sessions.listLineItems = jest.fn().mockResolvedValue({
      data: [{ price: { id: 'price_credits_10' } }],
    });

    const result = await service.handleWebhook(Buffer.from('{}'), 'sig');

    expect(result).toEqual({ received: true });
    // Dedup row insertada con event.id correcto
    expect(dedupeBuilder.insert).toHaveBeenCalledWith({
      event_id: 'evt_fresh_1',
      event_type: 'checkout.session.completed',
    });
    // Lookup en credit_ledger por reference_id
    expect(ledgerBuilder.select).toHaveBeenCalledWith('id');
    expect(ledgerBuilder.eq).toHaveBeenCalledWith('reference_id', 'cs_test_1');
    // Y add_credits efectivamente llamado
    expect(rpc).toHaveBeenCalledWith(
      'add_credits',
      expect.objectContaining({
        p_tenant_id: 'tenant_1',
        p_amount: 10,
        p_reference_id: 'cs_test_1',
      }),
    );
    // El supabase.from solo se invocó para tablas esperadas
    expect(supabase.from).toHaveBeenCalledWith('stripe_webhook_events');
    expect(supabase.from).toHaveBeenCalledWith('credit_ledger');
  });

  it('skips processing on replayed event (Postgres unique violation 23505)', async () => {
    const dedupeBuilder = makeBuilder({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      }),
    });

    const event: Stripe.Event = {
      id: 'evt_replay_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_replay',
          mode: 'payment',
          metadata: { tenantId: 'tenant_1' },
        } as any,
      },
    } as any;

    const rpc = jest.fn();
    const { service, supabase } = buildService({
      buildersByTable: { stripe_webhook_events: dedupeBuilder },
      rpc,
    });
    (service as any).stripe.webhooks.constructEvent = jest.fn().mockReturnValue(event);
    const listLineItems = jest.fn();
    (service as any).stripe.checkout.sessions.listLineItems = listLineItems;

    const result = await service.handleWebhook(Buffer.from('{}'), 'sig');

    expect(result).toEqual({ received: true, deduped: true });
    // Handler NO ejecutado: ni rpc, ni listLineItems, ni acceso a credit_ledger
    expect(rpc).not.toHaveBeenCalled();
    expect(listLineItems).not.toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('stripe_webhook_events');
    expect(supabase.from).not.toHaveBeenCalledWith('credit_ledger');
  });

  it('processes anyway if dedup insert fails with non-unique error (fail-open)', async () => {
    const dedupeBuilder = makeBuilder({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: { code: '08006', message: 'connection reset' },
      }),
    });
    const ledgerBuilder = makeBuilder();

    const event: Stripe.Event = {
      id: 'evt_db_fail',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_failopen',
          mode: 'payment',
          metadata: { tenantId: 'tenant_1' },
        } as any,
      },
    } as any;

    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
    const { service } = buildService({
      buildersByTable: {
        stripe_webhook_events: dedupeBuilder,
        credit_ledger: ledgerBuilder,
      },
      rpc,
    });
    (service as any).stripe.webhooks.constructEvent = jest.fn().mockReturnValue(event);
    (service as any).stripe.checkout.sessions.listLineItems = jest.fn().mockResolvedValue({
      data: [{ price: { id: 'price_credits_30' } }],
    });

    const result = await service.handleWebhook(Buffer.from('{}'), 'sig');

    expect(result).toEqual({ received: true });
    // Procesó porque preferimos doble-procesar a perder el evento
    expect(rpc).toHaveBeenCalled();
  });
});

describe('BillingService — credit pack second-line idempotency', () => {
  function makeCheckoutEvent(sessionId: string): Stripe.Event {
    return {
      id: `evt_${sessionId}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          mode: 'payment',
          metadata: { tenantId: 'tenant_1', userId: 'user_1' },
        } as any,
      },
    } as any;
  }

  it('skips RPC when credit_ledger already has a purchase row for this session', async () => {
    const dedupeBuilder = makeBuilder();
    const ledgerBuilder = makeBuilder({
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 'ledger_existing' },
        error: null,
      }),
    });

    const rpc = jest.fn();
    const { service } = buildService({
      buildersByTable: {
        stripe_webhook_events: dedupeBuilder,
        credit_ledger: ledgerBuilder,
      },
      rpc,
    });
    (service as any).stripe.webhooks.constructEvent = jest
      .fn()
      .mockReturnValue(makeCheckoutEvent('cs_existing_pack'));
    const listLineItems = jest.fn();
    (service as any).stripe.checkout.sessions.listLineItems = listLineItems;

    const result = await service.handleWebhook(Buffer.from('{}'), 'sig');

    expect(result).toEqual({ received: true });
    expect(rpc).not.toHaveBeenCalled();
    // Ni se molestó en pedir line items
    expect(listLineItems).not.toHaveBeenCalled();
  });

  it('swallows add_credits unique violation (race against partial index)', async () => {
    const dedupeBuilder = makeBuilder();
    const ledgerBuilder = makeBuilder();

    const rpc = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key' },
    });

    const { service } = buildService({
      buildersByTable: {
        stripe_webhook_events: dedupeBuilder,
        credit_ledger: ledgerBuilder,
      },
      rpc,
    });
    (service as any).stripe.webhooks.constructEvent = jest
      .fn()
      .mockReturnValue(makeCheckoutEvent('cs_race'));
    (service as any).stripe.checkout.sessions.listLineItems = jest.fn().mockResolvedValue({
      data: [{ price: { id: 'price_credits_100' } }],
    });

    // No debe propagar error — la carrera está protegida por el unique partial index
    await expect(
      service.handleWebhook(Buffer.from('{}'), 'sig'),
    ).resolves.toEqual({ received: true });
    expect(rpc).toHaveBeenCalled();
  });

  it('logs and bails when priceId does not map to a known credit pack (misconfig)', async () => {
    const dedupeBuilder = makeBuilder();
    const ledgerBuilder = makeBuilder();
    const rpc = jest.fn();

    const { service } = buildService({
      buildersByTable: {
        stripe_webhook_events: dedupeBuilder,
        credit_ledger: ledgerBuilder,
      },
      rpc,
    });
    (service as any).stripe.webhooks.constructEvent = jest
      .fn()
      .mockReturnValue(makeCheckoutEvent('cs_misconf'));
    (service as any).stripe.checkout.sessions.listLineItems = jest.fn().mockResolvedValue({
      data: [{ price: { id: 'price_unknown_pack' } }],
    });

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'sig'),
    ).resolves.toEqual({ received: true });
    // Nunca se intentó acreditar
    expect(rpc).not.toHaveBeenCalled();
  });
});
