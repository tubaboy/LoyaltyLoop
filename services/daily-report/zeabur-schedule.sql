-- Enable the pg_cron extension
create extension if not exists pg_cron with schema extensions;

-- Grant usage (standard)
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- 1. Unschedule old job
select cron.unschedule('daily-report-cron');

-- 2. Schedule the new job using Zeabur Internal Networking
-- Use the Service Name you set in Zeabur, e.g., "daily-report"
-- Zeabur internal DNS pattern: http://<SERVICE_NAME>.zeabur.internal:<PORT>
-- Assuming service name is "daily-report" and port is 8000
select cron.schedule(
  'daily-report-cron',
  '0 13 * * *',  -- UTC 13:00 = TW 21:00
  $$
  select
    net.http_post(
        url:='http://daily-report.zeabur.internal:8000/report',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
