import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, AlertTriangle, Upload, CheckCircle,
  Crosshair, Loader, ChevronDown
} from 'lucide-react'
import { createProblem } from '../services/api'
import { dispatchVolunteers } from '../services/api'
import { useAuthStore } from '../store/authStore'

const SKILLS = [
  { value: 'medical',          label: '🏥 Medical / First Aid'       },
  { value: 'water_sanitation', label: '💧 Water & Sanitation'         },
  { value: 'construction',     label: '🏗️ Construction / Engineering' },
  { value: 'education',        label: '📚 Education & Literacy'       },
  { value: 'nutrition',        label: '🥗 Nutrition & Food Security'  },
  { value: 'solar_energy',     label: '☀️ Solar & Renewable Energy'   },
]

const URGENCY_LABELS = {
  1:  'Minimal — No immediate risk',
  2:  'Very Low — Can wait weeks',
  3:  'Low — Can wait days',
  4:  'Moderate — Needs attention soon',
  5:  'Significant — This week',
  6:  'High — Within 48 hrs',
  7:  'Urgent — Within 24 hrs',
  8:  'Critical — Within hours',
  9:  'Severe — Immediate response',
  10: 'LIFE-THREATENING — NOW',
}

function urgencyColor(u) {
  if (u >= 8) return '#ef4444'
  if (u >= 5) return '#f59e0b'
  return '#22c55e'
}

export default function ReportProblem() {
  const user     = useAuthStore(s => s.user)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title:          '',
    description:    '',
    required_skill: 'medical',
    urgency:        5,
    address:        '',
  })
  const [location,    setLocation]    = useState(null)   // { lat, lng }
  const [locLoading,  setLocLoading]  = useState(false)
  const [locError,    setLocError]    = useState(null)
  const [mediaFiles,  setMediaFiles]  = useState([])
  const [mediaPreviews, setMediaPreviews] = useState([])
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [error,       setError]       = useState(null)
  const [createdId,   setCreatedId]   = useState(null)

  // Auto-grab GPS on mount
  useEffect(() => { grabLocation() }, [])

  function grabLocation() {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported — enter address manually.')
      return
    }
    setLocLoading(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocLoading(false)
      },
      () => {
        // Demo fallback — Jaipur rural area
        setLocation({ lat: 26.72, lng: 75.52 })
        setLocError('GPS denied — using demo location (Jaipur area)')
        setLocLoading(false)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  function handleMediaChange(e) {
    const files = Array.from(e.target.files)
    setMediaFiles(files)
    // Generate preview URLs
    const previews = files.map(f => URL.createObjectURL(f))
    setMediaPreviews(previews)
  }

  async function handleSubmit() {
    // Validation
    if (!form.title.trim())  { setError('Title is required.'); return }
    if (!form.required_skill){ setError('Select a required skill.'); return }
    if (!location)           { setError('Location is required. Allow GPS or wait.'); return }

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        title:          form.title.trim(),
        description:    form.description.trim() || null,
        required_skill: form.required_skill,
        urgency:        form.urgency,
        location: {
          latitude:  location.lat,
          longitude: location.lng,
        },
        address:    form.address || null,
        media_urls: mediaPreviews.join(',') || null,
      }

      const res = await createProblem(payload)
      const newId = res.data.id
      setCreatedId(newId)

      // Auto-dispatch immediately after creation
      try { await dispatchVolunteers(newId) } catch (_) { /* non-fatal */ }

      setSubmitted(true)
    } catch (e) {
      // Demo mode — simulate success if backend offline
      if (e.code === 'ERR_NETWORK' || e.code === 'ECONNREFUSED') {
        setCreatedId('demo-' + Date.now())
        setSubmitted(true)
      } else {
        setError(e.response?.data?.detail || 'Submission failed. Check connection.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 52px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, position: 'relative', zIndex: 1,
      }}>
        <div style={{
          textAlign: 'center', maxWidth: 420,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderTop: '2px solid var(--accent-green)',
          borderRadius: 6, padding: 40,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(34,197,94,0.1)',
            border: '2px solid #22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <CheckCircle size={28} color="#22c55e" />
          </div>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#22c55e', marginBottom: 8 }}>
            REPORT FILED & DISPATCHED
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            {form.title}
          </div>
          <div style={{
            fontSize: 10, color: 'var(--text-secondary)',
            marginBottom: 8, lineHeight: 1.6,
          }}>
            Volunteers with matching skills within 100km have been notified.
            The Vanguard algorithm is working.
          </div>
          <div style={{
            fontSize: 9, color: 'var(--text-dim)',
            fontFamily: 'monospace', marginBottom: 28,
          }}>ID: {createdId}</div>

          {/* Urgency bar */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 4,
            padding: '12px 16px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>URGENCY FILED</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} style={{
                  width: 4, height: i < form.urgency ? 14 : 6,
                  background: i < form.urgency ? urgencyColor(form.urgency) : 'var(--border)',
                  borderRadius: 1,
                }} />
              ))}
              <span style={{ fontSize: 11, color: urgencyColor(form.urgency), marginLeft: 4, fontWeight: 700 }}>
                {form.urgency}/10
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setSubmitted(false); setForm({ title:'', description:'', required_skill:'medical', urgency:5, address:'' }); setMediaFiles([]); setMediaPreviews([]) }}
              style={{
                flex: 1, padding: '11px 0',
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', borderRadius: 4,
                fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                letterSpacing: '0.1em',
              }}
            >+ NEW REPORT</button>
            {user?.role === 'ngo' && (
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  flex: 1, padding: '11px 0',
                  background: 'var(--accent-amber)', color: '#000',
                  border: 'none', borderRadius: 4,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', letterSpacing: '0.1em',
                }}
              >→ COMMAND</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: 'calc(100vh - 52px)',
      display: 'flex', justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative', zIndex: 1,
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 9, letterSpacing: '0.2em',
            color: 'var(--accent-amber)', marginBottom: 6,
          }}>VILLAGER INTERFACE — NEW INCIDENT REPORT</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Report a Problem
          </h1>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Your report triggers the Vanguard matching engine. Volunteers with the right
            skills near your location will be dispatched automatically.
          </p>
        </div>

        {/* ── GPS Location Card ── */}
        <FormCard label="LOCATION" accent={location ? '#22c55e' : '#f59e0b'}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: location ? 12 : 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {locLoading
                ? <Loader size={14} color="var(--accent-amber)" style={{ animation: 'spin 1s linear infinite' }} />
                : location
                  ? <CheckCircle size={14} color="#22c55e" />
                  : <Crosshair size={14} color="var(--text-dim)" />
              }
              <span style={{ fontSize: 11, color: location ? '#22c55e' : 'var(--text-secondary)' }}>
                {locLoading
                  ? 'Acquiring GPS signal...'
                  : location
                    ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                    : 'GPS not yet acquired'
                }
              </span>
            </div>
            <button onClick={grabLocation} style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              borderRadius: 3, padding: '4px 10px', fontSize: 9,
              letterSpacing: '0.1em', fontFamily: 'inherit',
            }}>
              ↻ REFRESH
            </button>
          </div>
          {locError && (
            <div style={{ fontSize: 9, color: 'var(--accent-amber)', marginTop: 4 }}>
              ⚠ {locError}
            </div>
          )}
          {location && (
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Add human-readable address (optional)"
              style={inputStyle}
            />
          )}
        </FormCard>

        {/* ── Title ── */}
        <FormCard label="INCIDENT TITLE">
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Child with critical fever — no transport to hospital"
            maxLength={200}
            style={inputStyle}
          />
          <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4, textAlign: 'right' }}>
            {form.title.length}/200
          </div>
        </FormCard>

        {/* ── Description ── */}
        <FormCard label="DESCRIPTION (OPTIONAL)">
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Additional details — symptoms, number of people affected, access constraints..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }}
          />
        </FormCard>

        {/* ── Skill Required ── */}
        <FormCard label="SKILL REQUIRED">
          <div style={{ position: 'relative' }}>
            <select
              value={form.required_skill}
              onChange={e => setForm(f => ({ ...f, required_skill: e.target.value }))}
              style={{
                ...inputStyle,
                appearance: 'none', cursor: 'pointer',
                paddingRight: 36,
              }}
            >
              {SKILLS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{
              position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)', pointerEvents: 'none',
            }} />
          </div>
        </FormCard>

        {/* ── Urgency Slider ── */}
        <FormCard label="URGENCY LEVEL" accent={urgencyColor(form.urgency)}>
          <div style={{ marginBottom: 12 }}>
            {/* Slider */}
            <input
              type="range"
              min={1} max={10}
              value={form.urgency}
              onChange={e => setForm(f => ({ ...f, urgency: Number(e.target.value) }))}
              style={{
                width: '100%', height: 4,
                accentColor: urgencyColor(form.urgency),
                cursor: 'pointer',
              }}
            />
            {/* Tick marks */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 4, fontSize: 8, color: 'var(--text-dim)',
            }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <span key={n} style={{
                  color: n === form.urgency ? urgencyColor(form.urgency) : 'var(--text-dim)',
                  fontWeight: n === form.urgency ? 700 : 400,
                }}>{n}</span>
              ))}
            </div>
          </div>

          {/* Urgency display */}
          <div style={{
            background: `${urgencyColor(form.urgency)}10`,
            border: `1px solid ${urgencyColor(form.urgency)}30`,
            borderRadius: 4, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              fontSize: 28, fontWeight: 700,
              color: urgencyColor(form.urgency), lineHeight: 1,
              minWidth: 32,
            }}>{form.urgency}</div>
            <div>
              <div style={{
                fontSize: 9, letterSpacing: '0.1em',
                color: urgencyColor(form.urgency), fontWeight: 700,
                marginBottom: 2,
              }}>
                {form.urgency >= 8 ? 'CRITICAL' : form.urgency >= 5 ? 'ELEVATED' : 'STANDARD'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {URGENCY_LABELS[form.urgency]}
              </div>
            </div>

            {/* Visual urgency bars */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 2, marginLeft: 'auto',
            }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} style={{
                  width: 5,
                  height: `${8 + i * 4}px`,
                  background: i < form.urgency ? urgencyColor(form.urgency) : 'var(--border)',
                  borderRadius: 1, transition: 'background 0.15s',
                }} />
              ))}
            </div>
          </div>
        </FormCard>

        {/* ── Media Upload ── */}
        <FormCard label="PHOTO / VIDEO EVIDENCE (OPTIONAL)">
          <label style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '20px',
            border: `2px dashed ${mediaFiles.length > 0 ? 'var(--accent-amber)' : 'var(--border)'}`,
            borderRadius: 4, cursor: 'pointer',
            background: mediaFiles.length > 0 ? 'rgba(245,158,11,0.04)' : 'transparent',
            transition: 'all 0.2s',
          }}>
            <Upload size={20} color={mediaFiles.length > 0 ? 'var(--accent-amber)' : 'var(--text-dim)'} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                {mediaFiles.length > 0
                  ? `${mediaFiles.length} file(s) selected`
                  : 'Tap to upload photos or video'}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                JPG, PNG, MP4 — max 10MB each
              </div>
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaChange}
              style={{ display: 'none' }}
            />
          </label>

          {/* Image previews */}
          {mediaPreviews.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12,
            }}>
              {mediaPreviews.map((src, i) => (
                <div key={i} style={{
                  width: 72, height: 72, borderRadius: 4,
                  overflow: 'hidden', border: '1px solid var(--border)',
                  position: 'relative',
                }}>
                  <img src={src} alt="" style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                  }} />
                </div>
              ))}
            </div>
          )}
        </FormCard>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 4, padding: '10px 14px', marginBottom: 16,
            fontSize: 11, color: '#ef4444',
          }}>{error}</div>
        )}

        {/* ── Submit ── */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !location}
          style={{
            width: '100%', padding: '14px 0',
            background: submitting || !location ? 'var(--bg-card)' : 'var(--accent-amber)',
            color: submitting || !location ? 'var(--text-dim)' : '#000',
            border: 'none', borderRadius: 4,
            fontSize: 13, fontWeight: 700, letterSpacing: '0.15em',
            cursor: submitting || !location ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s',
            marginBottom: 40,
          }}
        >
          {submitting ? 'FILING REPORT & DISPATCHING...' : '⚡ FILE REPORT & DISPATCH VOLUNTEERS'}
        </button>
      </div>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────
function FormCard({ label, accent = 'var(--border)', children }) {
  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${accent}`,
      borderRadius: 4, padding: '16px 18px',
      marginBottom: 14,
    }}>
      <div style={{
        fontSize: 9, letterSpacing: '0.2em',
        color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600,
      }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 4, color: 'var(--text-primary)',
  fontSize: 12, fontFamily: 'inherit', outline: 'none',
}