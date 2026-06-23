// Tests for U9 enrichment display logic (R14, R14a, KTD7).
// Run: node --test app/lib/enrichment.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enrichmentForDisplay, factForDisplay } from './enrichment.js'

const NOW = Date.UTC(2026, 5, 23)
const fact = (value, confidence, extra = {}) => ({
  value,
  confidence,
  edition: '2026',
  evidence: null,
  source_url: null,
  last_checked: new Date(NOW).toISOString(),
  ...extra,
})

test('high-blast start time shows at high confidence', () => {
  const d = factForDisplay('start_time', fact('08:00', 'high'), NOW)
  assert.equal(d.value, '08:00')
  assert.equal(d.highBlast, true)
  assert.equal(d.stale, false)
})

test('high-blast fact is hidden at low confidence', () => {
  assert.equal(factForDisplay('start_time', fact('08:00', 'low'), NOW), null)
  assert.equal(factForDisplay('confirmed_status', fact('confirmed', 'unknown'), NOW), null)
})

test('R14a: a stale high-blast fact reverts to "check site"', () => {
  const old = new Date(Date.UTC(2026, 0, 1)).toISOString() // ~173 days old > 90
  const d = factForDisplay('start_time', fact('08:00', 'high', { last_checked: old }), NOW)
  assert.equal(d.stale, true)
  assert.equal(d.value, undefined)
})

test('price (low-blast) shows at medium, hidden at unknown', () => {
  assert.equal(factForDisplay('price', fact('25€', 'medium'), NOW).value, '25€')
  assert.equal(factForDisplay('price', fact(null, 'unknown'), NOW), null)
})

test('price at low confidence shows with a likely-previous caveat', () => {
  const d = factForDisplay('price', fact('25€', 'low', { edition: 'previous' }), NOW)
  assert.equal(d.value, '25€')
  assert.equal(d.likelyPrevious, true)
})

test('a fact with no value never renders', () => {
  assert.equal(factForDisplay('start_time', fact(null, 'high'), NOW), null)
})

test('enrichmentForDisplay omits non-displayable facts and returns null when empty', () => {
  const row = {
    start_time: fact('08:00', 'high'),
    confirmed_status: fact(null, 'unknown'),
    price: fact(null, 'unknown'),
  }
  const out = enrichmentForDisplay(row, NOW)
  assert.ok(out.start_time)
  assert.equal(out.confirmed_status, undefined)
  assert.equal(out.price, undefined)

  assert.equal(enrichmentForDisplay(null, NOW), null)
  assert.equal(enrichmentForDisplay({ start_time: fact(null, 'unknown') }, NOW), null)
})
