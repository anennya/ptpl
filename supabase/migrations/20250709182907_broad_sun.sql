/*
  # Fix Member ID Default Constraint

  1. Changes
    - Ensure the members table id column has proper UUID default generation
    - Add constraint to prevent null IDs
    - Verify the gen_random_uuid() function is available

  2. Security
    - No changes to existing RLS policies
*/

-- Ensure the uuid-ossp extension is enabled (fallback if gen_random_uuid doesn't work)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate the members table with proper constraints
-- First, let's make sure the id column has the correct default
DO $$
BEGIN
  -- Check if the default is properly set, if not, alter it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'members' 
    AND column_name = 'id' 
    AND column_default LIKE '%gen_random_uuid%'
  ) THEN
    -- Set the default value for the id column
    ALTER TABLE members ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
  
  -- Ensure the column is NOT NULL
  ALTER TABLE members ALTER COLUMN id SET NOT NULL;
END $$;

-- Verify the constraint is working by testing (this will be rolled back)
DO $$
DECLARE
  test_id uuid;
BEGIN
  -- Test that default UUID generation works
  INSERT INTO members (name, mobile_number, flat_number, membership_status, total_amount_due)
  VALUES ('Test User', '9999999999', 'TEST', 'PENDING', 0)
  RETURNING id INTO test_id;
  
  -- Clean up test record
  DELETE FROM members WHERE id = test_id;
  
  -- If we get here, the default is working
  RAISE NOTICE 'UUID default generation is working correctly';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'UUID default generation failed: %', SQLERRM;
END $$;