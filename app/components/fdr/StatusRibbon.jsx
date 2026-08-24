// Tier-0 status: a full-width typographic ribbon — dark ink, no hue (hue is
// difficulty). Absent entirely when there is nothing to say.
export default function StatusRibbon({ kind, detail }) {
  if (!kind) return null
  const title = kind === 'cancelled' ? 'Cancelled' : 'Sold out'
  return (
    <div role="status" style={{
      background: 'var(--fdr-ink)', color: 'var(--fdr-ink-inverse)',
      borderRadius: 'var(--fdr-radius-sm)', padding: '10px 16px', marginBottom: '18px',
    }}>
      <span className="fdr-mono" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'inherit' }}>
        {title}
      </span>
      {detail && (
        <span style={{ fontSize: '13px', marginLeft: '10px', opacity: 0.85 }}>{detail}</span>
      )}
    </div>
  )
}
