-- ============================================================
-- MiAsesor — Habilitar Row Level Security
-- Las policies ya existen en 000_supabase_rls_setup.sql + 001_initial_schema.sql;
-- pero el ENABLE ROW LEVEL SECURITY nunca se aplicó: el linter de Supabase
-- reportaba 24 tablas con `policy_exists_rls_disabled` (datos expuestos por
-- la anon key). El backend usa SUPABASE_SERVICE_ROLE_KEY que bypassa RLS,
-- así que habilitar RLS no rompe ningún endpoint propio: sólo cierra el
-- acceso público a PostgREST.
-- ============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guided_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_checklists ENABLE ROW LEVEL SECURITY;
