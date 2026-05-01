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
