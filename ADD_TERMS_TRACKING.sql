-- ============================================================
-- PARCHE: Auditoría de aceptación de términos y condiciones
-- ============================================================
-- COMO USAR: Supabase Dashboard -> SQL Editor -> New query ->
-- pegar ESTO ENTERO -> Run.
-- Es seguro correrlo varias veces (todo es IF NOT EXISTS).
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS accepted_terms_version VARCHAR(20),
  ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_accepted_terms_version
  ON public.users (accepted_terms_version);
