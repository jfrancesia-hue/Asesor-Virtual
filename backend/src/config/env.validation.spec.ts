import 'reflect-metadata';
import { validateEnv } from './env.validation';

describe('env.validation — validateEnv', () => {
  const validTestEnv = {
    NODE_ENV: 'development',
    PORT: 3001,
    FRONTEND_URL: 'http://localhost:3000',
    JWT_SECRET: 'a'.repeat(64),
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
    STRIPE_SECRET_KEY: 'sk_test_123456',
    STRIPE_WEBHOOK_SECRET: 'whsec_123456',
    AI_PROVIDER: 'anthropic',
    ANTHROPIC_API_KEY: 'sk-ant-test',
  };

  it('rejects JWT_SECRET with placeholder value', () => {
    const config = {
      ...validTestEnv,
      JWT_SECRET: 'change-this-super-secret-key-minimum-64-chars',
    };

    expect(() => validateEnv(config)).toThrow();
    expect(() => validateEnv(config)).toThrow(
      /JWT_SECRET no puede ser el valor por defecto/,
    );
  });

  it('rejects JWT_SECRET shorter than 64 characters', () => {
    const config = {
      ...validTestEnv,
      JWT_SECRET: 'short_secret',
    };

    expect(() => validateEnv(config)).toThrow();
    expect(() => validateEnv(config)).toThrow(/JWT_SECRET debe tener al menos 64 caracteres/);
  });

  it('accepts valid JWT_SECRET (64+ chars, not placeholder)', () => {
    const config = validTestEnv;
    expect(() => validateEnv(config)).not.toThrow();
  });

  it('rejects in production without STRIPE_PRICE_START', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'production',
      OPENAI_API_KEY: 'sk-prod-123456',
      RESEND_API_KEY: 're_test_123',
      // Missing STRIPE_PRICE_START, STRIPE_PRICE_PRO, etc.
    };

    expect(() => validateEnv(config)).toThrow();
    expect(() => validateEnv(config)).toThrow(/STRIPE_PRICE_START/);
  });

  it('rejects in production without RESEND_API_KEY', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'production',
      OPENAI_API_KEY: 'sk-prod-123456',
      STRIPE_PRICE_START: 'price_start',
      STRIPE_PRICE_PRO: 'price_pro',
      STRIPE_PRICE_ENTERPRISE: 'price_enterprise',
      STRIPE_PRICE_CREDITS_10: 'price_10',
      STRIPE_PRICE_CREDITS_30: 'price_30',
      STRIPE_PRICE_CREDITS_100: 'price_100',
      // Missing RESEND_API_KEY
    };

    expect(() => validateEnv(config)).toThrow();
    expect(() => validateEnv(config)).toThrow(/RESEND_API_KEY/);
  });

  it('accepts valid config for production with all required price IDs and Resend key', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'production',
      OPENAI_API_KEY: 'sk-prod-123456',
      STRIPE_PRICE_START: 'price_start_prod',
      STRIPE_PRICE_PRO: 'price_pro_prod',
      STRIPE_PRICE_ENTERPRISE: 'price_enterprise_prod',
      STRIPE_PRICE_CREDITS_10: 'price_credits_10_prod',
      STRIPE_PRICE_CREDITS_30: 'price_credits_30_prod',
      STRIPE_PRICE_CREDITS_100: 'price_credits_100_prod',
      RESEND_API_KEY: 're_prod_123456',
    };

    expect(() => validateEnv(config)).not.toThrow();
  });

  it('accepts development environment without price IDs (optional in dev)', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'development',
      // No STRIPE_PRICE_* and no RESEND_API_KEY — should be OK in dev
    };

    expect(() => validateEnv(config)).not.toThrow();
  });

  it('error message includes property names for all validation failures', () => {
    const config = {
      NODE_ENV: 'production',
      PORT: 3001,
      FRONTEND_URL: 'http://localhost:3000',
      JWT_SECRET: 'short',
      SUPABASE_URL: 'not-a-url',
      SUPABASE_ANON_KEY: 'invalid',
      SUPABASE_SERVICE_ROLE_KEY: 'invalid',
      DATABASE_URL: 'invalid-db-url',
      STRIPE_SECRET_KEY: 'invalid_stripe',
      STRIPE_WEBHOOK_SECRET: 'invalid_webhook',
      // Missing AI_PROVIDER, ANTHROPIC_API_KEY, price IDs, etc.
    };

    expect(() => validateEnv(config)).toThrow();
    try {
      validateEnv(config);
    } catch (e: any) {
      const message = e.message;
      // Check that property names appear in error
      expect(message).toMatch(/JWT_SECRET|SUPABASE|STRIPE|ANTHROPIC/);
    }
  });

  it('accepts OPENAI_API_KEY with sk- prefix', () => {
    const config = {
      ...validTestEnv,
      AI_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test-1234567890',
      ANTHROPIC_API_KEY: undefined, // Not required when using OpenAI
    };

    expect(() => validateEnv(config)).not.toThrow();
  });

  it('accepts STRIPE price IDs with price_ prefix', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'production',
      OPENAI_API_KEY: 'sk-prod-123456',
      STRIPE_PRICE_START: 'price_start_abc123',
      STRIPE_PRICE_PRO: 'price_pro_abc123',
      STRIPE_PRICE_ENTERPRISE: 'price_ent_abc123',
      STRIPE_PRICE_CREDITS_10: 'price_c10_abc123',
      STRIPE_PRICE_CREDITS_30: 'price_c30_abc123',
      STRIPE_PRICE_CREDITS_100: 'price_c100_abc123',
      RESEND_API_KEY: 're_test_abc123',
    };

    expect(() => validateEnv(config)).not.toThrow();
  });

  it('rejects STRIPE_PRICE_* with invalid prefix (not starting with price_)', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'production',
      OPENAI_API_KEY: 'sk-prod-123456',
      STRIPE_PRICE_START: 'invalid_price_id', // Must start with "price_"
      STRIPE_PRICE_PRO: 'price_pro_abc123',
      STRIPE_PRICE_ENTERPRISE: 'price_ent_abc123',
      STRIPE_PRICE_CREDITS_10: 'price_c10_abc123',
      STRIPE_PRICE_CREDITS_30: 'price_c30_abc123',
      STRIPE_PRICE_CREDITS_100: 'price_c100_abc123',
      RESEND_API_KEY: 're_test_abc123',
    };

    expect(() => validateEnv(config)).toThrow();
    expect(() => validateEnv(config)).toThrow(/STRIPE_PRICE_START/);
  });

  it('rejects RESEND_API_KEY with invalid prefix (not starting with re_)', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'production',
      OPENAI_API_KEY: 'sk-prod-123456',
      STRIPE_PRICE_START: 'price_start_abc123',
      STRIPE_PRICE_PRO: 'price_pro_abc123',
      STRIPE_PRICE_ENTERPRISE: 'price_ent_abc123',
      STRIPE_PRICE_CREDITS_10: 'price_c10_abc123',
      STRIPE_PRICE_CREDITS_30: 'price_c30_abc123',
      STRIPE_PRICE_CREDITS_100: 'price_c100_abc123',
      RESEND_API_KEY: 'invalid_resend_key', // Must start with "re_"
    };

    expect(() => validateEnv(config)).toThrow();
    expect(() => validateEnv(config)).toThrow(/RESEND_API_KEY/);
  });

  it('rejects production config without OPENAI_API_KEY because RAG needs embeddings', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'production',
      STRIPE_PRICE_START: 'price_start_abc123',
      STRIPE_PRICE_PRO: 'price_pro_abc123',
      STRIPE_PRICE_ENTERPRISE: 'price_ent_abc123',
      STRIPE_PRICE_CREDITS_10: 'price_c10_abc123',
      STRIPE_PRICE_CREDITS_30: 'price_c30_abc123',
      STRIPE_PRICE_CREDITS_100: 'price_c100_abc123',
      RESEND_API_KEY: 're_test_abc123',
    };

    expect(() => validateEnv(config)).toThrow(/OPENAI_API_KEY/);
  });
});
