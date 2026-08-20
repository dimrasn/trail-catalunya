import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { SITE_URL } from './lib/site'

const TITLE = 'Trail Races in Catalunya 2026 — Calendar with Drive Times from Barcelona'
const DESCRIPTION =
  'Find the trail race that fits you: 200+ races in Catalunya, filterable by ' +
  'drive time from Barcelona, distance, elevation gain and month. Updated weekly.'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  verification: { google: 'ZVjpRlNczEl7LjVFN6Sgs7aBMTY845zgvAheKW72HZE' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    siteName: 'Trail Catalunya',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
