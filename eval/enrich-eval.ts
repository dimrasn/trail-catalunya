// U8 — enrichment evaluation harness (R16–R19, KTD7). Measures the extractor
// against a hand-verified set of frozen page snapshots, so scoring reflects
// extraction quality, not world drift. Reports per-field ACCURACY, COVERAGE
// (share of races with a displayable fact — accuracy without coverage fails the
// goal), and CONFIDENCE CALIBRATION (how often "high" is actually right), with
// an "insufficient data" guard below a minimum sample.
//
// The scoring core is pure + unit-tested. Running it for real over the fixtures
// calls the Anthropic API (needs ANTHROPIC_API_KEY) — that run is the maintainer
// step, deferred until a key is available.
//
// Run scoring tests:  deno test eval/enrich-eval_test.ts
// Run a real eval:    deno run --allow-read --allow-net --allow-env eval/enrich-eval.ts

import { extractFacts, type ModelCaller } from '../supabase/functions/enrich-races/extract.ts'
import { htmlToText } from '../supabase/functions/enrich-races/fetch.ts'
import {
  type Confidence,
  type FactSet,
  STABLE_FACT_KEYS,
  type StableFactKey,
} from '../supabase/functions/enrich-races/types.ts'

export const MIN_CALIBRATION_SAMPLE = 5

export interface EvalEntry {
  id: string
  source: string
  race_url: string
  town: string
  fixture: string // repo-relative path to a frozen HTML snapshot
  truth: Record<StableFactKey, string | null>
}

export interface Graded {
  entry: EvalEntry
  facts: FactSet
}

export interface FieldScore {
  accuracy: number // 0..1
  n: number // races scored for this field
  correct: number
}

export interface Report {
  perField: Record<StableFactKey, FieldScore>
  coverage: number // 0..1, races with >=1 displayable fact
  calibration: Record<StableFactKey, number | 'insufficient'>
  races: number
}

function norm(v: string | null): string | null {
  if (v == null) return null
  return v.trim().toLowerCase().replace(/\s+/g, '')
}

function isCorrect(extracted: string | null, truth: string | null): boolean {
  return norm(extracted) === norm(truth)
}

// A fact is "displayable" when it would actually show publicly: a non-null value
// at high or medium confidence (KTD5/KTD7 display gate).
function isDisplayable(conf: Confidence, value: string | null): boolean {
  return value != null && (conf === 'high' || conf === 'medium')
}

export function score(graded: Graded[]): Report {
  const perField = {} as Record<StableFactKey, FieldScore>
  const calibration = {} as Record<StableFactKey, number | 'insufficient'>

  for (const key of STABLE_FACT_KEYS) {
    let correct = 0
    let highCorrect = 0
    let highCount = 0
    for (const g of graded) {
      const fact = g.facts[key]
      if (isCorrect(fact.value, g.entry.truth[key])) correct++
      if (fact.confidence === 'high') {
        highCount++
        if (isCorrect(fact.value, g.entry.truth[key])) highCorrect++
      }
    }
    const n = graded.length
    perField[key] = { accuracy: n ? correct / n : 0, n, correct }
    calibration[key] = highCount < MIN_CALIBRATION_SAMPLE ? 'insufficient' : highCorrect / highCount
  }

  // Coverage: races where start_time OR confirmed_status is displayable.
  let covered = 0
  for (const g of graded) {
    const st = g.facts.start_time
    const cs = g.facts.confirmed_status
    if (isDisplayable(st.confidence, st.value) || isDisplayable(cs.confidence, cs.value)) covered++
  }

  return {
    perField,
    coverage: graded.length ? covered / graded.length : 0,
    calibration,
    races: graded.length,
  }
}

export function formatReport(r: Report): string {
  const pct = (x: number) => `${(x * 100).toFixed(0)}%`
  const lines = [`Eval over ${r.races} races`, '']
  for (const key of STABLE_FACT_KEYS) {
    const f = r.perField[key]
    const cal = r.calibration[key]
    const calStr = cal === 'insufficient' ? 'insufficient data' : pct(cal)
    lines.push(`  ${key}: accuracy ${pct(f.accuracy)} (${f.correct}/${f.n})  |  high-conf calibration ${calStr}`)
  }
  lines.push('', `  coverage (start_time or confirmed displayable): ${pct(r.coverage)}`)
  return lines.join('\n')
}

// Run the extractor over every fixture and score. callModel is injectable for
// tests; the default hits the live API.
export async function runEval(entries: EvalEntry[], callModel?: ModelCaller): Promise<Report> {
  const graded: Graded[] = []
  for (const entry of entries) {
    const html = await Deno.readTextFile(entry.fixture)
    const pages = [{ url: entry.race_url, text: htmlToText(html) }]
    const { facts } = await extractFacts(pages, { callModel, sourceUrl: entry.race_url })
    graded.push({ entry, facts })
  }
  return score(graded)
}

if (import.meta.main) {
  const entries: EvalEntry[] = JSON.parse(await Deno.readTextFile('eval/eval-set.json'))
  const report = await runEval(entries) // live model
  console.log(formatReport(report))
}
