export default function MetricCard({ label, value, unit, accent, icon: Icon, sublabel }) {
  return (
    <div style={{
      flex: '1 1 180px', minWidth: 180,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 18,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 12,
          background: accent || 'var(--accent-blue)',
          display: 'grid', placeItems: 'center', color: '#fff',
        }}>
          {Icon ? <Icon size={16} /> : null}
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-dim)' }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}{unit ? ` ${unit}` : ''}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{sublabel}</div>
    </div>
  )
}
