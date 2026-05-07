-- ============================================================
-- MiAsesor — Migration 006: Drop Stripe-era artifacts
-- ============================================================
-- Después de la migración a Mercado Pago, las columnas y la tabla
-- relacionadas con Stripe quedaron huérfanas. Esta migración:
--   1) Elimina las 3 columnas stripe_* de tenants (no se leen ni
--      escriben desde el código nuevo).
--   2) Renombra la tabla de idempotencia de webhooks a un nombre
--      neutro (payment_webhook_events) — ya recibe eventos de MP.
-- Es idempotente: usa IF EXISTS / IF NOT EXISTS donde aplica.
-- ============================================================

-- 1) Drop columnas Stripe huérfanas en tenants
ALTER TABLE public.tenants
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS stripe_price_id;

-- 2) Renombrar tabla de webhook idempotency a un nombre neutro
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stripe_webhook_events'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payment_webhook_events'
  ) THEN
    ALTER TABLE public.stripe_webhook_events RENAME TO payment_webhook_events;
  END IF;
END $$;

-- Renombrar índice asociado para que matchee el nuevo nombre
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_stripe_webhook_events_processed_at'
  ) THEN
    ALTER INDEX idx_stripe_webhook_events_processed_at
      RENAME TO idx_payment_webhook_events_processed_at;
  END IF;
END $$;

COMMENT ON TABLE public.payment_webhook_events IS
  'Idempotencia de webhooks del processor de pagos (Mercado Pago). Limpiar entradas con processed_at < NOW() - INTERVAL ''90 days''.';
