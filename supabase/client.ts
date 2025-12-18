/**
 * Supabase Client Configuration
 * 
 * Usage:
 * import supabase from '@/lib/supabase'
 * 
 * // Auth
 * const { data, error } = await supabase.auth.signUp({ email, password })
 * 
 * // Query
 * const { data: items } = await supabase.from('items').select('*')
 * 
 * // Real-time
 * supabase.from('items').on('*', handleChange).subscribe()
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types' // See schema.ts for type generation

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env.local file.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// ============================================================================
// Auth Helpers
// ============================================================================

/**
 * Sign up a new user
 */
export async function signUpUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Sign in with email and password
 */
export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

// ============================================================================
// Profile Helpers
// ============================================================================

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<{ username: string; full_name: string; avatar_url: string }>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

// ============================================================================
// Items Helpers
// ============================================================================

/**
 * Create a new item
 */
export async function createItem(
  title: string,
  description?: string,
  isPublic: boolean = false
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('items')
    .insert({
      owner_id: user.id,
      title,
      description,
      is_public: isPublic,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get user's items
 */
export async function getUserItems(limit = 50, offset = 0) {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error, count } = await supabase
    .from('items')
    .select('*', { count: 'exact' })
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return { items: data, total: count }
}

/**
 * Get item by ID
 */
export async function getItem(itemId: string) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (error) throw error
  return data
}

/**
 * Update item
 */
export async function updateItem(
  itemId: string,
  updates: Partial<{ title: string; description: string; is_public: boolean }>
) {
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete item
 */
export async function deleteItem(itemId: string) {
  const { error } = await supabase.from('items').delete().eq('id', itemId)
  if (error) throw error
}

/**
 * Get accessible items for current user
 */
export async function getAccessibleItems(limit = 50, offset = 0) {
  const { data, error, count } = await supabase.rpc('get_accessible_items', {
    limit,
    offset,
  })

  if (error) throw error
  return { itemIds: data, total: count }
}

/**
 * Search items
 */
export async function searchItems(query: string, limit = 20) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('is_public', true)
    .limit(limit)

  if (error) throw error
  return data
}

// ============================================================================
// Sharing Helpers
// ============================================================================

/**
 * Share item with another user
 */
export async function shareItem(
  itemId: string,
  userEmail: string,
  permission: 'view' | 'edit' | 'admin' = 'view'
) {
  const { data, error } = await supabase.rpc('share_item', {
    p_item_id: itemId,
    p_user_email: userEmail,
    p_permission: permission,
  })

  if (error) throw error
  return data
}

/**
 * Get shares for item
 */
export async function getItemShares(itemId: string) {
  const { data, error } = await supabase
    .from('item_shares')
    .select(`
      *,
      profiles:shared_with_user_id(id, username, full_name, avatar_url)
    `)
    .eq('item_id', itemId)

  if (error) throw error
  return data
}

/**
 * Remove share
 */
export async function removeShare(itemId: string, userId: string) {
  const { error } = await supabase
    .from('item_shares')
    .delete()
    .eq('item_id', itemId)
    .eq('shared_with_user_id', userId)

  if (error) throw error
}

/**
 * Update share permission
 */
export async function updateSharePermission(
  itemId: string,
  userId: string,
  permission: 'view' | 'edit' | 'admin'
) {
  const { data, error } = await supabase
    .from('item_shares')
    .update({ permission })
    .eq('item_id', itemId)
    .eq('shared_with_user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// Comments Helpers
// ============================================================================

/**
 * Add comment to item
 */
export async function addComment(itemId: string, content: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('comments')
    .insert({
      item_id: itemId,
      author_id: user.id,
      content,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get comments for item
 */
export async function getComments(itemId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:author_id(id, username, full_name, avatar_url)
    `)
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: string) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw error
}

// ============================================================================
// Real-time Subscriptions
// ============================================================================

/**
 * Subscribe to item changes
 */
export function subscribeToItem(
  itemId: string,
  callback: (payload: any) => void
) {
  return supabase
    .from(`items:id=eq.${itemId}`)
    .on('*', callback)
    .subscribe()
}

/**
 * Subscribe to comments on item
 */
export function subscribeToComments(
  itemId: string,
  callback: (payload: any) => void
) {
  return supabase
    .from(`comments:item_id=eq.${itemId}`)
    .on('*', callback)
    .subscribe()
}

/**
 * Subscribe to user's items
 */
export function subscribeToUserItems(
  userId: string,
  callback: (payload: any) => void
) {
  return supabase
    .from(`items:owner_id=eq.${userId}`)
    .on('*', callback)
    .subscribe()
}

export default supabase
