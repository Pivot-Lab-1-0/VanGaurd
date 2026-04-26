import { useState, useEffect } from 'react'
import { MapPin, Clock, Zap, CheckCircle, X, Upload, Award } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { getMatches, confirmResolution } from '../services/api'

// Demo dispatches seeded for vol-001 (Arjun Sharma)
const DEMO_DISPATCHES = [
  {
    id: 'match-001',
    problem_id:    'prob-001',
    volunteer_id:  'vol-001',
    display_name:  'Arjun Sharma',
    vanguard_score: 79.86,
    distance_km:   24.3,
    skill_match:   1.0,
    status:        'notified',
    dispatched_at: new Date(Date.now() - 18 * 60000).toISOString(),
    responded_at:  null,
    // Extra fields for display
    problem_title:  'Child with critical fever — no transport',
    problem_urgency: 9,
    required_skill:  'medical',
    address:         'Kalyanpura, Jaipur Dist.',
    description:     '4yr old, 104°F fever, 30km from nearest clinic.',
  },
  {
    id: 'match-002',
    problem_id:    'prob-006',
    volunteer_id:  'vol-001',
    display_name:  'Arjun Sharma',
    vanguard_score: 86.12,
    distance_km:   41.7,
    skill_match:   1.0,
    status:        'notified',
    dispatched_at: new Date(Date.now() - 8 * 60000).toISOString(),
    responded_at:  null,
    problem_title:  'Snakebite — anti-venom needed urgently',
    problem_urgency: 10,
    required_skill:  'medical',
    address:         'Alwar rural zone',
    description:     'Adult male, neurotoxic bite. Golden hour closing.',
  },
  {
    id: 'match-003',
    problem_id:    'prob-007',
    volunteer_id:  'vol-001',
    display_name:  'Arjun Sharma',
    vanguard_score: 62.40,
    distance_km:   67.2,
    skill_match:   1.0,
    status:        'accepted',
    dispatched_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    responded_at:  new Date(Date.now() - 2.5 * 3600000).toISOString(),
    problem_title:  'Post-delivery complication — rural health center',
    problem_urgency: 7,
    required_skill:  'medical',
    address:         'Bandikui, Dausa Dist.',
    description:     'New mother, excessive bleeding. No OB/GYN available.',
  },
]

function urgencyColor(u) {
  if (u >= 8) return '#ef4444'
  if (u >= 5) return '#f59e0b'
  return '#22c55e'
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
}

const STATUS_META = {
  notified:  { label: 'AWAITING RESPONSE', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  accepted:  { label: 'ACCEPTED',          color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  rejected:  { label: 'DECLINED',          color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  confirmed: { label: 'RESOLVED ✓',        color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
  expired:   { label: 'EXPIRED',           color: '#4b5563', bg: 'rgba(75,85,99,0.1)'    },
}

export default function VolunteerView() {
  const user = useAuthStore(s => s.user)

  const [dispatches, setDispatches] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('active')   // active | history
  const [confirmingId, setConfirmingId] = useState(null)   // match ID being confirmed

  useEffect(() => {
    loadDispatches()
  }, [user])

  async function loadDispatches() {
    setLoading(true)
    try {
      // In real app: fetch matches for this volunteer from backend
      // const res = await api.get(`/api/volunteers/${user.id}/matches`)
      setDispatches(DEMO_DISPATCHES)
    } catch {
      setDispatches(DEMO_DISPATCHES)
    } finally {
      setLoading(false)
    }
  }

  function handleAccept(matchId) {
    setDispatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, status: 'accepted', responded_at: new Date().toISOString() } : m
    ))
  }

  function handleReject(matchId) {
    setDispatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, status: 'rejected', responded_at: new Date().toISOString() } : m
    ))
  }

  const active  = dispatches.filter(m => ['notified','accepted'].includes(m.status))
  const history = dispatches.filter(m => ['confirmed','rejected','expired'].includes(m.status))
  const shown   = activeTab === 'active' ? active : history

  return (
    <div style={{
      minHeight: 'calc(100vh - 52px)',
      padding: '28px 24px',
      maxWidth: 680, margin: '0 auto',
      position: 'relative', zIndex: 1,
    }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 9, letterSpacing: '0.2em',
          color: 'var(--accent-blue)', marginBottom: 6,
        }}>VOLUNTEER INTERFACE</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>
            {user?.name || 'Volunteer'}'s Dispatch Queue
          </h1>
          <div style={{
            display: 'flex', gap: 10, fontSize: 10,
            color: 'var(--text-dim)', letterSpacing: '0.05em',
          }}>
            <span style={{ color: '#22c55e' }}>
              ● {user?.skills?.join(' · ') || 'medical · first_aid'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, marginBottom: 24,
      }}>
        {[
          { label: 'ACTIVE',    value: active.length,   color: '#f59e0b' },
          { label: 'RESOLVED',  value: history.filter(m=>m.status==='confirmed').length, color: '#22c55e' },
          { label: 'MY SCORE',  value: '⭐ 4.9',         color: '#3b82f6' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderTop: `2px solid ${color}`,
            borderRadius: 4, padding: '12px 14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)', marginBottom: 20,
      }}>
        {[
          { id: 'active',  label: `ACTIVE (${active.length})`   },
          { id: 'history', label: `HISTORY (${history.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 20px', background: 'none',
            border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent-amber)' : 'transparent'}`,
            color: activeTab === tab.id ? 'var(--accent-amber)' : 'var(--text-secondary)',
            fontSize: 10, letterSpacing: '0.15em', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Dispatch cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontSize: 12 }}>
          Loading dispatches...
        </div>
      ) : shown.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 48,
          color: 'var(--text-dim)', fontSize: 12,
          border: '1px dashed var(--border)', borderRadius: 4,
        }}>
          No {activeTab} dispatches. Stand by.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {shown.map(dispatch => (
            <DispatchCard
              key={dispatch.id}
              dispatch={dispatch}
              onAccept={() => handleAccept(dispatch.id)}
              onReject={() => handleReject(dispatch.id)}
              onConfirm={() => setConfirmingId(dispatch.id)}
              isConfirming={confirmingId === dispatch.id}
              onConfirmSubmit={(proofUrl) => {
                setDispatches(prev => prev.map(m =>
                  m.id === dispatch.id
                    ? { ...m, status: 'confirmed', proof_image_url: proofUrl }
                    : m
                ))
                setConfirmingId(null)
              }}
              onConfirmCancel={() => setConfirmingId(null)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dispatch Card ────────────────────────────────────────────────────────────
function DispatchCard({
  dispatch, onAccept, onReject, onConfirm,
  isConfirming, onConfirmSubmit, onConfirmCancel,
}) {
  const sm = STATUS_META[dispatch.status] || STATUS_META.notified
  const uc = urgencyColor(dispatch.problem_urgency)
  const [proofFile,    setProofFile]    = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [submitting,   setSubmitting]   = useState(false)

  function handleProofChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setProofFile(f)
    setProofPreview(URL.createObjectURL(f))
  }

  async function handleConfirmSubmit() {
    setSubmitting(true)
    try {
      await confirmResolution({
        problem_id:      dispatch.problem_id,
        volunteer_id:    dispatch.volunteer_id,
        proof_image_url: proofPreview || null,
      })
    } catch (_) { /* demo: proceed anyway */ }
    finally { setSubmitting(false) }
    onConfirmSubmit(proofPreview)
  }

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${uc}`,
      borderRadius: 6, overflow: 'hidden',
    }}>

      {/* Card header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          {/* Urgency + status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              background: `${uc}20`, border: `1px solid ${uc}`,
              color: uc, fontSize: 8, fontWeight: 700,
              padding: '2px 7px', borderRadius: 2, letterSpacing: '0.1em',
            }}>URG {dispatch.problem_urgency}/10</span>
            <span style={{
              background: sm.bg, color: sm.color,
              fontSize: 8, fontWeight: 700, padding: '2px 7px',
              borderRadius: 2, letterSpacing: '0.1em',
            }}>{sm.label}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>
            {dispatch.problem_title}
          </div>
          {dispatch.description && (
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {dispatch.description}
            </div>
          )}
        </div>

        {/* Vanguard score badge */}
        <div style={{
          textAlign: 'center', flexShrink: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 4, padding: '8px 12px',
        }}>
          <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 4 }}>
            VANGUARD
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-amber)', lineHeight: 1 }}>
            {dispatch.vanguard_score.toFixed(1)}
          </div>
          <div style={{ fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>SCORE</div>
        </div>
      </div>

      {/* Meta row */}
      <div style={{
        padding: '10px 18px',
        display: 'flex', flexWrap: 'wrap', gap: '14px',
        fontSize: 10, color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={10} /> {dispatch.address}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          📏 {dispatch.distance_km.toFixed(1)} km away
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={10} /> Dispatched {timeAgo(dispatch.dispatched_at)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          🎯 {dispatch.required_skill?.replace('_', ' ')}
        </span>
      </div>

      {/* ── Action area ── */}
      {dispatch.status === 'notified' && (
        <div style={{
          padding: '12px 18px',
          display: 'flex', gap: 10,
        }}>
          <button onClick={onAccept} style={{
            flex: 1, padding: '10px 0',
            background: 'var(--accent-blue)', color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 11,
            fontWeight: 700, letterSpacing: '0.1em',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <CheckCircle size={12} /> ACCEPT MISSION
          </button>
          <button onClick={onReject} style={{
            padding: '10px 16px',
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', borderRadius: 4, fontSize: 11,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <X size={12} /> DECLINE
          </button>
        </div>
      )}

      {dispatch.status === 'accepted' && !isConfirming && (
        <div style={{ padding: '12px 18px' }}>
          <div style={{
            fontSize: 9, color: '#3b82f6', letterSpacing: '0.1em',
            marginBottom: 10,
          }}>
            ● MISSION ACTIVE — Upload proof when complete
          </div>
          <button onClick={onConfirm} style={{
            width: '100%', padding: '10px 0',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid #22c55e',
            color: '#22c55e', borderRadius: 4, fontSize: 11,
            fontWeight: 700, letterSpacing: '0.1em',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Award size={12} /> MARK RESOLVED + UPLOAD PROOF
          </button>
        </div>
      )}

      {/* ── Proof upload flow ── */}
      {isConfirming && (
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            fontSize: 9, letterSpacing: '0.2em',
            color: 'var(--accent-amber)', marginBottom: 12,
          }}>DECENTRALIZED CONSENSUS — UPLOAD PROOF</div>

          <label style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 8, padding: 16,
            border: `2px dashed ${proofFile ? '#22c55e' : 'var(--border)'}`,
            borderRadius: 4, cursor: 'pointer', marginBottom: 12,
            background: proofFile ? 'rgba(34,197,94,0.04)' : 'transparent',
            transition: 'all 0.2s',
          }}>
            {proofPreview ? (
              <img src={proofPreview} alt="proof"
                style={{ maxHeight: 160, borderRadius: 4, objectFit: 'cover' }} />
            ) : (
              <>
                <Upload size={18} color="var(--text-dim)" />
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Upload "after" photo as proof
                </div>
              </>
            )}
            <input
              type="file" accept="image/*"
              onChange={handleProofChange}
              style={{ display: 'none' }}
            />
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleConfirmSubmit}
              disabled={submitting}
              style={{
                flex: 1, padding: '10px 0',
                background: submitting ? 'var(--bg-card)' : '#22c55e',
                color: submitting ? 'var(--text-dim)' : '#000',
                border: 'none', borderRadius: 4, fontSize: 11,
                fontWeight: 700, letterSpacing: '0.1em',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {submitting ? 'SUBMITTING...' : '✓ CONFIRM RESOLUTION'}
            </button>
            <button onClick={onConfirmCancel} style={{
              padding: '10px 14px', background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)', borderRadius: 4,
              fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
            }}>CANCEL</button>
          </div>

          <div style={{
            fontSize: 9, color: 'var(--text-dim)',
            marginTop: 8, lineHeight: 1.5, letterSpacing: '0.05em',
          }}>
            5/5 volunteer confirmations auto-close this mission.
            Your submission counts toward the consensus threshold.
          </div>
        </div>
      )}

      {/* Confirmed state */}
      {dispatch.status === 'confirmed' && (
        <div style={{
          padding: '12px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 11, color: '#22c55e',
        }}>
          <CheckCircle size={14} />
          Resolution confirmed. Impact logged to your profile.
        </div>
      )}
    </div>
  )
}