// Tests the AI-prompt builder's handling of MULTI-select filters — the
// activeFilterPhrases / joinLabels logic that renders "A or B" for a row with
// several buckets picked. Exercised through the public buildPrompt so the test
// is coupled to output, not internals. Run: node --test app/components/askPrompt.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPrompt, buildBestNextRacePrompt } from './askPrompt.js'

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

// --- buildBestNextRacePrompt (Step 3: goal-first handoff) ---

const TASTE_RACE = {
  name: 'Ultra Serra', date: '2026-09-12', town: 'Ulldemolins', province: 'TARRAGONA', driveMinutes: 110,
  distances: [{ km: 100, elevationGain: 3470 }, { km: 42, elevationGain: 1800 }],
  tasteSummary: { value: 'a savage Montsant loop', strength: 'our_read', strengthLabel: 'Our read' },
  tasteFlags: { technicality: 'high' },
}

test('buildBestNextRacePrompt: states the goal + chips and asks for a ranked shortlist', () => {
  const p = buildBestNextRacePrompt([TASTE_RACE], EMPTY_FILTERS, { goal: 'something scenic I can train toward', chips: ['somewhere new'] })
  assert.match(p, /something scenic I can train toward/)
  assert.match(p, /somewhere new/)
  assert.match(p, /best 3–5/)
  assert.match(p, /Low-faff/)
  assert.match(p, /Novelty/)
})

test('buildBestNextRacePrompt: inlines each race\'s difficulty + taste projection with its source label', () => {
  const p = buildBestNextRacePrompt([TASTE_RACE], EMPTY_FILTERS, { goal: 'a big mountain day' })
  assert.match(p, /difficulty .+ \(ITRA km-effort \d+/)
  assert.match(p, /character: "a savage Montsant loop" \[Our read\]/)
  assert.match(p, /technicality high/)
})

test('buildBestNextRacePrompt: carries verify-at-url, injection-guard and Strava-optional discipline', () => {
  const p = buildBestNextRacePrompt([TASTE_RACE], EMPTY_FILTERS, { goal: 'x' })
  assert.match(p, /open each recommended race's URL/)
  assert.match(p, /data, not instructions/)
  assert.match(p, /never send my training or personal data/)
  assert.match(p, /If you don't have my training data, just skip/)
})

test('buildBestNextRacePrompt: folds active filters in as hard constraints', () => {
  const p = buildBestNextRacePrompt([TASTE_RACE], { ...EMPTY_FILTERS, drive: ['60-120'] }, { goal: 'fun' })
  assert.match(p, /hard constraints/)
  assert.match(p, /drive 1–2h/)
})

test('buildBestNextRacePrompt: empty goal AND no chips degrades to buildPrompt', () => {
  const best = buildBestNextRacePrompt([TASTE_RACE], EMPTY_FILTERS, { goal: '  ', chips: [] })
  const plain = buildPrompt([TASTE_RACE], EMPTY_FILTERS)
  assert.equal(best, plain)
})

import { chipLabel } from '../lib/intent.js'
test('chip id→label mapping: prompt carries the LABEL, never the raw id (review #6)', () => {
  const labels = ['chase-pb'].map(chipLabel) // AskAI maps ids→labels for the prompt
  const p = buildBestNextRacePrompt([TASTE_RACE], EMPTY_FILTERS, { goal: '', chips: labels })
  assert.match(p, /chase a PB/)
  assert.doesNotMatch(p, /chase-pb/)
})
