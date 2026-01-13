-- Quick Fix: Disable RLS on expenses table to fix immediate errors
-- Run this FIRST in your Supabase SQL Editor if you're getting RLS policy errors
-- Then run MIGRATION_ADD_EXPENSES_RLS.sql to enable RLS with proper policies

-- Disable RLS temporarily to allow operations
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'expenses';
