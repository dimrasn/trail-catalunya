import { Suspense } from 'react'
import races from '@/data/races.json'
import RaceList from './components/RaceList'
import ChatWidget from './components/ChatWidget'

const LAST_UPDATED = '2 April 2026'

export default function Page() {
  return (
    <Suspense>
      <RaceList races={races} lastUpdated={LAST_UPDATED} />
      <ChatWidget />
    </Suspense>
  )
}
