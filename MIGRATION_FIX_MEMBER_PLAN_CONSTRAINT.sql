-- Migration: Fix member_plan constraint to include all plan types
-- Run this in your Supabase SQL Editor if you already ran MIGRATION_ADD_PENDING_MEMBER_FIELDS.sql

-- Drop existing constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_member_plan_check;

-- Add updated constraint with all valid plan names
ALTER TABLE payments 
ADD CONSTRAINT payments_member_plan_check 
CHECK (member_plan IS NULL OR member_plan IN (
  'Basic', 'Premium', 'VIP',  -- Legacy plans
  'Monthly', '2 Weeks', '1 Week', 'Day Morning', 'Day Evening'  -- Current plans
));

-- Verify the constraint
SELECT 
  constraint_name, 
  check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'payments_member_plan_check';

