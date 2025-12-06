-- Create archived_jobs table to store archived saved jobs
CREATE TABLE public.archived_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_archived_job UNIQUE (user_id, job_id)
);

-- Enable RLS
ALTER TABLE public.archived_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own archived jobs"
ON public.archived_jobs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own archived jobs"
ON public.archived_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own archived jobs"
ON public.archived_jobs
FOR DELETE
USING (auth.uid() = user_id);