-- Migration: Add photo column to members table
-- Run this in your Supabase SQL Editor

-- Add photo column to store base64 encoded images or URLs
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS photo TEXT;

-- Add a comment to explain the column
COMMENT ON COLUMN members.photo IS 'Base64 encoded image data or image URL for member profile photo';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'members'
AND column_name = 'photo';

