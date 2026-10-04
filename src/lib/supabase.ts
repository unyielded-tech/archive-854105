import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Customer login is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
  client = createClient(url, key)
  return client
}
