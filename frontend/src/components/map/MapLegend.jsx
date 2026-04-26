export default function MapLegend() {
  return (
    <div style={{
      position: 'absolute', bottom: 18, right: 18,
      background: 'rgba(14,16,22,0.9)', color: '#f8fafc',
      border: '1px solid rgba(148,163,184,0.3)', borderRadius: 12,
      padding: 14, fontSize: 11, lineHeight: 1.6,
      zIndex: 500,
      width: 220,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>MAP LEGEND</div>
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Critical</span><span style={{ color: '#ef4444' }}>8+ urgency</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>High</span><span style={{ color: '#f59e0b' }}>5-7 urgency</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Info</span><span style={{ color: '#22c55e' }}>1-4 urgency</span>
        </div>
      </div>
    </div>
  )
}
