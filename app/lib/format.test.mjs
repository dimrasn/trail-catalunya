// Tests for the site's km-effort / difficulty helpers. Mirrors the MCP's
// supabase/functions/mcp/difficulty_test.ts case-for-case — the two are separate
// runtimes (Next vs Deno) but MUST agree, so the shared cases are the parity guard.
// Run: node --test app/lib/format.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  kmEffort, eventKmEffort, itraPoints, difficultyLevel, dPlusPerKm,
  distancesSummary, elevationSummary, metadataDistancePart, expectedDateLabel,
} from './format.js'

test('kmEffort: missing km → null', () => {
  assert.equal(kmEffort({ elevationGain: 500 }), null)
})

test('kmEffort: missing D+ → null (never zero-climb)', () => {
  assert.equal(kmEffort({ km: 42 }), null)
  assert.equal(kmEffort({ km: 42, elevationGain: null }), null)
})

test('kmEffort: 21.4 + 1090/100 → 32.3', () => {
  assert.equal(kmEffort({ km: 21.4, elevationGain: 1090 }), 32.3)
})

test('kmEffort: whole result is 166, not 166.0', () => {
  const v = kmEffort({ km: 100, elevationGain: 6600 })
  assert.equal(v, 166)
  assert.equal(String(v), '166')
})

test('itraPoints: exact ITRA table boundaries (0-24→0 … 210+→6)', () => {
  assert.equal(itraPoints(24), 0)
  assert.equal(itraPoints(25), 1)
  assert.equal(itraPoints(44), 1)
  assert.equal(itraPoints(45), 2)
  assert.equal(itraPoints(74), 2)
  assert.equal(itraPoints(75), 3)
  assert.equal(itraPoints(114), 3)
  assert.equal(itraPoints(115), 4)
  assert.equal(itraPoints(154), 4)
  assert.equal(itraPoints(155), 5)
  assert.equal(itraPoints(209), 5)
  assert.equal(itraPoints(210), 6)
  assert.equal(itraPoints(null), null)
})

test('difficultyLevel: 6-level words on ITRA boundaries (4+5 merged to Extreme)', () => {
  assert.equal(difficultyLevel(24), 'Easy')
  assert.equal(difficultyLevel(25), 'Moderate')
  assert.equal(difficultyLevel(45), 'Hard')
  assert.equal(difficultyLevel(75), 'Very hard')
  assert.equal(difficultyLevel(115), 'Extreme')  // ITRA 4
  assert.equal(difficultyLevel(209), 'Extreme')  // ITRA 5 — merged
  assert.equal(difficultyLevel(210), 'Brutal')   // ITRA 6
  assert.equal(difficultyLevel(null), null)
})

test('dPlusPerKm: rounds D+/km; null when either input missing', () => {
  assert.equal(dPlusPerKm({ km: 50, elevationGain: 2500 }), 50)
  assert.equal(dPlusPerKm({ km: 21.4, elevationGain: 1090 }), 51)  // 50.9 → 51
  assert.equal(dPlusPerKm({ km: 42 }), null)
  assert.equal(dPlusPerKm({ km: 0, elevationGain: 500 }), null)
})

test('eventKmEffort: all distances missing D+ → null', () => {
  assert.equal(eventKmEffort([{ km: 10 }, { km: 21 }]), null)
})

test('eventKmEffort: partial (one distance missing D+) → null', () => {
  // Cursa de l'Alba shape: 42 km unknown D+, plus known 22 and 12.
  assert.equal(eventKmEffort([
    { km: 42 },
    { km: 22, elevationGain: 1200 },
    { km: 12, elevationGain: 600 },
  ]), null)
})

test('eventKmEffort: complete event → max; per-distance values intact', () => {
  const ds = [
    { km: 100, elevationGain: 6600 },
    { km: 42, elevationGain: 2800 },
    { km: 21, elevationGain: 1450 },
    { km: 5, elevationGain: 860 },
  ]
  assert.equal(eventKmEffort(ds), 166)
  assert.deepEqual(ds.map(kmEffort), [166, 70, 35.5, 13.6])
})

test('eventKmEffort: empty → null', () => {
  assert.equal(eventKmEffort([]), null)
})

// ---------------------------------------------------------------------------
// Discrete-value rendering (rules R1, R2 in docs/rules.md).
// A range asserts that intermediate values exist. Distances and elevations are
// discrete, enumerable options — a runner picks one, they cannot pick 19 km.
// Reported by Dima 2026-08-23 against /race/trail-de-monells ("18–25 km").
// ---------------------------------------------------------------------------

test('distancesSummary: two discrete options are a list, not a range', () => {
  // The reported defect. Trail de Monells offers exactly 18 km and 25 km.
  assert.equal(distancesSummary([{ km: 25 }, { km: 18 }]), '18, 25 km')
})

test('distancesSummary: five options (Congost Trail Challenge — the widest event)', () => {
  assert.equal(
    distancesSummary([{ km: 25 }, { km: 15 }, { km: 11 }, { km: 10.6 }, { km: 5.2 }]),
    '5.2, 10.6, 11, 15, 25 km',
  )
})

test('distancesSummary: single distance has no separator', () => {
  assert.equal(distancesSummary([{ km: 21.4 }]), '21.4 km')
})

test('distancesSummary: duplicate distances collapse', () => {
  assert.equal(distancesSummary([{ km: 21 }, { km: 21 }]), '21 km')
})

test('distancesSummary: rows without km are ignored; none → null', () => {
  assert.equal(distancesSummary([{ km: 12 }, { km: null }]), '12 km')
  assert.equal(distancesSummary([{ km: null }]), null)
  assert.equal(distancesSummary([]), null)
})

test('elevationSummary: discrete climbs are a list, not a range', () => {
  assert.equal(elevationSummary([{ elevationGain: 1090 }, { elevationGain: 650 }]), '↑650, 1090 m')
  assert.equal(elevationSummary([{ elevationGain: 650 }]), '↑650 m')
  assert.equal(elevationSummary([{ elevationGain: null }]), null)
})

// R2: never pair a range endpoint with an unrelated maximum. Ultra Pirineu's
// title read "5–100 km / 6600 m D+" — a 5 km race with 6600 m of climb.
test('metadataDistancePart: multi-distance events mark the climb as a maximum', () => {
  const ultraPirineu = [
    { km: 100, elevationGain: 6600 }, { km: 42, elevationGain: 2400 },
    { km: 21, elevationGain: 1200 }, { km: 5, elevationGain: 400 },
  ]
  assert.equal(metadataDistancePart(ultraPirineu), '5, 21, 42, 100 km · up to 6600 m D+')
})

test('metadataDistancePart: a single distance pairs its own climb directly', () => {
  assert.equal(metadataDistancePart([{ km: 21.4, elevationGain: 1090 }]), '21.4 km / 1090 m D+')
})

test('metadataDistancePart: no elevation → distances alone; no distances → null', () => {
  assert.equal(metadataDistancePart([{ km: 18 }, { km: 25 }]), '18, 25 km')
  assert.equal(metadataDistancePart([]), null)
})

// ---------------------------------------------------------------------------
// Known-month dates (P1.5). All 138 TBD rows carry month_num and year; the site
// discarded both and rendered "To be announced". An expected month is NOT a
// confirmed date and must never be presented as one.
// ---------------------------------------------------------------------------

test('expectedDateLabel: month + year → a month, not a date', () => {
  assert.equal(expectedDateLabel(8, 2026), 'August 2026')
  assert.equal(expectedDateLabel(9, 2026), 'September 2026')
})

test('expectedDateLabel: missing or out-of-range input → null', () => {
  assert.equal(expectedDateLabel(null, 2026), null)
  assert.equal(expectedDateLabel(8, null), null)
  assert.equal(expectedDateLabel(0, 2026), null)
  assert.equal(expectedDateLabel(13, 2026), null)
})
