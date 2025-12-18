-- ============================================================================
-- Row Level Security (RLS) Policies for Data Tables
-- ============================================================================

-- ============================================================================
-- Items Table Policies
-- ============================================================================

-- Users can view their own items
CREATE POLICY "Users can view own items"
ON items FOR SELECT
USING (auth.uid() = owner_id);

-- Users can view public items from other users
CREATE POLICY "Anyone can view public items"
ON items FOR SELECT
USING (is_public = TRUE);

-- Users can view items shared with them
CREATE POLICY "Users can view shared items"
ON items FOR SELECT
USING (
  id IN (
    SELECT item_id FROM item_shares WHERE shared_with_user_id = auth.uid()
  )
);

-- Users can create items
CREATE POLICY "Authenticated users can create items"
ON items FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Users can update their own items
CREATE POLICY "Users can update own items"
ON items FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Users can update items shared with them (if permission = edit or admin)
CREATE POLICY "Users can update shared items with permission"
ON items FOR UPDATE
USING (
  id IN (
    SELECT item_id FROM item_shares 
    WHERE shared_with_user_id = auth.uid() 
    AND permission IN ('edit', 'admin')
  )
)
WITH CHECK (
  id IN (
    SELECT item_id FROM item_shares 
    WHERE shared_with_user_id = auth.uid() 
    AND permission IN ('edit', 'admin')
  )
);

-- Users can delete their own items
CREATE POLICY "Users can delete own items"
ON items FOR DELETE
USING (auth.uid() = owner_id);

-- ============================================================================
-- Item Shares Table Policies
-- ============================================================================

-- Item owners can view shares for their items
CREATE POLICY "Owners can view item shares"
ON item_shares FOR SELECT
USING (
  item_id IN (
    SELECT id FROM items WHERE owner_id = auth.uid()
  )
);

-- Shared users can view their own shares
CREATE POLICY "Shared users can view own shares"
ON item_shares FOR SELECT
USING (shared_with_user_id = auth.uid());

-- Item owners can create shares
CREATE POLICY "Owners can create shares"
ON item_shares FOR INSERT
WITH CHECK (
  item_id IN (
    SELECT id FROM items WHERE owner_id = auth.uid()
  )
);

-- Item owners can update shares for their items
CREATE POLICY "Owners can update shares"
ON item_shares FOR UPDATE
USING (
  item_id IN (
    SELECT id FROM items WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  item_id IN (
    SELECT id FROM items WHERE owner_id = auth.uid()
  )
);

-- Item owners can delete shares
CREATE POLICY "Owners can delete shares"
ON item_shares FOR DELETE
USING (
  item_id IN (
    SELECT id FROM items WHERE owner_id = auth.uid()
  )
);

-- ============================================================================
-- Comments Table Policies
-- ============================================================================

-- Users can view comments on items they have access to
CREATE POLICY "Users can view comments on accessible items"
ON comments FOR SELECT
USING (
  item_id IN (
    -- User's own items
    SELECT id FROM items WHERE owner_id = auth.uid()
    UNION
    -- Public items
    SELECT id FROM items WHERE is_public = TRUE
    UNION
    -- Shared items
    SELECT item_id FROM item_shares WHERE shared_with_user_id = auth.uid()
  )
);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON comments FOR INSERT
WITH CHECK (
  auth.uid() = author_id AND
  item_id IN (
    SELECT id FROM items WHERE owner_id = auth.uid()
    UNION
    SELECT id FROM items WHERE is_public = TRUE
    UNION
    SELECT item_id FROM item_shares WHERE shared_with_user_id = auth.uid()
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
USING (auth.uid() = author_id);

-- ============================================================================
-- Activity Log Table Policies
-- ============================================================================

-- Users can view activity on their own items
CREATE POLICY "Users can view activity on own items"
ON activity_log FOR SELECT
USING (
  item_id IN (
    SELECT id FROM items WHERE owner_id = auth.uid()
  )
);

-- Service role can insert activity
CREATE POLICY "Service can insert activity"
ON activity_log FOR INSERT
WITH CHECK (
  (current_setting('role') = 'postgres') OR
  (current_setting('role') = 'service_role')
);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get user's accessible items
CREATE OR REPLACE FUNCTION get_accessible_items()
RETURNS TABLE(item_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT id FROM items WHERE owner_id = auth.uid()
  UNION
  SELECT id FROM items WHERE is_public = TRUE
  UNION
  SELECT item_id FROM item_shares WHERE shared_with_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Function to share item with user
CREATE OR REPLACE FUNCTION share_item(
  p_item_id UUID,
  p_user_email TEXT,
  p_permission TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_shared_user_id UUID;
BEGIN
  -- Verify user owns the item
  IF NOT EXISTS (
    SELECT 1 FROM items WHERE id = p_item_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Item not found or user not authorized';
  END IF;

  -- Get the user ID from email
  SELECT id INTO v_shared_user_id FROM profiles WHERE email = p_user_email;
  
  IF v_shared_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Insert or update share
  INSERT INTO item_shares (item_id, shared_with_user_id, permission)
  VALUES (p_item_id, v_shared_user_id, p_permission)
  ON CONFLICT (item_id, shared_with_user_id) 
  DO UPDATE SET permission = p_permission;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
