// Rate limiting + invocation counting via the SECURITY DEFINER RPCs from U2.
// The function holds only the anon key; it cannot read the counter tables,
// only bump them through the granted functions.

import { getClient } from './client.ts'

// Per-IP window. Conservative defaults for a hobby endpoint; tune from the
// query log later (plan Open Questions).
const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_PER_WINDOW = 120 // tool calls per IP per hour
const MAX_PER_DAY_GLOBAL = 50_000 // global backstop, well under the 500k/mo ceiling

// Hash the client IP (never store raw). Take the rightmost x-forwarded-for
// hop appended by the platform, not the leftmost caller-supplied value.
export async function clientIpHash(req: Request): Promise<string> {
  const xff = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const hops = xff.split(',').map((s) => s.trim()).filter(Boolean)
  const ip = hops.length ? hops[hops.length - 1] : 'unknown'
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Returns false when the caller is over the per-IP window limit OR the global
// daily ceiling. Fails open on infrastructure error — availability over
// strictness for a public read-only endpoint whose worst case is a free-tier
// pause, never a bill.
export async function checkRateLimit(ipHash: string): Promise<boolean> {
  const supabase = getClient()
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS).toISOString()
  try {
    const { data, error } = await supabase.rpc('bump_rate_limit', {
      p_ip_hash: ipHash,
      p_window_start: windowStart,
    })
    if (error) {
      console.error(`bump_rate_limit error: ${error.message}`)
      return true
    }
    return (data as number) <= MAX_PER_WINDOW
  } catch (err) {
    console.error(`checkRateLimit threw: ${err instanceof Error ? err.message : String(err)}`)
    return true
  }
}

// Increment the daily invocation counter (R12). Returns whether we're still
// under the global ceiling so the caller can reject past the backstop.
export async function bumpInvocations(): Promise<boolean> {
  const supabase = getClient()
  try {
    const { data, error } = await supabase.rpc('bump_invocations')
    if (error) {
      console.error(`bump_invocations error: ${error.message}`)
      return true
    }
    return (data as number) <= MAX_PER_DAY_GLOBAL
  } catch (err) {
    console.error(`bumpInvocations threw: ${err instanceof Error ? err.message : String(err)}`)
    return true
  }
}
