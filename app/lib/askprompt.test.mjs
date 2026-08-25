import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPrompt } from '../components/askPrompt.js'

const RACE = {
  name: 'Test Race', date: '2026-09-05', town: 'Amer', province: 'GIRONA',
  driveMinutes: 80, distances: [{ km: 12, elevationGain: 500 }], url: 'https://x',
}
const BASE = { drive: [], distance: [], elevation: [], difficulty: [], month: [], province: [], showTBD: false, showPast: false, kidsRun: false }

test('difficulty-only filter reaches the prompt (Codex P2-3)', () => {
  const p = buildPrompt([RACE], { ...BASE, difficulty: ['hard', 'vh+'] })
  assert.match(p, /My filters:/)
  assert.match(p, /difficulty Hard or Very hard or above \(ITRA km-effort scale\)/)
})

test('mixed filters include difficulty alongside the others', () => {
  const p = buildPrompt([RACE], { ...BASE, drive: ['u60'], difficulty: ['easy'] })
  assert.match(p, /drive under 1h from Barcelona/)
  assert.match(p, /difficulty Easy/)
})

test('no filters still routes to the unfiltered prompt shape', () => {
  const p = buildPrompt([RACE], BASE)
  assert.match(p, /haven't set any filters/)
})
