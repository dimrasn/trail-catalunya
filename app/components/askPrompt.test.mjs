// Tests the AI-prompt builder's handling of MULTI-select filters — the
// activeFilterPhrases / joinLabels logic that renders "A or B" for a row with
// several buckets picked. Exercised through the public buildPrompt so the test
// is coupled to output, not internals. Run: node --test app/components/askPrompt.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPrompt } from './askPrompt.js'

const RACES = [
  { name: 'Race A', date: '2026-05-10', town: 'Olot', province: 'GIRONA', driveMinutes: 90,
    distances: [{ km: 12, elevationGain: 600 }] },
]
const EMPTY_FILTERS = {
  drive: [], distance: [], elevation: [], month: [], province: [],
  showTBD: false, showPast: false, kidsRun: false,
}

test('buildPrompt: multiple buckets in one row render as "A or B"', () => {
  const p = buildPrompt(RACES, { ...EMPTY_FILTERS, distance: ['10-15', '15-21'] })
  assert.match(p, /distance 10–15 km or 15–21 km/)
})

test('buildPrompt: multiple months render as month names joined with "or"', () => {
  const p = buildPrompt(RACES, { ...EMPTY_FILTERS, month: ['05', '06'] })
  assert.match(p, /in May or June/)
})

test('buildPrompt: multiple provinces render joined with "or"', () => {
  const p = buildPrompt(RACES, { ...EMPTY_FILTERS, province: ['BARCELONA', 'GIRONA'] })
  assert.match(p, /in Barcelona or Girona province/)
})

test('buildPrompt: a single-bucket row reads naturally (no dangling "or")', () => {
  const p = buildPrompt(RACES, { ...EMPTY_FILTERS, drive: ['u60'] })
  assert.match(p, /drive under 1h from Barcelona/)
  assert.doesNotMatch(p, /under 1h or/)
})

test('buildPrompt: no active filters uses the unfiltered "ask my constraints" shape', () => {
  const p = buildPrompt(RACES, EMPTY_FILTERS)
  assert.match(p, /haven't set any filters/)
  assert.doesNotMatch(p, /My filters:/)
})

test('buildPrompt: an active filter uses the filtered "recommend the best" shape', () => {
  const p = buildPrompt(RACES, { ...EMPTY_FILTERS, distance: ['10-15'] })
  assert.match(p, /My filters:/)
})
