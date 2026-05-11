-- ============================================================
-- MiAsesor — Sanear search_path de funciones del schema public
-- Sin SET search_path, una función puede resolver tipos/objetos contra
-- un schema arbitrario controlado por el caller. Fijar el search_path
-- a pg_catalog, public elimina ese vector de schema shadowing.
-- Referencia: lint 0011_function_search_path_mutable.
-- Firmas confirmadas con pg_get_function_identity_arguments().
-- ============================================================

ALTER FUNCTION public.tenant_id()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.app_user_id()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.app_user_role()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.update_updated_at()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.create_tenant_wallet()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.version_contract()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.get_dashboard_stats(p_tenant_id uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.add_credits(
  p_tenant_id uuid,
  p_user_id uuid,
  p_amount integer,
  p_type credit_tx_type,
  p_description character varying,
  p_reference_id character varying
) SET search_path = pg_catalog, public;

ALTER FUNCTION public.consume_credits(
  p_tenant_id uuid,
  p_user_id uuid,
  p_amount integer,
  p_description character varying,
  p_reference_id character varying
) SET search_path = pg_catalog, public;

ALTER FUNCTION public.search_legal_knowledge(
  query_embedding extensions.vector,
  match_count integer,
  filter_country character varying,
  filter_category character varying,
  similarity_threshold double precision
) SET search_path = pg_catalog, public;
