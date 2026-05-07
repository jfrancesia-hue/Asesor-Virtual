# MiAsesor

Plataforma SaaS multi-asesor con IA para Latinoamérica. 5 asesores especializados bajo una sola suscripción, cobrada en pesos argentinos vía Mercado Pago.

## Asesores IA

| Asesor | ID | Ícono | Descripción |
|--------|-----|-------|-------------|
| Legal | `legal` | ⚖️ | Contratos, análisis de riesgo y consultas jurídicas para AR, MX y CO. Incluye RAG sobre legislación. |
| Salud | `health` | 🏥 | Orientación de síntomas, nutrición, prevención y bienestar general. |
| Finanzas | `finance` | 💰 | Presupuesto, inversiones, deudas e impuestos adaptados a LATAM. |
| Bienestar | `psychology` | 💜 | Escucha empática, manejo de ansiedad, ejercicios guiados y orientación emocional. |
| Hogar | `home` | 🏠 | Plomería, electricidad básica, pintura, jardinería y mantenimiento. |

## Stack

- **Backend**: NestJS + TypeScript + PostgreSQL (Supabase) + pgvector
- **Frontend**: Next.js 14 App Router + Tailwind CSS + Zustand
- **IA**: Anthropic Claude (Sonnet para legal, Haiku para el resto) + OpenAI (embeddings RAG, fallback)
- **Billing**: Mercado Pago (Preferences one-shot, en ARS)
- **Emails**: Resend
- **PDF**: Puppeteer + sanitize-html
- **Deploy**: Render (backend) + Vercel (frontend)

## Planes (ARS/mes)

| Plan | Precio | Usuarios | Contratos/mes | Consultas IA | Créditos |
|------|--------|----------|---------------|--------------|---------|
| Start | $7.900 | 1 | 5 | 20 | 2 |
| Pro | $19.900 | 5 | 25 | 100 | 10 |
| Enterprise | $59.900 | ilimitados | ilimitados | 1.000 | 30 |

Packs de créditos extra: 10 a $4.900, 30 a $9.900, 100 a $24.900.

## Variables de entorno

### Backend (`.env`) — ver `backend/.env.example`
```env
NODE_ENV=development
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
JWT_SECRET=...                # 64+ chars random
FRONTEND_URL=https://...
BACKEND_URL=https://...        # para notification_url de MP
MP_ACCESS_TOKEN=APP_USR-...    # opcional, billing se desactiva si falta
MP_WEBHOOK_SECRET=...          # obligatorio en producción si MP está activo
RESEND_API_KEY=re_...          # opcional
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=/api       # se proxea via next.config.mjs rewrites
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=miasesor-web
```

## Estructura

```
miasesor/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── ai/          # Asesores, conversaciones, RAG
│   │   │   ├── contracts/   # CRUD + PDF + versiones
│   │   │   ├── analysis/    # Análisis de riesgo
│   │   │   ├── auth/        # JWT + tenants
│   │   │   └── billing/     # Mercado Pago + créditos
│   │   └── database/
│   │       └── migrations/  # 000-006 + seeds
│   └── .env.example
├── frontend/                # Next.js 14
│   └── src/app/
│       ├── landing/         # Página pública
│       ├── auth/            # Login + registro
│       └── (dashboard)/     # App protegida
│           ├── home/, advisor/, conversations/, contracts/,
│           │   analysis/, alerts/, dashboard/, settings/
├── render.yaml              # config Render para el backend
├── SETUP_SUPABASE.sql       # consolidado de todas las migraciones
└── docker-compose.yml
```

## Setup desde cero

```bash
# 1. Base de datos (en Supabase SQL Editor)
#    Pegar SETUP_SUPABASE.sql y ejecutar.

# 2. Backend
cd backend
cp .env.example .env       # completar valores
npm install
npm run start:dev

# 3. Frontend
cd frontend
cp .env.local.example .env.local   # completar valores
npm install
npm run dev
```

## Deploy

Ver `deploy/DEPLOY_GUIDE.md` para instrucciones completas (Render para backend, Vercel para frontend).
