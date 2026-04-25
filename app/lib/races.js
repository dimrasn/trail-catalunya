// Server-side data layer: fetch races from Supabase at build time,
// collapse one-row-per-distance into one-event-per-card with a
// `distances[]` array (matching the existing UI shape), and join
// drive times from the JSON cache.
//
// This module is imported by app/page.js. With Next.js's default
// caching for fetch and the `revalidate` export below, the page is
// statically generated at build time. The Vercel deploy hook (fired
// by the Edge Function after a scrape) re-runs the build, so users
// always see data within a few minutes of the latest scrape.

import { createClient } from '@supabase/supabase-js'
import driveTimes from '@/data/towns-drive-times.json'
import townsGeocoded from '@/data/towns-geocoded.json'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const KIDS_KEYWORDS = [
  'cadet', 'juvenil', 'junior', 'jove', 'nens', 'mini',
  'infant', 'kids', 'escolar', 'benjamí', 'aleví', 'prebenjamí',
]

function isKidsName(name) {
  const lower = name.toLowerCase()
  return KIDS_KEYWORDS.some(k => lower.includes(k))
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Parse the multi-day end date from a date_display string like
// "11-12/04/2026" or "29/8-05/09/2026". Returns YYYY-MM-DD or null.
function parseDateEnd(dateDisplay, dateIso) {
  if (!dateDisplay || !dateIso) return null
  const s = dateDisplay.trim()
  const year = dateIso.slice(0, 4)

  // Cross-month: "29/8-05/09/2026"
  let m = s.match(/^(\d{1,2})\/(\d{1,2})-(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const [, , , d2, mo2, y] = m
    return `${y}-${String(parseInt(mo2)).padStart(2, '0')}-${String(parseInt(d2)).padStart(2, '0')}`
  }

  // Same-month: "11-12/04/2026"
  m = s.match(/^(\d{1,2})-(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const [, , d2, mo, y] = m
    return `${y}-${String(parseInt(mo)).padStart(2, '0')}-${String(parseInt(d2)).padStart(2, '0')}`
  }

  return null
}

// Parse a price text like "23€", "ESGOTADES", "" into a number or null.
function parsePrice(priceStr) {
  if (!priceStr || !priceStr.trim()) return null
  const s = priceStr.trim().toUpperCase()
  if (s.includes('ESGOTADES') || s.includes('SOLD OUT') || s.includes('ESGOTAT')) return null
  const cleaned = priceStr.replace(/[€\s]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? null : n
}

// Group DB rows (one row = one race × one distance) into events
// (one event = one race; multiple distances inside).
//
// Grouping key: (race_url, town) — same as parse-csv.py used to do for
// the static races.json. Two distances of "Volta a Peramola" in Peramola
// with the same URL collapse into a single card with multiple chips.
function groupRowsIntoEvents(rows) {
  const groups = new Map()
  const order = []

  for (const row of rows) {
    const url = (row.race_url || '').trim()
    const town = (row.town || '').trim()
    const key = `${url}::${town}`
    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key).push(row)
  }

  const seenIds = new Map()
  const events = []

  for (const key of order) {
    const groupRows = groups.get(key)

    // Pick the canonical event name: first non-kids row, else first row.
    const mainRows = groupRows.filter(r => !isKidsName(r.race_name || ''))
    const eventName = ((mainRows[0] || groupRows[0]).race_name || '').trim()
    const province = ((mainRows[0] || groupRows[0]).province || '').trim()
    const url = (groupRows[0].race_url || '').trim()
    const town = (groupRows[0].town || '').trim()

    // Pick the first non-null date for the event-level date.
    let dateIso = null
    let dateEndIso = null
    let dateDisplay = null
    for (const r of groupRows) {
      if (r.date) {
        dateIso = r.date
        dateDisplay = r.date_display
        dateEndIso = parseDateEnd(r.date_display || '', r.date)
        break
      }
    }

    // Detect status flags.
    let soldOut = false
    let kidsRun = false

    // Build the distances[] array.
    const distances = []
    for (const r of groupRows) {
      const rowName = (r.race_name || '').trim()
      if (isKidsName(rowName)) kidsRun = true

      if (r.distance_km == null || r.distance_km === '') continue

      // Supabase numerics come back as strings — normalize to numbers.
      const km = typeof r.distance_km === 'string' ? parseFloat(r.distance_km) : r.distance_km
      if (Number.isNaN(km)) continue

      const elev =
        r.elevation_m == null || r.elevation_m === ''
          ? null
          : (typeof r.elevation_m === 'string' ? parseInt(r.elevation_m) : r.elevation_m)

      const price = parsePrice(r.price)
      if (r.status === 'SOLD_OUT' || (r.price && r.price.toUpperCase().includes('ESGOTADES'))) {
        soldOut = true
      }

      const dist = { km }
      if (elev != null && !Number.isNaN(elev)) dist.elevationGain = elev
      if (price != null) dist.price = price
      if (rowName && rowName !== eventName) dist.variantName = rowName

      distances.push(dist)
    }

    // Sort distances longest first.
    distances.sort((a, b) => b.km - a.km)

    // Generate stable id (same scheme as parse-csv.py).
    let id = slugify(eventName)
    if (seenIds.has(id) && seenIds.get(id) !== town) {
      id = `${id}-${slugify(town)}`
    }
    seenIds.set(id, town)

    // Drive time and lat/lng from the JSON caches.
    const driveMinutes = driveTimes[town] ?? null
    const geo = townsGeocoded[town] || null

    const event = {
      id,
      name: eventName,
      url,
      date: dateIso,
      town,
      province,
      status: groupRows[0].status,
      distances,
    }
    if (dateEndIso) event.dateEnd = dateEndIso
    if (driveMinutes != null) event.driveMinutes = driveMinutes
    if (geo) {
      event.lat = geo.lat
      event.lng = geo.lng
    }
    if (soldOut) event.soldOut = true
    if (kidsRun) event.kidsRun = true

    events.push(event)
  }

  // Sort: dated events first (chronologically), TBD at the end.
  events.sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date)
    if (a.date) return -1
    if (b.date) return 1
    return a.name.localeCompare(b.name)
  })

  return events
}

export async function getRaces() {
  // Fail loud during build if env vars aren't set, rather than silently
  // shipping an empty page.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for the build',
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })

  // Pull every active row in one shot. ~700 rows is fine to fetch at
  // build time. Skip status=REMOVED — those are deletions we shouldn't
  // surface anymore.
  const { data, error } = await supabase
    .from('races')
    .select('*')
    .eq('source', 'ultrescatalunya')
    .neq('status', 'REMOVED')

  if (error) throw new Error(`Supabase fetch failed: ${error.message}`)

  return groupRowsIntoEvents(data || [])
}

// Get the timestamp of the most recent successful scrape, used in the
// footer's "Last updated" label so users can see how fresh the data is.
export async function getLastUpdated() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })

  const { data } = await supabase
    .from('scrape_runs')
    .select('run_at')
    .eq('source', 'ultrescatalunya')
    .eq('status', 'success')
    .order('run_at', { ascending: false })
    .limit(1)

  return data?.[0]?.run_at || null
}
