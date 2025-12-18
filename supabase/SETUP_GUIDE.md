# Supabase SQL Setup & RLS Policies Guide

This directory contains SQL scripts to set up a complete Supabase project with Row Level Security (RLS) policies, user management, and data tables.

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Enter project details and create

### 2. Execute SQL Scripts

In your Supabase dashboard:
1. Go to **SQL Editor**
2. Click **+ New Query**
3. Copy and paste each SQL file in order:
   - `01_auth_tables.sql` - User profiles and session management
   - `02_rls_policies_auth.sql` - Security policies for auth tables
   - `03_data_tables.sql` - Application data tables (customize for your needs)
   - `04_rls_policies_data.sql` - Security policies for data tables

4. Run each query with **Ctrl+Enter**

## File Structure

### 01_auth_tables.sql
Sets up authentication-related tables:
- **profiles** - User profile information (extends auth.users)
- **audit_logs** - Track all changes for compliance
- **user_sessions** - Manage active user sessions
- Automatically creates user profiles on signup via trigger

### 02_rls_policies_auth.sql
Row Level Security policies for auth tables:
- Users can only access their own data
- Admins can manage any profile
- Audit logs are restricted to admins
- Includes helper functions for user management

### 03_data_tables.sql
Example application data tables:
- **items** - Main data objects (customize to your app)
- **item_shares** - Collaboration & sharing
- **comments** - Discussion functionality
- **activity_log** - Track user activity

### 04_rls_policies_data.sql
Row Level Security policies for data tables:
- Users own and control their items
- Public sharing and collaboration
- Fine-grained permissions (view, edit, admin)
- Helper functions for common operations

## Database Schema

```
auth.users (Supabase native)
    ↓
profiles
    ↓
├─ items (user-created content)
│   ├─ item_shares (collaboration)
│   └─ comments (discussion)
│
├─ user_sessions (session tracking)
├─ audit_logs (compliance)
└─ activity_log (analytics)
```

## RLS Policy Model

### Authentication Layer (profiles table)
```
┌─────────────────────────────────────┐
│ Policy: Users can view own profile   │
│ Condition: auth.uid() = id          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Policy: Anyone can view active users │
│ Condition: is_active = TRUE         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Policy: Admins can manage profiles   │
│ Condition: role = 'admin'           │
└─────────────────────────────────────┘
```

### Data Layer (items table)
```
User can access items if:
  ✓ They own the item (owner_id = auth.uid())
  ✓ Item is public (is_public = TRUE)
  ✓ Item is shared with them (via item_shares)
```

## Role-Based Access Control (RBAC)

The system supports three roles:
- **user** - Default role for all users
- **moderator** - Can review and moderate content
- **admin** - Full system access

Promote a user to admin:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'user@example.com';
```

## Common Operations

### Share an Item with Another User
```sql
SELECT share_item('item-id-here', 'user@example.com', 'view');
-- Permission options: 'view', 'edit', 'admin'
```

### Get All Items Accessible to Current User
```sql
SELECT * FROM get_accessible_items();
```

### View Audit Trail for Compliance
```sql
SELECT * FROM audit_logs 
WHERE user_id = 'user-id-here' 
ORDER BY created_at DESC;
```

### Deactivate a User Account
```sql
SELECT deactivate_user('user@example.com');
```

## Environment Variables

Create a `.env.local` file with your Supabase credentials:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Service role key (backend only, never expose in frontend)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## JavaScript/TypeScript Integration

### Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### Initialize Client
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default supabase
```

### Example: Fetch User's Items
```typescript
async function getUserItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('owner_id', supabase.auth.user()?.id)

  if (error) console.error(error)
  return data
}
```

### Example: Share Item
```typescript
async function shareItem(itemId: string, userEmail: string) {
  const { data, error } = await supabase
    .rpc('share_item', {
      p_item_id: itemId,
      p_user_email: userEmail,
      p_permission: 'view'
    })

  if (error) console.error(error)
  return data
}
```

## Security Best Practices

### 1. Always Use RLS
- Enable RLS on all tables
- Define policies for all operations (SELECT, INSERT, UPDATE, DELETE)
- Test policies thoroughly before deploying

### 2. Principle of Least Privilege
- Grant users only the minimum access they need
- Use fine-grained permissions (view, edit, admin)
- Regularly audit access patterns

### 3. Protect Service Role Key
- Never expose in frontend code
- Use only in backend/edge functions
- Store in environment variables

### 4. Audit Everything
- Log all critical operations
- Review audit logs regularly
- Archive logs for compliance

### 5. Validate on Backend
- Don't rely solely on RLS
- Validate data server-side
- Check permissions before operations

## Customization

### Add Your Own Tables

1. Create table:
```sql
CREATE TABLE your_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

2. Create policies:
```sql
CREATE POLICY "Users can view own records"
ON your_table FOR SELECT
USING (auth.uid() = owner_id);
```

3. Grant permissions:
```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO authenticated;
```

## Monitoring & Troubleshooting

### Check RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'items';
```

### View Failed Queries
```sql
-- Enable query logging in Supabase dashboard
-- Settings → Logs
```

### Debug Policy Issues
1. Check if RLS is enabled: `ALTER TABLE items ENABLE ROW LEVEL SECURITY;`
2. Verify policies exist: `SELECT * FROM pg_policies;`
3. Check auth context: `SELECT auth.uid();`
4. Test policy: Run query and check error message

### Common Issues

| Issue | Solution |
|-------|----------|
| "permission denied for schema public" | Grant permissions: `GRANT USAGE ON SCHEMA public TO authenticated;` |
| "new row violates row-level security policy" | Check policy conditions and user role |
| "no rows returned" | Verify RLS policies allow SELECT |
| "Insert failed" | Check INSERT policy conditions and defaults |

## Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Tutorial](https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security)
- [SQL Style Guide](https://www.sqlstyle.guide/)

## Support

For issues or questions:
1. Check Supabase documentation
2. Review PostgreSQL error messages
3. Check audit logs for debug info
4. Ask in Supabase Discord community
