-- Migration: Make email field optional in members table
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the UNIQUE constraint on email (if it exists)
DO $$ 
BEGIN
    -- Drop unique constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'members_email_key' 
        AND conrelid = 'members'::regclass
    ) THEN
        ALTER TABLE members DROP CONSTRAINT members_email_key;
    END IF;
END $$;

-- Step 2: Alter the email column to allow NULL
ALTER TABLE members 
ALTER COLUMN email DROP NOT NULL;

-- Step 3: Add a comment to document the change
COMMENT ON COLUMN members.email IS 'Optional email address. Members can be registered without providing an email.';

-- Step 4: Create a partial unique index to ensure email uniqueness when provided
-- This allows multiple NULL values but ensures unique emails when email is provided
CREATE UNIQUE INDEX IF NOT EXISTS members_email_unique_when_not_null 
ON members(email) 
WHERE email IS NOT NULL AND email != '';

-- Verification query (optional - run to verify the changes)
-- SELECT 
--     column_name, 
--     is_nullable, 
--     data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'members' 
-- AND column_name = 'email';
