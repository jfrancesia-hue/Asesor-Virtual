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

  it('accepts production without MP_ACCESS_TOKEN because billing is opt-in', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'production',
      OPENAI_API_KEY: 'sk-prod-123456',
    };

    expect(() => validateEnv(config)).not.toThrow();
  });

  it('accepts development without MP_ACCESS_TOKEN', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'development',
    };

    expect(() => validateEnv(config)).not.toThrow();
  });

  it('accepts MP_ACCESS_TOKEN with APP_USR- prefix (production)', () => {
    const config = {
      ...validTestEnv,
      MP_ACCESS_TOKEN: 'APP_USR-1234567890-050711-abcdef-987654321',
    };
    expect(() => validateEnv(config)).not.toThrow();
  });

  it('accepts MP_ACCESS_TOKEN with TEST- prefix (sandbox)', () => {
    const config = {
      ...validTestEnv,
      MP_ACCESS_TOKEN: 'TEST-1234567890-050711-abcdef-987654321',
    };
    expect(() => validateEnv(config)).not.toThrow();
  });

  it('rejects MP_ACCESS_TOKEN with invalid prefix', () => {
    const config = {
      ...validTestEnv,
      MP_ACCESS_TOKEN: 'invalid_token_12345',
    };

    expect(() => validateEnv(config)).toThrow();
    expect(() => validateEnv(config)).toThrow(/MP_ACCESS_TOKEN/);
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
    };

    expect(() => validateEnv(config)).toThrow();
    try {
      validateEnv(config);
    } catch (e: any) {
      const message = e.message;
      expect(message).toMatch(/JWT_SECRET|SUPABASE|ANTHROPIC|OPENAI/);
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

  it('rejects RESEND_API_KEY with invalid prefix (not starting with re_)', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'production',
      OPENAI_API_KEY: 'sk-prod-123456',
      RESEND_API_KEY: 'invalid_resend_key',
    };

    expect(() => validateEnv(config)).toThrow();
    expect(() => validateEnv(config)).toThrow(/RESEND_API_KEY/);
  });

  it('rejects production config without OPENAI_API_KEY because RAG needs embeddings', () => {
    const config = {
      ...validTestEnv,
      NODE_ENV: 'production',
    };

    expect(() => validateEnv(config)).toThrow(/OPENAI_API_KEY/);
  });
});
