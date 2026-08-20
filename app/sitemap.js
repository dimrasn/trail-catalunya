import { SITE_URL } from './lib/site'
import { getRaces, getLastUpdated } from './lib/races'

// Homepage + evergreen content pages + every per-race page. Race pages share
// the weekly-scrape timestamp as their honest lastmod (that's when the data
// they render last changed) — never the build time, which would teach Google
// to distrust lastmod.
export default async function sitemap() {
  const [races, lastUpdatedIso] = await Promise.all([getRaces(), getLastUpdated()])
  const raceLastmod = lastUpdatedIso ? new Date(lastUpdatedIso) : new Date()

  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/for-agents`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  const racePages = races.map(r => ({
    url: `${SITE_URL}/race/${r.id}`,
    lastModified: raceLastmod,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...racePages]
}
