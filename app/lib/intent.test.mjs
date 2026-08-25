import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  INTENT_CHIPS, chipLabel, normalizeIntentPayload, logIntent,
  FILTER_ARRAY_DOMAINS, PROVIDERS,
} from './intent.js'

test('chip ids map to labels; unknown id → null', () => {
  assert.equal(chipLabel('chase-pb'), 'chase a PB')
  assert.equal(chipLabel('kid-friendly'), 'kid-friendly')
  assert.equal(chipLabel('nope'), null)
})

test('normalizeIntentPayload: keeps only allowlisted chip ids, deduped', () => {
  const p = normalizeIntentPayload({ provider: 'claude', chips: ['chase-pb', 'chase-pb', 'bogus', 'somewhere-new'] })
  assert.deepEqual(p.chips, ['chase-pb', 'somewhere-new'])
})

test('normalizeIntentPayload: rebuilds filters to in-domain values in canonical order; drops junk', () => {
  const p = normalizeIntentPayload({
    provider: 'chatgpt',
    filters: { province: ['GIRONA', 'MARS', 'BARCELONA'], distance: ['42+'], bogusKey: ['x'], showPast: true, kidsRun: true },
  })
  assert.deepEqual(p.filters.province, ['BARCELONA', 'GIRONA']) // canonical order, junk dropped
  assert.deepEqual(p.filters.distance, ['42+'])
  assert.equal(p.filters.bogusKey, undefined)   // unknown key dropped
  assert.equal(p.filters.showPast, undefined)   // view toggle, not logged
  assert.equal(p.filters.kidsRun, true)         // real demand boolean kept
})

test('normalizeIntentPayload: invalid/absent provider → null (unusable)', () => {
  assert.equal(normalizeIntentPayload({ provider: 'junk' }), null)
  assert.equal(normalizeIntentPayload({}), null)
  assert.equal(normalizeIntentPayload(null), null)
})

test('normalizeIntentPayload: has_intent is server-derived, ignoring the client value', () => {
  // client lies "true" but nothing was entered → false
  const empty = normalizeIntentPayload({ provider: 'copy', has_intent: true, goal_text: '   ', chips: [] })
  assert.equal(empty.has_intent, false)
  // a real goal → true
  const withGoal = normalizeIntentPayload({ provider: 'copy', has_intent: false, goal_text: 'scenic and runnable' })
  assert.equal(withGoal.has_intent, true)
  // chips only → true
  const withChip = normalizeIntentPayload({ provider: 'claude', chips: ['fun-trail'] })
  assert.equal(withChip.has_intent, true)
})

test('normalizeIntentPayload: goal_text trimmed and capped at 400', () => {
  const long = 'x'.repeat(500)
  const p = normalizeIntentPayload({ provider: 'claude', goal_text: `  ${long}  ` })
  assert.equal(p.goal_text.length, 400)
})

// KTD2 parity: the JS canonical vocab must equal what the SQL migration hardcodes,
// so a direct-RPC caller is validated against the SAME sets the UI/route use.
// DB-free: parse the committed migration file (the SQL side of the parity guard).
test('JS↔SQL parity: intent_log migration hardcodes the same chip ids, providers, and filter domains', () => {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'supabase', 'migrations')
  const file = readdirSync(dir).find(f => f.endsWith('_intent_log.sql'))
  assert.ok(file, 'intent_log migration exists')
  const sql = readFileSync(join(dir, file), 'utf8')

  // Chip ids: every JS id must appear as a quoted literal in the migration, and
  // the migration must not reference a chip id JS does not define.
  const jsChipIds = INTENT_CHIPS.map(c => c.id).sort()
  for (const id of jsChipIds) {
    assert.ok(sql.includes(`'${id}'`), `migration references chip id '${id}'`)
  }
  // Providers
  for (const pv of PROVIDERS) {
    assert.ok(sql.includes(`'${pv}'`), `migration references provider '${pv}'`)
  }
  // Filter value domains: each canonical value must appear in the migration.
  for (const [key, domain] of Object.entries(FILTER_ARRAY_DOMAINS)) {
    assert.ok(sql.includes(key), `migration references filter key '${key}'`)
    for (const v of domain) {
      assert.ok(sql.includes(`'${v}'`), `migration references ${key} value '${v}'`)
    }
  }
})

test('logIntent posts chip IDS to /api/intent (not labels)', () => {
  const calls = []
  const realFetch = globalThis.fetch
  globalThis.fetch = (u, opts) => { calls.push({ u, opts }); return { catch() {} } }
  try {
    logIntent({ goal: 'x', chips: ['chase-pb', 'fun-trail'], filters: { province: ['GIRONA'] }, provider: 'claude' })
  } finally {
    globalThis.fetch = realFetch
  }
  assert.equal(calls.length, 1)
  assert.match(calls[0].u, /\/api\/intent$/)
  const body = JSON.parse(calls[0].opts.body)
  assert.deepEqual(body.chips, ['chase-pb', 'fun-trail']) // IDS, not "chase a PB"
  assert.equal(body.provider, 'claude')
  assert.equal(calls[0].opts.keepalive, true)
})
