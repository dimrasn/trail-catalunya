// Anonymous query logging via the SECURITY DEFINER RPC from U2. Records the
// tool name + arguments only — never IP or any identity. Best-effort: a log
// failure never blocks a tool call.

import { getServiceClient } from './client.ts'

// Caps so a caller can't stuff the log with large blobs (#7).
const MAX_QUERY_CHARS = 500
const MAX_FILTER_KEYS = 20
const MAX_VALUE_CHARS = 200

function capArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  let n = 0
  for (const [k, v] of Object.entries(args)) {
    if (n++ >= MAX_FILTER_KEYS) break
    if (typeof v === 'string') out[k] = v.length > MAX_VALUE_CHARS ? v.slice(0, MAX_VALUE_CHARS) : v
    else if (v == null || typeof v === 'number' || typeof v === 'boolean') out[k] = v
    else out[k] = String(v).slice(0, MAX_VALUE_CHARS) // collapse arrays/objects defensively
  }
  return out
}

export async function logCall(tool: string, args: Record<string, unknown>): Promise<void> {
  const supabase = getServiceClient()
  // The free-text intent ("scenic, with butifarra") rides in args; store it as
  // query_text when present so the slice-2 enrichment priorities are grounded
  // in real demand. Capped to bound storage.
  const rawQuery = typeof args.query === 'string' ? args.query : null
  const queryText = rawQuery ? rawQuery.slice(0, MAX_QUERY_CHARS) : null
  try {
    const { error } = await supabase.rpc('log_mcp_call', {
      p_tool: tool,
      p_query_text: queryText,
      p_filters: capArgs(args),
    })
    if (error) console.error(`log_mcp_call error: ${error.message}`)
  } catch (err) {
    console.error(`logCall threw: ${err instanceof Error ? err.message : String(err)}`)
  }
}
