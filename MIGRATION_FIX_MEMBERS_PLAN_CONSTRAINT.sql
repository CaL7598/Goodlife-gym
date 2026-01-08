-- Migration: Fix members table plan constraint to include all plan types
-- Run this in your Supabase SQL Editor

-- Drop existing constraint
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_plan_check;

-- Add updated constraint with all valid plan names
ALTER TABLE members 
ADD CONSTRAINT members_plan_check 
CHECK (plan IN (
  'Basic', 'Premium', 'VIP',  -- Legacy plans
  'Monthly', '2 Weeks', '1 Week', 'Day Morning', 'Day Evening'  -- Current plans
));

-- Verify the constraint
SELECT 
  constraint_name, 
  check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'members_plan_check';

