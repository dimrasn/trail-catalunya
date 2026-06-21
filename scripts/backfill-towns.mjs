// One-off, idempotent backfill of public.towns from the committed JSON caches.
//
// Union of data/towns-drive-times.json (~347 keys) and
// data/towns-geocoded.json (~113 keys, a subset). Rows without a geocode are
// inserted with null lat/lng — their drive_minutes is still needed. province
// is sourced from the races table (most common province per town), since
// neither JSON file carries it.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-towns.mjs
//
// Re-running is safe: upsert on name leaves counts and values unchanged when
// the source data hasn't moved.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}
const supabase = createClient(url, key, { auth: { persistSession: false } })

const driveTimes = JSON.parse(readFileSync('data/towns-drive-times.json', 'utf8'))
const geocoded = JSON.parse(readFileSync('data/towns-geocoded.json', 'utf8'))

// town -> province, taking the most common province across race rows.
async function buildProvinceMap() {
  const { data, error } = await supabase
    .from('races')
    .select('town, province')
    .neq('status', 'REMOVED')
  if (error) throw new Error(`fetch races: ${error.message}`)

  const counts = new Map() // town -> Map(province -> n)
  for (const r of data || []) {
    const town = (r.town || '').trim()
    const prov = (r.province || '').trim()
    if (!town || !prov) continue
    if (!counts.has(town)) counts.set(town, new Map())
    const m = counts.get(town)
    m.set(prov, (m.get(prov) || 0) + 1)
  }
  const province = new Map()
  for (const [town, m] of counts) {
    province.set(town, [...m.entries()].sort((a, b) => b[1] - a[1])[0][0])
  }
  return province
}

const provinceByTown = await buildProvinceMap()

const names = new Set([...Object.keys(driveTimes), ...Object.keys(geocoded)])
const rows = [...names].map((name) => {
  const geo = geocoded[name] || null
  const dm = driveTimes[name]
  return {
    name,
    province: provinceByTown.get(name) ?? null,
    lat: geo ? geo.lat : null,
    lng: geo ? geo.lng : null,
    drive_minutes_from_barcelona: dm ?? null,
    updated_at: new Date().toISOString(),
  }
})

const BATCH = 200
let upserted = 0
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH)
  const { error } = await supabase.from('towns').upsert(batch, { onConflict: 'name' })
  if (error) throw new Error(`upsert batch ${i}: ${error.message}`)
  upserted += batch.length
}

const withGeo = rows.filter((r) => r.lat != null).length
const withProv = rows.filter((r) => r.province != null).length
console.log(`Upserted ${upserted} towns (${withGeo} with lat/lng, ${withProv} with province).`)
