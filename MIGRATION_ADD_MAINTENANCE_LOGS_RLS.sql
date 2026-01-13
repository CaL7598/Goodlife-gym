-- Migration: Add Row Level Security policies for maintenance_logs table
-- Run this in your Supabase SQL Editor

-- Enable RLS on maintenance_logs table (if not already enabled)
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users (staff and admin) to view all maintenance logs
CREATE POLICY "Allow authenticated users to view maintenance logs"
ON maintenance_logs
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users (staff and admin) to insert maintenance logs
CREATE POLICY "Allow authenticated users to insert maintenance logs"
ON maintenance_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to delete maintenance logs
-- Note: For stricter security, you can modify this to check user roles
CREATE POLICY "Allow authenticated users to delete maintenance logs"
ON maintenance_logs
FOR DELETE
TO authenticated
USING (true);

-- Also allow service_role (for server-side operations) to perform all operations
CREATE POLICY "Allow service_role full access to maintenance logs"
ON maintenance_logs
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
WHERE tablename = 'maintenance_logs';
