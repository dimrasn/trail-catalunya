// Canonical ask-box intent vocabulary + validation, shared by the client
// (AskAI.jsx), the route handler (app/api/intent/route.js), and — by parity test
// (intent.test.mjs) — the SQL `intent_allowlist()` in the intent_log migration.
// Plan: docs/plans/2026-08-25-001-feat-intent-logging-plan.md (KTD1/KTD2).
//
// Chips are stable IDS, not display labels: the ID is logged (stable across UI
// renames), the LABEL is what the user sees and what the AI prompt receives.
// Filter keys + value domains DERIVE from the canonical model in filters.js — not
// a second hand-listed set — so the two can't drift.

import {
  DRIVE_VALUES, DISTANCE_VALUES, ELEVATION_VALUES,
  DIFFICULTY_VALUES, MONTH_VALUES, PROVINCE_VALUES,
} from './filters.js'

// { id (stable, logged), label (shown + sent to the AI prompt) }.
export const INTENT_CHIPS = [
  { id: 'fun-trail', label: 'fun trail' },
  { id: 'somewhere-new', label: 'somewhere new' },
  { id: 'chase-pb', label: 'chase a PB' },
  { id: 'kid-friendly', label: 'kid-friendly' },
]

const CHIP_IDS = new Set(INTENT_CHIPS.map(c => c.id))
const CHIP_LABEL = new Map(INTENT_CHIPS.map(c => [c.id, c.label]))

export function chipLabel(id) {
  return CHIP_LABEL.get(id) || null
}

// The multi-select filter dimensions we log as demand signal, each with its
// value domain (from filters.js). kidsRun is the one boolean dimension worth
// logging; showTBD/showPast are view toggles, not demand, so they're dropped.
export const FILTER_ARRAY_DOMAINS = {
  drive: DRIVE_VALUES,
  distance: DISTANCE_VALUES,
  elevation: ELEVATION_VALUES,
  difficulty: DIFFICULTY_VALUES,
  month: MONTH_VALUES,
  province: PROVINCE_VALUES,
}
export const FILTER_BOOL_KEYS = ['kidsRun']

export const GOAL_MAX = 400
export const CHIP_MAX = 8
export const PROVIDERS = ['claude', 'chatgpt', 'copy']

// Keep only in-domain values, deduped, in canonical order (matches filters.js
// parseMulti's stability guarantee).
function rebuildArray(values, domain) {
  if (!Array.isArray(values)) return []
  const seen = new Set(values)
  return domain.filter(v => seen.has(v))
}

// Normalize + validate an intent payload. The route handler runs this; the RPC
// re-runs the equivalent in SQL (the RPC is the real trust boundary — a direct
// anon caller skips this). Returns a clean payload, or null when unusable
// (invalid/absent provider).
export function normalizeIntentPayload(body) {
  if (!body || typeof body !== 'object') return null

  const provider = PROVIDERS.includes(body.provider) ? body.provider : null
  if (!provider) return null

  const goal_text = typeof body.goal_text === 'string'
    ? body.goal_text.trim().slice(0, GOAL_MAX)
    : ''

  const chipsIn = Array.isArray(body.chips) ? body.chips : []
  const chips = [...new Set(chipsIn.filter(c => CHIP_IDS.has(c)))].slice(0, CHIP_MAX)

  const filtersIn = (body.filters && typeof body.filters === 'object') ? body.filters : {}
  const filters = {}
  for (const [key, domain] of Object.entries(FILTER_ARRAY_DOMAINS)) {
    const arr = rebuildArray(filtersIn[key], domain)
    if (arr.length) filters[key] = arr
  }
  for (const key of FILTER_BOOL_KEYS) {
    if (filtersIn[key] === true) filters[key] = true
  }

  // Server-derived — never trust a client-sent has_intent.
  const has_intent = goal_text.length > 0 || chips.length > 0

  return { goal_text, chips, filters, provider, has_intent }
}

// Client-only: fire-and-forget the log AFTER the handoff. Never awaited by the
// UI; swallows everything (a log failure must never touch the handoff). keepalive
// lets it survive the tab navigation from window.open.
export function logIntent({ goal, chips, filters, provider }) {
  try {
    const body = JSON.stringify({
      goal_text: goal || '',
      chips: chips || [],
      filters: filters || {},
      provider,
    })
    // Not awaited. Returns a promise we deliberately ignore.
    fetch('/api/intent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // never throw into the handoff path
  }
}
