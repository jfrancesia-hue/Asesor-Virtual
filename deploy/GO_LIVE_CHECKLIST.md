# Go-Live Checklist

## 1. Backend en Render

Crear o completar estas variables en `tuasesor-api`:

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://<tu-dominio-vercel>
JWT_SECRET=<generado-seguro-de-128-hex-o-mas>

DATABASE_URL=postgresql://...
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
AI_MODEL_ANTHROPIC=claude-sonnet-4-6
AI_MODEL_OPENAI=gpt-4o

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_START=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
STRIPE_PRICE_CREDITS_10=price_...
STRIPE_PRICE_CREDITS_30=price_...
STRIPE_PRICE_CREDITS_100=price_...

RESEND_API_KEY=re_...
RESEND_FROM=noreply@<tu-dominio>

SENTRY_DSN=https://...
```

Notas:
- `OPENAI_API_KEY` es necesaria en producción aunque el provider primario sea Anthropic, porque el RAG legal usa embeddings de OpenAI.
- `FRONTEND_URL` debe ser la URL final de Vercel para que cookies, redirects y Stripe vuelvan bien.

## 2. Frontend en Vercel

Crear o completar estas variables en `tuasesor-web`:

```env
NEXT_PUBLIC_API_URL=https://<tu-api-render-o-dominio>/api
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=<tu-org>
SENTRY_PROJECT=tuasesor-web
```

Notas:
- El frontend ya no depende de rewrites hardcodeadas; todo sale por `NEXT_PUBLIC_API_URL`.
- Si usás dominio custom para la API, cargalo acá desde el principio.

## 3. Base de datos

Ejecutar, en orden:

1. `backend/src/database/migrations/000_supabase_rls_setup.sql`
2. `backend/src/database/migrations/001_initial_schema.sql`
3. `backend/src/database/migrations/002_multi_advisor.sql`
4. `backend/src/database/migrations/003_advisor_tools.sql`
5. `backend/src/database/migrations/004_billing_idempotency.sql`

Opcional:

1. `backend/src/database/seeds/001_contract_templates.sql`
2. `backend/src/database/seeds/002_legal_knowledge_ar.sql`

## 4. Stripe

Antes de abrir al público:

1. Crear productos y precios reales.
2. Copiar todos los `price_*` a Render.
3. Configurar webhook:
   `https://<tu-api>/api/billing/webhook`
4. Escuchar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`

## 5. Smoke test después del deploy

1. Abrir frontend.
2. Registrar usuario nuevo.
3. Login/logout.
4. `GET /api/health`.
5. Crear conversación de asesor.
6. Crear contrato.
7. Subir documento.
8. Abrir settings/billing.
9. Probar webhook de Stripe en test.

## 6. Estado actual del repo

Hoy ya quedó validado:

- build de backend OK
- tests de backend OK
- lint de backend OK
- build de frontend OK
- lint de frontend OK
- `docker build` de backend y frontend OK
- `docker compose up -d --build` OK
- `http://localhost:3001/api/health` OK
