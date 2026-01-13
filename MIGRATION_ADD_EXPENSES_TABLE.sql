-- Migration: Add expenses table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  staff_name TEXT NOT NULL,
  staff_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_date_time ON expenses(date_time DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_staff_name ON expenses(staff_name);

-- Disable RLS initially (enable it after adding policies if needed)
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- Add a comment to explain the table
COMMENT ON TABLE expenses IS 'Track all expenses and purchases made by the gym. Records item name, amount, date/time, and staff member who recorded it.';

-- Verify the table was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;
