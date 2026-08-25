import { kmEffort, difficultyLevel } from '../../lib/format.js'
import { difficultyToken } from '../../lib/semantics.js'

// One bar per startable distance: length = km against maxKm, fill = that
// option's own difficulty. A missing D+ renders sunk and says so — never
// an invented level.
export default function DistanceLadder({ distances, maxKm }) {
  if (!distances || distances.length === 0) return null
  const max = maxKm || Math.max(...distances.map(d => d.km))
  const rows = [...distances].sort((a, b) => b.km - a.km)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {rows.map((d, i) => {
        const eff = kmEffort(d)
        const level = eff != null ? difficultyLevel(eff) : null
        const t = difficultyToken(level)
        const pct = Math.max(3, Math.round((d.km / max) * 100))
        return (
          <div key={i}>
            <div style={{
              height: '8px', width: `${pct}%`, borderRadius: '3px',
              background: level ? t.bg : 'var(--fdr-sunk)',
              border: level ? 'none' : '1px solid var(--fdr-border)',
            }} />
            <div className="fdr-mono" style={{ fontSize: '10.5px', color: 'var(--fdr-ink-muted)', marginTop: '2px' }}>
              {d.km} km{d.elevationGain != null ? ` · ↑${d.elevationGain} m` : ' · D+ not published'}
              {level ? ` · ${level}` : ''}
              {d.variantName ? ` · ${d.variantName}` : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}
