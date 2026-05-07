-- ============================================================
-- PARCHE PRODUCCIÓN: aplicar migration 006 sobre Supabase actual
-- ============================================================
-- Esto droppea las columnas Stripe huérfanas de tenants y renombra
-- la tabla stripe_webhook_events a payment_webhook_events para que
-- coincida con el código nuevo (post-MP).
--
-- USO: Supabase Dashboard -> SQL Editor -> New query -> pegar TODO
--      -> Run. Es idempotente (IF EXISTS / IF NOT EXISTS).
-- ============================================================

ALTER TABLE public.tenants
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS stripe_price_id;

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
