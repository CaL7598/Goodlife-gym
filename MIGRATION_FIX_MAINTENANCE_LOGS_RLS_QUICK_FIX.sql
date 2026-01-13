-- Quick Fix: Disable RLS on maintenance_logs table to fix immediate errors
-- Run this FIRST in your Supabase SQL Editor if you're getting RLS policy errors
-- Then run MIGRATION_ADD_MAINTENANCE_LOGS_RLS.sql to enable RLS with proper policies

-- Disable RLS temporarily to allow operations
ALTER TABLE maintenance_logs DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'maintenance_logs';
