/*
  # Initial Schema Setup for Prestige Tranquility People's Library

  1. New Tables
    - volunteers
    - members
    - books
    - loans
    - fines

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum types
CREATE TYPE membership_status AS ENUM ('APPROVED', 'PENDING');
CREATE TYPE volunteer_status AS ENUM ('ACTIVE', 'REVOKED');

-- Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  clerk_uid text NOT NULL UNIQUE,
  status volunteer_status NOT NULL DEFAULT 'ACTIVE',
  added_by text NOT NULL,
  approved_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT volunteers_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile_number text NOT NULL UNIQUE,
  flat_number text,
  email text,
  membership_number text UNIQUE,
  membership_status membership_status NOT NULL DEFAULT 'PENDING',
  payment_received numeric DEFAULT 0,
  total_amount_due numeric DEFAULT 0,
  membership_date timestamptz,
  date_of_application timestamptz DEFAULT now(),
  user_uuid text,
  approved_by text REFERENCES volunteers(clerk_uid),
  renewal_date timestamptz,
  renewal_payment numeric,
  renewed_by text REFERENCES volunteers(clerk_uid),
  
  CONSTRAINT members_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT members_mobile_valid CHECK (char_length(mobile_number) = 10)
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  category text NOT NULL, -- Changed from enum to text
  isbn text UNIQUE,
  book_number text UNIQUE,
  language text NOT NULL DEFAULT 'English',
  price numeric,
  publisher text,
  available_quantity integer NOT NULL DEFAULT 1,
  currently_issued_to text REFERENCES members(mobile_number),
  reserved_by text REFERENCES members(mobile_number),
  book_added_by text REFERENCES volunteers(clerk_uid),
  book_donated_by text,
  storage_location text,
  cover_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false,
  
  CONSTRAINT books_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT books_quantity_positive CHECK (available_quantity >= 0),
  CONSTRAINT books_category_valid CHECK (category IN ('Fiction', 'Non-Fiction', 'Children')) -- Added check constraint
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  issued_on timestamptz DEFAULT now(),
  due_on timestamptz NOT NULL,
  returned_on timestamptz,
  is_renewed boolean DEFAULT false,
  issued_by text REFERENCES volunteers(clerk_uid),
  
  CONSTRAINT loans_due_date_valid CHECK (due_on > issued_on)
);

-- Create fines table
CREATE TABLE IF NOT EXISTS fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  days_overdue integer NOT NULL,
  fine_amount numeric NOT NULL,
  is_paid boolean DEFAULT false,
  waived boolean DEFAULT false,
  waived_reason text,
  cleared_by text REFERENCES volunteers(clerk_uid),
  recorded_on timestamptz DEFAULT now(),
  
  CONSTRAINT fines_days_positive CHECK (days_overdue > 0),
  CONSTRAINT fines_amount_positive CHECK (fine_amount > 0)
);

-- Enable Row Level Security
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for books table
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS Policies
-- Volunteers can read all records
CREATE POLICY "Volunteers can view all records"
ON volunteers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Volunteers can view all records"
ON members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Volunteers can view all records"
ON books FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Volunteers can view all records"
ON loans FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Volunteers can view all records"
ON fines FOR SELECT
TO authenticated
USING (true);

-- Volunteers can insert/update/delete records
CREATE POLICY "Volunteers can modify records"
ON volunteers FOR ALL
TO authenticated
USING (auth.jwt() ->> 'sub' = clerk_uid)
WITH CHECK (auth.jwt() ->> 'sub' = clerk_uid);

CREATE POLICY "Volunteers can modify records"
ON members FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Volunteers can modify records"
ON books FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Volunteers can modify records"
ON loans FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Volunteers can modify records"
ON fines FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);