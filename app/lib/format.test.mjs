// Tests for the site's km-effort / difficulty helpers. Mirrors the MCP's
// supabase/functions/mcp/difficulty_test.ts case-for-case — the two are separate
// runtimes (Next vs Deno) but MUST agree, so the shared cases are the parity guard.
// Run: node --test app/lib/format.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { kmEffort, eventKmEffort, itraPoints, difficultyLevel, dPlusPerKm } from './format.js'

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
