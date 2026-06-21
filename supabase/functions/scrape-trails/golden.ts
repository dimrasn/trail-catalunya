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
      .select('town, province, elevation_m')
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
  }

  return { passed: failures.length === 0, failures }
}
