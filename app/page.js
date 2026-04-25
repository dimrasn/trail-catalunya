import { Suspense } from 'react'
import RaceList from './components/RaceList'
import ChatWidget from './components/ChatWidget'
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

export default async function Page() {
  const [races, lastUpdatedIso] = await Promise.all([getRaces(), getLastUpdated()])
  const lastUpdated = formatLastUpdated(lastUpdatedIso)

  return (
    <Suspense>
      <RaceList races={races} lastUpdated={lastUpdated} />
      <ChatWidget />
    </Suspense>
  )
}
