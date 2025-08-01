-- Drop the old, restrictive constraint
ALTER TABLE public.invitations DROP CONSTRAINT invitations_email_valid;

-- Add a new, more permissive constraint that allows the '+' symbol
ALTER TABLE public.invitations ADD CONSTRAINT invitations_email_valid
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
