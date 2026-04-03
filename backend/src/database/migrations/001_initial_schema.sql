-- ============================================================
-- AbogadoVirtual — Migration 001: Initial Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE plan_type AS ENUM ('start', 'pro', 'enterprise');
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
  plan plan_type NOT NULL DEFAULT 'start',
  country VARCHAR(10) NOT NULL DEFAULT 'AR',
  legal_jurisdiction VARCHAR(50) NOT NULL DEFAULT 'argentina',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_period_end TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{}',
  max_users INT NOT NULL DEFAULT 1,
  max_contracts_per_month INT NOT NULL DEFAULT 5,
  max_ai_queries_per_month INT NOT NULL DEFAULT 20,
  max_analysis_credits INT NOT NULL DEFAULT 2,
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
CREATE OR REPLACE FUNCTION auth.tenant_id()
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
    WHEN 'start' THEN 2
    WHEN 'pro' THEN 10
    WHEN 'enterprise' THEN 30
    ELSE 2
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
  USING (id = auth.tenant_id());

-- Users: solo del mismo tenant
CREATE POLICY users_isolation ON users
  USING (tenant_id = auth.tenant_id());

-- Contracts
CREATE POLICY contracts_isolation ON contracts
  USING (tenant_id = auth.tenant_id());

-- Contract versions (via parent)
CREATE POLICY contract_versions_isolation ON contract_versions
  USING (tenant_id = auth.tenant_id());

-- Risk assessments
CREATE POLICY risk_assessments_isolation ON risk_assessments
  USING (tenant_id = auth.tenant_id());

-- Risk findings (via parent assessment)
CREATE POLICY risk_findings_isolation ON risk_findings
  USING (tenant_id = auth.tenant_id());

-- Conversations
CREATE POLICY conversations_isolation ON conversations
  USING (tenant_id = auth.tenant_id());

-- Conversation messages
CREATE POLICY conversation_messages_isolation ON conversation_messages
  USING (tenant_id = auth.tenant_id());

-- Compliance items
CREATE POLICY compliance_items_isolation ON compliance_items
  USING (tenant_id = auth.tenant_id());

-- Alerts
CREATE POLICY alerts_isolation ON alerts
  USING (tenant_id = auth.tenant_id());

-- Credit wallets
CREATE POLICY credit_wallets_isolation ON credit_wallets
  USING (tenant_id = auth.tenant_id());

-- Credit ledger
CREATE POLICY credit_ledger_isolation ON credit_ledger
  USING (tenant_id = auth.tenant_id());

-- Audit logs
CREATE POLICY audit_logs_isolation ON audit_logs
  USING (tenant_id = auth.tenant_id());

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
