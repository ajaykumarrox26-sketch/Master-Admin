/*
# NSDL PAN Card Application Table

## Purpose
Stores PAN card applications submitted through the sign-in-only portal.
This table supports the comprehensive NSDL original PAN card creation form
with Income Tax Department standards and e-KYC options.

## New Tables

### pan_applications
- id (uuid, primary key)
- user_id (uuid, not null, references auth.users, defaults to auth.uid())
- application_type (text: "new" | "correction" | "reprint")
- applicant_category (text: "individual" | "minor" | "huf" | "company" | "partnership" | "trust" | "aop" | "local_authority" | "artificial_judicial")
- title (text: applicant's title - "shri" | "smt" | "kumari" | "m_s" | "dr" | "adv" | "prof" | "ca")
- last_name (text, surname)
- first_name (text, given name)
- middle_name (text, nullable)
- fathers_last_name (text)
- fathers_first_name (text)
- fathers_middle_name (text, nullable)
- mothers_last_name (text, nullable)
- mothers_first_name (text, nullable)
- mothers_name_flag (text: use_mothers_name selection - "f" | "m" — whose name to use for PAN)
- dob (date, date of birth)
- gender (text: "male" | "female" | "transgender")
- aadhaar_number (text, nullable, masked)
- citizenship (text: "indian" | "oci" | "foreign")
- source_of_income (text[], array of income sources: "salary" | "business" | "house_property" | "capital_gains" | "other_sources" | "no_income")
- office_address_line1 (text, nullable for individuals)
- office_address_line2 (text, nullable)
- office_city (text, nullable)
- office_state (text, nullable)
- office_pincode (text, nullable)
- office_country (text, nullable)
- residential_address_line1 (text)
- residential_address_line2 (text, nullable)
- residential_city (text)
- residential_state (text)
- residential_pincode (text)
- residential_country (text)
- contact_number (text)
- email (text)
- kyc_mode (text: "ekyc" | "scan" | "physical")
- physical_pan_required (boolean, default true)
- pan_card_delivery_mode (text: "physical" | "digital" | "both")
- signature_name (text, nullable)
- reference_number (text, generated ticket/reference)
- status (text: "submitted" | "in_review" | "completed" | "rejected", default "submitted")
- created_at (timestamptz, default now())

## Security
- RLS enabled on pan_applications.
- Owner-scoped CRUD: authenticated users can only see/manage their own applications.
- Grants to authenticated only (sign-in required).
*/

CREATE TABLE IF NOT EXISTS pan_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  application_type text NOT NULL DEFAULT 'new',
  applicant_category text NOT NULL DEFAULT 'individual',
  title text NOT NULL DEFAULT 'shri',
  last_name text NOT NULL,
  first_name text NOT NULL,
  middle_name text,
  fathers_last_name text NOT NULL,
  fathers_first_name text NOT NULL,
  fathers_middle_name text,
  mothers_last_name text,
  mothers_first_name text,
  mothers_name_flag text DEFAULT 'f',
  dob date NOT NULL,
  gender text NOT NULL DEFAULT 'male',
  aadhaar_number text,
  citizenship text NOT NULL DEFAULT 'indian',
  source_of_income text[] NOT NULL DEFAULT ARRAY['salary']::text[],
  office_address_line1 text,
  office_address_line2 text,
  office_city text,
  office_state text,
  office_pincode text,
  office_country text,
  residential_address_line1 text NOT NULL,
  residential_address_line2 text,
  residential_city text NOT NULL,
  residential_state text NOT NULL,
  residential_pincode text NOT NULL,
  residential_country text NOT NULL DEFAULT 'India',
  contact_number text NOT NULL,
  email text NOT NULL,
  kyc_mode text NOT NULL DEFAULT 'ekyc',
  physical_pan_required boolean NOT NULL DEFAULT true,
  pan_card_delivery_mode text NOT NULL DEFAULT 'physical',
  signature_name text,
  reference_number text UNIQUE NOT NULL DEFAULT 'PAN-' || upper(encode(gen_random_bytes(6), 'hex')),
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pan_applications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON pan_applications TO authenticated;

DROP POLICY IF EXISTS "select_own_pan_applications" ON pan_applications;
CREATE POLICY "select_own_pan_applications" ON pan_applications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_pan_applications" ON pan_applications;
CREATE POLICY "insert_own_pan_applications" ON pan_applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_pan_applications" ON pan_applications;
CREATE POLICY "update_own_pan_applications" ON pan_applications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_pan_applications" ON pan_applications;
CREATE POLICY "delete_own_pan_applications" ON pan_applications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pan_applications_user_id ON pan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_pan_applications_created_at ON pan_applications(created_at DESC);
