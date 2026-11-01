/*
# PAN Application Timeline, Admin Review, and Document Storage

## Purpose
1. Status tracking timeline for each PAN application
2. Admin review panel to approve/reject PAN applications
3. Storage bucket for PAN application supporting documents

## New Tables

### pan_application_timeline
- id (uuid, primary key)
- pan_application_id (uuid, references pan_applications, on delete cascade)
- user_id (uuid, not null, defaults to auth.uid(), references auth.users)
- status (text: "submitted" | "in_review" | "completed" | "rejected")
- note (text, nullable — admin note or system message)
- actor_name (text — who made the change)
- created_at (timestamptz, default now())

## Modified Tables
None modified. pan_applications.status is updated via RPC.

## Security
- pan_application_timeline: RLS enabled, owner-scoped (user sees their own timeline entries)
- Grants to authenticated only
- Storage bucket "pan-documents" created for document uploads, owner-scoped

## New RPC Functions

### review_pan_application(p_application_id, p_decision, p_note)
- Allows admin/owner to review a PAN application
- Sets status to "completed" (approved) or "rejected"
- Inserts a timeline entry
- SECURITY DEFINER so admin can update any user's PAN application
*/

CREATE TABLE IF NOT EXISTS pan_application_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pan_application_id uuid NOT NULL REFERENCES pan_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  actor_name text NOT NULL DEFAULT 'System',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pan_application_timeline ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON pan_application_timeline TO authenticated;

DROP POLICY IF EXISTS "select_own_pan_timeline" ON pan_application_timeline;
CREATE POLICY "select_own_pan_timeline" ON pan_application_timeline FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_pan_timeline" ON pan_application_timeline;
CREATE POLICY "insert_own_pan_timeline" ON pan_application_timeline FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pan_timeline_app_id ON pan_application_timeline(pan_application_id);
CREATE INDEX IF NOT EXISTS idx_pan_timeline_created_at ON pan_application_timeline(created_at);

-- SECURITY DEFINER function for admin review
-- Admins (owner/admin role) can review any PAN application
CREATE OR REPLACE FUNCTION review_pan_application(
  p_application_id uuid,
  p_decision text,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_record record;
  v_new_status text;
  v_actor_name text;
  v_app_user_id uuid;
BEGIN
  -- Validate decision
  IF p_decision NOT IN ('completed', 'rejected', 'in_review') THEN
    RAISE EXCEPTION 'Invalid decision. Must be completed, rejected, or in_review.';
  END IF;

  -- Check caller is an admin
  SELECT user_id, role, display_name INTO v_admin_record
  FROM admin_users
  WHERE user_id = auth.uid();

  IF NOT FOUND OR v_admin_record.role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only owners and admins can review PAN applications.';
  END IF;

  v_actor_name := COALESCE(v_admin_record.display_name, 'Admin');
  v_new_status := p_decision;

  -- Get the application owner
  SELECT user_id INTO v_app_user_id FROM pan_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAN application not found.';
  END IF;

  -- Update application status
  UPDATE pan_applications SET status = v_new_status WHERE id = p_application_id;

  -- Insert timeline entry on behalf of the application owner so RLS allows them to see it
  INSERT INTO pan_application_timeline (pan_application_id, user_id, status, note, actor_name)
  VALUES (p_application_id, v_app_user_id, v_new_status, p_note, v_actor_name);
END;
$$;

REVOKE EXECUTE ON FUNCTION review_pan_application(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION review_pan_application(uuid, text, text) TO authenticated;

-- Create storage bucket for PAN documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('pan-documents', 'pan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can manage their own folder
DROP POLICY IF EXISTS "pan_docs_select_own" ON storage.objects;
CREATE POLICY "pan_docs_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'pan-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "pan_docs_insert_own" ON storage.objects;
CREATE POLICY "pan_docs_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pan-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "pan_docs_delete_own" ON storage.objects;
CREATE POLICY "pan_docs_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'pan-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
