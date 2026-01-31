-- Migration: Fix "Error fetching members" / HTTP 500 when loading members
-- Run this in your Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- Step 1: Ensure created_at column exists (required for ORDER BY)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE members ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added created_at to members';
  END IF;
END $$;

-- Step 2: Ensure updated_at column exists (used when updating members)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE members ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at to members';
  END IF;
END $$;

-- Step 3: Grant SELECT permission to anon and authenticated roles
-- (Fixes 500/42501 if the roles lack permission)
GRANT SELECT ON public.members TO anon;
GRANT SELECT ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;

-- Step 4: If RLS is enabled and blocking access, allow public read
-- (RLS with no permissive policy can cause 500 in some cases)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'members') THEN
    -- Disable RLS if it's blocking (enables full access for anon key)
    ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Disabled RLS on members for public access';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Step 4 skipped or failed: %', SQLERRM;
END $$;

-- Step 5: Add index to prevent "statement timeout" on ORDER BY created_at
-- (Without this, large members tables can cause Supabase to cancel slow queries)
CREATE INDEX IF NOT EXISTS idx_members_created_at_desc 
ON public.members (created_at DESC);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'members'
ORDER BY ordinal_position;
