-- ============================================================
-- Migration 008: activar plan Free para nuevas cuentas
-- ============================================================

ALTER TABLE tenants
  ALTER COLUMN plan SET DEFAULT 'free',
  ALTER COLUMN subscription_status SET DEFAULT 'free',
  ALTER COLUMN max_contracts_per_month SET DEFAULT 1,
  ALTER COLUMN max_ai_queries_per_month SET DEFAULT 2,
  ALTER COLUMN max_analysis_credits SET DEFAULT 1;

UPDATE advisors
SET requires_plan = 'free'
WHERE id = 'legal';

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
