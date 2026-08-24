// How we know a thing: Organizer / Derived / Our read / Our guess / auto.
// Visible but sub-weight — it qualifies, it never competes.
export default function Provenance({ label }) {
  if (!label) return null
  return (
    <span className="fdr-mono" style={{
      fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
      color: 'var(--fdr-ink-faint)', whiteSpace: 'nowrap',
    }}>
      · {label}
    </span>
  )
}
