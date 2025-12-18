-- ============================================================================
-- Row Level Security (RLS) Policies for Authentication Tables
-- ============================================================================

-- ============================================================================
-- Profiles Table Policies
-- ============================================================================

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to view public profiles (if is_active = true)
CREATE POLICY "Anyone can view active profiles"
ON profiles FOR SELECT
USING (is_active = TRUE);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Allow admins to delete any profile
CREATE POLICY "Admins can delete any profile"
ON profiles FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- ============================================================================
-- Audit Logs Table Policies
-- ============================================================================

-- Only allow users to view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON audit_logs FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Only admin service role can insert audit logs
CREATE POLICY "Service can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (
  (current_setting('role') = 'postgres') OR
  (current_setting('role') = 'service_role')
);

-- ============================================================================
-- User Sessions Table Policies
-- ============================================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON user_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON user_sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON user_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Service role can insert sessions
CREATE POLICY "Service can insert sessions"
ON user_sessions FOR INSERT
WITH CHECK (
  (current_setting('role') = 'postgres') OR
  (current_setting('role') = 'service_role')
);

-- ============================================================================
-- Admin Functions for Management
-- ============================================================================

-- Function to promote user to admin (admin only)
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ) THEN
    UPDATE profiles SET role = 'admin' WHERE email = user_email;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate user (admin only)
CREATE OR REPLACE FUNCTION deactivate_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ) THEN
    UPDATE profiles SET is_active = FALSE WHERE email = user_email;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
