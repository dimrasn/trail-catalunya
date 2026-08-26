import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRaces } from '../../lib/races.js'
import {
  displayDate, formatDrive, distancesSummary,
  metadataDistancePart, completeMaxElevation, expectedDateLabel, MONTHS_SHORT,
  kmEffort, eventKmEffort, difficultyLevel, dPlusPerKm,
  PROVINCE_TITLE, yearOf,
} from '../../lib/format.js'
import { driveBand, DRIVE_INK, DRIVE_CHIP, enumerateDistances, verdictFor, difficultyToken } from '../../lib/semantics.js'
import DifficultyChip from '../../components/fdr/DifficultyChip.jsx'
import DifficultyScale from '../../components/fdr/DifficultyScale.jsx'
import DistanceLadder from '../../components/fdr/DistanceLadder.jsx'
import StatusRibbon from '../../components/fdr/StatusRibbon.jsx'
import Provenance from '../../components/fdr/Provenance.jsx'
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
  const maxEl = completeMaxElevation(race.distances)
  const distPart = metadataDistancePart(race.distances)
  const driveStr = race.driveMinutes != null ? formatDrive(race.driveMinutes) : null
  const prov = PROVINCE_TITLE[race.province] || race.province

  const titleBits = [`${race.name}${year ? ` ${year}` : ''} — ${race.town}`]
  if (distPart) titleBits.push(distPart)
  if (driveStr) titleBits.push(`${driveStr} from Barcelona`)
  const title = titleBits.join(' · ')

  const dateStr = displayDate(race)
  const expected = dateStr ? null : expectedDateLabel(race.expectedMonth, race.expectedYear)
  const description =
    `${race.name} trail race in ${race.town}, ${prov}` +
    `${dateStr ? ` on ${dateStr}` : expected ? ` — expected ${expected}` : ''}. ` +
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

// ---- Full de Ruta light board ----
const wrap = { maxWidth: '720px', margin: '0 auto', padding: '20px 16px 64px', lineHeight: 1.55, color: 'var(--fdr-ink)' }
const kicker = {
  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em',
  fontFamily: 'var(--fdr-mono)', color: 'var(--fdr-ink)', margin: '32px 0 10px',
  paddingBottom: '6px', borderBottom: '1px solid var(--fdr-border)',
}
const card = {
  background: 'var(--fdr-surface)', border: '1px solid var(--fdr-border)',
  borderRadius: 'var(--fdr-radius-sm)', padding: '16px 18px',
}
const th = {
  fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fdr-ink-muted)',
  fontFamily: 'var(--fdr-mono)', textAlign: 'left', padding: '6px 10px 6px 0', fontWeight: 600,
}
const td = { fontFamily: 'var(--fdr-mono)', fontSize: '14px', color: 'var(--fdr-ink)', padding: '9px 10px 9px 0', borderTop: '1px solid var(--fdr-border)' }

export default async function RacePage({ params }) {
  const { slug } = await params
  const races = await allRaces()
  const race = races.find(r => r.id === slug)
  if (!race) notFound()

  const prov = PROVINCE_TITLE[race.province] || race.province
  const dateStr = displayDate(race)
  // An expected month is NOT a confirmed date and must read as an expectation
  // (docs/rules.md R6); it stays out of JSON-LD.
  const expectedMonthStr = expectedDateLabel(race.expectedMonth, race.expectedYear)
  const cancelled = race.enrichment?.confirmed_status?.value === 'cancelled'
  const hasAnyPrice = race.distances.some(d => d.price != null)
  const hasAnyEffort = race.distances.some(d => kmEffort(d) != null)
  const maxEff = eventKmEffort(race.distances)
  const diffLevel = difficultyLevel(maxEff)
  // Climb density of the headline (hardest) distance — same variant the
  // difficulty label describes. Defined whenever maxEff is (all distances have D+).
  const hardest = maxEff != null ? race.distances.find(d => kmEffort(d) === maxEff) : null
  const climbDensity = hardest ? dPlusPerKm(hardest) : null
  const someMissingElev = race.distances.some(d => d.elevationGain == null)
  const verdict = verdictFor(race)
  const band = driveBand(race.driveMinutes)
  const related = relatedRaces(races, race)
  const prompt = buildRacePrompt(race)
  const jsonLd = JSON.stringify(eventJsonLd(race)).replace(/</g, '\\u003c')
  const editorialRest = (race.taste?.editorial || []).filter(e => e.key !== 'unique')

  return (
    <main style={wrap}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <p style={{ marginBottom: '18px' }}>
        <Link href="/" style={{ fontSize: '14px', color: 'var(--fdr-action)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>← All races</Link>
      </p>

      {/* TIER 0 — status. Event-level flag is all the data has; per-distance
          availability is not invented. */}
      <StatusRibbon
        kind={cancelled ? 'cancelled' : race.soldOut ? 'sold-out' : null}
        detail={cancelled
          ? 'Listed as cancelled — confirm on the official site.'
          : 'Check the official site for remaining distances.'}
      />

      {/* TIER 1 — identity + verdict */}
      <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fdr-ink)', lineHeight: 1.12, textWrap: 'balance' }}>
        {race.name}
      </h1>
      <div className="fdr-mono" style={{ fontSize: '13px', color: 'var(--fdr-ink-muted)', marginTop: '7px' }}>
        {dateStr || (expectedMonthStr
          ? <span title="Exact date not announced">Expected {expectedMonthStr} — not confirmed</span>
          : 'Date TBD')}
        {' · '}{race.town}, {prov}
      </div>
      {verdict && (
        <p style={{ fontSize: '17px', color: 'var(--fdr-ink)', lineHeight: 1.45, margin: '14px 0 0', maxWidth: '62ch' }}>
          {verdict.text} <Provenance label={verdict.label} />
        </p>
      )}

      {/* TIER 1 — difficulty */}
      <div style={{ ...card, marginTop: '18px' }}>
        {diffLevel ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <DifficultyChip level={diffLevel} effort={maxEff} />
              <span className="fdr-mono" style={{ fontSize: '12px', color: 'var(--fdr-ink-muted)' }}>
                {maxEff} km-effort{climbDensity != null ? ` · ${climbDensity} m/km climb` : ''}
              </span>
            </div>
            <DifficultyScale level={diffLevel} />
            <div style={{ fontSize: '11.5px', color: 'var(--fdr-ink-faint)', marginTop: '10px' }}>
              Endurance load on ITRA&apos;s km-effort scale — not steepness or technical terrain.{' '}
              <details style={{ display: 'inline-block' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--fdr-action)', display: 'inline' }}>How we measure</summary>
                <span style={{ display: 'block', marginTop: '6px', color: 'var(--fdr-ink-muted)' }}>
                  km-effort = distance + climb/100, ITRA&apos;s published scale: every 100 m of climb counts
                  like ~1 km of distance. Six levels, Easy → Brutal, from the hardest distance of the event.
                  The climb figure (m/km) shows how vertical the course is.
                </span>
              </details>
            </div>
          </>
        ) : (
          <div style={{ fontSize: '14px', color: 'var(--fdr-ink-muted)' }}>
            Difficulty unrated — the organizer hasn&apos;t published elevation for every distance.
          </div>
        )}
      </div>

      {/* TIER 2 — the gate: drive · when · distances */}
      <div style={{ ...card, padding: 0, marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[
          {
            label: 'Drive',
            value: race.driveMinutes != null
              ? <span style={{ background: DRIVE_CHIP[band].bg, color: DRIVE_CHIP[band].ink, fontWeight: 700, padding: '2px 8px', borderRadius: '3px', fontSize: '13px', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{DRIVE_CHIP[band].word} {formatDrive(race.driveMinutes)}</span>
              : <span style={{ color: 'var(--fdr-ink-faint)' }}>—</span>,
            sub: race.driveMinutes != null ? 'from Barcelona (Glòries, est.)' : 'not available',
          },
          {
            label: 'When',
            value: dateStr || (expectedMonthStr ? `Exp. ${expectedMonthStr}` : '—'),
            sub: dateStr ? null : expectedMonthStr ? 'not confirmed' : 'TBD',
          },
          {
            label: 'Distances',
            value: enumerateDistances(race.distances) || '—',
            sub: race.kidsRun ? '+ kids run' : null,
          },
        ].map((cell, i) => (
          <div key={cell.label} style={{ padding: '12px 14px', borderLeft: i > 0 ? '1px solid var(--fdr-border)' : 'none', minWidth: 0 }}>
            <div className="fdr-label" style={{ marginBottom: '4px' }}>{cell.label}</div>
            <div className="fdr-mono" style={{ fontSize: '15px', fontWeight: 600, overflowWrap: 'break-word' }}>{cell.value}</div>
            {cell.sub && <div style={{ fontSize: '10.5px', color: 'var(--fdr-ink-faint)', marginTop: '2px' }}>{cell.sub}</div>}
          </div>
        ))}
      </div>

      {/* TIER 2 — act zone */}
      <div style={{ marginTop: '18px' }}>
        <a href={race.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', background: 'var(--fdr-action)', color: '#fff', borderRadius: 'var(--fdr-radius-md)', padding: '13px', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>
          Official site &amp; registration ↗
        </a>
        {/* Provider buttons in palette shades (Dima's ruling 2026-08-24):
            Claude wears the ramp's orange tint, ChatGPT the green — palette
            colours, not raw brand hex. */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {[['Ask Claude', claudeUrl(prompt), '#F9CAA2', '#593215'], ['Ask ChatGPT', chatgptUrl(prompt), '#ADE3BF', '#103C28']].map(([label, url, bg, ink]) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, textAlign: 'center', background: bg, color: ink, border: 'none', borderRadius: 'var(--fdr-radius-md)', padding: '10px', fontWeight: 700, fontSize: '13.5px', textDecoration: 'none' }}>
              {label}
            </a>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--fdr-ink-muted)', marginTop: '8px', textAlign: 'center' }}>
          Ask anything the page doesn&apos;t show — &ldquo;can I walk it?&rdquo;, &ldquo;good first trail race?&rdquo;
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--fdr-ink-faint)', marginTop: '10px', lineHeight: 1.5 }}>
          Dates, start times and registration change — always confirm on the official site.
        </div>
      </div>

      {/* TIER 3 — distances */}
      {race.distances.length > 0 && (
        <>
          <div style={kicker}>Distances</div>
          <DistanceLadder distances={race.distances} />
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px' }}>
            <thead>
              <tr>
                <th style={th}>Distance</th>
                <th style={th}>Climb</th>
                {hasAnyEffort && <th style={th} title="km-effort = km + D+/100 (ITRA's endurance scale)">Effort</th>}
                {hasAnyPrice && <th style={th}>Price</th>}
              </tr>
            </thead>
            <tbody>
              {race.distances.map((d, i) => {
                const eff = kmEffort(d)
                const level = eff != null ? difficultyLevel(eff) : null
                const t = difficultyToken(level)
                return (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 600 }}>
                      {d.km} km
                      {d.variantName && <div style={{ fontSize: '11px', color: 'var(--fdr-ink-muted)', fontWeight: 400, marginTop: '2px' }}>↳ {d.variantName}</div>}
                    </td>
                    <td style={{ ...td, color: 'var(--fdr-ink-muted)' }}>
                      {d.elevationGain != null ? `↑${d.elevationGain} m` : <span style={{ color: 'var(--fdr-ink-faint)' }}>—</span>}
                    </td>
                    {hasAnyEffort && (
                      <td style={{ ...td, color: 'var(--fdr-ink-muted)' }}>
                        {eff != null ? (
                          <>
                            {eff}{' '}
                            <span style={{ fontFamily: 'var(--fdr-sans)', fontSize: '10.5px', fontWeight: 700, padding: '1px 7px', borderRadius: 'var(--fdr-radius-pill)', background: t.bg, color: t.ink, whiteSpace: 'nowrap' }}>
                              {level}
                            </span>
                          </>
                        ) : <span style={{ color: 'var(--fdr-ink-faint)' }}>—</span>}
                      </td>
                    )}
                    {hasAnyPrice && (
                      <td style={{ ...td, color: 'var(--fdr-ink-muted)' }}>
                        {d.price != null ? `${d.price} €` : <span style={{ color: 'var(--fdr-ink-faint)' }}>—</span>}
                      </td>
                    )}
                  </tr>
                )
              })}
              {race.kidsRun && (
                <tr>
                  <td style={{ ...td, fontWeight: 600 }}>Kids run</td>
                  <td style={{ ...td, color: 'var(--fdr-ink-faint)' }} colSpan={1 + (hasAnyEffort ? 1 : 0) + (hasAnyPrice ? 1 : 0)}>
                    distance TBC — see the official site
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {someMissingElev && (
            <div style={{ fontSize: '11px', color: 'var(--fdr-ink-faint)', marginTop: '8px' }}>Some distances have no published elevation yet.</div>
          )}
        </>
      )}

      {/* TIER 3 — our take + character (taste layer, honesty-labelled) */}
      {editorialRest.length > 0 && (
        <>
          <div style={kicker}>Our take</div>
          {editorialRest.map(item => (
            <div key={item.key} style={{ marginBottom: '13px' }}>
              <div className="fdr-label" style={{ marginBottom: '2px' }}>
                {item.label} <Provenance label={item.strengthLabel} />
              </div>
              <div style={{ fontSize: '14px', color: 'var(--fdr-ink)', lineHeight: 1.55, maxWidth: '68ch' }}>{item.value}</div>
            </div>
          ))}
        </>
      )}
      {race.taste?.character?.length > 0 && (
        <>
          <div style={kicker}>Character</div>
          <dl style={{ margin: 0 }}>
            {race.taste.character.map(item => (
              <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '10px', padding: '5px 0' }}>
                <dt className="fdr-label" style={{ paddingTop: '2px' }} title={item.evidence || undefined}>{item.label}</dt>
                <dd style={{ fontSize: '14px', color: 'var(--fdr-ink)', lineHeight: 1.5 }}>
                  {item.value} <Provenance label={item.strengthLabel} />
                </dd>
              </div>
            ))}
          </dl>
          <div style={{ fontSize: '11px', color: 'var(--fdr-ink-faint)', marginTop: '10px', lineHeight: 1.5 }}>
            Labels show how we know each thing: Organizer (from the race&rsquo;s own site) · Derived · Our read · Our guess · Dima (ran it).
          </div>
        </>
      )}

      {/* RACE-DAY FACTS (enrichment slot; renders only with a payload) */}
      {race.enrichment && (
        <>
          <div style={kicker}>Race-day facts</div>
          <div style={{ fontSize: '14px', color: 'var(--fdr-ink)', lineHeight: 1.6 }}>
            {race.enrichment.start_time?.value && !race.enrichment.start_time.stale && (
              <div>◷ Start {race.enrichment.start_time.value}</div>
            )}
            {race.enrichment.confirmed_status?.value === 'confirmed' && !race.enrichment.confirmed_status.stale && (
              <div style={{ color: DRIVE_INK.near }}>✓ Confirmed</div>
            )}
            <div style={{ fontSize: '11.5px', color: 'var(--fdr-ink-faint)', marginTop: '6px' }}>Best-effort — always confirm on the official site.</div>
          </div>
        </>
      )}

      {/* LINKS — route maps + social channels linked from the official page
          (Slice 1). Event-level: several route maps = the different distances.
          Socials are honest — scope "organizer" = a shared timing/host channel,
          never asserted as the race's own account. */}
      {race.links && (race.links.tracks?.length > 0 || race.links.socials?.length > 0) && (
        <>
          <div style={kicker}>Links</div>
          <div style={{ fontSize: '11.5px', color: 'var(--fdr-ink-faint)', marginBottom: '8px' }}>Found on the official race page — verify on the site.</div>
          {race.links.tracks?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: race.links.socials?.length ? '12px' : 0 }}>
              {race.links.tracks.map((t, i) => {
                const host = /wikiloc/i.test(t.url) ? 'Wikiloc' : /komoot/i.test(t.url) ? 'Komoot' : /strava/i.test(t.url) ? 'Strava' : 'Route'
                return (
                  <a key={t.url} href={t.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-block', background: 'var(--fdr-surface)', border: '1px solid var(--fdr-border-strong)', color: 'var(--fdr-ink)', borderRadius: 'var(--fdr-radius-md)', padding: '8px 14px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                    ↝ Route map{race.links.tracks.length > 1 ? ` ${i + 1}` : ''} · {host}
                  </a>
                )
              })}
            </div>
          )}
          {race.links.socials?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: '13px' }}>
              {race.links.socials.map(s => {
                const plat = s.handle?.startsWith('ig:') ? 'Instagram' : s.handle?.startsWith('fb:') ? 'Facebook' : 'Link'
                const name = s.handle?.includes(':') ? s.handle.split(':')[1] : s.handle
                return (
                  <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--fdr-ink)', textDecoration: 'underline' }}>
                    {plat}: {name}{s.scope === 'organizer' ? <span style={{ color: 'var(--fdr-ink-faint)' }}> (organizer)</span> : null}
                  </a>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* GETTING THERE */}
      {race.lat != null && race.lng != null && (
        <>
          <div style={kicker}>Getting there</div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${race.lat},${race.lng}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', background: 'var(--fdr-surface)', border: '1px solid var(--fdr-border-strong)', color: 'var(--fdr-ink)', borderRadius: 'var(--fdr-radius-md)', padding: '9px 16px', fontSize: '13.5px', fontWeight: 600, textDecoration: 'none' }}>
            Open in Google Maps ↗
          </a>
          <div className="fdr-mono" style={{ fontSize: '11.5px', color: 'var(--fdr-ink-faint)', marginTop: '9px' }}>
            {race.town} · {race.lat}, {race.lng}
          </div>
        </>
      )}

      {/* RELATED */}
      {related.length > 0 && (
        <>
          <div style={kicker}>{race.soldOut ? 'Still-open alternatives' : 'More races like this'}</div>
          <div>
            {related.map((r, i) => {
              const rBand = driveBand(r.driveMinutes)
              return (
                <Link key={r.id} href={`/race/${r.id}`}
                  style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', padding: '11px 0', borderTop: i === 0 ? 'none' : '1px solid var(--fdr-border)', textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--fdr-ink)' }}>{r.name}</span>
                    <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--fdr-ink-muted)', marginTop: '2px' }}>
                      {displayDate(r) || (r.expectedMonth != null ? `${MONTHS_SHORT[r.expectedMonth - 1]} ${r.expectedYear} (expected)` : 'Date TBD')} · {r.town} · {r.distances.length} {r.distances.length === 1 ? 'distance' : 'distances'}
                    </span>
                  </span>
                  {r.driveMinutes != null
                    ? <span className="fdr-mono" style={{ fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap', color: rBand === 'near' ? DRIVE_INK.near : rBand === 'mid' ? DRIVE_INK.mid : DRIVE_INK.far }}>{formatDrive(r.driveMinutes)}</span>
                    : <span style={{ fontSize: '12px', color: 'var(--fdr-ink-faint)', whiteSpace: 'nowrap' }}>drive —</span>}
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: '40px', paddingTop: '18px', borderTop: '1px solid var(--fdr-border)', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: 'var(--fdr-ink-muted)', marginBottom: '6px' }}>
          <Link href="/about" style={{ textDecoration: 'underline', color: 'inherit' }}>Why I built this</Link>
          {' · '}
          <Link href="/for-agents" style={{ textDecoration: 'underline', color: 'inherit' }}>For AI agents</Link>
        </p>
        <p style={{ fontSize: '12px', color: 'var(--fdr-ink-faint)' }}>Data from ultrescatalunya.com · Drive times are estimates</p>
      </footer>
    </main>
  )
}
