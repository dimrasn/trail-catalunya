import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRaces } from '../../lib/races.js'
import {
  displayDate, formatDrive, driveColor, distancesSummary, elevationSummary,
  maxElevation, yearOf, kmEffort, maxKmEffort, kmEffortBand,
  PROVINCE_COLOR, PROVINCE_TITLE,
} from '../../lib/format.js'
import { buildRacePrompt, claudeUrl, chatgptUrl } from '../../components/askPrompt.js'
import { SITE_URL } from '../../lib/site.js'

// Static, one page per race, revalidated on the weekly-scrape deploy hook (24h
// safety net matches the homepage). Only known slugs are served — an unknown
// slug 404s rather than rendering an empty shell.
export const revalidate = 86400
export const dynamicParams = false

// Build-time memo: the module loads once per build worker, so every race page
// in that worker shares one Supabase pull instead of re-querying per page.
let _racesPromise = null
function allRaces() {
  if (!_racesPromise) _racesPromise = getRaces()
  return _racesPromise
}

async function findRace(slug) {
  const races = await allRaces()
  return races.find(r => r.id === slug) || null
}

export async function generateStaticParams() {
  const races = await allRaces()
  return races.map(r => ({ slug: r.id }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const race = await findRace(slug)
  if (!race) return {}

  const year = yearOf(race.date)
  const dist = distancesSummary(race.distances)
  const maxEl = maxElevation(race.distances)
  const driveStr = race.driveMinutes != null ? formatDrive(race.driveMinutes) : null
  const prov = PROVINCE_TITLE[race.province] || race.province

  const titleBits = [`${race.name}${year ? ` ${year}` : ''} — ${race.town}`]
  if (dist) titleBits.push(dist + (maxEl ? ` / ${maxEl} m D+` : ''))
  if (driveStr) titleBits.push(`${driveStr} from Barcelona`)
  const title = titleBits.join(' · ')

  const dateStr = displayDate(race)
  const description =
    `${race.name} trail race in ${race.town}, ${prov}` +
    `${dateStr ? ` on ${dateStr}` : ''}. ` +
    `${dist ? `Distances ${dist}${maxEl ? `, up to ${maxEl} m D+` : ''}. ` : ''}` +
    `${driveStr ? `${driveStr} drive from Barcelona. ` : ''}` +
    `Drive time, elevation and the official registration link.`

  return {
    title,
    description,
    alternates: { canonical: `/race/${race.id}` },
    openGraph: {
      title,
      description,
      url: `/race/${race.id}`,
      siteName: 'Trail Catalunya',
      type: 'article',
      locale: 'en_US',
    },
  }
}

// Related-races mesh: same province + month + near drive time, widening the
// filter until we have at least 3. Keeps every race page linked (no orphans).
function relatedRaces(all, race) {
  const others = all.filter(r => r.id !== race.id)
  const month = race.date ? race.date.slice(0, 7) : null
  const drive = race.driveMinutes
  const seen = new Set()
  const out = []
  const add = (list) => {
    for (const r of list) {
      if (seen.has(r.id)) continue
      seen.add(r.id)
      out.push(r)
    }
  }

  if (month) {
    add(others.filter(r =>
      r.province === race.province && r.date && r.date.slice(0, 7) === month &&
      drive != null && r.driveMinutes != null && Math.abs(r.driveMinutes - drive) <= 30))
    if (out.length < 3) add(others.filter(r => r.province === race.province && r.date && r.date.slice(0, 7) === month))
    if (out.length < 3) add(others.filter(r => r.date && r.date.slice(0, 7) === month))
  }
  if (out.length < 3) add(others.filter(r => r.province === race.province))

  return out
    .sort((a, b) => (a.driveMinutes ?? 9999) - (b.driveMinutes ?? 9999))
    .slice(0, 6)
}

function eventJsonLd(race) {
  const prov = PROVINCE_TITLE[race.province] || race.province
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: race.name,
    sport: 'Trail running',
    eventStatus: race.enrichment?.confirmed_status?.value === 'cancelled'
      ? 'https://schema.org/EventCancelled'
      : 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: race.town,
      address: { '@type': 'PostalAddress', addressRegion: prov, addressCountry: 'ES' },
    },
    url: race.url,
  }
  if (race.date) ld.startDate = race.date
  if (race.dateEnd) ld.endDate = race.dateEnd
  if (race.lat != null && race.lng != null) {
    ld.location.geo = { '@type': 'GeoCoordinates', latitude: race.lat, longitude: race.lng }
  }
  const offers = (race.distances || [])
    .filter(d => d.price != null)
    .map(d => ({
      '@type': 'Offer',
      name: d.variantName || `${d.km} km`,
      price: d.price,
      priceCurrency: 'EUR',
      availability: race.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      url: race.url,
    }))
  if (offers.length) ld.offers = offers
  return ld
}

// ---- styles (dark-theme tokens, matching /about + the cards) ----
const wrap = { maxWidth: '680px', margin: '0 auto', padding: '20px 16px 64px', lineHeight: 1.5 }
const back = { fontSize: '14px', color: '#8a8aff', textDecoration: 'underline' }
const kicker = {
  fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
  color: '#fff', margin: '30px 0 8px', paddingBottom: '6px', borderBottom: '1px solid #26263f',
}
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }

export default async function RacePage({ params }) {
  const { slug } = await params
  const races = await allRaces()
  const race = races.find(r => r.id === slug)
  if (!race) notFound()

  const prov = PROVINCE_TITLE[race.province] || race.province
  const provColor = PROVINCE_COLOR[race.province] || '#555'
  const dateStr = displayDate(race)
  const dist = distancesSummary(race.distances)
  const elev = elevationSummary(race.distances)
  const hasAnyPrice = race.distances.some(d => d.price != null)
  const hasAnyEffort = race.distances.some(d => kmEffort(d) != null)
  const maxEff = maxKmEffort(race.distances)
  const effBand = kmEffortBand(maxEff)
  const someMissingElev = race.distances.some(d => d.elevationGain == null)
  const related = relatedRaces(races, race)
  const prompt = buildRacePrompt(race)
  const jsonLd = JSON.stringify(eventJsonLd(race)).replace(/</g, '\\u003c')

  return (
    <main style={wrap}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <p style={{ marginBottom: '22px' }}>
        <Link href="/" style={back}>← All races</Link>
      </p>

      {/* HERO */}
      <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.15 }}>
        {race.name}
      </h1>
      <div style={{ fontSize: '14px', color: '#9a9ab0', marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={mono}>{dateStr || <span style={{ color: '#a78bfa' }}>Date TBD</span>} · {race.town}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: '6px', backgroundColor: provColor + '33', color: provColor, textTransform: 'uppercase' }}>
          {prov}
        </span>
        {race.soldOut && (
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', backgroundColor: '#dc2626', color: '#fff' }}>SOLD OUT</span>
        )}
        {race.kidsRun && (
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', backgroundColor: '#064e3b', color: '#34d399' }}>KIDS RUN</span>
        )}
      </div>

      <div style={{ background: '#12122a', border: '1px solid #26263f', borderRadius: '14px', padding: '16px 18px', marginTop: '16px' }}>
        {race.driveMinutes != null ? (
          <>
            <div style={{ ...mono, fontSize: '40px', fontWeight: 700, lineHeight: 1, color: driveColor(race.driveMinutes) }}>
              {formatDrive(race.driveMinutes)}
            </div>
            <div style={{ fontSize: '13px', color: '#9a9ab0', marginTop: '6px' }}>drive from Barcelona</div>
            <div style={{ fontSize: '11px', color: '#62627a', marginTop: '2px' }}>from Plaça Glòries (estimated)</div>
          </>
        ) : (
          <div style={{ fontSize: '15px', color: '#666' }}>Drive time — not available</div>
        )}
      </div>

      {/* KEY FACTS */}
      <dl style={{ marginTop: '18px' }}>
        {[
          ['Date', dateStr || 'To be announced'],
          ['Location', `${race.town}, ${prov}`],
          dist && ['Distances', dist],
          elev && ['Elevation', elev],
          maxEff != null && ['Difficulty', `${maxEff} km-effort · ${effBand}`],
        ].filter(Boolean).map(([label, value]) => (
          <div key={label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '10px', padding: '5px 0' }}>
            <dt style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', paddingTop: '2px' }}>{label}</dt>
            <dd style={{ fontSize: '15px', color: '#e8e8f0', ...(label === 'Distances' || label === 'Elevation' ? mono : {}) }}>{value}</dd>
          </div>
        ))}
      </dl>

      {/* DISTANCES */}
      {race.distances.length > 0 && (
        <>
          <div style={kicker}>Distances</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#666', textAlign: 'left', padding: '6px 8px 6px 0', fontWeight: 600 }}>Distance</th>
                <th style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#666', textAlign: 'left', padding: '6px 8px 6px 0', fontWeight: 600 }}>Elevation</th>
                {hasAnyEffort && <th title="km-effort = km + D+/100 (the FEEC difficulty metric)" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#666', textAlign: 'left', padding: '6px 8px 6px 0', fontWeight: 600 }}>Effort</th>}
                {hasAnyPrice && <th style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#666', textAlign: 'left', padding: '6px 0', fontWeight: 600 }}>Price</th>}
              </tr>
            </thead>
            <tbody>
              {race.distances.map((d, i) => (
                <tr key={i}>
                  <td style={{ ...mono, fontSize: '15px', fontWeight: 600, color: '#e8e8f0', padding: '9px 8px 9px 0', borderTop: '1px solid #1a1a2e' }}>
                    {d.km} km
                    {d.variantName && <div style={{ fontSize: '12px', color: '#9a9ab0', fontWeight: 400, marginTop: '2px' }}>↳ {d.variantName}</div>}
                  </td>
                  <td style={{ ...mono, fontSize: '15px', color: '#c9c9d6', padding: '9px 8px 9px 0', borderTop: '1px solid #1a1a2e' }}>
                    {d.elevationGain != null ? `↑${d.elevationGain} m` : <span style={{ color: '#62627a' }}>—</span>}
                  </td>
                  {hasAnyEffort && (
                    <td style={{ ...mono, fontSize: '15px', color: '#c9c9d6', padding: '9px 8px 9px 0', borderTop: '1px solid #1a1a2e' }}>
                      {kmEffort(d) != null ? kmEffort(d) : <span style={{ color: '#62627a' }}>—</span>}
                    </td>
                  )}
                  {hasAnyPrice && (
                    <td style={{ ...mono, fontSize: '15px', color: '#c9c9d6', padding: '9px 0', borderTop: '1px solid #1a1a2e' }}>
                      {d.price != null ? `${d.price} €` : <span style={{ color: '#62627a' }}>—</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {someMissingElev && (
            <div style={{ fontSize: '11px', color: '#62627a', marginTop: '8px' }}>Some distances have no published elevation yet.</div>
          )}
        </>
      )}

      {/* RACE-DAY FACTS (enrichment slot; not load-bearing) */}
      <div style={kicker}>Race-day facts</div>
      {race.enrichment ? (
        <div style={{ fontSize: '14px', color: '#c9c9d6', lineHeight: 1.6 }}>
          {race.enrichment.start_time?.value && !race.enrichment.start_time.stale && (
            <div>◷ Start {race.enrichment.start_time.value}</div>
          )}
          {race.enrichment.confirmed_status?.value === 'confirmed' && !race.enrichment.confirmed_status.stale && (
            <div style={{ color: '#34d399' }}>✓ Confirmed</div>
          )}
          {race.enrichment.confirmed_status?.value === 'cancelled' && (
            <div style={{ color: '#f87171', fontWeight: 700 }}>CANCELLED</div>
          )}
          <div style={{ fontSize: '12px', color: '#62627a', marginTop: '6px' }}>Best-effort — always confirm on the official site below.</div>
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: '#9a9ab0', lineHeight: 1.5 }}>
          Start time and registration status aren’t verified yet — confirm on the official site below.
        </div>
      )}

      {/* REGISTER / VERIFY */}
      <div style={{ marginTop: '20px' }}>
        <a href={race.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', width: '100%', textAlign: 'center', background: '#2563eb', color: '#fff', borderRadius: '12px', padding: '12px', fontWeight: 600, fontSize: '15px', textDecoration: 'none' }}>
          Official site &amp; registration ↗
        </a>
        <div style={{ fontSize: '12px', color: '#9a9ab0', marginTop: '10px', lineHeight: 1.5 }}>
          Dates, start times and registration change. Always confirm on the official site before you count on it.
        </div>
      </div>

      {/* GETTING THERE */}
      {race.lat != null && race.lng != null && (
        <>
          <div style={kicker}>Getting there</div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${race.lat},${race.lng}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', background: 'transparent', border: '1px solid #26263f', color: '#c9c9d6', borderRadius: '12px', padding: '10px 16px', fontSize: '14px', textDecoration: 'none' }}>
            Open in Google Maps ↗
          </a>
          <div style={{ ...mono, fontSize: '12px', color: '#62627a', marginTop: '10px' }}>
            {race.town} · {race.lat}, {race.lng}
            {race.driveMinutes != null && <> · <span style={{ color: driveColor(race.driveMinutes) }}>{formatDrive(race.driveMinutes)}</span> drive from Barcelona (Plaça Glòries)</>}
          </div>
        </>
      )}

      {/* RELATED */}
      {related.length > 0 && (
        <>
          <div style={kicker}>More races like this</div>
          <div>
            {related.map((r, i) => (
              <Link key={r.id} href={`/race/${r.id}`}
                style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid #1a1a2e', textDecoration: 'none', color: 'inherit' }}>
                <span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{r.name}</span>
                  <span style={{ display: 'block', fontSize: '13px', color: '#888', marginTop: '3px' }}>
                    {displayDate(r) || 'Date TBD'} · {r.town} · {r.distances.length} {r.distances.length === 1 ? 'distance' : 'distances'}
                  </span>
                </span>
                {r.driveMinutes != null
                  ? <span style={{ ...mono, fontSize: '15px', fontWeight: 700, whiteSpace: 'nowrap', color: driveColor(r.driveMinutes) }}>{formatDrive(r.driveMinutes)}</span>
                  : <span style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>drive TBD</span>}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ASK AI (per-race prompt) */}
      <div style={kicker}>Plan this race with AI</div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <a href={claudeUrl(prompt)} target="_blank" rel="noopener noreferrer"
          style={{ borderRadius: '10px', padding: '10px 16px', fontWeight: 600, fontSize: '14px', color: '#fff', background: '#d97757', textDecoration: 'none' }}>Ask Claude</a>
        <a href={chatgptUrl(prompt)} target="_blank" rel="noopener noreferrer"
          style={{ borderRadius: '10px', padding: '10px 16px', fontWeight: 600, fontSize: '14px', color: '#fff', background: '#10a37f', textDecoration: 'none' }}>Ask ChatGPT</a>
        <Link href="/for-agents" style={{ fontSize: '14px', color: '#8a8aff', textDecoration: 'underline' }}>Connect your own AI →</Link>
      </div>

      {/* FOOTER */}
      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #1a1a2e', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          <Link href="/about" style={{ textDecoration: 'underline' }}>Why I built this</Link>
          {' · '}
          <Link href="/for-agents" style={{ textDecoration: 'underline' }}>For AI agents</Link>
        </p>
        <p style={{ fontSize: '12px', color: '#444' }}>Data from ultrescatalunya.com · Drive times are estimates</p>
      </footer>
    </main>
  )
}
