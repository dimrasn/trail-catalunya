// POST /api/intent — same-origin normalizer for ask-box intent logging (Step 3, U2).
// It strips junk, recomputes has_intent, caps the body, then AWAITS the write RPC
// (a non-awaited serverless fetch can be killed mid-flight). It is NOT the security
// boundary — the anon-callable log_intent() RPC is (see the migration). Always
// returns 204; never leaks validation detail. Plan:
// docs/plans/2026-08-25-001-feat-intent-logging-plan.md (U2/KTD5).

import { normalizeIntentPayload } from '../../lib/intent.js'

const MAX_BODY_BYTES = 4096
const NO_CONTENT = new Response(null, { status: 204 })

// Same-origin only: the browser sends Origin on POST; require its host to match
// the request Host. (No CORS headers are set, so cross-origin JSON POSTs also fail
// preflight — this is the explicit belt-and-braces check.)
function sameOrigin(request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(request) {
  // Reject anything not a same-origin JSON POST — quietly (204), no detail leaked.
  if (!sameOrigin(request)) return NO_CONTENT
  const ctype = request.headers.get('content-type') || ''
  if (!ctype.includes('application/json')) return NO_CONTENT

  let raw
  try {
    raw = await request.text()
  } catch {
    return NO_CONTENT
  }
  if (raw.length > MAX_BODY_BYTES) return NO_CONTENT

  let body
  try {
    body = JSON.parse(raw)
  } catch {
    return NO_CONTENT
  }

  const clean = normalizeIntentPayload(body)
  if (!clean) return NO_CONTENT

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    try {
      // Awaited: keep the function alive until the RPC completes. The BROWSER side
      // is already non-blocking (logIntent uses keepalive + no await), so this
      // latency is invisible to the user.
      await fetch(`${url}/rest/v1/rpc/log_intent`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          apikey: key,
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          p_goal: clean.goal_text,
          p_chips: clean.chips,
          p_filters: clean.filters,
          p_provider: clean.provider,
          p_has_intent: clean.has_intent,
        }),
      })
    } catch {
      // best-effort — never surface a logging failure
    }
  }

  return NO_CONTENT
}
