import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
  validateSync,
  ValidateIf,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

export enum AiProvider {
  Anthropic = 'anthropic',
  OpenAI = 'openai',
}

const PLACEHOLDER_JWT_SECRET = 'change-this-super-secret-key-minimum-64-chars';

export class EnvironmentVariables {
  // ── App ───────────────────────────────────────────────────
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3001;

  @IsUrl({ require_tld: false, require_protocol: true })
  FRONTEND_URL: string;

  @IsString()
  @IsOptional()
  EXTRA_ORIGINS?: string;

  // ── JWT ───────────────────────────────────────────────────
  @IsString()
  @MinLength(64, {
    message:
      'JWT_SECRET debe tener al menos 64 caracteres. Generá uno con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
  })
  @Matches(new RegExp(`^(?!${PLACEHOLDER_JWT_SECRET}$).+`), {
    message:
      'JWT_SECRET no puede ser el valor por defecto del .env.example. Generá uno propio.',
  })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '30d';

  // ── Supabase ──────────────────────────────────────────────
  @IsUrl({ require_tld: false, require_protocol: true })
  SUPABASE_URL: string;

  @IsString()
  @MinLength(20, { message: 'SUPABASE_ANON_KEY parece inválida (muy corta).' })
  SUPABASE_ANON_KEY: string;

  @IsString()
  @MinLength(20, {
    message: 'SUPABASE_SERVICE_ROLE_KEY parece inválida (muy corta).',
  })
  SUPABASE_SERVICE_ROLE_KEY: string;

  @IsString()
  @Matches(/^postgres(ql)?:\/\/.+/, {
    message: 'DATABASE_URL debe empezar con postgres:// o postgresql://',
  })
  DATABASE_URL: string;

  // ── IA ────────────────────────────────────────────────────
  @IsEnum(AiProvider)
  @IsOptional()
  AI_PROVIDER: AiProvider = AiProvider.Anthropic;

  // Anthropic es obligatorio si es el provider primario
  @ValidateIf((o) => o.AI_PROVIDER !== AiProvider.OpenAI)
  @IsString()
  @Matches(/^sk-ant-/, { message: 'ANTHROPIC_API_KEY debe empezar con sk-ant-' })
  ANTHROPIC_API_KEY?: string;

  // OpenAI es obligatorio si es el provider primario o en producción para embeddings/RAG
  @ValidateIf(
    (o) => o.AI_PROVIDER === AiProvider.OpenAI || o.NODE_ENV === Environment.Production,
  )
  @IsString()
  @Matches(/^sk-/, { message: 'OPENAI_API_KEY debe empezar con sk-' })
  OPENAI_API_KEY?: string;

  @IsString()
  @IsOptional()
  AI_MODEL_ANTHROPIC?: string;

  @IsString()
  @IsOptional()
  AI_MODEL_OPENAI?: string;

  @IsString()
  @IsOptional()
  CLAUDE_MODEL_LEGAL?: string;

  @IsString()
  @IsOptional()
  CLAUDE_MODEL_HEALTH?: string;

  @IsString()
  @IsOptional()
  CLAUDE_MODEL_FINANCE?: string;

  @IsString()
  @IsOptional()
  CLAUDE_MODEL_PSYCHOLOGY?: string;

  @IsString()
  @IsOptional()
  CLAUDE_MODEL_HOME?: string;

  @IsString()
  @IsOptional()
  CLAUDE_PROMPT_CACHE?: string;

  @IsNumber()
  @IsOptional()
  CLAUDE_MAX_HISTORY?: number;

  // ── Mercado Pago (opcional — billing se desactiva si falta) ──
  // Si MP_ACCESS_TOKEN está vacío, los endpoints de billing devuelven
  // un error claro en runtime y el backend arranca igual.
  @ValidateIf((o) => o.MP_ACCESS_TOKEN !== undefined && o.MP_ACCESS_TOKEN !== '')
  @IsString()
  @Matches(/^(APP_USR|TEST)-/, {
    message: 'MP_ACCESS_TOKEN debe empezar con APP_USR- (producción) o TEST- (sandbox)',
  })
  MP_ACCESS_TOKEN?: string;

  // En producción + con MP activo, el secret es obligatorio:
  // sin él, cualquiera podría POSTear webhooks falsos al endpoint
  // /api/billing/webhook y forzar la activación de planes.
  @ValidateIf(
    (o) =>
      (o.NODE_ENV === Environment.Production && o.MP_ACCESS_TOKEN) ||
      (o.MP_WEBHOOK_SECRET !== undefined && o.MP_WEBHOOK_SECRET !== ''),
  )
  @IsString({
    message:
      'MP_WEBHOOK_SECRET es obligatorio en producción cuando MP_ACCESS_TOKEN está configurado',
  })
  MP_WEBHOOK_SECRET?: string;

  // URL pública del backend (para notification_url de MP).
  // Si no se setea, MP usa FRONTEND_URL como fallback.
  @ValidateIf((o) => o.BACKEND_URL !== undefined && o.BACKEND_URL !== '')
  @IsUrl({ require_tld: false, require_protocol: true })
  BACKEND_URL?: string;

  // ── Resend ────────────────────────────────────────────────
  @ValidateIf((o) => o.RESEND_API_KEY !== undefined && o.RESEND_API_KEY !== '')
  @IsString()
  @Matches(/^re_/, { message: 'RESEND_API_KEY debe empezar con re_' })
  RESEND_API_KEY?: string;

  @IsString()
  @IsOptional()
  RESEND_FROM?: string;

  // ── Rate limit ────────────────────────────────────────────
  @IsNumber()
  @IsOptional()
  THROTTLE_TTL?: number;

  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT?: number;

  // ── Sentry ────────────────────────────────────────────────
  @IsString()
  @IsOptional()
  SENTRY_DSN?: string;

  // ── Logging ───────────────────────────────────────────────
  @IsString()
  @IsOptional()
  LOG_LEVEL?: string;

  // ── Redis (opcional) ──────────────────────────────────────
  @IsString()
  @IsOptional()
  REDIS_URL?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    forbidUnknownValues: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints).join('; ')
          : 'inválido';
        return `  • ${err.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(
      `\n\n❌ Configuración inválida — el backend no puede arrancar:\n${messages}\n\n` +
        `Revisá tu archivo .env y compará contra .env.example\n`,
    );
  }

  return validated;
}
