import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectRaceForPrompt } from './raceProjection.js'

// A big mountain ultra: distances all carry D+ so eventKmEffort is defined.
const ultra = {
  distances: [{ km: 100, elevationGain: 6000 }, { km: 42, elevationGain: 2500 }],
  tasteSummary: { value: 'a savage high-Pyrenees loop', strength: 'our_read', strengthLabel: 'Our read' },
  tasteFlags: { technicality: 'high' },
}

test('projectRaceForPrompt: difficulty computed from distances, taste passed through', () => {
  const p = projectRaceForPrompt(ultra)
  assert.ok(p.difficulty, 'difficulty present')
  assert.equal(typeof p.difficulty.level, 'string')
  assert.equal(typeof p.difficulty.kmEffort, 'number')
  assert.equal(typeof p.difficulty.itraPoints, 'number')
  assert.equal(p.difficulty.dPlusPerKm, 60) // 6000/100 on the longest distance
  assert.deepEqual(p.tasteSummary, ultra.tasteSummary)
  assert.deepEqual(p.tasteFlags, { technicality: 'high' })
})

test('projectRaceForPrompt: omits unknowns — no fabrication', () => {
  // No elevation anywhere → eventKmEffort null → difficulty omitted entirely.
  const noElev = { distances: [{ km: 21 }] }
  const p = projectRaceForPrompt(noElev)
  assert.equal(p.difficulty, undefined)
  assert.equal(p.tasteSummary, undefined)
  assert.equal(p.tasteFlags, undefined)
})

test('projectRaceForPrompt: difficulty without dPlusPerKm when longest distance lacks elevation', () => {
  // eventKmEffort needs every distance to have D+; if the LONGEST lacks it but the
  // event still resolves, dPlusPerKm is simply omitted. Here all lack D+ → no difficulty.
  const p = projectRaceForPrompt({ distances: [{ km: 30 }, { km: 12 }] })
  assert.equal(p.difficulty, undefined)
})

test('projectRaceForPrompt: empty taste flags object is dropped', () => {
  const p = projectRaceForPrompt({ distances: [{ km: 20, elevationGain: 800 }], tasteFlags: {} })
  assert.equal(p.tasteFlags, undefined)
  assert.ok(p.difficulty)
})

test('projectRaceForPrompt: null-safe', () => {
  assert.deepEqual(projectRaceForPrompt(null), {})
  assert.deepEqual(projectRaceForPrompt({}), {})
})
