# Deploy Guide — AbogadoVirtual

## Migraciones de base de datos

Ejecutar **en orden** sobre tu instancia de Supabase (SQL Editor o psql):

1. `backend/src/database/migrations/000_supabase_rls_setup.sql`
   - Crea las funciones `auth.tenant_id()`, `auth.user_id()` y `auth.user_role()` para que las políticas RLS puedan leer claims del JWT.

2. `backend/src/database/migrations/001_initial_schema.sql`
   - Crea las 17 tablas base, enums, triggers, funciones SQL y políticas RLS.

3. `backend/src/database/migrations/002_multi_advisor.sql`
   - Inserta los 5 asesores con sus system prompts, quick_actions, capabilities y safety_rules.

4. `backend/src/database/migrations/003_advisor_tools.sql`
   - Crea las 7 tablas de herramientas por asesor (health_checks, wellness_logs, budget_entries, financial_goals, mood_entries, guided_exercises, home_checklists).
   - Inserta ejercicios guiados para el asesor de bienestar y checklists para hogar.

O ejecutar todo de una: `./setup-db.sh` (requiere `DATABASE_URL` en `backend/.env`).

> Todas las migraciones usan `IF NOT EXISTS` y `ON CONFLICT DO UPDATE` — son idempotentes y se pueden re-ejecutar.

---

## Backend — Railway / Render

### Variables de entorno requeridas

```env
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_KEY=[service_role_key]
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=[string_aleatoria_larga]
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
FRONTEND_URL=https://tuapp.com
NODE_ENV=production
PORT=3001
SENTRY_DSN=https://...  # opcional
```

### Deploy en Railway

```bash
railway login
railway init
railway up
railway variables set DATABASE_URL=... OPENAI_API_KEY=... # etc
```

### Deploy en Render

1. New Web Service → conectar repo
2. Build Command: `npm install && npm run build`
3. Start Command: `npm run start:prod`
4. Agregar todas las variables de entorno en el dashboard

---

## Frontend — Vercel

### Variables de entorno

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api
NEXT_PUBLIC_SENTRY_DSN=https://...  # opcional
SENTRY_ORG=tu-organizacion           # opcional
SENTRY_PROJECT=asesor-virtual-web    # opcional
```

### Deploy

```bash
vercel --prod
```

O conectar el repo en vercel.com → Project Settings → Environment Variables.

---

## Stripe Webhooks

1. Ir a dashboard.stripe.com → Developers → Webhooks
2. Add endpoint: `https://api.tudominio.com/api/billing/webhook`
3. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiar el `Signing secret` → `STRIPE_WEBHOOK_SECRET`

---

## Sentry (monitoreo de errores)

### 1. Crear proyecto en Sentry

1. Ir a [sentry.io](https://sentry.io) → Create Project
2. Crear **dos proyectos**: uno para NestJS (Node) y otro para Next.js
3. Copiar el DSN de cada uno

### 2. Variables de entorno

**Backend** (Render / Railway):
```env
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

**Frontend** (Vercel):
```env
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=asesor-virtual-web
```

### 3. Comportamiento

- **Backend**: Sentry captura solo errores 5xx (errores de servidor). Los errores de validación (4xx) no se reportan.
- **Frontend**: Sentry captura errores no controlados, con Session Replay habilitado para debugging visual.
- Si `SENTRY_DSN` no está configurado, Sentry no se inicializa (no rompe nada).

---

## Docker (self-hosted)

```bash
# Copiar variables
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores

docker-compose up -d
```

El `docker-compose.yml` levanta:
- `api`: NestJS en puerto 3001
- `web`: Next.js en puerto 3000
- `postgres`: PostgreSQL 15 (solo para desarrollo local)

---

## Checklist post-deploy

- [ ] Migraciones 001, 002 y 003 ejecutadas en orden
- [ ] Variables de entorno configuradas en backend y frontend
- [ ] Stripe webhook apuntando al endpoint correcto
- [ ] Dominio personalizado configurado en Vercel/Render
- [ ] Supabase RLS habilitado (viene activo por defecto con las migraciones)
- [ ] CORS en backend apuntando al dominio del frontend (`FRONTEND_URL`)
- [ ] Sentry DSN configurado en backend y frontend (opcional pero recomendado)
