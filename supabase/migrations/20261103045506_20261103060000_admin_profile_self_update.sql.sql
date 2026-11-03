/*
# Allow admin users to update their own display name

## Purpose
Currently `admin_users` has only a SELECT policy. Authenticated admins cannot
update their own profile (e.g. display name) because there is no UPDATE policy
and the `authenticated` role lacks UPDATE grants on the table.

This migration adds:
1. A column-restricted UPDATE grant on `display_name` to `authenticated`.
2. An UPDATE policy so an authenticated user can only update their own row.
3. A SECURITY DEFINER function `update_admin_profile(display_name text)` that
   safely updates the caller's own display name and returns the updated row.
   This avoids exposing the full table for direct UPDATE and keeps `role`
   and `user_id` protected from client writes.

## Security changes
- GRANT UPDATE (display_name) ON admin_users TO authenticated
- New UPDATE policy: user can only update their own row (auth.uid() = user_id)
- New SECURITY DEFINER function `update_admin_profile` — callable by
  authenticated only, validates the caller is an admin, updates only
  `display_name`, returns the refreshed profile columns.
- REVOKE EXECUTE on `update_admin_profile` FROM PUBLIC and anon.
*/

-- 1. Column-restricted UPDATE grant: only display_name is writable by the client
GRANT UPDATE (display_name) ON admin_users TO authenticated;

-- 2. UPDATE policy: an authenticated user can update only their own row
DROP POLICY IF EXISTS "admin_update_own_profile" ON admin_users;
CREATE POLICY "admin_update_own_profile"
ON admin_users FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. SECURITY DEFINER function for safe profile updates
CREATE OR REPLACE FUNCTION public.update_admin_profile(p_display_name text)
RETURNS TABLE (
  user_id uuid,
  role text,
  display_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  UPDATE public.admin_users
     SET display_name = p_display_name
   WHERE user_id = auth.uid()
  RETURNING user_id, role, display_name;
$$;

-- Revoke default EXECUTE from PUBLIC and anon; grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.update_admin_profile(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_admin_profile(text) TO authenticated;
