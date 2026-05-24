ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_cancelled_at timestamptz;
