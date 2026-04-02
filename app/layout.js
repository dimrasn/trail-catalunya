import './globals.css'

export const metadata = {
  title: 'Trail Catalunya 2026',
  description: 'Find trail races in Catalunya by drive time, distance, and elevation',
  openGraph: {
    title: 'Trail Catalunya 2026',
    description: 'Find trail races in Catalunya by drive time, distance, and elevation',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Trail Catalunya 2026',
    description: 'Find trail races in Catalunya by drive time, distance, and elevation',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  )
}
