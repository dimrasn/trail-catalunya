import { ImageResponse } from 'next/og'

// Share-card image, generated at build time (no design tooling, no binary in
// the repo). Full de Ruta light board; leads with the USP.
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
          backgroundColor: '#F9FAFC',
          color: '#20252A',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, color: '#04884D', letterSpacing: '0.1em', marginBottom: 24, fontWeight: 700 }}>
          TRAIL CATALUNYA 2026
        </div>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, lineHeight: 1.15, marginBottom: 28 }}>
          Find the race that fits
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#5F6469', lineHeight: 1.4 }}>
          200+ races · drive time from Barcelona · honest difficulty · updated weekly
        </div>
        <div style={{ display: 'flex', marginTop: 48, gap: 14 }}>
          <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, backgroundColor: '#FFFFFF', border: '1px solid #DBDEE2', color: '#20252A', fontSize: 26 }}>
            under 1h drive
          </div>
          <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, backgroundColor: '#ADE3BF', color: '#103C28', fontSize: 26 }}>
            Easy
          </div>
          <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, backgroundColor: '#B04A44', color: '#FDF3F2', fontSize: 26 }}>
            Extreme
          </div>
          <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, backgroundColor: '#FFFFFF', border: '1px solid #DBDEE2', color: '#20252A', fontSize: 26 }}>
            ask AI
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
