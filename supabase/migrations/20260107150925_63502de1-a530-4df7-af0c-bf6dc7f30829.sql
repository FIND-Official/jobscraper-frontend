-- Add cron job for automated scraping every 6 hours
-- This scrapes fresh jobs so there's always content for alert emails

-- First, clean up existing job-alerts cron if it exists
SELECT cron.unschedule('job-alerts-hourly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'job-alerts-hourly'
);

-- Schedule automated scraping every 6 hours
SELECT cron.schedule(
  'scrape-jobs-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ydvmulhmmragakuimuqm.supabase.co/functions/v1/scrape-jobs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkdm11bGhtbXJhZ2FrdWltdXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTk1NzksImV4cCI6MjA3OTU3NTU3OX0.YozlONF8m9qE25xNSSk-s7xIqBEEV0LPB90oGVcS-10"}'::jsonb,
    body := '{"boards": ["We Work Remotely", "RemoteOK", "Working Nomads", "Remote.com"], "searchQuery": ""}'::jsonb
  ) AS request_id;
  $$
);

-- Re-schedule job alerts to run hourly (checks user preferences)
SELECT cron.schedule(
  'job-alerts-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ydvmulhmmragakuimuqm.supabase.co/functions/v1/job-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkdm11bGhtbXJhZ2FrdWltdXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTk1NzksImV4cCI6MjA3OTU3NTU3OX0.YozlONF8m9qE25xNSSk-s7xIqBEEV0LPB90oGVcS-10"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);