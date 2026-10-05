import type { User as SbUser } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

export interface CustomerUser {
  uid: string
  email: string | null
  displayName: string
  emailVerified: boolean
}

const toUser = (u: SbUser): CustomerUser => ({
  uid: u.id,
  email: u.email ?? null,
  displayName: (u.user_metadata?.displayName as string) || '',
  emailVerified: !!u.email_confirmed_at,
})

export function authMessage(error: unknown): string {
  const msg = String((error as any)?.message || '').toLowerCase()
  if (msg.includes('not configured')) return 'Customer login is temporarily unavailable. Please try again later.'
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) return 'Invalid email or password.'
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'An account already exists with this email.'
  if (msg.includes('password') && msg.includes('characters')) return 'Choose a stronger password (at least 6 characters).'
  if (msg.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox.'
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Too many attempts. Please wait and try again.'
  if (msg.includes('fetch') || msg.includes('network')) return 'Network error. Check your connection and try again.'
  return 'Authentication could not be completed. Please try again.'
}

// Tell the server about the customer so they show up in the admin Customers page.
async function syncProfile(accessToken?: string) {
  if (!accessToken) return
  try {
    await fetch('/api/store/customers/sync', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
  } catch { /* non-critical */ }
}

// Where emails from Supabase (verify / reset) should send people back to.
// Set VITE_SITE_URL in Vercel to force your real domain; otherwise the current address is used.
export const siteUrl = () => ((import.meta as any).env?.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')

export async function registerCustomer(email: string, password: string, displayName: string, phone = '') {
  try {
    const { data, error } = await getSupabase().auth.signUp({
      email: email.trim(), password, options: { data: { displayName: displayName.trim(), phone }, emailRedirectTo: siteUrl() + '/account/profile?welcome=1' },
    })
    if (error) throw error
    if (!data.user) throw new Error('Sign up failed')
    await syncProfile(data.session?.access_token)
    return toUser(data.user)
  } catch (error) { throw new Error(authMessage(error)) }
}

export async function loginCustomer(email: string, password: string) {
  try {
    const { data, error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
    await syncProfile(data.session?.access_token)
    return toUser(data.user)
  } catch (error) { throw new Error(authMessage(error)) }
}

export async function resetCustomerPassword(email: string) {
  try {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: siteUrl() + '/reset-password' })
    if (error) throw error
  } catch (error) { throw new Error(authMessage(error)) }
}

export function watchCustomerAuth(callback: (user: CustomerUser | null) => void) {
  const sb = getSupabase()
  sb.auth.getSession().then(({ data }) => callback(data.session ? toUser(data.session.user) : null))
  const { data } = sb.auth.onAuthStateChange((_e, session) => callback(session ? toUser(session.user) : null))
  return () => data.subscription.unsubscribe()
}

export async function logoutCustomer() {
  await getSupabase().auth.signOut()
}
