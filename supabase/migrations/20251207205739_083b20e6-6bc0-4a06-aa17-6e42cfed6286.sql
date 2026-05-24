-- Create dismissed_jobs table to track jobs users have dismissed
CREATE TABLE public.dismissed_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS
ALTER TABLE public.dismissed_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for dismissed_jobs
CREATE POLICY "Users can view own dismissed jobs"
ON public.dismissed_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dismissed jobs"
ON public.dismissed_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dismissed jobs"
ON public.dismissed_jobs FOR DELETE
USING (auth.uid() = user_id);

-- Add monthly export tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN monthly_export_count integer NOT NULL DEFAULT 0,
ADD COLUMN export_reset_date timestamptz NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month';

-- Create index for faster lookups
CREATE INDEX idx_dismissed_jobs_user_id ON public.dismissed_jobs(user_id);
CREATE INDEX idx_dismissed_jobs_job_id ON public.dismissed_jobs(job_id);