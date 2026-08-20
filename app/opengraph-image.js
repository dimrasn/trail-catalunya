import { ImageResponse } from 'next/og'

// Share-card image, generated at build time (no design tooling, no binary in
// the repo). Dark card matching the site aesthetic; leads with the USP.
export const alt = 'Trail Catalunya 2026 — find the race that fits you, with drive times from Barcelona'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#0a0a14',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, color: '#4ade80', letterSpacing: '0.1em', marginBottom: 24 }}>
          TRAIL CATALUNYA 2026
        </div>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, lineHeight: 1.15, marginBottom: 28 }}>
          Find the trail race that fits you
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#9a9ab0', lineHeight: 1.4 }}>
          200+ races · drive time from Barcelona · distance · D+ · updated weekly
        </div>
        <div style={{ display: 'flex', marginTop: 48, gap: 14 }}>
          <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, backgroundColor: '#12122a', color: '#cccccc', fontSize: 26 }}>
            ⏱ under 1h drive
          </div>
          <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, backgroundColor: '#12122a', color: '#cccccc', fontSize: 26 }}>
            ⛰ 1000m D+
          </div>
          <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, backgroundColor: '#12122a', color: '#cccccc', fontSize: 26 }}>
            🤖 ask AI
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
