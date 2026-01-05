-- Migration: Add pending member fields to payments table
-- Run this in your Supabase SQL Editor

-- Add columns for pending member registrations (from checkout)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS is_pending_member BOOLEAN DEFAULT FALSE;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS member_email TEXT;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS member_phone TEXT;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS member_address TEXT;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS member_photo TEXT;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS member_plan TEXT CHECK (member_plan IN ('Basic', 'Premium', 'VIP'));

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS member_start_date DATE;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS member_expiry_date DATE;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'payments'
AND column_name IN (
  'is_pending_member',
  'member_email',
  'member_phone',
  'member_address',
  'member_photo',
  'member_plan',
  'member_start_date',
  'member_expiry_date'
)
ORDER BY column_name;

