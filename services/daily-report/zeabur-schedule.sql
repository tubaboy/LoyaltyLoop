-- Skip extension creation as it is already enabled and managed by the system.
-- 1. Unschedule old job safely
do $$
begin
    if exists (select 1 from cron.job where jobname = 'daily-report-cron') then
        perform cron.unschedule('daily-report-cron');
    end if;
end $$;

-- 2. Schedule the new job using the verified GET /test endpoint
select cron.schedule(
  'daily-report-cron',
  '0 13 * * *',  -- UTC 13:00 = TW 21:00
  $$
  select net.http_get(url:='https://daily-report-loyaltyloop.zeabur.app/test');
  $$
);
