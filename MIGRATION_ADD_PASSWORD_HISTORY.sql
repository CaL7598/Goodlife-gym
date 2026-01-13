-- Migration: Add password_history column to staff table
-- Run this in your Supabase SQL Editor

-- Add password_history column to store JSON array of old passwords
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS password_history TEXT;

-- Add a comment to explain the column
COMMENT ON COLUMN staff.password_history IS 'JSON array of previous passwords. Format: [{"password": "oldpass1", "changed_at": "2024-01-01T00:00:00Z"}, ...]';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'staff'
AND column_name IN ('password', 'password_history', 'created_at');
