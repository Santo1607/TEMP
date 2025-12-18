# Supabase RLS Quick Reference

## Table Overview

| Table | Purpose | Owner Check | Public Access |
|-------|---------|------------|---------------|
| profiles | User data | YES | Partial |
| items | Main content | YES | Conditional |
| item_shares | Collaboration | Via item | NO |
| comments | Discussion | YES | Conditional |
| user_sessions | Active sessions | YES | NO |
| audit_logs | Compliance | NO | Admin only |
| activity_log | Analytics | NO | Limited |

## Policy Quick Reference

### Profiles Table
```sql
-- View own profile
SELECT * WHERE id = auth.uid()

-- View active users (public)
SELECT * WHERE is_active = TRUE

-- Update own
UPDATE ... WHERE id = auth.uid()

-- Admin management
UPDATE ... WHERE auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
```

### Items Table
```sql
-- Own items
SELECT * WHERE owner_id = auth.uid()

-- Public items
SELECT * WHERE is_public = TRUE

-- Shared items
SELECT * FROM items WHERE id IN (
  SELECT item_id FROM item_shares 
  WHERE shared_with_user_id = auth.uid()
)
```

### Collaborative Access Pattern
```
Item ownership: owner_id = auth.uid()
View access: is_public = TRUE OR auth.uid() IN shared_with_users
Edit access: permission = 'edit' AND auth.uid() IN shared_with_users
Admin access: owner_id = auth.uid() OR permission = 'admin'
```

## Common Queries

### Get Current User ID
```typescript
const userId = supabase.auth.user()?.id
```

### Fetch User's Items with Shares
```sql
SELECT items.* FROM items
LEFT JOIN item_shares ON items.id = item_shares.item_id
WHERE items.owner_id = auth.uid()
   OR item_shares.shared_with_user_id = auth.uid()
```

### Get User's Accessible Items Count
```sql
SELECT COUNT(*) FROM get_accessible_items()
```

### List Users Who Have Access to an Item
```sql
SELECT profiles.* FROM profiles
JOIN item_shares ON profiles.id = item_shares.shared_with_user_id
WHERE item_shares.item_id = 'item-id-here'
```

## Permission Levels

### View
- Read access only
- Cannot modify data
- `SELECT` permission only

### Edit
- Read and modify access
- Can update item content
- Cannot delete or change shares

### Admin
- Full control of item
- Can modify and delete
- Can manage shares

## RLS Policy Structure

Every policy follows this pattern:
```sql
CREATE POLICY "Policy Name"
ON table_name FOR operation
USING (authentication_check)
WITH CHECK (validation_check);
```

Components:
- **Policy Name**: Descriptive identifier
- **operation**: SELECT, INSERT, UPDATE, DELETE
- **USING**: Checks which rows are accessible
- **WITH CHECK**: Validates new/modified data

## User Roles

### User (default)
- Create own items
- View public items
- Share items
- View own profile

### Moderator
- All user permissions
- View all items
- Remove items if needed

### Admin
- All permissions
- Manage user roles
- View audit logs
- System administration

## Role Verification

```sql
-- Check if current user is admin
SELECT role FROM profiles WHERE id = auth.uid()

-- Check if user has certain role
SELECT 1 FROM profiles 
WHERE id = auth.uid() AND role = 'admin'

-- Promote user to admin
UPDATE profiles SET role = 'admin' WHERE email = 'user@example.com'
```

## Real-Time Subscriptions

```typescript
// Listen to changes on items table
supabase
  .from('items')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

## Testing Policies

### Test Query
```sql
SELECT * FROM items WHERE owner_id = auth.uid()
```

### Expected Results
- Your items: ✓ Show
- Others' private items: ✗ Don't show
- Public items: ✓ Show
- Shared items: ✓ Show

## Debugging Checklist

- [ ] RLS is enabled on table
- [ ] Policies are created
- [ ] `auth.uid()` returns expected value
- [ ] User has correct role
- [ ] Foreign key references exist
- [ ] No conflicting policies

## Policy Examples

### Self-Only Access
```sql
CREATE POLICY "Users view own data"
ON table_name FOR SELECT
USING (user_id = auth.uid())
```

### Public + Owner
```sql
CREATE POLICY "Public or own"
ON table_name FOR SELECT
USING (is_public = TRUE OR owner_id = auth.uid())
```

### Role-Based
```sql
CREATE POLICY "Admin only"
ON table_name FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
)
```

### Complex Logic
```sql
CREATE POLICY "Complex access"
ON table_name FOR SELECT
USING (
  owner_id = auth.uid()
  OR is_public = TRUE
  OR id IN (
    SELECT item_id FROM item_shares 
    WHERE shared_with_user_id = auth.uid()
  )
)
```

## Performance Tips

1. **Index frequently filtered columns**
   ```sql
   CREATE INDEX idx_owner ON items(owner_id);
   ```

2. **Avoid N+1 queries**
   - Use joins instead of separate queries
   - Load relationships eagerly

3. **Limit results**
   ```sql
   SELECT * FROM items LIMIT 100
   ```

4. **Use pagination**
   ```typescript
   .range(0, 9) // First 10 items
   ```

5. **Cache RLS policy results**
   - Don't re-fetch if data hasn't changed
   - Use React Query or similar

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "permission denied for schema public" | No schema access | Grant permissions |
| "new row violates row-level security policy" | INSERT policy failed | Check defaults and policy |
| "no rows returned" | Query matched no rows | Verify RLS allows SELECT |
| "undefined" auth.uid() | Not authenticated | User must sign in |
| "duplicate key value" | Unique constraint | Check UNIQUE constraints |
