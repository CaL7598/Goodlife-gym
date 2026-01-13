-- Migration: Add Row Level Security policies for expenses table
-- Run this in your Supabase SQL Editor after running MIGRATION_ADD_EXPENSES_TABLE.sql

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all expenses
CREATE POLICY "Allow authenticated users to view expenses" 
ON expenses 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Allow authenticated users to insert expenses
CREATE POLICY "Allow authenticated users to insert expenses" 
ON expenses 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy: Allow authenticated users to update expenses
CREATE POLICY "Allow authenticated users to update expenses" 
ON expenses 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy: Allow authenticated users to delete expenses
CREATE POLICY "Allow authenticated users to delete expenses" 
ON expenses 
FOR DELETE 
TO authenticated 
USING (true);

-- Policy: Allow service_role full access to expenses
CREATE POLICY "Allow service_role full access to expenses" 
ON expenses 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'expenses'
ORDER BY policyname;
