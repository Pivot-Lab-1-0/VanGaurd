import { useState } from 'react'
import { X, UploadCloud, ShieldCheck } from 'lucide-react'

export default function DispatchModal({ problem, onClose }) {
  const [dispatched, setDispatched] = useState(false)

  function handleDispatch() {
    setDispatched(true)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(8,12,16,0.72)', display: 'grid', placeItems: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 520, background: 'var(--bg-panel)',
        border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>DISPATCH INCIDENT</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{problem.title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>LOCATION</div>
            <div style={{ fontSize: 14 }}>{problem.address || 'Unknown'}</div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>SKILL REQUIRED</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{problem.required_skill || 'general'}</div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>DESCRIPTION</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{problem.description || 'No details provided.'}</div>
          </div>

          <button
            onClick={handleDispatch}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: dispatched ? 'var(--accent-green)' : 'var(--accent-amber)',
              color: '#000', border: 'none', borderRadius: 10,
              padding: '14px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {dispatched ? <><ShieldCheck size={16} /> DISPATCHED</> : <><UploadCloud size={16} /> SEND VOLUNTEERS</>}
          </button>
        </div>
      </div>
    </div>
  )
}
