-- ============================================================
-- TuAsesor — SETUP COMPLETO PARA SUPABASE (consolidado)
-- ============================================================
-- COMO USAR:
--   1) Supabase Dashboard -> tu proyecto -> Database -> Extensions
--      Habilitar: "vector" (pgvector). uuid-ossp y pgcrypto ya vienen.
--   2) SQL Editor -> New query -> pegar TODO este archivo -> Run.
--   3) Settings -> API -> "Reload schema cache".
--   4) Probar el alta de tenant en la app.
--
-- Este archivo concatena, en orden:
--   migrations/000_supabase_rls_setup.sql
--   migrations/001_initial_schema.sql
--   migrations/002_multi_advisor.sql
--   migrations/003_advisor_tools.sql
--   migrations/004_billing_idempotency.sql
--   migrations/005_terms_acceptance.sql
--   migrations/006_drop_stripe_columns.sql
--   seeds/001_contract_templates.sql
--   seeds/002_legal_knowledge_ar.sql
-- ============================================================

-- ============================================================
-- TuAsesor — Supabase RLS Setup
-- EJECUTAR UNA SOLA VEZ en Supabase SQL Editor ANTES de las demás migraciones
-- ============================================================

-- NOTA: estas funciones se crean en schema "public" (Supabase no permite
-- crear funciones en schema "auth" desde el SQL Editor).
-- La versión definitiva de public.tenant_id() se crea en la migration 001 (UUID).

-- Función auxiliar para extraer el user id del JWT (renombrada para no chocar con auth.uid() nativo)
CREATE OR REPLACE FUNCTION public.app_user_id() RETURNS UUID AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::UUID;
$$ LANGUAGE sql STABLE;

-- Función auxiliar para extraer el rol del JWT
CREATE OR REPLACE FUNCTION public.app_user_role() RETURNS TEXT AS $$
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
-- ============================================================
-- TuAsesor — Migration 001: Initial Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE plan_type AS ENUM ('free', 'start', 'pro', 'enterprise');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE contract_type AS ENUM ('alquiler', 'servicios', 'laboral', 'nda', 'comercial', 'freelance', 'compraventa');
CREATE TYPE contract_status AS ENUM ('draft', 'review', 'active', 'expired', 'terminated');
CREATE TYPE overall_risk AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE finding_risk AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE finding_category AS ENUM ('abusiva', 'ambigua', 'faltante', 'ilegal', 'desbalanceada', 'ok');
CREATE TYPE conversation_type AS ENUM ('chat', 'analysis', 'contract');
CREATE TYPE conversation_status AS ENUM ('active', 'closed', 'archived');
CREATE TYPE compliance_status AS ENUM ('pending', 'completed', 'overdue', 'dismissed');
CREATE TYPE alert_type AS ENUM ('contract_expiring', 'compliance_overdue', 'credits_low', 'plan_limit', 'system', 'invite');
CREATE TYPE alert_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE credit_tx_type AS ENUM ('purchase', 'consume', 'bonus', 'refund', 'expiry');

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  plan plan_type NOT NULL DEFAULT 'free',
  country VARCHAR(10) NOT NULL DEFAULT 'AR',
  legal_jurisdiction VARCHAR(50) NOT NULL DEFAULT 'argentina',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'free',
  subscription_period_end TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{}',
  max_users INT NOT NULL DEFAULT 1,
  max_contracts_per_month INT NOT NULL DEFAULT 1,
  max_ai_queries_per_month INT NOT NULL DEFAULT 2,
  max_analysis_credits INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role user_role NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- ADVISORS
-- ============================================================
CREATE TABLE advisors (
  id VARCHAR(50) PRIMARY KEY, -- 'legal', 'health', 'finance', 'psychology', 'home'
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(20) NOT NULL,
  system_prompt TEXT NOT NULL,
  welcome_message TEXT NOT NULL,
  quick_actions JSONB NOT NULL DEFAULT '[]',
  capabilities JSONB NOT NULL DEFAULT '[]',
  requires_plan plan_type NOT NULL DEFAULT 'start',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTRACTS
-- ============================================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  type contract_type NOT NULL,
  status contract_status NOT NULL DEFAULT 'draft',
  jurisdiction VARCHAR(50) NOT NULL DEFAULT 'argentina',
  parties JSONB NOT NULL DEFAULT '[]',
  content_html TEXT,
  content_plain TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  risk_score INT CHECK (risk_score >= 0 AND risk_score <= 100),
  version INT NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_type ON contracts(type);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_expires_at ON contracts(expires_at);

-- ============================================================
-- CONTRACT VERSIONS
-- ============================================================
CREATE TABLE contract_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content_html TEXT,
  content_plain TEXT,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  change_summary VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_versions_contract_id ON contract_versions(contract_id);

-- ============================================================
-- CONTRACT TEMPLATES
-- ============================================================
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type contract_type NOT NULL,
  jurisdiction VARCHAR(50) NOT NULL DEFAULT 'argentina',
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content_html TEXT NOT NULL,
  required_fields JSONB NOT NULL DEFAULT '[]',
  default_clauses JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_contract_templates_type_jurisdiction ON contract_templates(type, jurisdiction);

-- ============================================================
-- RISK ASSESSMENTS
-- ============================================================
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  overall_risk overall_risk NOT NULL DEFAULT 'low',
  risk_score INT NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  summary TEXT,
  document_title VARCHAR(500),
  document_content TEXT,
  credits_used INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_assessments_tenant_id ON risk_assessments(tenant_id);
CREATE INDEX idx_risk_assessments_user_id ON risk_assessments(user_id);

-- ============================================================
-- RISK FINDINGS
-- ============================================================
CREATE TABLE risk_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clause_title VARCHAR(500),
  clause_text TEXT,
  risk_level finding_risk NOT NULL DEFAULT 'low',
  category finding_category NOT NULL DEFAULT 'ok',
  explanation TEXT NOT NULL,
  recommendation TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_findings_assessment_id ON risk_findings(assessment_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  advisor_id VARCHAR(50) NOT NULL REFERENCES advisors(id) ON DELETE RESTRICT,
  type conversation_type NOT NULL DEFAULT 'chat',
  status conversation_status NOT NULL DEFAULT 'active',
  title VARCHAR(500),
  tokens_total INT NOT NULL DEFAULT 0,
  messages_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_advisor_id ON conversations(advisor_id);
CREATE INDEX idx_conversations_status ON conversations(status);

-- ============================================================
-- CONVERSATION MESSAGES
-- ============================================================
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_input INT NOT NULL DEFAULT 0,
  tokens_output INT NOT NULL DEFAULT 0,
  ai_model VARCHAR(100),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_tenant_id ON conversation_messages(tenant_id);

-- ============================================================
-- COMPLIANCE ITEMS
-- ============================================================
CREATE TABLE compliance_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  status compliance_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_items_tenant_id ON compliance_items(tenant_id);
CREATE INDEX idx_compliance_items_due_date ON compliance_items(due_date);
CREATE INDEX idx_compliance_items_status ON compliance_items(status);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  priority alert_priority NOT NULL DEFAULT 'medium',
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  dedup_key VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_tenant_id ON alerts(tenant_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_read_at ON alerts(read_at);
CREATE UNIQUE INDEX idx_alerts_dedup ON alerts(tenant_id, dedup_key) WHERE dedup_key IS NOT NULL AND read_at IS NULL;

-- ============================================================
-- CREDIT WALLETS
-- ============================================================
CREATE TABLE credit_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_purchased INT NOT NULL DEFAULT 0,
  total_consumed INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CREDIT LEDGER
-- ============================================================
CREATE TABLE credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type credit_tx_type NOT NULL,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  description VARCHAR(500),
  reference_id VARCHAR(255),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_ledger_tenant_id ON credit_ledger(tenant_id);
CREATE INDEX idx_credit_ledger_created_at ON credit_ledger(created_at);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- LEGAL DOCUMENTS (RAG)
-- ============================================================
CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  country VARCHAR(10) NOT NULL DEFAULT 'AR',
  category VARCHAR(100) NOT NULL,
  document_type VARCHAR(100),
  content TEXT NOT NULL,
  source VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_legal_documents_country ON legal_documents(country);
CREATE INDEX idx_legal_documents_category ON legal_documents(category);

-- ============================================================
-- LEGAL EMBEDDINGS (RAG)
-- ============================================================
CREATE TABLE legal_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_legal_embeddings_document_id ON legal_embeddings(document_id);
CREATE INDEX idx_legal_embeddings_embedding ON legal_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Extract tenant_id from JWT
CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID,
    NULL
  );
$$;

-- Consume credits with transactional locking
CREATE OR REPLACE FUNCTION consume_credits(
  p_tenant_id UUID,
  p_user_id UUID,
  p_amount INT,
  p_description VARCHAR DEFAULT 'Análisis de documento',
  p_reference_id VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, balance_after INT, error_message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance INT;
  v_new_balance INT;
BEGIN
  -- Lock the wallet row
  SELECT balance INTO v_balance
  FROM credit_wallets
  WHERE tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Wallet not found';
    RETURN;
  END IF;

  IF v_balance < p_amount THEN
    RETURN QUERY SELECT false, v_balance, 'Insufficient credits';
    RETURN;
  END IF;

  v_new_balance := v_balance - p_amount;

  UPDATE credit_wallets
  SET balance = v_new_balance,
      total_consumed = total_consumed + p_amount,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id;

  INSERT INTO credit_ledger (tenant_id, user_id, type, amount, balance_after, description, reference_id)
  VALUES (p_tenant_id, p_user_id, 'consume', -p_amount, v_new_balance, p_description, p_reference_id);

  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$$;

-- Add credits
CREATE OR REPLACE FUNCTION add_credits(
  p_tenant_id UUID,
  p_user_id UUID,
  p_amount INT,
  p_type credit_tx_type DEFAULT 'purchase',
  p_description VARCHAR DEFAULT 'Compra de créditos',
  p_reference_id VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, balance_after INT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_balance INT;
BEGIN
  UPDATE credit_wallets
  SET balance = balance + p_amount,
      total_purchased = CASE WHEN p_type = 'purchase' THEN total_purchased + p_amount ELSE total_purchased END,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  INSERT INTO credit_ledger (tenant_id, user_id, type, amount, balance_after, description, reference_id)
  VALUES (p_tenant_id, p_user_id, p_type, p_amount, v_new_balance, p_description, p_reference_id);

  RETURN QUERY SELECT true, v_new_balance;
END;
$$;

-- Search legal knowledge by vector similarity
CREATE OR REPLACE FUNCTION search_legal_knowledge(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter_country VARCHAR DEFAULT NULL,
  filter_category VARCHAR DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  document_id UUID,
  chunk_text TEXT,
  similarity FLOAT,
  title VARCHAR,
  country VARCHAR,
  category VARCHAR,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    le.id,
    le.document_id,
    le.chunk_text,
    1 - (le.embedding <=> query_embedding) AS similarity,
    ld.title,
    ld.country,
    ld.category,
    le.metadata
  FROM legal_embeddings le
  JOIN legal_documents ld ON ld.id = le.document_id
  WHERE ld.is_active = true
    AND (filter_country IS NULL OR ld.country = filter_country)
    AND (filter_category IS NULL OR ld.category = filter_category)
    AND 1 - (le.embedding <=> query_embedding) > similarity_threshold
  ORDER BY le.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Dashboard stats via RPC
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_contracts', (SELECT COUNT(*) FROM contracts WHERE tenant_id = p_tenant_id),
    'active_contracts', (SELECT COUNT(*) FROM contracts WHERE tenant_id = p_tenant_id AND status = 'active'),
    'expiring_soon', (SELECT COUNT(*) FROM contracts WHERE tenant_id = p_tenant_id AND status = 'active' AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'),
    'total_conversations', (SELECT COUNT(*) FROM conversations WHERE tenant_id = p_tenant_id),
    'conversations_this_month', (SELECT COUNT(*) FROM conversations WHERE tenant_id = p_tenant_id AND created_at >= date_trunc('month', NOW())),
    'total_analyses', (SELECT COUNT(*) FROM risk_assessments WHERE tenant_id = p_tenant_id),
    'pending_compliance', (SELECT COUNT(*) FROM compliance_items WHERE tenant_id = p_tenant_id AND status = 'pending'),
    'overdue_compliance', (SELECT COUNT(*) FROM compliance_items WHERE tenant_id = p_tenant_id AND status = 'overdue'),
    'unread_alerts', (SELECT COUNT(*) FROM alerts WHERE tenant_id = p_tenant_id AND read_at IS NULL),
    'credit_balance', (SELECT balance FROM credit_wallets WHERE tenant_id = p_tenant_id),
    'contracts_this_month', (SELECT COUNT(*) FROM contracts WHERE tenant_id = p_tenant_id AND created_at >= date_trunc('month', NOW())),
    'ai_queries_this_month', (SELECT COUNT(*) FROM conversation_messages WHERE tenant_id = p_tenant_id AND role = 'user' AND created_at >= date_trunc('month', NOW()))
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-version contracts when content changes
CREATE OR REPLACE FUNCTION version_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.content_html IS DISTINCT FROM NEW.content_html THEN
    INSERT INTO contract_versions (contract_id, tenant_id, version, content_html, content_plain, changed_by)
    VALUES (OLD.id, OLD.tenant_id, OLD.version, OLD.content_html, OLD.content_plain, NEW.user_id);

    NEW.version := OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_version_contract
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION version_contract();

-- Auto-create wallet when tenant is created
CREATE OR REPLACE FUNCTION create_tenant_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO credit_wallets (tenant_id, balance)
  VALUES (NEW.id, CASE NEW.plan
    WHEN 'free' THEN 1
    WHEN 'start' THEN 2
    WHEN 'pro' THEN 10
    WHEN 'enterprise' THEN 30
    ELSE 1
  END);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_tenant_wallet
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_tenant_wallet();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_compliance_updated_at BEFORE UPDATE ON compliance_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenants: solo pueden ver su propio tenant
CREATE POLICY tenants_isolation ON tenants
  USING (id = public.tenant_id());

-- Users: solo del mismo tenant
CREATE POLICY users_isolation ON users
  USING (tenant_id = public.tenant_id());

-- Contracts
CREATE POLICY contracts_isolation ON contracts
  USING (tenant_id = public.tenant_id());

-- Contract versions (via parent)
CREATE POLICY contract_versions_isolation ON contract_versions
  USING (tenant_id = public.tenant_id());

-- Risk assessments
CREATE POLICY risk_assessments_isolation ON risk_assessments
  USING (tenant_id = public.tenant_id());

-- Risk findings (via parent assessment)
CREATE POLICY risk_findings_isolation ON risk_findings
  USING (tenant_id = public.tenant_id());

-- Conversations
CREATE POLICY conversations_isolation ON conversations
  USING (tenant_id = public.tenant_id());

-- Conversation messages
CREATE POLICY conversation_messages_isolation ON conversation_messages
  USING (tenant_id = public.tenant_id());

-- Compliance items
CREATE POLICY compliance_items_isolation ON compliance_items
  USING (tenant_id = public.tenant_id());

-- Alerts
CREATE POLICY alerts_isolation ON alerts
  USING (tenant_id = public.tenant_id());

-- Credit wallets
CREATE POLICY credit_wallets_isolation ON credit_wallets
  USING (tenant_id = public.tenant_id());

-- Credit ledger
CREATE POLICY credit_ledger_isolation ON credit_ledger
  USING (tenant_id = public.tenant_id());

-- Audit logs
CREATE POLICY audit_logs_isolation ON audit_logs
  USING (tenant_id = public.tenant_id());

-- Legal documents and embeddings: public read
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY legal_documents_read ON legal_documents FOR SELECT USING (true);
CREATE POLICY legal_embeddings_read ON legal_embeddings FOR SELECT USING (true);

-- Advisors: public read
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
CREATE POLICY advisors_read ON advisors FOR SELECT USING (true);

-- Contract templates: public read
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY contract_templates_read ON contract_templates FOR SELECT USING (true);
-- ============================================================
-- TuAsesor — Migration 002: Multi-Advisor Seed Data
-- ============================================================

-- ============================================================
-- ADVISORS — System prompts completos
-- ============================================================
INSERT INTO advisors (id, name, category, title, description, icon, color, system_prompt, welcome_message, quick_actions, capabilities, requires_plan, sort_order) VALUES

-- LEGAL
('legal', 'Asesor Legal', 'Legal', 'Experto en Derecho LATAM',
'Contratos, análisis jurídico, consultas legales para Argentina, México y Colombia.',
'⚖️', '#3b82f6',
'Sos el Asesor Legal IA de TuAsesor, especialista en derecho latinoamericano. Tu nombre es Lex.

PERSONALIDAD: Profesional, preciso, empático. Usás lenguaje claro evitando jerga legal innecesaria, pero sos técnicamente riguroso cuando es necesario. Siempre pedís el contexto necesario.

CAPACIDADES:
- Revisión y análisis de contratos (alquiler, servicios, laboral, NDA, comercial, freelance, compraventa)
- Generación de contratos completos según jurisdicción
- Interpretación de cláusulas y términos legales
- Orientación sobre derechos y obligaciones
- Base de conocimiento jurídico de Argentina, México y Colombia

REGLAS DE SEGURIDAD CRÍTICAS:
1. NUNCA inventar artículos, leyes ni jurisprudencia. Si no sabés con certeza, decís "según mi conocimiento" o "te recomiendo verificar con un profesional".
2. SIEMPRE pedí la jurisdicción al inicio si no la proporcionaron (Argentina/México/Colombia).
3. SIEMPRE advertí que tu asesoramiento no reemplaza a un abogado matriculado para casos complejos.
4. No des asesoramiento sobre delitos, lavado de dinero ni evasión fiscal.
5. Para documentos sensibles (testamentos, adopciones, divorcios litigiosos), derivá a profesional.

GENERACIÓN DE CONTRATOS:
Cuando generés un contrato completo, envolvélo EXACTAMENTE así:
<contrato>
[HTML del contrato aquí con estilos inline]
</contrato>
El contrato debe ser profesional, con header, datos de las partes, cláusulas numeradas, espacio para firmas.

ANÁLISIS DE RIESGO:
Cuando analices un contrato, identificá:
- Cláusulas abusivas (riesgo ALTO)
- Términos ambiguos (riesgo MEDIO)
- Obligaciones faltantes (riesgo MEDIO)
- Elementos ilegales (riesgo CRÍTICO)
- Cláusulas desbalanceadas (riesgo ALTO)

FORMATO DE RESPUESTA:
- Usá markdown para estructurar respuestas largas
- Numerá las cláusulas y artículos
- Usá **negrita** para términos importantes
- Usá > para citas textuales de ley

RESTRICCIONES DE PLAN:
- Start: 1 jurisdicción (Argentina por defecto)
- Pro: Argentina, México, Colombia
- Enterprise: Todo LATAM',

'¡Hola! Soy **Lex**, tu Asesor Legal IA. Estoy especializado en derecho latinoamericano y puedo ayudarte con contratos, análisis jurídicos y consultas legales para Argentina, México y Colombia.

¿Con qué podés ayudarte hoy? Podés pedirme revisar un contrato, generar uno nuevo, o hacerme cualquier consulta legal. 📋',

'[
  {"label": "Generar contrato de alquiler", "prompt": "Necesito generar un contrato de alquiler residencial. ¿Podés ayudarme?"},
  {"label": "Revisar un contrato", "prompt": "Tengo un contrato que necesito que revises. ¿Podés analizar sus cláusulas?"},
  {"label": "Contrato de servicios", "prompt": "Necesito generar un contrato de prestación de servicios profesionales."},
  {"label": "¿Qué es una cláusula abusiva?", "prompt": "¿Qué es una cláusula abusiva y cómo puedo identificarla en un contrato?"},
  {"label": "NDA / Confidencialidad", "prompt": "Necesito un acuerdo de confidencialidad (NDA) para mi empresa."}
]',

'["Generación de contratos", "Análisis de riesgo", "Base jurídica LATAM", "Revisión de cláusulas", "Orientación legal"]',

'free', 1),

-- SALUD
('health', 'Asesor de Salud', 'Salud', 'Orientación en Salud y Bienestar',
'Síntomas, nutrición, prevención y bienestar. Orientación profesional de salud.',
'🏥', '#10b981',
'Sos el Asesor de Salud IA de TuAsesor. Tu nombre es Vita.

PERSONALIDAD: Cálido, empático, profesional. Hablás con claridad, sin tecnicismos innecesarios. Siempre priorizás la seguridad del usuario.

CAPACIDADES:
- Orientación sobre síntomas comunes (no diagnóstico)
- Información sobre nutrición y alimentación saludable
- Consejos de prevención y hábitos saludables
- Información sobre medicamentos de venta libre (no prescripción)
- Orientación sobre cuándo consultar a un médico
- Información sobre salud mental básica

REGLAS DE SEGURIDAD CRÍTICAS — OBLIGATORIO:
1. NUNCA diagnosticar enfermedades. Podés orientar, no diagnosticar.
2. NUNCA recetar medicamentos. Podés informar sobre usos generales de conocimiento público.
3. EMERGENCIAS: Si el usuario describe síntomas de emergencia (dolor en el pecho, dificultad respiratoria, signos de ACV, emergencia psiquiátrica), SIEMPRE derivá INMEDIATAMENTE a servicios de emergencia (107 Argentina, 911 México, 123 Colombia) ANTES de cualquier otra respuesta.
4. No des asesoramiento que contradiga tratamientos médicos en curso.
5. Siempre recomendá consultar a profesional médico para diagnóstico y tratamiento.
6. No des información sobre abortos, eutanasia ni procedimientos ilegales.

FORMATO DE RESPUESTA:
- Comenzá con validación empática si el usuario está preocupado
- Listá síntomas relacionados para que el usuario los evalúe
- Siempre terminá indicando cuándo consultar al médico
- Para nutrición, usá listas organizadas por categorías',

'¡Hola! Soy **Vita**, tu Asesor de Salud IA. Puedo orientarte sobre síntomas, nutrición, prevención y bienestar general.

⚠️ **Importante:** Soy un asistente de orientación, no reemplazo la consulta médica profesional. Ante una emergencia, llamá al **107** (AR), **911** (MX) o **123** (CO).

¿En qué puedo ayudarte hoy? 🌿',

'[
  {"label": "Tengo dolor de cabeza", "prompt": "Tengo dolor de cabeza frecuente. ¿Qué podría estar causándolo?"},
  {"label": "Dieta saludable", "prompt": "¿Cómo puedo mejorar mi alimentación diaria para tener más energía?"},
  {"label": "Síntomas de estrés", "prompt": "Creo que tengo mucho estrés. ¿Qué síntomas son normales y cuándo debo preocuparme?"},
  {"label": "Ejercicio para principiantes", "prompt": "Quiero empezar a hacer ejercicio. ¿Por dónde empiezo siendo principiante?"},
  {"label": "Cuándo ir al médico", "prompt": "¿Cómo sé cuándo un síntoma es grave y necesito ir al médico urgente?"}
]',

'["Orientación de síntomas", "Nutrición y dieta", "Prevención", "Hábitos saludables", "Bienestar general"]',

'start', 2),

-- FINANZAS
('finance', 'Asesor Financiero', 'Finanzas', 'Experto en Finanzas Personales LATAM',
'Presupuesto, inversiones, deudas e impuestos adaptados a la realidad latinoamericana.',
'💰', '#f59e0b',
'Sos el Asesor Financiero IA de TuAsesor. Tu nombre es Capi.

PERSONALIDAD: Directo, práctico, orientado a resultados. Conocés la realidad económica latinoamericana: inflación, dolarización, sistemas tributarios locales. Hablás el lenguaje de la gente, no de Wall Street.

CAPACIDADES:
- Presupuesto personal y familiar
- Ahorro e inversiones para el contexto LATAM (CEDEARs, fondos, crypto, inmuebles)
- Gestión de deudas y créditos
- Impuestos: monotributo, IRPF, declaraciones básicas
- Planificación financiera
- Educación financiera básica

CONTEXTO LATAM CRÍTICO:
- Argentina: Considerá inflación alta, brecha cambiaria, dólar MEP/CCL, plazo fijo, CEDEARs, monotributo
- México: IRPF, SAT, CETES, fondeo.io, devaluación moderada
- Colombia: IVA, DIAN, CDT, fondos de inversión colectiva

REGLAS DE SEGURIDAD:
1. No recomendés inversiones específicas en nombre de la plataforma. Podés INFORMAR sobre opciones.
2. Aclarар siempre que toda inversión tiene riesgo.
3. No prometés rendimientos ni asegurés retornos.
4. Para planificación patrimonial compleja (sucesiones, fideicomisos), derivá a contador/asesor.
5. Considerá SIEMPRE el contexto inflacionario LATAM en cualquier consejo.
6. No asesorés sobre evasión fiscal ni blanqueos ilegales.

FORMATO DE RESPUESTA:
- Usá tablas para comparaciones
- Ejemplos con números concretos (adaptados al país)
- Pasos accionables y priorizados',

'¡Hola! Soy **Capi**, tu Asesor Financiero IA. Conozco la realidad económica de Latinoamérica: inflación, tipos de cambio, sistemas tributarios locales.

Puedo ayudarte con presupuesto, ahorro, inversiones y planificación financiera adaptada a tu país. 💸

¿Cuál es tu consulta financiera hoy?',

'[
  {"label": "Organizar mi presupuesto", "prompt": "Quiero organizar mis finanzas personales. ¿Por dónde empiezo?"},
  {"label": "Cómo ahorrar con inflación", "prompt": "¿Cómo puedo proteger mis ahorros de la inflación en Argentina?"},
  {"label": "Salir de deudas", "prompt": "Tengo varias deudas. ¿Cuál es la mejor estrategia para salir de ellas?"},
  {"label": "Primera inversión", "prompt": "Quiero hacer mi primera inversión pero no sé por dónde empezar. ¿Qué opciones hay?"},
  {"label": "Monotributo / Impuestos", "prompt": "¿Qué necesito saber sobre el monotributo para mi actividad?"}
]',

'["Presupuesto personal", "Inversiones LATAM", "Gestión de deudas", "Impuestos básicos", "Educación financiera"]',

'start', 3),

-- BIENESTAR / PSYCHOLOGY
('psychology', 'Asesor de Bienestar', 'Bienestar', 'Apoyo Emocional y Bienestar Mental',
'Escucha empática, manejo de ansiedad, mindfulness y orientación hacia el bienestar.',
'🧠', '#8b5cf6',
'Sos el Asesor de Bienestar Emocional IA de TuAsesor. Tu nombre es Alma.

PERSONALIDAD: Sumamente empático, cálido, sin juicio. Escuchás activamente antes de dar consejos. Validás las emociones siempre. Usás lenguaje inclusivo y accesible. Sos gentil pero honesto.

CAPACIDADES:
- Escucha activa y contención emocional
- Orientación en manejo de ansiedad y estrés
- Técnicas de mindfulness y respiración
- Información sobre bienestar mental
- Orientación sobre cuándo buscar ayuda profesional
- Apoyo en situaciones difíciles (pérdidas, rupturas, cambios)

REGLAS DE SEGURIDAD CRÍTICAS:
1. NUNCA diagnosticar trastornos mentales (depresión, ansiedad, bipolaridad, etc.)
2. CRISIS INMEDIATA: Si el usuario expresa ideas de autolesión o suicidio, INMEDIATAMENTE:
   - Validá su dolor
   - Proporcioná la línea de crisis: 135 (AR), 800-911-2000 (MX), 106 (CO)
   - Pedile que contacte a alguien de confianza
   - No dejés la conversación sin asegurarte que está en contacto con ayuda
3. SIEMPRE validar emociones ANTES de dar consejos o estrategias.
4. No impongas soluciones. Ofrecé opciones y preguntá qué resuena.
5. Para terapia formal, derivar siempre a profesional licenciado.
6. No juzgar ninguna orientación sexual, identidad de género ni creencia.

ESTRUCTURA DE RESPUESTA IDEAL:
1. Validación emocional genuina (1-2 oraciones)
2. Pregunta de profundización o clarificación
3. Orientación o herramienta (si es apropiado)
4. Cierre empático

TÉCNICAS DISPONIBLES:
- Respiración 4-7-8
- Box breathing
- Grounding 5-4-3-2-1
- Técnica STOP para ansiedad
- Journaling guiado',

'Hola, soy **Alma**, tu Acompañante de Bienestar Emocional. 💜

Estoy aquí para escucharte, sin juicios. Puedo acompañarte en momentos de estrés, ansiedad o cuando simplemente necesitás hablar con alguien.

🆘 Si estás en una crisis, por favor contactá: **135** (AR) | **800-911-2000** (MX) | **106** (CO)

¿Cómo estás hoy?',

'[
  {"label": "Me siento ansioso/a", "prompt": "Últimamente me siento muy ansioso/a. No sé cómo manejarlo."},
  {"label": "Técnicas para relajarme", "prompt": "¿Podés enseñarme alguna técnica para relajarme cuando me siento abrumado/a?"},
  {"label": "Problemas para dormir", "prompt": "Tengo problemas para conciliar el sueño por pensamientos que no puedo detener."},
  {"label": "Relaciones difíciles", "prompt": "Estoy teniendo conflictos en mis relaciones y no sé cómo manejarlo."},
  {"label": "Empezar meditación", "prompt": "Me interesa empezar a meditar pero no sé cómo comenzar."}
]',

'["Escucha empática", "Manejo de ansiedad", "Mindfulness", "Técnicas de relajación", "Orientación emocional"]',

'start', 4),

-- HOGAR
('home', 'Asesor del Hogar', 'Hogar', 'Mantenimiento y Mejoras del Hogar',
'Plomería, electricidad básica, pintura, jardinería y mantenimiento general.',
'🏠', '#f97316',
'Sos el Asesor del Hogar IA de TuAsesor. Tu nombre es Tito.

PERSONALIDAD: Práctico, amigable, paso a paso. Como ese vecino que sabe de todo y siempre está dispuesto a ayudar. Usás lenguaje cotidiano, no técnico. Sos paciente con los que no saben.

CAPACIDADES:
- Plomería básica (goteras, destape, cambio de grifería)
- Electricidad básica (cambio de tomacorrientes, interruptores, luces)
- Pintura interior y exterior
- Jardinería y plantas
- Reparaciones menores (puertas, ventanas, pisos)
- Diagnóstico de problemas del hogar

REGLAS DE SEGURIDAD CRÍTICAS:
1. GAS: NUNCA des instrucciones sobre instalaciones de gas. SIEMPRE derivá a gasista matriculado. Si hay olor a gas, indicar PRIMERO que abran ventanas y llamen al servicio de emergencias.
2. ALTA TENSIÓN: No des instrucciones para trabajar en el tablero eléctrico principal, alta tensión ni líneas externas. Derivá a electricista matriculado.
3. ESTRUCTURAS: No des asesoramiento sobre demolición de paredes, problemas estructurales graves. Derivá a arquitecto/ingeniero.
4. SIEMPRE incluí advertencias de seguridad al inicio de cada trabajo.
5. Para trabajos en altura (más de 2 metros), siempre recomendá andamio y ayuda.

FORMATO DE RESPUESTA:
- Listá los materiales necesarios primero
- Pasos numerados y claros
- ⚠️ para advertencias de seguridad
- 💡 para tips y trucos
- Estimación de dificultad: Fácil / Medio / Difícil',

'¡Hola! Soy **Tito**, tu Asesor del Hogar. 🔧

Soy como ese vecino que sabe de todo: plomería, electricidad básica, pintura, jardinería... ¡Lo que necesites!

⚠️ Para gas y alta tensión siempre recomiendo profesionales matriculados.

¿Qué problema del hogar querés resolver hoy?',

'[
  {"label": "Canilla que gotea", "prompt": "Tengo una canilla que gotea. ¿Cómo la reparo?"},
  {"label": "Pintar una habitación", "prompt": "Quiero pintar mi habitación. ¿Por dónde empiezo y qué materiales necesito?"},
  {"label": "Tapar humedad", "prompt": "Tengo manchas de humedad en la pared. ¿Cómo las soluciono?"},
  {"label": "Jardinería básica", "prompt": "Quiero empezar un pequeño jardín en casa. ¿Qué plantas son fáciles para principiantes?"},
  {"label": "Destape de cañería", "prompt": "Se me tapó el desagüe del baño. ¿Cómo lo destapо sin llamar al plomero?"}
]',

'["Plomería básica", "Electricidad básica", "Pintura", "Jardinería", "Reparaciones generales"]',

'start', 5);

-- ============================================================
-- PLAN LIMITS CONFIG
-- ============================================================
UPDATE tenants SET
  max_users = 1,
  max_contracts_per_month = 1,
  max_ai_queries_per_month = 2,
  max_analysis_credits = 1
WHERE plan = 'free';

UPDATE tenants SET
  max_users = 1,
  max_contracts_per_month = 5,
  max_ai_queries_per_month = 20,
  max_analysis_credits = 2
WHERE plan = 'start';

UPDATE tenants SET
  max_users = 5,
  max_contracts_per_month = 25,
  max_ai_queries_per_month = 100,
  max_analysis_credits = 10
WHERE plan = 'pro';

UPDATE tenants SET
  max_users = 99999,
  max_contracts_per_month = 99999,
  max_ai_queries_per_month = 99999,
  max_analysis_credits = 30
WHERE plan = 'enterprise';
-- ============================================================
-- TuAsesor — Migration 003: Advisor-Specific Tools
-- ============================================================

-- ============================================================
-- SALUD: Consultas de síntomas
-- ============================================================
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symptoms JSONB NOT NULL DEFAULT '[]',
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'emergency')),
  ai_response TEXT,
  recommended_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_health_checks_user_id ON health_checks(user_id);
CREATE INDEX idx_health_checks_tenant_id ON health_checks(tenant_id);

ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_checks_isolation ON health_checks USING (tenant_id = public.tenant_id());

-- ============================================================
-- SALUD: Diario de bienestar diario
-- ============================================================
CREATE TABLE wellness_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood INT CHECK (mood BETWEEN 1 AND 5),
  energy INT CHECK (energy BETWEEN 1 AND 5),
  sleep_hours NUMERIC(4,1),
  water_glasses INT,
  exercise_minutes INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);
CREATE INDEX idx_wellness_logs_user_id ON wellness_logs(user_id);
CREATE INDEX idx_wellness_logs_date ON wellness_logs(log_date);

ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY wellness_logs_isolation ON wellness_logs
  USING (user_id = (SELECT id FROM users WHERE id = auth.uid() LIMIT 1));

-- ============================================================
-- FINANZAS: Registro de ingresos/gastos
-- ============================================================
CREATE TYPE budget_entry_type AS ENUM ('income', 'expense', 'saving');

CREATE TABLE budget_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type budget_entry_type NOT NULL DEFAULT 'expense',
  category VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'ARS',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_budget_entries_user_id ON budget_entries(user_id);
CREATE INDEX idx_budget_entries_tenant_id ON budget_entries(tenant_id);
CREATE INDEX idx_budget_entries_date ON budget_entries(entry_date);

ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY budget_entries_isolation ON budget_entries USING (tenant_id = public.tenant_id());

-- ============================================================
-- FINANZAS: Metas financieras
-- ============================================================
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused');

CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'ARS',
  deadline DATE,
  status goal_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);

ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY financial_goals_isolation ON financial_goals
  USING (user_id = (SELECT id FROM users WHERE id = auth.uid() LIMIT 1));

-- ============================================================
-- BIENESTAR: Diario emocional
-- ============================================================
CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood INT NOT NULL CHECK (mood BETWEEN 1 AND 5),
  emotions JSONB NOT NULL DEFAULT '[]',
  triggers TEXT,
  journal_text TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entry_date)
);
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_date ON mood_entries(entry_date);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY mood_entries_isolation ON mood_entries
  USING (user_id = (SELECT id FROM users WHERE id = auth.uid() LIMIT 1));

-- ============================================================
-- BIENESTAR: Ejercicios guiados
-- ============================================================
CREATE TABLE guided_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id VARCHAR(50) REFERENCES advisors(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 5,
  description TEXT NOT NULL,
  instructions JSONB NOT NULL DEFAULT '[]',
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  icon VARCHAR(10),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE guided_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY guided_exercises_read ON guided_exercises FOR SELECT USING (TRUE);

-- ============================================================
-- HOGAR: Checklists de mantenimiento
-- ============================================================
CREATE TYPE checklist_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

CREATE TABLE home_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  frequency checklist_frequency NOT NULL DEFAULT 'monthly',
  items JSONB NOT NULL DEFAULT '[]',
  last_completed DATE,
  next_due DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_home_checklists_user_id ON home_checklists(user_id);

ALTER TABLE home_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY home_checklists_isolation ON home_checklists
  USING (user_id = (SELECT id FROM users WHERE id = auth.uid() LIMIT 1));

-- ============================================================
-- SEEDS: Ejercicios guiados de bienestar
-- ============================================================
INSERT INTO guided_exercises (advisor_id, title, category, duration_minutes, description, instructions, difficulty, icon, sort_order) VALUES

('psychology', 'Respiración 4-7-8', 'respiracion', 5,
'Técnica de respiración que activa el sistema nervioso parasimpático, ideal para reducir ansiedad aguda y prepararse para dormir.',
'[
  {"step": 1, "text": "Adoptá una postura cómoda, espalda recta. Podés estar sentado o acostado."},
  {"step": 2, "text": "Exhalá completamente por la boca, vaciando los pulmones."},
  {"step": 3, "text": "Cerrá la boca e inhalá suavemente por la nariz contando mentalmente hasta 4."},
  {"step": 4, "text": "Retení el aire contando hasta 7. No fuerces — si necesitás, hacé la pausa más corta."},
  {"step": 5, "text": "Exhalá completamente por la boca durante 8 segundos, haciendo un suave sonido."},
  {"step": 6, "text": "Este ciclo completo es una respiración. Repetí 3 a 4 veces."},
  {"step": 7, "text": "Con la práctica diaria, este ejercicio se vuelve más efectivo."}
]',
'beginner', '🌬️', 1),

('psychology', 'Body Scan', 'relajacion', 15,
'Técnica de atención plena que recorre el cuerpo sistemáticamente para liberar tensión y conectar con las sensaciones físicas.',
'[
  {"step": 1, "text": "Acostáte boca arriba en un lugar cómodo y silencioso."},
  {"step": 2, "text": "Cerrá los ojos y tomá 3 respiraciones profundas para centrarte."},
  {"step": 3, "text": "Llevá tu atención a los dedos de los pies. Notá cualquier sensación: temperatura, tensión, hormigueo."},
  {"step": 4, "text": "Subí lentamente por las plantas de los pies, tobillos, pantorrillas."},
  {"step": 5, "text": "Continuá hacia las rodillas, muslos, cadera. Respirá en cada zona."},
  {"step": 6, "text": "Pasá por el abdomen, pecho, espalda baja y alta."},
  {"step": 7, "text": "Continuá por los hombros, brazos, manos y dedos."},
  {"step": 8, "text": "Finalizá con cuello, mandíbula, cara y cabeza."},
  {"step": 9, "text": "Tomá un momento con atención en todo el cuerpo antes de abrir los ojos."}
]',
'beginner', '🧘', 2),

('psychology', 'Journaling de gratitud', 'journaling', 10,
'Práctica de escritura reflexiva que redirige la atención hacia aspectos positivos y fortalece la resiliencia emocional.',
'[
  {"step": 1, "text": "Tomá un cuaderno o usá la sección de notas de la app. Elegí un momento tranquilo."},
  {"step": 2, "text": "Escribí 3 cosas por las que estás agradecido/a hoy. Pueden ser grandes o pequeñas."},
  {"step": 3, "text": "Para cada una, escribí brevemente por qué te genera gratitud."},
  {"step": 4, "text": "Escribí algo bueno que hiciste hoy, aunque sea pequeño."},
  {"step": 5, "text": "Escribí algo que querés mejorar mañana, con compasión, sin autocrítica."},
  {"step": 6, "text": "Releé lo que escribiste antes de cerrar."}
]',
'beginner', '📓', 3),

('psychology', 'Grounding 5-4-3-2-1', 'grounding', 5,
'Técnica de anclaje sensorial para salir de una crisis de ansiedad o disociación, conectando con el presente a través de los sentidos.',
'[
  {"step": 1, "text": "Reconocé que estás teniendo un momento difícil. Eso requiere valentía."},
  {"step": 2, "text": "VISTA: Nombrá 5 cosas que podés ver ahora mismo a tu alrededor."},
  {"step": 3, "text": "TACTO: Identificá 4 cosas que podés tocar. Tocálas y describí cómo se sienten."},
  {"step": 4, "text": "OÍDO: Escuchá y nombrá 3 sonidos que podés escuchar en este momento."},
  {"step": 5, "text": "OLFATO: Identificá 2 cosas que podés oler (perfume, comida, aire fresco)."},
  {"step": 6, "text": "GUSTO: Nombrá 1 cosa que podés saborear o que te gustaría saborear."},
  {"step": 7, "text": "Tomá una respiración profunda. Observá si te sentís más presente."}
]',
'beginner', '🌱', 4),

('psychology', 'Reestructuración cognitiva ABC', 'cognitivo', 15,
'Técnica de Terapia Cognitivo-Conductual para identificar y cuestionar pensamientos automáticos negativos.',
'[
  {"step": 1, "text": "A - ACONTECIMIENTO: Describí la situación que desencadenó el malestar. Solo los hechos, sin interpretación."},
  {"step": 2, "text": "B - BELIEFS (Creencias): ¿Qué pensaste sobre esa situación? Escribí todos los pensamientos que surgieron."},
  {"step": 3, "text": "C - CONSECUENCIAS: ¿Qué emoción sentiste? ¿Qué hiciste como resultado de ese pensamiento?"},
  {"step": 4, "text": "CUESTIONAR: Para cada pensamiento preguntate: ¿Tengo evidencia real de que esto es cierto?"},
  {"step": 5, "text": "ALTERNATIVAS: ¿Hay otra forma de ver la misma situación que sea más balanceada?"},
  {"step": 6, "text": "NUEVO PENSAMIENTO: Escribí una versión más realista y equilibrada del pensamiento original."},
  {"step": 7, "text": "EMOCIÓN NUEVA: ¿Cómo te sentís con el pensamiento alternativo?"}
]',
'intermediate', '🧠', 5)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEEDS: Checklists de mantenimiento del hogar
-- ============================================================
-- Nota: home_checklists requiere user_id, se seedean como templates
-- Los checklists se crean por usuario desde la app
-- Guardamos templates en la tabla guided_exercises del asesor hogar

INSERT INTO guided_exercises (advisor_id, title, category, duration_minutes, description, instructions, difficulty, icon, sort_order) VALUES

('home', 'Checklist mantenimiento mensual', 'mantenimiento', 30,
'Revisión mensual del hogar para prevenir problemas mayores y mantener todo en buen estado.',
'[
  {"step": 1, "text": "Revisar filtros de aire acondicionado/ventilación y limpiar si corresponde."},
  {"step": 2, "text": "Inspeccionar bajo mesada de cocina y baño — buscar humedad, pérdidas o manchas."},
  {"step": 3, "text": "Revisar grifería: canillas, ducheras, inodoros. Verificar que no gotee nada."},
  {"step": 4, "text": "Limpiar rejillas de desagüe del baño y cocina con destaponador preventivo."},
  {"step": 5, "text": "Verificar tomacorrientes e interruptores — ninguno debe estar flojo, caliente o con marcas."},
  {"step": 6, "text": "Revisar estado de selladores en ventanas y puertas (evita filtraciones)."},
  {"step": 7, "text": "Controlar estado de la pintura en zonas húmedas (baño, cocina) buscando manchas."},
  {"step": 8, "text": "Revisar puertas y ventanas: bisagras, cerraduras y burletes en buen estado."}
]',
'beginner', '🏠', 10),

('home', 'Preparación para invierno', 'estacional', 60,
'Checklist para preparar el hogar antes de la temporada de frío y evitar problemas con el clima.',
'[
  {"step": 1, "text": "Revisar calefacción (caldera, estufas, radiadores). Si usás gas, llamá a un gasista matriculado para el service anual."},
  {"step": 2, "text": "Verificar que todas las ventanas y puertas cierren bien y no haya corrientes de aire."},
  {"step": 3, "text": "Inspeccionar el techo si es accesible — buscar tejas rotas, canaletas obstruidas con hojas."},
  {"step": 4, "text": "Limpiar canaletas de desagüe pluvial para evitar desborde con lluvias."},
  {"step": 5, "text": "Revisar impermeabilización de terrazas y balcones (manchas o deterioro del membrana)."},
  {"step": 6, "text": "Verificar desagüe de patio o garaje — que el agua escurra correctamente."},
  {"step": 7, "text": "Guardar o cubrir muebles de jardín y plantas sensibles al frío."},
  {"step": 8, "text": "Revisar extintores — verificar fecha de vencimiento y presión."}
]',
'beginner', '❄️', 11)

ON CONFLICT (id) DO NOTHING;
-- ============================================================
-- 004 — Billing idempotency
-- Previene duplicación de créditos cuando Stripe reenvía un webhook
-- (event delivery retries / network timeouts).
-- ============================================================

-- Unique partial index: solo afecta a tipo 'purchase' con reference_id no nulo.
-- Permite múltiples consumos (consume) con reference_id repetido (mensaje IA, etc.).
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_ledger_purchase_reference
  ON credit_ledger (reference_id)
  WHERE type = 'purchase' AND reference_id IS NOT NULL;

-- Índice compuesto para paginación de transacciones por tenant
CREATE INDEX IF NOT EXISTS idx_credit_ledger_tenant_created
  ON credit_ledger (tenant_id, created_at DESC);

-- ============================================================
-- Idempotencia de webhooks Stripe
-- Tabla simple para deduplicar event.id procesados.
-- ============================================================
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON stripe_webhook_events (processed_at DESC);

-- Limpia eventos viejos (>90 días) — se puede correr manual o vía cron.
COMMENT ON TABLE stripe_webhook_events IS
  'Idempotencia de webhooks Stripe. Limpiar entradas con processed_at < NOW() - INTERVAL ''90 days''.';
-- TuAsesor — Contract Templates Seeds
INSERT INTO contract_templates (type, jurisdiction, name, description, content_html, required_fields, default_clauses) VALUES

('alquiler', 'argentina',
'Contrato de Locación Residencial — Argentina',
'Template para alquiler residencial bajo Ley 27.551',
'<div style="font-family: Times New Roman, serif; padding: 20px;">
<h1 style="text-align:center;text-transform:uppercase;font-size:16pt">CONTRATO DE LOCACIÓN</h1>
<p style="text-align:center">Ciudad de {{ciudad}}, {{fecha}}</p>

<h2>PARTES</h2>
<p><strong>LOCADOR:</strong> {{nombre_locador}}, DNI {{dni_locador}}, con domicilio en {{domicilio_locador}}.</p>
<p><strong>LOCATARIO:</strong> {{nombre_locatario}}, DNI {{dni_locatario}}, con domicilio en {{domicilio_locatario}}.</p>

<h2>OBJETO</h2>
<p>El locador da en locación al locatario el inmueble ubicado en {{direccion_inmueble}}, para uso exclusivamente habitacional.</p>

<h2>CLÁUSULA PRIMERA — PLAZO</h2>
<p>El plazo de la locación será de {{plazo}} años, contados desde el {{fecha_inicio}}, con vencimiento el {{fecha_fin}}. En cumplimiento de la Ley 27.551, el plazo mínimo es de tres (3) años.</p>

<h2>CLÁUSULA SEGUNDA — CANON LOCATIVO</h2>
<p>El canon locativo mensual es de PESOS {{monto_alquiler}} ($ {{monto_alquiler}}), ajustable según el Índice Casa Propia (ICP) elaborado por el BCRA, con periodicidad anual.</p>

<h2>CLÁUSULA TERCERA — DEPÓSITO EN GARANTÍA</h2>
<p>El locatario entrega en este acto la suma de PESOS {{deposito}} (equivalente a {{cantidad_meses}} meses de alquiler) en concepto de depósito en garantía, que será devuelto al finalizar el contrato.</p>

<h2>CLÁUSULA CUARTA — EXPENSAS Y SERVICIOS</h2>
<p>Las expensas ordinarias estarán a cargo del locatario. Las extraordinarias corresponden al locador. Los servicios de agua, gas, electricidad e internet corresponden al locatario.</p>

<h2>CLÁUSULA QUINTA — DESTINO</h2>
<p>El inmueble se destina exclusivamente a vivienda familiar del locatario. No podrá subarrendarse sin consentimiento escrito del locador.</p>

<h2>CLÁUSULA SEXTA — RESCISIÓN ANTICIPADA</h2>
<p>Conforme al Art. 1221 del CCyC, el locatario podrá rescindir el contrato en cualquier momento, notificando con la antelación prevista en la ley. Si la rescisión ocurre antes de los 6 meses, corresponde una indemnización de mes y medio de alquiler.</p>

<h2>CLÁUSULA SÉPTIMA — REPARACIONES</h2>
<p>Las reparaciones urgentes y las que hacen al mantenimiento de la habitabilidad están a cargo del locador. Las mejoras por uso son a cargo del locatario.</p>

<div style="margin-top:60px;display:flex;justify-content:space-between">
<div style="width:45%;text-align:center">
<p style="border-top:1px solid #000;padding-top:8px">LOCADOR<br>{{nombre_locador}}<br>DNI: {{dni_locador}}</p>
</div>
<div style="width:45%;text-align:center">
<p style="border-top:1px solid #000;padding-top:8px">LOCATARIO<br>{{nombre_locatario}}<br>DNI: {{dni_locatario}}</p>
</div>
</div>
</div>',
'["ciudad", "fecha", "nombre_locador", "dni_locador", "nombre_locatario", "dni_locatario", "direccion_inmueble", "plazo", "fecha_inicio", "fecha_fin", "monto_alquiler"]',
'["plazo_minimo_3_anios", "ajuste_icp_bcra", "rescision_anticipada_art1221"]'),

('nda', 'argentina',
'Acuerdo de Confidencialidad (NDA) — Argentina',
'Non-Disclosure Agreement para Argentina',
'<div style="font-family: Times New Roman, serif; padding: 20px;">
<h1 style="text-align:center;text-transform:uppercase">ACUERDO DE CONFIDENCIALIDAD</h1>
<p style="text-align:center">{{ciudad}}, {{fecha}}</p>

<h2>PARTES</h2>
<p><strong>PARTE DIVULGANTE:</strong> {{nombre_divulgante}}, CUIT {{cuit_divulgante}}</p>
<p><strong>PARTE RECEPTORA:</strong> {{nombre_receptora}}, CUIT {{cuit_receptora}}</p>

<h2>DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL</h2>
<p>Se considera información confidencial toda información técnica, comercial, financiera, de clientes, proveedores, estrategias de negocio y cualquier otro dato no público que una parte revele a la otra.</p>

<h2>OBLIGACIONES</h2>
<p>La Parte Receptora se compromete a: (i) mantener estricta confidencialidad; (ii) no divulgar a terceros; (iii) usar únicamente para el propósito acordado; (iv) implementar medidas de seguridad razonables.</p>

<h2>PLAZO</h2>
<p>Este acuerdo tendrá vigencia de {{plazo_anios}} años desde la firma.</p>

<h2>EXCEPCIONES</h2>
<p>Las obligaciones no aplican a información que: sea de dominio público, ya fuera conocida por la receptora, deba revelarse por orden judicial.</p>

<h2>JURISDICCIÓN</h2>
<p>Las partes se someten a los tribunales ordinarios de {{ciudad_jurisdiccion}}.</p>

<div style="margin-top:60px;display:flex;justify-content:space-between">
<div style="width:45%;text-align:center">
<p style="border-top:1px solid #000;padding-top:8px">PARTE DIVULGANTE<br>{{nombre_divulgante}}</p>
</div>
<div style="width:45%;text-align:center">
<p style="border-top:1px solid #000;padding-top:8px">PARTE RECEPTORA<br>{{nombre_receptora}}</p>
</div>
</div>
</div>',
'["nombre_divulgante", "cuit_divulgante", "nombre_receptora", "cuit_receptora", "plazo_anios"]',
'["confidencialidad_absoluta", "jurisdiccion_ordinaria"]');
-- TuAsesor — Legal Knowledge Base — Argentina
INSERT INTO legal_documents (title, country, category, document_type, content, source) VALUES

('Ley 27.551 — Contrato de Locación Argentina',
'AR', 'alquiler', 'ley',
'La Ley 27.551 establece las condiciones del contrato de locación en Argentina.
PLAZO MÍNIMO: El plazo mínimo de la locación con destino habitacional es de 3 años (Art. 1198 CCyC modificado).
AJUSTE: El ajuste del canon locativo es anual y se rige por el Índice Casa Propia (ICP) elaborado por el BCRA.
DEPÓSITO: El depósito en garantía no puede superar el equivalente al primer mes de alquiler para inmuebles con destino habitacional.
RESCISIÓN ANTICIPADA: El locatario puede rescindir el contrato en cualquier momento con la antelación prevista. Si es antes de los 6 meses de firmado, debe abonar al locador, en concepto de indemnización, la suma equivalente a mes y medio de alquiler al momento de desocupar. Si la rescisión se produce transcurrido ese lapso, la indemnización es de un mes de alquiler.
REPARACIONES: El locador debe realizar las reparaciones de urgencia y las que hacen a la habitabilidad del inmueble. El locatario está obligado a conservar la cosa y puede reclamar el reintegro de las reparaciones urgentes.
EXPENSAS: Las expensas ordinarias están a cargo del locatario. Las extraordinarias son a cargo del locador.
PROHIBICIONES: Queda prohibido exigir el pago de alquileres en moneda extranjera, o como condición al contrato de locación, el pago de sumas en concepto de "llave" o similares.',
'Boletín Oficial Argentina — Ley 27.551/2020'),

('Código Civil y Comercial — Contratos (Arts. 957-1091)',
'AR', 'contratos', 'codigo',
'CONCEPTO: El contrato es el acto jurídico mediante el cual dos o más partes manifiestan su consentimiento para crear, regular, modificar, transferir o extinguir relaciones jurídicas patrimoniales (Art. 957).
FORMACIÓN: El contrato se concluye con la recepción de la aceptación de una oferta (Art. 971). La oferta hecha a persona presente puede ser aceptada solo inmediatamente (Art. 976).
OBJETO: El objeto del contrato debe ser lícito, posible, determinado o determinable, susceptible de valoración económica y corresponder a un interés de las partes (Art. 1003).
CAUSA: La causa es el fin inmediato autorizado por el ordenamiento jurídico que ha sido determinante de la voluntad (Art. 1012).
BUENA FE: Los contratos deben celebrarse, interpretarse y ejecutarse de buena fe (Art. 961).
ABUSO DE POSICIÓN DOMINANTE: El juez puede intervenir cuando una parte usa su posición dominante de manera abusiva (Art. 11).
CLÁUSULAS ABUSIVAS: Las cláusulas que desnaturalizan las obligaciones del predisponente, limitan la responsabilidad o amplían los derechos del predisponente en perjuicio del adherente son ineficaces (Art. 988).
INTERPRETACIÓN: El contrato debe interpretarse conforme a la intención común de las partes y al principio de conservación del contrato (Art. 1065).',
'Código Civil y Comercial de la Nación Argentina — Ley 26.994/2014'),

('Ley de Contrato de Trabajo (LCT) 20.744 — Argentina',
'AR', 'laboral', 'ley',
'CONCEPTO: Habrá contrato de trabajo cuando una persona física se obligue a realizar actos, ejecutar obras o prestar servicios en favor de la otra y bajo su dependencia (Art. 22).
PERÍODO DE PRUEBA: El contrato de trabajo por tiempo indeterminado se entiende celebrado a prueba durante los primeros 3 meses (Art. 92 bis).
JORNADA: La jornada normal de trabajo no podrá exceder de 8 horas diarias o 48 semanales (Ley 11.544). El trabajo nocturno no puede exceder de 7 horas.
REMUNERACIÓN: El trabajador tiene derecho a una remuneración no inferior al salario mínimo, vital y móvil (Art. 116).
VACACIONES: El trabajador goza de vacaciones pagas según su antigüedad: 14 días (hasta 5 años), 21 días (5-10 años), 28 días (10-20 años), 35 días (más de 20 años) (Art. 150).
AGUINALDO: El trabajador tiene derecho al sueldo anual complementario (SAC), equivalente al 50% de la mayor remuneración devengada en cada semestre (Art. 121).
INDEMNIZACIÓN POR DESPIDO: En caso de despido sin justa causa, el empleador debe abonar indemnización equivalente a 1 mes de sueldo por cada año de servicio o fracción mayor de 3 meses (Art. 245). El mínimo es 2 meses.
PREAVISO: El empleador debe otorgar preaviso de 15 días (período de prueba), 1 mes (hasta 5 años) o 2 meses (más de 5 años) (Art. 231).',
'Ley de Contrato de Trabajo 20.744 — Argentina'),

('Ley 24.240 — Defensa del Consumidor Argentina',
'AR', 'consumidor', 'ley',
'CONCEPTO: Rige las relaciones de consumo entre proveedores y consumidores (Art. 1).
INFORMACIÓN: El proveedor debe suministrar al consumidor información cierta, clara y detallada sobre las características esenciales de los bienes y servicios que provee (Art. 4).
CLÁUSULAS ABUSIVAS: Se consideran términos o cláusulas abusivas las que afectan inequitativamente al consumidor en el cotejo entre los derechos y obligaciones de ambas partes (Art. 37).
GARANTÍA: Los fabricantes, importadores y vendedores ofrecen garantía obligatoria de 6 meses para cosas muebles no consumibles (Art. 11).
REVOCACIÓN: En operaciones de venta domiciliaria, por correspondencia, o por cualquier otro medio, el consumidor tiene derecho a revocar la aceptación dentro de los 10 días corridos (Art. 34).
RESPONSABILIDAD: El daño sufrido por el consumidor como consecuencia de vicio o riesgo de la cosa, o de la prestación del servicio, genera la responsabilidad solidaria del fabricante, importador, distribuidor y vendedor (Art. 40).',
'Ley 24.240 de Defensa del Consumidor — Argentina'),

('Monotributo y AFIP — Argentina',
'AR', 'impuestos', 'normativa',
'El monotributo es un régimen simplificado para pequeños contribuyentes que unifica el pago de IVA e impuesto a las ganancias.
CATEGORÍAS: Existen categorías A a K para servicios y A a K para venta de cosas muebles, según facturación anual y parámetros de energía y superficie.
FACTURACIÓN 2024: La categoría A abarca hasta $1.700.000 anuales para servicios. La categoría K es la máxima.
CUOTA: Se paga mensualmente un importe fijo que incluye: componente impositivo + aportes previsionales (jubilación + obra social).
RECATEGORIZACIÓN: Se realiza cada cuatro meses (en enero, mayo y septiembre), evaluando los últimos 12 meses de actividad.
EXCLUSIÓN: Se excluye del monotributo quien supere en el año el límite de facturación de su categoría máxima o tenga ingresos de más de 3 fuentes.
FACTURACIÓN ELECTRÓNICA: Obligatoria para todos los monotributistas. Las facturas A son para responsables inscriptos; B para consumidores finales y monotributistas.',
'AFIP — Régimen Simplificado Monotributo Argentina 2024');
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
