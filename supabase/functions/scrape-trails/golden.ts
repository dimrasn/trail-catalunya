// Golden-row assertions: a handful of large, well-established Catalan ultras
// whose facts are stable year to year. After each scrape we confirm these rows
// still carry the expected town / province / elevation for a known distance.
// A failure here catches silent parser drift (e.g. columns scrambled) that the
// row-count sanity gate would pass.
//
// MAINTAINER: review this set against the live calendar each season. A race
// that legitimately changes its course (distance/D+) or drops off the calendar
// will trip a false alarm — update or remove its entry here when that happens.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

interface GoldenRace {
  race_name: string
  town: string
  province: string
  distance_km: number
  elevation_m: number
}

export const GOLDEN_RACES: GoldenRace[] = [
  { race_name: 'Pyrenees Stage Run', town: 'Ribes de Freser', province: 'GIRONA', distance_km: 240, elevation_m: 15000 },
  { race_name: 'Aran by UTMB', town: 'Vielha', province: 'LLEIDA', distance_km: 162, elevation_m: 10700 },
  { race_name: 'Ultra Pirineu', town: 'Bagà', province: 'BARCELONA', distance_km: 100, elevation_m: 6600 },
  { race_name: 'Cavalls del Vent', town: 'Refugi Lluis Estasen', province: 'BARCELONA', distance_km: 84.2, elevation_m: 5600 },
  { race_name: 'Rialp Matxicots', town: 'Rialp', province: 'LLEIDA', distance_km: 60, elevation_m: 4700 },
  { race_name: 'Trail del Bisaura', town: 'Sant Quirze de Besora', province: 'BARCELONA', distance_km: 56, elevation_m: 3800 },
  { race_name: 'UTSM Serra de Montsant', town: 'Ulldemolins', province: 'TARRAGONA', distance_km: 63, elevation_m: 3470 },
]

export async function runGoldenAssertions(
  supabase: SupabaseClient,
): Promise<{ passed: boolean; failures: string[] }> {
  const failures: string[] = []

  for (const g of GOLDEN_RACES) {
    const { data, error } = await supabase
      .from('races')
      .select('town, province, elevation_m, race_url')
      .eq('source', 'ultrescatalunya')
      .eq('race_name', g.race_name)
      .eq('distance_km', g.distance_km)
      .neq('status', 'REMOVED')

    if (error) {
      failures.push(`${g.race_name} ${g.distance_km}km: query error ${error.message}`)
      continue
    }
    if (!data || data.length === 0) {
      failures.push(`${g.race_name} ${g.distance_km}km: row missing`)
      continue
    }
    const row = data[0]
    if ((row.town || '').trim() !== g.town) {
      failures.push(`${g.race_name}: town '${row.town}' != '${g.town}'`)
    }
    if ((row.province || '').trim() !== g.province) {
      failures.push(`${g.race_name}: province '${row.province}' != '${g.province}'`)
    }
    if (Number(row.elevation_m) !== g.elevation_m) {
      failures.push(`${g.race_name}: elevation '${row.elevation_m}' != '${g.elevation_m}'`)
    }
    // race_url is not just a link — app/lib/races.js groups events by
    // `${race_url}::${town}`, so an EMPTY url does not merely lose a button, it
    // merges the race with every other link-less race in the same town: one
    // card, one slug, several races. The parser falls back to '' when the
    // aggregator lists no <a href> (parser.ts:306), so this is one bad upstream
    // row away from happening silently. Fail the scrape instead.
    if (!(row.race_url || '').trim()) {
      failures.push(`${g.race_name}: race_url is empty — events group by (race_url, town), so this would MERGE races`)
    }
  }

  // Catalogue-wide, not just the golden rows: any empty race_url is an identity
  // hazard, and the golden set is seven races out of hundreds.
  const { count: urllessCount, error: urllessError } = await supabase
    .from('races')
    .select('race_hash', { count: 'exact', head: true })
    .eq('source', 'ultrescatalunya')
    .neq('status', 'REMOVED')
    .or('race_url.is.null,race_url.eq.')
  if (urllessError) {
    failures.push(`race_url sweep: query error ${urllessError.message}`)
  } else if ((urllessCount ?? 0) > 0) {
    failures.push(
      `${urllessCount} active row(s) have an empty race_url — these MERGE into one ` +
      `event per town (app/lib/races.js groups by race_url::town). Fix upstream or ` +
      `give them a synthetic stable key before publishing.`,
    )
  }

  return { passed: failures.length === 0, failures }
}
