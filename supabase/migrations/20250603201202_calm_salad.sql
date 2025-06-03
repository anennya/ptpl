/*
  # Add Member Table Policies
  
  1. Security Changes
    - Enable RLS on members table
    - Add policies for member management
    - Define access rules for different roles
  
  2. Policies Added
    - Admin full access
    - Volunteer read access
    - Member self-access
*/

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage all members"
ON members
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role = 'admin'
  )
);

-- Volunteers can view members
CREATE POLICY "Volunteers can view members"
ON members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('admin', 'volunteer')
  )
);

-- Members can view their own records
CREATE POLICY "Members can view own records"
ON members
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);