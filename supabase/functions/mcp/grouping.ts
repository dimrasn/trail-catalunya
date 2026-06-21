// Deno port of the event-grouping logic in app/lib/races.js. One DB row =
// one race × one distance; this collapses rows into events (one event =
// one race, multiple distance entries) keyed by (race_url, town).
//
// Kept behaviour-identical to the Next.js version on purpose; a cross-check
// test (grouping_test.ts) asserts the two produce the same event ids/counts.
// The shared-core refactor that would unify them is deferred (see plan).

export interface RaceRow {
  race_name?: string
  race_url?: string
  town?: string
  province?: string
  distance_km?: number | string | null
  elevation_m?: number | string | null
  price?: string | null
  date?: string | null
  date_display?: string | null
  status?: string
}

export interface Distance {
  km: number
  elevationGain?: number
  price?: number
  variantName?: string
}

export interface RaceEvent {
  id: string
  name: string
  url: string
  date: string | null
  dateEnd?: string
  town: string
  province: string
  status: string
  distances: Distance[]
  soldOut?: boolean
  kidsRun?: boolean
}

const KIDS_KEYWORDS = [
  'cadet', 'juvenil', 'junior', 'jove', 'nens', 'mini',
  'infant', 'kids', 'escolar', 'benjamí', 'aleví', 'prebenjamí',
]

function isKidsName(name: string): boolean {
  const lower = name.toLowerCase()
  return KIDS_KEYWORDS.some((k) => lower.includes(k))
}

function slugify(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseDateEnd(dateDisplay: string, dateIso: string): string | null {
  if (!dateDisplay || !dateIso) return null
  const s = dateDisplay.trim()
  let m = s.match(/^(\d{1,2})\/(\d{1,2})-(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const [, , , d2, mo2, y] = m
    return `${y}-${String(parseInt(mo2)).padStart(2, '0')}-${String(parseInt(d2)).padStart(2, '0')}`
  }
  m = s.match(/^(\d{1,2})-(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const [, , d2, mo, y] = m
    return `${y}-${String(parseInt(mo)).padStart(2, '0')}-${String(parseInt(d2)).padStart(2, '0')}`
  }
  return null
}

function parsePrice(priceStr: string | null | undefined): number | null {
  if (!priceStr || !priceStr.trim()) return null
  const s = priceStr.trim().toUpperCase()
  if (s.includes('ESGOTADES') || s.includes('SOLD OUT') || s.includes('ESGOTAT')) return null
  const cleaned = priceStr.replace(/[€\s]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? null : n
}

export function groupRowsIntoEvents(rows: RaceRow[]): RaceEvent[] {
  const groups = new Map<string, RaceRow[]>()
  const order: string[] = []

  for (const row of rows) {
    const url = (row.race_url || '').trim()
    const town = (row.town || '').trim()
    const key = `${url}::${town}`
    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key)!.push(row)
  }

  const seenIds = new Map<string, string>()
  const events: RaceEvent[] = []

  for (const key of order) {
    const groupRows = groups.get(key)!
    const mainRows = groupRows.filter((r) => !isKidsName(r.race_name || ''))
    const eventName = ((mainRows[0] || groupRows[0]).race_name || '').trim()
    const province = ((mainRows[0] || groupRows[0]).province || '').trim()
    const url = (groupRows[0].race_url || '').trim()
    const town = (groupRows[0].town || '').trim()

    let dateIso: string | null = null
    let dateEndIso: string | null = null
    for (const r of groupRows) {
      if (r.date) {
        dateIso = r.date
        dateEndIso = parseDateEnd(r.date_display || '', r.date)
        break
      }
    }

    let soldOut = false
    let kidsRun = false
    const distances: Distance[] = []

    for (const r of groupRows) {
      const rowName = (r.race_name || '').trim()
      if (isKidsName(rowName)) kidsRun = true
      if (r.distance_km == null || r.distance_km === '') continue

      const km = typeof r.distance_km === 'string' ? parseFloat(r.distance_km) : r.distance_km
      if (Number.isNaN(km)) continue

      const elevRaw = r.elevation_m
      const elev = elevRaw == null || elevRaw === ''
        ? null
        : (typeof elevRaw === 'string' ? parseInt(elevRaw) : elevRaw)

      const price = parsePrice(r.price)
      if (r.status === 'SOLD_OUT' || (r.price && r.price.toUpperCase().includes('ESGOTADES'))) {
        soldOut = true
      }

      const dist: Distance = { km }
      if (elev != null && !Number.isNaN(elev)) dist.elevationGain = elev
      if (price != null) dist.price = price
      if (rowName && rowName !== eventName) dist.variantName = rowName
      distances.push(dist)
    }

    distances.sort((a, b) => b.km - a.km)

    let id = slugify(eventName)
    if (seenIds.has(id) && seenIds.get(id) !== town) {
      id = `${id}-${slugify(town)}`
    }
    seenIds.set(id, town)

    const event: RaceEvent = {
      id,
      name: eventName,
      url,
      date: dateIso,
      town,
      province,
      status: groupRows[0].status || '',
      distances,
    }
    if (dateEndIso) event.dateEnd = dateEndIso
    if (soldOut) event.soldOut = true
    if (kidsRun) event.kidsRun = true
    events.push(event)
  }

  events.sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date)
    if (a.date) return -1
    if (b.date) return 1
    return a.name.localeCompare(b.name)
  })

  return events
}
