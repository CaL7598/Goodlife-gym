-- Migration: Add maintenance_logs table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_name TEXT NOT NULL,
  description TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  staff_name TEXT NOT NULL,
  staff_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date_time ON maintenance_logs(date_time DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_equipment_name ON maintenance_logs(equipment_name);

-- Add a comment to explain the table
COMMENT ON TABLE maintenance_logs IS 'Logbook for equipment maintenance records. Records maintenance activities with equipment name, description, date/time, and staff member who recorded it.';

-- Disable RLS initially (enable it after adding policies in MIGRATION_ADD_MAINTENANCE_LOGS_RLS.sql)
-- This allows the table to work immediately, then you can enable RLS with proper policies
ALTER TABLE maintenance_logs DISABLE ROW LEVEL SECURITY;

-- Verify the table was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'maintenance_logs'
ORDER BY ordinal_position;
