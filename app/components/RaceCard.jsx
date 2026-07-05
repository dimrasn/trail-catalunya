const PROVINCE_COLOR = {
  BARCELONA: '#2563eb',
  GIRONA: '#059669',
  TARRAGONA: '#dc2626',
  LLEIDA: '#d97706',
}

const PROVINCE_SHORT = {
  BARCELONA: 'BCN',
  GIRONA: 'GIR',
  TARRAGONA: 'TAR',
  LLEIDA: 'LLE',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseDateParts(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { y, m, d }
}

function formatDate(dateStr) {
  const { y, m, d } = parseDateParts(dateStr)
  const date = new Date(y, m - 1, d)
  const weekday = WEEKDAYS[date.getDay()]
  const day = String(d).padStart(2, '0')
  const month = MONTHS_SHORT[m - 1]
  return `${weekday} ${day} ${month}`
}

function formatDateRange(dateStr, dateEndStr) {
  const { y, m, d } = parseDateParts(dateStr)
  const start = new Date(y, m - 1, d)
  const weekdayStart = WEEKDAYS[start.getDay()]
  const dayStart = String(d).padStart(2, '0')

  const { d: dEnd, m: mEnd } = parseDateParts(dateEndStr)
  const end = new Date(y, mEnd - 1, dEnd)
  const weekdayEnd = WEEKDAYS[end.getDay()]
  const dayEnd = String(dEnd).padStart(2, '0')

  const monthStr = MONTHS_SHORT[m - 1]
  if (m === mEnd) {
    return `${weekdayStart} ${dayStart}–${weekdayEnd} ${dayEnd} ${monthStr}`
  }
  return `${weekdayStart} ${dayStart} ${MONTHS_SHORT[m - 1]}–${weekdayEnd} ${dayEnd} ${MONTHS_SHORT[mEnd - 1]}`
}

function formatDrive(minutes) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function driveColor(minutes) {
  if (minutes <= 60) return '#4ade80'
  if (minutes <= 120) return '#fbbf24'
  return '#888888'
}

function DistanceChip({ dist }) {
  const hasElev = dist.elevationGain != null
  let label = `${dist.km % 1 === 0 ? dist.km : dist.km}km`
  if (hasElev) label += ` ↑${dist.elevationGain}m`
  if (dist.price) label += ` · ${dist.price}€`
  if (dist.variantName) label += ` (${dist.variantName})`

  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      backgroundColor: '#12122a',
      color: '#cccccc',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function ElevTBDBadge() {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      backgroundColor: '#3b2f6e',
      color: '#a78bfa',
      whiteSpace: 'nowrap',
    }}>
      ELEV. TBD
    </span>
  )
}

function formatChecked(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]}`
}

// Enriched stable facts (Phase 2a): start time + confirmed/cancelled + price.
// High-blast facts carry a "checked DD Mon" note and the card links out for
// verification; a fact past its staleness ceiling shows "check site" instead.
function EnrichmentRow({ enrichment }) {
  const chips = []
  const st = enrichment.start_time
  if (st) {
    chips.push(
      st.stale
        ? { key: 'st', text: '◷ start — check site', color: '#888' }
        : { key: 'st', text: `◷ ${st.value}${st.likelyPrevious ? ' (likely, prev.)' : ''}`, color: '#cbd5e1', checked: formatChecked(st.lastChecked) },
    )
  }
  const cs = enrichment.confirmed_status
  if (cs && !cs.stale) {
    if (cs.value === 'cancelled') chips.push({ key: 'cs', text: 'CANCELLED', color: '#fff', bg: '#dc2626' })
    else if (cs.value === 'confirmed') chips.push({ key: 'cs', text: '✓ confirmed', color: '#34d399', checked: formatChecked(cs.lastChecked) })
  } else if (cs && cs.stale) {
    chips.push({ key: 'cs', text: 'status — check site', color: '#888' })
  }
  const pr = enrichment.price
  if (pr) chips.push({ key: 'pr', text: `${pr.value}${pr.likelyPrevious ? ' (likely, prev.)' : ''}`, color: '#cbd5e1' })

  if (chips.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
      {chips.map(c => (
        <span key={c.key} style={{
          display: 'inline-flex', alignItems: 'baseline', gap: '5px',
          fontSize: '12px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          padding: c.bg ? '2px 6px' : '0',
          borderRadius: c.bg ? '3px' : '0',
          backgroundColor: c.bg || 'transparent',
          color: c.color,
          fontWeight: c.bg ? '700' : '400',
        }}>
          {c.text}
          {c.checked && <span style={{ fontSize: '10px', color: '#5b6472' }}>· checked {c.checked}</span>}
        </span>
      ))}
    </div>
  )
}

export default function RaceCard({ race }) {
  const provinceColor = PROVINCE_COLOR[race.province] || '#555'
  const provinceShort = PROVINCE_SHORT[race.province] || race.province.slice(0, 3)

  const hasAnyElev = race.distances.some(d => d.elevationGain != null)
  const showElevTBD = race.distances.length > 0 && !hasAnyElev
  const someDistsMissingElev = race.distances.length > 0 && hasAnyElev && race.distances.some(d => d.elevationGain == null)

  let dateDisplay = null
  if (race.date) {
    dateDisplay = race.dateEnd ? formatDateRange(race.date, race.dateEnd) : formatDate(race.date)
  }

  return (
    <a
      href={race.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        padding: '14px 16px',
        borderBottom: '1px solid #1a1a2e',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0d0d1f'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {/* Row 1: Name + Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', lineHeight: '1.3' }}>
            {race.name}
          </span>
          {race.soldOut && (
            <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#dc2626', color: '#fff', fontWeight: '700', flexShrink: 0 }}>
              SOLD OUT
            </span>
          )}
          {race.kidsRun && (
            <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#064e3b', color: '#34d399', fontWeight: '700', flexShrink: 0 }}>
              KIDS RUN
            </span>
          )}
        </div>
        <span style={{ fontSize: '13px', color: '#888', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', flexShrink: 0 }}>
          {dateDisplay || <span style={{ color: '#a78bfa' }}>DATE TBD</span>}
        </span>
      </div>

      {/* Row 2: Town + Province + Drive */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: '#888' }}>{race.town}</span>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            padding: '1px 5px',
            borderRadius: '3px',
            backgroundColor: provinceColor + '33',
            color: provinceColor,
            letterSpacing: '0.03em',
          }}>
            {provinceShort}
          </span>
        </div>
        {race.driveMinutes != null ? (
          <span style={{
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: driveColor(race.driveMinutes),
          }}>
            {formatDrive(race.driveMinutes)} drive
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: '#666' }}>drive TBD</span>
        )}
      </div>

      {/* Enriched stable facts (Phase 2a) */}
      {race.enrichment && <EnrichmentRow enrichment={race.enrichment} />}

      {/* Row 3: Distance chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {race.distances.length === 0 ? (
          <span style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>Various distances — check website</span>
        ) : (
          <>
            {race.distances.map((dist, i) => (
              <DistanceChip key={i} dist={dist} />
            ))}
            {(showElevTBD || someDistsMissingElev) && <ElevTBDBadge />}
          </>
        )}
      </div>
    </a>
  )
}
