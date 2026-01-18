-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the job-alerts function to run every hour
-- This checks all notification preferences and sends alerts based on each user's frequency setting
SELECT cron.schedule(
  'job-alerts-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://ydvmulhmmragakuimuqm.supabase.co/functions/v1/job-alerts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkdm11bGhtbXJhZ2FrdWltdXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTk1NzksImV4cCI6MjA3OTU3NTU3OX0.YozlONF8m9qE25xNSSk-s7xIqBEEV0LPB90oGVcS-10"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);