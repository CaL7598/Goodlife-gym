-- Migration: Add Equipment table for gym equipment management
-- Run this in your Supabase SQL Editor
-- This migration will drop the existing table if it exists and create a new one with the simplified schema

-- Drop existing trigger and function if they exist (do this first before dropping table)
DROP TRIGGER IF EXISTS update_equipment_timestamp ON equipment;
DROP FUNCTION IF EXISTS update_equipment_updated_at() CASCADE;

-- Drop existing table if it exists (this will delete all existing data)
DROP TABLE IF EXISTS equipment CASCADE;

-- Create equipment table with simplified schema
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('old', 'new')),
  condition TEXT NOT NULL CHECK (condition IN ('faulty', 'non-faulty')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_equipment_state ON equipment(state);
CREATE INDEX idx_equipment_condition ON equipment(condition);

-- Enable Row Level Security
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow all operations on equipment" ON equipment;
CREATE POLICY "Allow all operations on equipment" ON equipment FOR ALL USING (true) WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_timestamp
BEFORE UPDATE ON equipment
FOR EACH ROW
EXECUTE FUNCTION update_equipment_updated_at();
