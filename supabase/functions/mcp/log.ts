// Anonymous query logging via the SECURITY DEFINER RPC from U2. Records the
// tool name + arguments only — never IP or any identity. Best-effort: a log
// failure never blocks a tool call.

import { getServiceClient } from './client.ts'
import { capArgs } from './log_filter.ts'

// Free-text intent cap. The allowlist filter for structured args lives in
// log_filter.ts (pure + tested).
const MAX_QUERY_CHARS = 500

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
