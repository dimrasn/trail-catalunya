// Cost model for the enrichment cap (R11, KTD3). Pure + testable, separate from
// index.ts so importing it doesn't start the Deno.serve handler.
//
// PROVISIONAL — validate the per-token rates and the cap against the claude-api
// reference before trusting the cap. micros are millionths of a EUR.

export const MONTHLY_CAP_MICROS = 5_000_000 // ≈ €5 / month
export const INPUT_MICROS_PER_TOKEN = 1 // ≈ €1 / 1M input tokens
export const OUTPUT_MICROS_PER_TOKEN = 5 // ≈ €5 / 1M output tokens

export function estimateCostMicros(usage: { input_tokens: number; output_tokens: number }): number {
  return usage.input_tokens * INPUT_MICROS_PER_TOKEN + usage.output_tokens * OUTPUT_MICROS_PER_TOKEN
}

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function overCap(spentMicros: number, cap: number = MONTHLY_CAP_MICROS): boolean {
  return spentMicros >= cap
}
