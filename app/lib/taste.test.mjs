// Tests for the site taste gate. Mirrors supabase/functions/mcp/taste_view_test.ts
// case-for-case (parity guard). Field names are camelCase here (strengthLabel)
// vs snake_case on the MCP — the LOGIC is identical, which is what parity guards.
// Run: node --test app/lib/taste.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tasteForDisplay, tasteSummary, tasteFlags } from './taste.js'

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

test('tasteSummary falls back (who → setting) when no unique/reference', () => {
  assert.equal(
    tasteSummary({ attributes: { setting: { value: 'forested coastal hills', claim_strength: 'organizer_fact' } }, editorial: {} }).value,
    'forested coastal hills',
  )
})

test('tasteFlags: conservative — set only when stated, absent = unknown', () => {
  assert.equal(tasteFlags(null), null)
  assert.deepEqual(tasteFlags({ attributes: { night_race: { value: 'Yes', claim_strength: 'organizer_fact' } }, editorial: {} }), { night: true })
  // Technicality bands from the organizer EVIDENCE quote, not our value prose.
  assert.deepEqual(tasteFlags({ attributes: { technicality: { value: 'some technical sections', claim_strength: 'organizer_fact', evidence: 'some technical sections' } }, editorial: {} }), { technicality: 'moderate' })
  assert.deepEqual(tasteFlags({ attributes: { technicality: { value: 'genuinely technical', claim_strength: 'organizer_fact', evidence: 'molt tècnica, rocky descents' } }, editorial: {} }), { technicality: 'high' })
  assert.deepEqual(tasteFlags({ attributes: { technicality: { value: 'runnable, low tech', claim_strength: 'organizer_fact', evidence: 'runnable, low tech' } }, editorial: {} }), { technicality: 'low' })
  assert.equal(tasteFlags({ attributes: { setting: { value: 'coastal forest', claim_strength: 'our_read' } }, editorial: {} }), null)
})

test('tasteFlags: negation never sets night; non-organizer provenance is ineligible (audit #6)', () => {
  assert.equal(tasteFlags({ attributes: { night_race: { value: 'No. (day marxa, no night mention)', claim_strength: 'organizer_fact' } }, editorial: {} }), null)
  assert.equal(tasteFlags({ attributes: { technicality: { value: 'rocky, technical', claim_strength: 'inference', evidence: 'rocky' } }, editorial: {} }), null)
  assert.equal(tasteFlags({ attributes: { night_race: { value: 'Yes — nocturna', claim_strength: 'our_read' } }, editorial: {} }), null)
})

test('tasteFlags: blended organizer value does NOT manufacture a technicality flag (review #1, UTSM)', () => {
  // The real UTSM field: organizer said only "accessible"; the words "rocky
  // Montsant" are OUR caution living in the same value string. Banding must read
  // the evidence ("accessible" → no band), never the blended value → no flag.
  const utsm = {
    attributes: {
      technicality: {
        value: '"accessible" despite distance — treat with caution given 3470 m D+ on rocky Montsant conglomerate.',
        claim_strength: 'organizer_fact',
        evidence: 'accessible',
      },
    },
    editorial: {},
  }
  assert.equal(tasteFlags(utsm), null)
  // Guard the other half: when the organizer's OWN quote is high-technical, it flags.
  const vilaverd = { attributes: { technicality: { value: 'HIGH — organizer states it', claim_strength: 'organizer_fact', evidence: 'very technical… for runners accustomed to mountain' } }, editorial: {} }
  assert.deepEqual(tasteFlags(vilaverd), { technicality: 'high' })
  // An organizer_fact with NO evidence quote yields no flag (conservative).
  assert.equal(tasteFlags({ attributes: { technicality: { value: 'rocky and hard', claim_strength: 'organizer_fact', evidence: null } }, editorial: {} }), null)
})

test('inference stays inference, not upgraded to fact', () => {
  const d = tasteForDisplay({ editorial: { who: { value: 'strong night runners', claim_strength: 'inference' } } })
  assert.equal(d.editorial[0].strengthLabel, 'Our guess')
})
