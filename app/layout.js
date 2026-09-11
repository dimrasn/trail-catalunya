import './globals.css'
import './fdr.css'
import './study.css'
import { Archivo, Manrope, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SITE_URL } from './lib/site'

// The design study's three faces, replacing Anton / Work Sans / JetBrains Mono.
// Archivo is loaded as a VARIABLE font with its width axis exposed: the study
// sets headlines at weight 800 / "wdth" 75, and a static cut cannot do that —
// the condensed width is the whole point of the masthead. Manrope and IBM Plex
// Mono are the study's body and data faces.
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-poster' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' })
const plexMono = IBM_Plex_Mono({ weight: ['500', '600'], subsets: ['latin'], variable: '--font-mono' })

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
      <body className={`${archivo.variable} ${manrope.variable} ${plexMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
