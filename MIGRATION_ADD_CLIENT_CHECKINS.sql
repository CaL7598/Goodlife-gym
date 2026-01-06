-- Migration: Add client_checkins table
-- Run this in your Supabase SQL Editor

-- Create client_checkins table
CREATE TABLE IF NOT EXISTS client_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_client_checkins_date ON client_checkins(date);
CREATE INDEX IF NOT EXISTS idx_client_checkins_phone ON client_checkins(phone);
CREATE INDEX IF NOT EXISTS idx_client_checkins_check_in_time ON client_checkins(check_in_time DESC);

-- Add comments
COMMENT ON TABLE client_checkins IS 'Client check-in and check-out records for tracking visitor attendance';
COMMENT ON COLUMN client_checkins.full_name IS 'Full name of the client';
COMMENT ON COLUMN client_checkins.phone IS 'Phone number used for identification';
COMMENT ON COLUMN client_checkins.email IS 'Optional email address';
COMMENT ON COLUMN client_checkins.check_in_time IS 'Timestamp when client checked in';
COMMENT ON COLUMN client_checkins.check_out_time IS 'Timestamp when client checked out (NULL if still checked in)';
COMMENT ON COLUMN client_checkins.date IS 'Date of the visit';
COMMENT ON COLUMN client_checkins.notes IS 'Optional notes about the visit';

-- Enable Row Level Security (RLS)
ALTER TABLE client_checkins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
-- For production, you may want to restrict this based on user roles
CREATE POLICY "Allow all operations on client_checkins" 
ON client_checkins 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Verify the table was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'client_checkins'
ORDER BY ordinal_position;

