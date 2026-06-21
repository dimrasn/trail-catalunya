// Anonymous query logging via the SECURITY DEFINER RPC from U2. Records the
// tool name + arguments only — never IP or any identity. Best-effort: a log
// failure never blocks a tool call.

import { getClient } from './client.ts'

export async function logCall(tool: string, args: Record<string, unknown>): Promise<void> {
  const supabase = getClient()
  // The free-text intent ("scenic, with butifarra") rides in args; store it as
  // query_text when present so the slice-2 enrichment priorities are grounded
  // in real demand.
  const queryText = typeof args.query === 'string' ? args.query : null
  try {
    const { error } = await supabase.rpc('log_mcp_call', {
      p_tool: tool,
      p_query_text: queryText,
      p_filters: args,
    })
    if (error) console.error(`log_mcp_call error: ${error.message}`)
  } catch (err) {
    console.error(`logCall threw: ${err instanceof Error ? err.message : String(err)}`)
  }
}
