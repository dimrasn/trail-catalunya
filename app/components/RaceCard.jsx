import { PROVINCE_TITLE, MONTHS_SHORT, WEEKDAYS, formatDrive, kmEffort, eventKmEffort, difficultyLevel, maxElevation } from '../lib/format.js'
import { driveBand, DRIVE_INK, enumerateDistances, verdictFor, difficultyToken } from '../lib/semantics.js'

function parseDateParts(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { y, m, d }
}

function formatDate(dateStr) {
  const { y, m, d } = parseDateParts(dateStr)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS[date.getDay()]} ${String(d).padStart(2, '0')} ${MONTHS_SHORT[m - 1]}`
}

function formatDateRange(dateStr, dateEndStr) {
  const { y, m, d } = parseDateParts(dateStr)
  const start = new Date(y, m - 1, d)
  const { d: dEnd, m: mEnd } = parseDateParts(dateEndStr)
  const end = new Date(y, mEnd - 1, dEnd)
  const s = `${WEEKDAYS[start.getDay()]} ${String(d).padStart(2, '0')}`
  const e = `${WEEKDAYS[end.getDay()]} ${String(dEnd).padStart(2, '0')}`
  if (m === mEnd) return `${s}–${e} ${MONTHS_SHORT[m - 1]}`
  return `${s} ${MONTHS_SHORT[m - 1]}–${e} ${MONTHS_SHORT[mEnd - 1]}`
}

function formatChecked(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]}`
}

// Enriched stable facts: start time + confirmed/cancelled + price, each with
// a "checked DD Mon" note; a stale fact says "check site" instead.
function EnrichmentRow({ enrichment }) {
  const chips = []
  const st = enrichment.start_time
  if (st) {
    chips.push(
      st.stale
        ? { key: 'st', text: '◷ start — check site', color: 'var(--fdr-ink-faint)' }
        : { key: 'st', text: `◷ ${st.value}${st.likelyPrevious ? ' (likely, prev.)' : ''}`, color: 'var(--fdr-ink-muted)', checked: formatChecked(st.lastChecked) },
    )
  }
  const cs = enrichment.confirmed_status
  if (cs && !cs.stale) {
    if (cs.value === 'cancelled') chips.push({ key: 'cs', text: 'CANCELLED', color: 'var(--fdr-ink-inverse)', bg: 'var(--fdr-ink)' })
    else if (cs.value === 'confirmed') chips.push({ key: 'cs', text: '✓ confirmed', color: DRIVE_INK.near, checked: formatChecked(cs.lastChecked) })
  } else if (cs && cs.stale) {
    chips.push({ key: 'cs', text: 'status — check site', color: 'var(--fdr-ink-faint)' })
  }
  const pr = enrichment.price
  if (pr) chips.push({ key: 'pr', text: `${pr.value}${pr.likelyPrevious ? ' (likely, prev.)' : ''}`, color: 'var(--fdr-ink-muted)' })

  if (chips.length === 0) return null

  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
      {chips.map(c => (
        <span key={c.key} className="fdr-mono" style={{
          display: 'inline-flex', alignItems: 'baseline', gap: '5px', fontSize: '11.5px',
          padding: c.bg ? '2px 6px' : '0', borderRadius: c.bg ? '3px' : '0',
          backgroundColor: c.bg || 'transparent', color: c.color, fontWeight: c.bg ? '700' : '400',
        }}>
          {c.text}
          {c.checked && <span style={{ fontSize: '9.5px', color: 'var(--fdr-ink-faint)' }}>· checked {c.checked}</span>}
        </span>
      ))}
    </div>
  )
}

// V2 tiered card: (1) name … date · (2) town, province … drive ·
// (3) the signal line — level word + enumerated distances + climb ·
// (4) the taste one-liner when one exists. Sparse races simply have no
// line 4 — compact, not broken.
export default function RaceCard({ race }) {
  const prov = PROVINCE_TITLE[race.province] || race.province

  let dateDisplay = null
  if (race.date) {
    dateDisplay = race.dateEnd ? formatDateRange(race.date, race.dateEnd) : formatDate(race.date)
  }

  const eventEff = eventKmEffort(race.distances)
  const level = difficultyLevel(eventEff)
  const t = difficultyToken(level)
  const distStr = enumerateDistances(race.distances)
  const maxEl = maxElevation(race.distances)
  const verdict = verdictFor(race)
  const band = driveBand(race.driveMinutes)
  const driveColor = band === 'near' ? DRIVE_INK.near : band === 'mid' ? DRIVE_INK.mid : DRIVE_INK.far

  return (
    <a
      href={`/race/${race.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        columnGap: '12px',
        rowGap: '2px',
        alignItems: 'baseline',
        padding: '13px 16px',
        borderBottom: '1px solid var(--fdr-border)',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
        background: 'var(--fdr-surface)',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--fdr-sunk)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--fdr-surface)'}
    >
      {/* Row 1 — name … date */}
      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--fdr-ink)', lineHeight: 1.3, minWidth: 0 }}>
        {race.name}
        {race.soldOut && (
          <span className="fdr-mono" style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', backgroundColor: 'var(--fdr-ink)', color: 'var(--fdr-ink-inverse)', fontWeight: 700, marginLeft: '7px', verticalAlign: '1px', whiteSpace: 'nowrap' }}>
            SOLD OUT
          </span>
        )}
      </span>
      <span className="fdr-mono" style={{ fontSize: '12px', color: 'var(--fdr-ink-muted)', whiteSpace: 'nowrap' }}>
        {dateDisplay || (
          race.expectedMonth != null
            ? <span title="Exact date not announced">{MONTHS_SHORT[race.expectedMonth - 1].toUpperCase()} {race.expectedYear} · EXP.</span>
            : 'DATE TBD'
        )}
      </span>

      {/* Row 2 — town, province … drive */}
      <span style={{ fontSize: '12.5px', color: 'var(--fdr-ink-muted)' }}>{race.town} · {prov}</span>
      {race.driveMinutes != null ? (
        <span className="fdr-mono" style={{ fontSize: '13px', fontWeight: band === 'near' ? 700 : 500, color: driveColor, whiteSpace: 'nowrap', textAlign: 'right' }}>
          {formatDrive(race.driveMinutes)} drive
        </span>
      ) : (
        <span style={{ fontSize: '12px', color: 'var(--fdr-ink-faint)', whiteSpace: 'nowrap' }}>drive —</span>
      )}

      {/* Row 3 — the signal line */}
      <span className="fdr-mono" style={{ gridColumn: '1 / -1', fontSize: '12px', color: 'var(--fdr-ink-muted)', marginTop: '3px' }}>
        {level ? (
          <span style={{ fontWeight: 700, color: t.ink, background: t.bg, padding: '1px 7px', borderRadius: '3px', letterSpacing: '0.03em' }}>
            {level.toUpperCase()}
          </span>
        ) : race.distances.length > 0 ? (
          <span style={{ color: 'var(--fdr-ink-faint)', fontWeight: 600 }}>UNRATED</span>
        ) : null}
        {distStr
          ? <> · <b style={{ color: 'var(--fdr-ink)', fontWeight: 600 }}>{distStr}</b></>
          : <span style={{ fontStyle: 'italic' }}> Various distances — check website</span>}
        {maxEl != null ? ` · up to ${maxEl} D+` : distStr ? ' · climb not published' : ''}
        {race.kidsRun ? ' · + kids' : ''}
      </span>

      {/* Enriched stable facts */}
      {race.enrichment && <EnrichmentRow enrichment={race.enrichment} />}

      {/* Row 4 — taste one-liner, only when one exists */}
      {verdict && (
        <span style={{
          gridColumn: '1 / -1', fontSize: '12.5px', color: 'var(--fdr-ink-muted)', marginTop: '3px',
          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          “{verdict.text}”
        </span>
      )}
    </a>
  )
}
