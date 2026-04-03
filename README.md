# AbogadoVirtual

Plataforma SaaS multi-asesor con IA para Latinoamérica. 5 asesores especializados bajo una sola suscripción.

## Asesores IA

| Asesor | ID | Ícono | Descripción |
|--------|-----|-------|-------------|
| Legal | `legal` | ⚖️ | Contratos, análisis de riesgo y consultas jurídicas para AR, MX y CO. Incluye RAG sobre legislación. |
| Salud | `health` | 🏥 | Orientación de síntomas, nutrición, prevención y bienestar general. |
| Finanzas | `finance` | 💰 | Presupuesto, inversiones, deudas e impuestos adaptados a LATAM. |
| Bienestar | `psychology` | 🧠 | Escucha empática, manejo de ansiedad, ejercicios guiados y orientación emocional. |
| Hogar | `home` | 🏠 | Plomería, electricidad básica, pintura, jardinería y mantenimiento. |

## Stack

- **Backend**: NestJS + TypeScript + PostgreSQL (Supabase) + pgvector
- **Frontend**: Next.js 14 App Router + Tailwind CSS + Zustand
- **IA**: OpenAI GPT-4o (primario) + Anthropic Claude (fallback)
- **Billing**: Stripe subscriptions + créditos
- **Emails**: Resend
- **PDF**: Puppeteer
- **Deploy**: Railway / Render / Docker

## Estructura

```
abogadovirtual/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── ai/        # Asesores, conversaciones, RAG
│   │   │   ├── contracts/ # CRUD + PDF + versiones
│   │   │   ├── analysis/  # Análisis de riesgo
│   │   │   ├── auth/      # JWT + tenants
│   │   │   └── billing/   # Stripe + créditos
│   │   └── database/
│   │       └── migrations/
│   │           ├── 001_initial_schema.sql
│   │           ├── 002_multi_advisor.sql
│   │           └── 003_advisor_tools.sql
├── frontend/          # Next.js 14
│   └── src/app/
│       ├── landing/       # Página pública
│       ├── auth/          # Login + registro
│       └── (dashboard)/   # App protegida
│           ├── home/          # Grid de asesores
│           ├── advisor/       # Chat IA
│           │   └── [id]/      # Detalle por asesor
│           ├── conversations/ # Historial de chats
│           ├── contracts/     # Gestión de contratos
│           ├── analysis/      # Análisis de documentos
│           ├── alerts/        # Centro de alertas
│           ├── dashboard/     # Panel empresa
│           └── settings/      # Perfil + billing + equipo
└── docker-compose.yml
```

## Planes

| Plan | Precio | Usuarios | Contratos/mes | Consultas IA | Créditos |
|------|--------|----------|---------------|--------------|---------|
| Start | USD 29/mes | 1 | 5 | 20 | 2 |
| Pro | USD 79/mes | 5 | 25 | 100 | 10 |
| Enterprise | USD 199/mes | ilimitados | ilimitados | ilimitadas | 30 |

## Variables de entorno

### Backend (`.env`)
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
FRONTEND_URL=https://...
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api
```

## Deploy

Ver [deploy/DEPLOY_GUIDE.md](deploy/DEPLOY_GUIDE.md) para instrucciones completas.

## Inicio rápido (desarrollo)

```bash
# 1. Base de datos
cd backend && npx ts-node src/database/migrations/runner.ts

# 2. Backend
cd backend && npm run start:dev

# 3. Frontend
cd frontend && npm run dev
```
