// Shared anon-key Supabase client for the MCP function. Reads use anon +
// public-read RLS; writes go through SECURITY DEFINER RPCs (log/rate-limit),
// so the function never holds the service-role key.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

let cached: SupabaseClient | null = null

export function getClient(): SupabaseClient {
  if (cached) return cached
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set')
  }
  cached = createClient(url, anonKey, { auth: { persistSession: false } })
  return cached
}
