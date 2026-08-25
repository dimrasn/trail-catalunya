// Regression tripwire for the search_races public schema (Codex review
// 2026-08-25, P1-2): a bad merge once kept the tool DESCRIPTION advertising
// province/dist_ranges/elev_ranges while the inputSchema silently dropped
// them — schema-driven clients lost capabilities the handler still supported.
//
// tools.ts imports the supabase client, and importing it here would hit the
// known local `deno check` failure on npm:@supabase/realtime-js (AGENTS.md).
// So this test asserts against the SOURCE TEXT of the schema block instead —
// crude, but it catches exactly the failure mode that occurred.
import { assert } from 'jsr:@std/assert@1'

const src = await Deno.readTextFile(new URL('./tools.ts', import.meta.url))

function toolBlock(name: string, nextName?: string): string {
  const start = src.indexOf(`name: '${name}'`)
  const end = nextName ? src.indexOf(`name: '${nextName}'`) : src.length
  assert(start !== -1 && end > start, `could not locate tool block for ${name}`)
  return src.slice(start, end)
}

Deno.test('search_races inputSchema declares every filter the handler reads', () => {
  const block = toolBlock('search_races', 'get_race')
  const schema = block.slice(block.indexOf('inputSchema'), block.indexOf('handler:'))
  for (
    const prop of [
      'query', 'drive_min', 'drive_max', 'dist_min', 'dist_max', 'elev_min', 'elev_max',
      'dist_ranges', 'elev_ranges', 'province', 'month', 'kids_run', 'date_from', 'date_to', 'limit',
    ]
  ) {
    assert(schema.includes(`${prop}:`), `search_races inputSchema is missing "${prop}"`)
  }
})

Deno.test('whats_on inputSchema declares its multi-value filters', () => {
  const block = toolBlock('whats_on') // last tool in the file
  const schema = block.slice(block.indexOf('inputSchema'), block.indexOf('handler:'))
  for (const prop of ['dist_ranges', 'elev_ranges', 'province', 'drive_min', 'drive_max']) {
    assert(schema.includes(`${prop}:`), `whats_on inputSchema is missing "${prop}"`)
  }
})
