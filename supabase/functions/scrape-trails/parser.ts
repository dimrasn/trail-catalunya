// Pure parser — no I/O, no DB. Imported by both the function handler and
// tests. Ported from /scrape_trails.py. Keep the two in sync.

import { DOMParser, Element } from 'jsr:@b-fuze/deno-dom@0.1.48'
import { crypto } from 'jsr:@std/crypto@1'

export const CALENDAR_URL = 'https://ultrescatalunya.com/calendari-trail-catalunya-2026'

// Catalan month name → month number
const MONTH_MAP: Record<string, number> = {
  gener: 1, febrer: 2, 'març': 3, abril: 4,
  maig: 5, juny: 6, juliol: 7, agost: 8,
  setembre: 9, octubre: 10, novembre: 11, desembre: 12,
}

// Default column positions if header row is missing or unreadable.
const DEFAULT_COL_INDEX = {
  date: 0,
  name: 1,
  dist_elev: 2,
  price: 3,
  town: 4,
  province: 5,
}

const HEADER_ALIASES: Record<keyof typeof DEFAULT_COL_INDEX, string[]> = {
  date: ['DATA'],
  name: ['CURSA', 'NOM', 'RACE'],
  dist_elev: ['DISTANCIA', 'DISTANCIA-DESNIVELL', 'DISTANCIA DESNIVELL', 'KM'],
  price: ['PREU', 'PRICE'],
  town: ['POBLACIO', 'POBLACIÓ', 'TOWN'],
  province: ['PROVINCIA', 'PROVÍNCIA', 'PROVINCE'],
}

export interface Race {
  race_hash: string
  source: string
  month: string
  month_num: number
  year: number
  date: string | null
  date_display: string
  race_name: string
  race_url: string
  distance_km: number | null
  elevation_m: number | null
  distance_elevation_raw: string
  price: string
  town: string
  province: string
  status: 'ACTIVA' | 'SUSPESA' | 'SOLD_OUT'
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function stripAccents(s: string): string {
  const map: Record<string, string> = {
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Ö': 'O',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
    'Ç': 'C', 'Ñ': 'N',
  }
  return s.replace(/[ÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜÇÑ]/g, (c) => map[c] || c)
}

function extractMonthYear(headerText: string): [string, number, number] | null {
  const text = headerText.trim().toUpperCase()
  for (const [catName, num] of Object.entries(MONTH_MAP)) {
    if (text.includes(catName.toUpperCase())) {
      const yearMatch = text.match(/20\d{2}/)
      const year = yearMatch ? parseInt(yearMatch[0]) : 2026
      // Capitalize first letter
      const monthName = catName.charAt(0).toUpperCase() + catName.slice(1)
      return [monthName, num, year]
    }
  }
  return null
}

function isRecomanades(headerText: string): boolean {
  const upper = headerText.toUpperCase()
  return upper.includes('RECOMAN') || headerText.includes('⭐')
}

// Returns [distance_km_number, elevation_m_number, raw_cleaned, distance_str].
// The distance_str matches Python's compute_race_hash input: strip periods
// (thousands separators), convert comma to dot. Whole numbers stay integer
// strings ("25"), fractions use dots ("17.3"). This matters for hash parity.
function parseDistanceElevation(
  raw: string,
): [number | null, number | null, string, string | null] {
  if (!raw || !raw.trim()) return [null, null, '', null]
  const trimmed = raw.trim()

  const distMatch = trimmed.match(/([\d,.]+)\s*km/i)
  let distanceKm: number | null = null
  let distanceStr: string | null = null
  if (distMatch) {
    // Match Python: .replace(".", "").replace(",", ".")
    distanceStr = distMatch[1].replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(distanceStr)
    if (!isNaN(parsed)) distanceKm = parsed
  }

  const elevMatch = trimmed.match(/D?\+\s*([\d,.]+)\s*m/i)
  let elevationM: number | null = null
  if (elevMatch) {
    const cleaned = elevMatch[1].replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    if (!isNaN(parsed)) elevationM = parsed
  }

  return [distanceKm, elevationM, trimmed, distanceStr]
}

function parseDateField(raw: string): { iso: string | null; display: string } {
  if (!raw || !raw.trim()) return { iso: null, display: 'TBD' }
  const trimmed = raw.trim()

  if (trimmed.toUpperCase() === 'SUSPESA') {
    return { iso: null, display: 'SUSPESA' }
  }

  // Cross-month multi-day: '29/8-05/09/2026' — match BEFORE same-month to
  // avoid the simpler pattern swallowing it.
  const crossMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})[-–]\d{1,2}\/(\d{1,2})\/(\d{4})/)
  if (crossMatch) {
    const day = parseInt(crossMatch[1])
    const month = parseInt(crossMatch[2])
    const year = parseInt(crossMatch[4])
    const iso = formatISO(year, month, day)
    return { iso, display: trimmed }
  }

  // Same-month multi-day: '11-12/04/2026'
  const multiMatch = trimmed.match(/^(\d{1,2})[-–]\d{1,2}\/(\d{1,2})\/(\d{4})/)
  if (multiMatch) {
    const day = parseInt(multiMatch[1])
    const month = parseInt(multiMatch[2])
    const year = parseInt(multiMatch[3])
    const iso = formatISO(year, month, day)
    return { iso, display: trimmed }
  }

  // Single day: '11/04/2026'
  const dateMatch = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dateMatch) {
    const day = parseInt(dateMatch[1])
    const month = parseInt(dateMatch[2])
    const year = parseInt(dateMatch[3])
    const iso = formatISO(year, month, day)
    return { iso, display: trimmed }
  }

  return { iso: null, display: trimmed }
}

function formatISO(year: number, month: number, day: number): string | null {
  // Validate the date exists (e.g., reject 31/02).
  const d = new Date(Date.UTC(year, month - 1, day))
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null
  }
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

async function md5Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s)
  const digest = await crypto.subtle.digest('MD5', buf)
  const bytes = new Uint8Array(digest)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function computeRaceHash(race: {
  race_name: string
  distance_km_str: string | null
  town: string
  month: string
}): Promise<string> {
  // Match Python: key = f"{race_name}|{distance_km}|{town}|{month}"
  // Python's parse_distance_elevation produces a STRING for distance_km
  // (e.g. "25", "17.3"), so we use the same string form here. None → "None".
  const distStr = race.distance_km_str == null ? 'None' : race.distance_km_str
  const key = `${race.race_name}|${distStr}|${race.town}|${race.month}`
  const full = await md5Hex(key)
  return full.slice(0, 12)
}

function resolveColumnIndices(headerCells: Element[]): typeof DEFAULT_COL_INDEX {
  const indices = { ...DEFAULT_COL_INDEX }
  if (headerCells.length === 0) return indices

  headerCells.forEach((cell, i) => {
    const text = stripAccents(cell.textContent?.trim().toUpperCase() || '')
    if (!text) return
    for (const [logical, aliases] of Object.entries(HEADER_ALIASES)) {
      for (const alias of aliases) {
        if (text.includes(alias)) {
          ;(indices as any)[logical] = i
          break
        }
      }
    }
  })
  return indices
}

// ── Main parser ─────────────────────────────────────────────────────────────

export async function parseCalendar(html: string): Promise<Race[]> {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  if (!doc) throw new Error('Failed to parse HTML')

  const races: Race[] = []

  // Find content area — fall back to the document if specific containers
  // aren't present.
  const content =
    doc.querySelector('div.entry-content') ||
    doc.querySelector('article') ||
    doc.documentElement ||
    doc

  // Walk the tree in document order, tracking month context.
  let currentMonth: string | null = null
  let currentMonthNum: number | null = null
  let currentYear: number | null = null
  let skipNextTable = false

  // We emulate Python's `content.descendants` — depth-first in document order.
  const walker = walkDescendants(content as Element)
  for (const el of walker) {
    const tag = el.tagName?.toLowerCase()

    if (tag === 'h3' || tag === 'h2' || tag === 'h4' || tag === 'p') {
      const text = el.textContent?.trim() || ''
      const monthInfo = extractMonthYear(text)
      if (monthInfo) {
        if (isRecomanades(text)) {
          skipNextTable = true
        } else {
          currentMonth = monthInfo[0]
          currentMonthNum = monthInfo[1]
          currentYear = monthInfo[2]
          skipNextTable = false
        }
      }
    } else if (tag === 'table') {
      if (skipNextTable) {
        skipNextTable = false
        continue
      }
      if (!currentMonth || currentMonthNum == null || currentYear == null) continue

      const rows = Array.from(el.querySelectorAll('tr')) as Element[]
      if (rows.length === 0) continue

      // Detect header row.
      const firstRowCells = Array.from(rows[0].querySelectorAll('th, td')) as Element[]
      const hasTh = firstRowCells.some((c) => c.tagName.toLowerCase() === 'th')
      const firstRowText = firstRowCells
        .map((c) => c.textContent?.trim().toUpperCase() || '')
        .join('')
      const looksLikeHeader =
        hasTh || (firstRowText.includes('DATA') && firstRowText.includes('CURSA'))

      let colIdx: typeof DEFAULT_COL_INDEX
      let dataRows: Element[]
      if (looksLikeHeader) {
        colIdx = resolveColumnIndices(firstRowCells)
        dataRows = rows.slice(1)
      } else {
        colIdx = { ...DEFAULT_COL_INDEX }
        dataRows = rows
      }

      for (const row of dataRows) {
        const cells = Array.from(row.querySelectorAll('td')) as Element[]
        if (cells.length < 5) continue

        const cellText = (idx: number): string =>
          idx < cells.length ? (cells[idx].textContent?.trim() || '') : ''

        const dateRaw = cellText(colIdx.date)
        const nameCell = colIdx.name < cells.length ? cells[colIdx.name] : null
        const distRaw = cellText(colIdx.dist_elev)
        const price = cellText(colIdx.price)
        const town = cellText(colIdx.town)
        const province = cellText(colIdx.province)

        if (!nameCell) continue

        // Race name: collapse whitespace. Python does .get_text(separator=" ")
        // then splits/joins — deno_dom's textContent already merges text so
        // we just normalize runs of whitespace.
        const raceName = (nameCell.textContent || '').replace(/\s+/g, ' ').trim()
        const link = nameCell.querySelector('a')
        const raceUrl = link?.getAttribute('href') || ''

        const { iso: isoDate, display: displayDate } = parseDateField(dateRaw)

        // Status resolution (matches Python, plus SOLD_OUT addition).
        let status: Race['status']
        if (displayDate === 'SUSPESA' || dateRaw.toUpperCase().includes('SUSPESA')) {
          status = 'SUSPESA'
        } else if (
          price.toUpperCase().includes('ESGOTADES') ||
          price.toUpperCase().includes('ESGOTAT')
        ) {
          status = 'SOLD_OUT'
        } else {
          status = 'ACTIVA'
        }

        const [distanceKm, elevationM, distRawClean, distanceStr] =
          parseDistanceElevation(distRaw)

        const race: Race = {
          race_hash: '', // computed below
          source: 'ultrescatalunya',
          month: `${currentMonth} ${currentYear}`,
          month_num: currentMonthNum,
          year: currentYear,
          date: isoDate,
          date_display: displayDate,
          race_name: raceName,
          race_url: raceUrl,
          distance_km: distanceKm,
          elevation_m: elevationM,
          distance_elevation_raw: distRawClean || distRaw,
          price,
          town,
          province: province ? province.toUpperCase() : '',
          status,
        }

        race.race_hash = await computeRaceHash({
          race_name: race.race_name,
          distance_km_str: distanceStr,
          town: race.town,
          month: race.month,
        })
        races.push(race)
      }
    }
  }

  return races
}

// Depth-first walk of an element's descendants in document order.
function* walkDescendants(root: Element): Generator<Element> {
  for (const child of Array.from(root.children) as Element[]) {
    yield child
    yield* walkDescendants(child)
  }
}
