import RaceList from './components/RaceList'
import { getRaces, getLastUpdated } from './lib/races'

// Static-with-revalidation: build snapshots Supabase. The Vercel deploy
// hook (fired by the scrape-trails Edge Function on actual data changes)
// triggers a fresh build. As a safety net, also revalidate every 24h
// even if the hook didn't fire — keeps the page from going indefinitely
// stale if a deploy hook ever drops a request.
export const revalidate = 86400

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatLastUpdated(iso) {
  if (!iso) return 'unknown'
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

// schema.org SportsEvent markup for every dated race — the structured-data
// surface Google builds event experiences from. Regenerated on each rebuild,
// so dates/status stay as fresh as the weekly scrape.
function eventsJsonLd(races) {
  const items = races
    .filter(r => r.date)
    .map((r, i) => {
      const event = {
        '@type': 'SportsEvent',
        name: r.name,
        sport: 'Trail running',
        startDate: r.date,
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
          '@type': 'Place',
          name: r.town,
          address: { '@type': 'PostalAddress', addressRegion: r.province, addressCountry: 'ES' },
        },
        url: r.url,
      }
      if (r.dateEnd) event.endDate = r.dateEnd
      if (r.lat != null && r.lng != null) {
        event.location.geo = { '@type': 'GeoCoordinates', latitude: r.lat, longitude: r.lng }
      }
      return { '@type': 'ListItem', position: i + 1, item: event }
    })

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Trail running races in Catalunya 2026',
    numberOfItems: items.length,
    itemListElement: items,
  }
}

export default async function Page() {
  const [races, lastUpdatedIso] = await Promise.all([getRaces(), getLastUpdated()])
  const lastUpdated = formatLastUpdated(lastUpdatedIso)
  const jsonLd = JSON.stringify(eventsJsonLd(races)).replace(/</g, '\\u003c')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <RaceList races={races} lastUpdated={lastUpdated} />
    </>
  )
}
