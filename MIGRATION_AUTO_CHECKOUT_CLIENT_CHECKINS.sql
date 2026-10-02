-- Migration: Automatically check out clients who forgot to check out
-- Run this in your Supabase SQL Editor
--
-- The app already does this whenever staff open the Client Check-In page.
-- This job does it in the database every night, even if nobody opens the dashboard.
--
-- Requires the pg_cron extension
-- (Supabase Dashboard -> Database -> Extensions -> enable "pg_cron")
--
-- Rule (same as getAutoCheckOutTime in lib/dateUtils.ts):
--   * still checked in at closing time (8:00 PM Ghana time) -> checked out at 8:00 PM that day
--   * checked in after 8:00 PM                              -> checked out at 11:59:59 PM that day

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION auto_checkout_client_checkins()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  closed_count integer;
BEGIN
  WITH due AS (
    SELECT
      id,
      CASE
        WHEN check_in_time >= (date + time '20:00') AT TIME ZONE 'Africa/Accra'
          THEN (date + time '23:59:59') AT TIME ZONE 'Africa/Accra'
        ELSE (date + time '20:00') AT TIME ZONE 'Africa/Accra'
      END AS auto_check_out_time
    FROM client_checkins
    WHERE check_out_time IS NULL
  )
  UPDATE client_checkins c
  SET check_out_time = due.auto_check_out_time
  FROM due
  WHERE c.id = due.id
    AND due.auto_check_out_time <= NOW();

  GET DIAGNOSTICS closed_count = ROW_COUNT;
  RETURN closed_count;
END;
$$;

-- Run at 8:05 PM and 12:05 AM Ghana time every day (Ghana is UTC+0, pg_cron runs in UTC)
SELECT cron.unschedule('auto-checkout-client-checkins')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-checkout-client-checkins');

SELECT cron.schedule(
  'auto-checkout-client-checkins',
  '5 0,20 * * *',
  $$SELECT auto_checkout_client_checkins();$$
);

-- Close any check-ins that are already overdue right now (returns how many were closed)
SELECT auto_checkout_client_checkins() AS closed_now;

-- Verify the job is scheduled
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'auto-checkout-client-checkins';
