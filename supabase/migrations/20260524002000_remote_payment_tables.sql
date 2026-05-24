-- Mirrored from the linked Supabase remote schema on 2026-05-24.
-- These tables exist remotely outside the local migration history.

CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'paystack'::text,
  event_type TEXT NOT NULL,
  reference TEXT,
  provider_transaction_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT payment_webhook_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS payment_webhook_logs_provider_event_idx
  ON public.payment_webhook_logs USING btree (provider, event_type);

CREATE INDEX IF NOT EXISTS payment_webhook_logs_provider_tx_idx
  ON public.payment_webhook_logs USING btree (provider_transaction_id);

CREATE INDEX IF NOT EXISTS payment_webhook_logs_reference_idx
  ON public.payment_webhook_logs USING btree (reference);

CREATE TABLE IF NOT EXISTS public.paystack_transactions (
  id UUID NOT NULL,
  user_id UUID NOT NULL,
  email TEXT,
  reference TEXT,
  plan TEXT,
  amount_usd NUMERIC,
  amount_ngn INTEGER,
  exchange_rate NUMERIC,
  currency TEXT,
  status TEXT,
  paystack_transaction_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT paystack_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT paystack_transactions_reference_key UNIQUE (reference)
);

CREATE INDEX IF NOT EXISTS paystack_transactions_status_idx
  ON public.paystack_transactions USING btree (status);

CREATE INDEX IF NOT EXISTS paystack_transactions_user_id_idx
  ON public.paystack_transactions USING btree (user_id);
