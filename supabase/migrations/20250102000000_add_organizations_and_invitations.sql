/*
  # Add Invitations Table

  1. New Table
    - invitations

  2. Security
    - Enable RLS
    - Add policies for proper access control
*/

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'volunteer', 'member')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'canceled')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT invitations_email_valid CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for invitations
CREATE POLICY "Users can view invitations for their organizations"
ON invitations FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'volunteer')
  )
);

CREATE POLICY "Organization admins can manage invitations"
ON invitations FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow users to accept invitations sent to their email
CREATE POLICY "Users can accept their own invitations"
ON invitations FOR UPDATE
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
  AND status = 'pending' 
  AND expires_at > now()
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
  AND status IN ('accepted', 'rejected')
);

-- Create indexes for better performance
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_org_id ON invitations(organization_id);
CREATE INDEX idx_invitations_status ON invitations(status);