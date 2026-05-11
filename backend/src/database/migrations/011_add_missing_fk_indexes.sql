-- ============================================================
-- MiAsesor — Índices para FKs que estaban sin cubrir
-- Detectados por el linter de Supabase (lint 0001_unindexed_foreign_keys).
-- Sin estos índices los DELETE/UPDATE sobre la tabla referenciada
-- escanean tabla completa para chequear el constraint.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_contract_versions_tenant_id
  ON public.contract_versions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_contract_versions_changed_by
  ON public.contract_versions(changed_by);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_contract_id
  ON public.risk_assessments(contract_id);

CREATE INDEX IF NOT EXISTS idx_risk_findings_tenant_id
  ON public.risk_findings(tenant_id);

CREATE INDEX IF NOT EXISTS idx_compliance_items_contract_id
  ON public.compliance_items(contract_id);

CREATE INDEX IF NOT EXISTS idx_compliance_items_user_id
  ON public.compliance_items(user_id);

CREATE INDEX IF NOT EXISTS idx_compliance_items_responsible_user_id
  ON public.compliance_items(responsible_user_id);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id
  ON public.credit_ledger(user_id);

CREATE INDEX IF NOT EXISTS idx_guided_exercises_advisor_id
  ON public.guided_exercises(advisor_id);
