export default function ReportFeed({ problems, selectedId, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '18px 16px', borderBottom: '1px solid var(--border)',
        fontSize: 11, letterSpacing: '0.2em', color: 'var(--text-secondary)',
      }}>
        INCIDENT FEED
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {problems.map(problem => {
          const selected = problem.id === selectedId
          return (
            <button
              key={problem.id}
              onClick={() => onSelect(problem)}
              style={{
                width: '100%', textAlign: 'left', padding: 14,
                border: 'none', borderBottom: '1px solid var(--border)',
                background: selected ? 'rgba(59,130,246,0.08)' : 'transparent',
                cursor: 'pointer', color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{problem.title}</div>
                <div style={{ fontSize: 11, color: problem.urgency >= 8 ? '#ef4444' : '#f59e0b' }}>
                  {problem.urgency}/10
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {problem.address || 'Unknown location'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11 }}>
                <span>{problem.required_skill || 'general'}</span>
                <span>{problem.reported_by || 'community'}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
