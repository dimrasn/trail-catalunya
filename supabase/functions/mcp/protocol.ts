// Minimal hand-rolled MCP (Model Context Protocol) JSON-RPC surface for a
// stateless, read-only tools server. Plain application/json responses — no
// SSE, no session id. Protocol version pinned to 2025-03-26 with graceful
// negotiation. ~enough to satisfy Claude / ChatGPT remote MCP clients.

export const PROTOCOL_VERSION = '2025-03-26'

export const SERVER_INFO = {
  name: 'trail-catalunya',
  version: '0.1.0',
  // R17: anonymous-logging disclosure, surfaced where clients show server info.
  description:
    'Trail running races in Catalunya. Read-only. Queries are logged ' +
    'anonymously (no IP, no identity) for 90 days to improve the tool.',
}

// Session-level guidance returned in the MCP initialize result
// (InitializeResult.instructions). This is where a composing agent learns how
// to combine trail-catalunya with the user's OWN training-data connector. We
// store NO user data and never fetch Strava/Garmin ourselves — all
// personalization happens in the agent, joining our race fields with the
// user's training MCP locally.
export const INSTRUCTIONS = [
  'trail-catalunya returns trail-running races in Catalunya (Spain). Each race exposes',
  'distances[] (km + elevationGain in metres D+), drive_minutes_from_barcelona (measured',
  'from Plaça Glòries, Barcelona — NOT the user), province, dates, kidsRun, and best-effort',
  'enriched_facts (start_time / price / confirmed_status, each with confidence + last_checked).',
  '',
  'COMPOSES WITH TRAINING DATA. This server is designed to be joined with the user\'s OWN',
  'connected training-data MCP (e.g. a Strava or Garmin connector) if one is present in the',
  'session. When training data IS available, do the join locally and deliver three things:',
  '  1. RACE READINESS — is the user prepared for a given race, from recent training vs the',
  '     race\'s longest distance + elevationGain + steepness (D+/km).',
  '  2. PROJECTED FINISH TIME — a rough estimate from the user\'s recent pace and climbing',
  '     rate applied to the race\'s distance and D+.',
  '  3. SUITABILITY RANKING — sort/shortlist the races by fit to current fitness, not just',
  '     by the user\'s hard filters.',
  '',
  'PULL THESE SIGNALS from the training MCP (last 8–12 weeks): weekly volume (km), longest',
  'single run (km), weekly vertical (m), typical easy/long-run pace (min/km), climbing rate',
  '(VAM, vertical m ascended per hour on sustained climbs), and any recent race results.',
  '',
  'PROJECTED TIME — compute it yourself, do not ask this server for it. Preferred model when',
  'you have the user\'s climbing rate (VAM):',
  '  time_min = distance_km × flat_pace_min_per_km + (elevationGain_m / climb_VAM_m_per_h) × 60,',
  '  then × terrain_factor. Fallback when you only have pace: effort-adjusted distance, ~1 flat',
  '  km per 100 m of climb: time_min = (distance_km + elevationGain_m/100) × trail_pace × terrain_factor.',
  '  terrain_factor from steepness D+/km: <25 → 1.00; 25–50 → 1.10; >50 → 1.20 (technical footing).',
  '  If the race longest distance exceeds the user\'s longest recent run by >1.5×, add a further',
  '  5–10% and say endurance beyond their current long run is untested. Give a range (±10–15%),',
  '  not a single number, and call it a rough estimate, never a promise.',
  '',
  'READINESS — three ratios against the last 8–12 weeks, name the binding one:',
  '  L = race_longest_km / user_longest_run_km (endurance);',
  '  V = race_D+ / user_max_session_vertical (climbing);',
  '  W = race_longest_km / user_weekly_volume_km (load; a race > ~0.5 of weekly km is a lot).',
  '  Ready: L ≤ 1.0 and V ≤ 1.0 and W ≤ 0.5. Stretch: L ≤ 1.4 or V ≤ 1.5 (doable with respect /',
  '  a taper). Not ready: L > 1.4 or V > 1.5, or < 4 weeks of consistent data.',
  '',
  'GUARDRAILS (hard):',
  '  • No training data in the session → do NOT invent readiness or a finish time. Tell the user:',
  '    connect a Strava or Garmin MCP alongside this one and you\'ll get personalized readiness +',
  '    projected times. Then answer from race facts alone.',
  '  • Never send the user\'s training data to this server. Our tools take race filters only; the',
  '    join is local.',
  '  • State your assumptions (which weeks, which pace) and the uncertainty range every time.',
  '  • Our race distance/elevation are scraped third-party data; start_time / confirmed_status /',
  '    sold-out are volatile — verify a shortlisted race at its url before recommending, and say',
  '    so if you cannot. A confident projected time must not paper over an unverified start.',
].join('\n')

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

// A registered tool: JSON-Schema input + a handler returning a JSON-able value.
export interface ToolDef {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (args: Record<string, unknown>) => Promise<unknown> | unknown
}

export function rpcResult(id: JsonRpcRequest['id'], result: unknown): Response {
  return json({ jsonrpc: '2.0', id: id ?? null, result })
}

export function rpcError(
  id: JsonRpcRequest['id'],
  code: number,
  message: string,
): Response {
  return json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } })
}

// MCP tools/call envelope: structured payload as text content + structuredContent,
// with isError separating a tool-level failure from a JSON-RPC protocol error.
export function toolResult(id: JsonRpcRequest['id'], payload: unknown): Response {
  return rpcResult(id, {
    content: [{ type: 'text', text: JSON.stringify(payload) }],
    structuredContent: payload,
    isError: false,
  })
}

export function toolError(id: JsonRpcRequest['id'], message: string): Response {
  return rpcResult(id, {
    content: [{ type: 'text', text: message }],
    isError: true,
  })
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}
