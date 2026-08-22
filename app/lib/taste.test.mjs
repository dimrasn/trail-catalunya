// Tests for the site taste gate. Mirrors supabase/functions/mcp/taste_view_test.ts
// case-for-case (parity guard). Field names are camelCase here (strengthLabel)
// vs snake_case on the MCP — the LOGIC is identical, which is what parity guards.
// Run: node --test app/lib/taste.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tasteForDisplay, tasteSummary } from './taste.js'

test('null / empty profile → null', () => {
  assert.equal(tasteForDisplay(null), null)
  assert.equal(tasteSummary(null), null)
  assert.equal(tasteForDisplay({}), null)
})

test('editorial is our_read-labelled; Slice-1 excludes operational fields', () => {
  const p = {
    attributes: {
      setting: { value: 'coastal forest ridge', claim_strength: 'organizer_fact' },
      start_time: { value: '21:00', claim_strength: 'organizer_fact' },
    },
    editorial: { unique: { value: 'a night point-to-point to the beach', claim_strength: 'our_read' } },
  }
  const d = tasteForDisplay(p)
  assert.equal(d.editorial[0].label, 'What makes it special')
  assert.equal(d.editorial[0].strengthLabel, 'Our read')
  assert.deepEqual(d.character.map(c => c.key), ['setting'])
})

test('garble / too-short values are hidden (whole taste → null if nothing survives)', () => {
  const p = {
    attributes: { setting: { value: '; .', claim_strength: 'organizer_fact' }, food: { value: 'ok', claim_strength: 'organizer_fact' } },
    editorial: {},
  }
  assert.equal(tasteForDisplay(p), null)
})

test('tasteSummary picks unique and keeps its claim strength', () => {
  assert.deepEqual(
    tasteSummary({ editorial: { unique: { value: 'Catalonia benchmark 100k', claim_strength: 'our_read' } } }),
    { value: 'Catalonia benchmark 100k', strength: 'our_read', strengthLabel: 'Our read' },
  )
})

test('inference stays inference, not upgraded to fact', () => {
  const d = tasteForDisplay({ editorial: { who: { value: 'strong night runners', claim_strength: 'inference' } } })
  assert.equal(d.editorial[0].strengthLabel, 'Our guess')
})
