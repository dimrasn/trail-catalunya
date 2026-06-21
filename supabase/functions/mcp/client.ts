// Two Supabase clients for the MCP function:
//   getClient()        — anon key, for reads (public-read RLS on races/towns/
//                        scrape_runs). Safe to expose; it's the public key.
//   getServiceClient() — service-role key, ONLY for the write RPCs
//                        (log_mcp_call / bump_rate_limit / bump_invocations).
//                        Those functions had their anon EXECUTE revoked because
//                        the anon key is public and directly callable. The
//                        service-role key is server-only (Supabase injects it
//                        into the Edge runtime; never shipped to clients). It is
//                        used exclusively for those three RPCs — no user input
//                        ever reaches an arbitrary table through it.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

let anonCached: SupabaseClient | null = null
let serviceCached: SupabaseClient | null = null

export function getClient(): SupabaseClient {
  if (anonCached) return anonCached
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set')
  }
  anonCached = createClient(url, anonKey, { auth: { persistSession: false } })
  return anonCached
}

export function getServiceClient(): SupabaseClient {
  if (serviceCached) return serviceCached
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }
  serviceCached = createClient(url, serviceKey, { auth: { persistSession: false } })
  return serviceCached
}
