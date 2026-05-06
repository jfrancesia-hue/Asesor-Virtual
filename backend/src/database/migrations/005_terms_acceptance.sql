-- ============================================================
-- TuAsesor — Migration 005: Audit trail for T&C acceptance
-- ============================================================
-- Almacena qué versión de los términos aceptó cada usuario y cuándo,
-- para tener prueba auditable ante un reclamo legal o requerimiento
-- de la autoridad de aplicación (Defensa del Consumidor).
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS accepted_terms_version VARCHAR(20),
  ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_accepted_terms_version
  ON public.users (accepted_terms_version);

COMMENT ON COLUMN public.users.accepted_terms_version IS
  'Versión de los términos que aceptó el usuario al registrarse (ej. 2026-04).';
COMMENT ON COLUMN public.users.accepted_terms_at IS
  'Timestamp UTC del momento de aceptación.';
