-- ============================================================
-- TuAsesor — Supabase RLS Setup
-- EJECUTAR UNA SOLA VEZ en Supabase SQL Editor ANTES de las demás migraciones
-- ============================================================

-- Función que extrae tenant_id del JWT para usar en políticas RLS
-- El backend embebe tenantId en el JWT: { sub, tenantId, role, ... }
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'tenantId',
    ''
  )::TEXT;
$$ LANGUAGE sql STABLE;

-- Función auxiliar para extraer el user id del JWT
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::UUID;
$$ LANGUAGE sql STABLE;

-- Función auxiliar para extraer el rol del JWT
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'role',
    ''
  )::TEXT;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- NOTA: El backend usa SUPABASE_SERVICE_ROLE_KEY (bypass RLS)
-- Estas funciones son necesarias si:
--   a) Usás el cliente de Supabase directamente desde el frontend
--   b) Usás Supabase Auth en vez del JWT propio
-- Si solo usás el backend NestJS, las RLS las maneja la app layer.
-- ============================================================
