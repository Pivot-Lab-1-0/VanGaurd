import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, Phone, Hash, ChevronRight, AlertCircle } from 'lucide-react'
import { sendOTP, verifyOTP } from '../services/firebase'
import { useAuthStore } from '../store/authStore'

const ROLES = [
  {
    id:    'villager',
    label: 'VILLAGER',
    desc:  'Report community problems',
    color: '#22c55e',
    icon:  '🏘️',
  },
  {
    id:    'volunteer',
    label: 'VOLUNTEER',
    desc:  'Respond to dispatches',
    color: '#3b82f6',
    icon:  '⚡',
  },
  {
    id:    'ngo',
    label: 'NGO / ADMIN',
    desc:  'Command center access',
    color: '#f59e0b',
    icon:  '🛡️',
  },
]

export default function Login() {
  const navigate      = useNavigate()
  const location      = useLocation()
  const login         = useAuthStore(s => s.login)

  const [step,         setStep]         = useState('phone')   // phone | otp
  const [phone,        setPhone]        = useState('')
  const [otp,          setOtp]          = useState('')
  const [role,         setRole]         = useState('ngo')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [otpHint,      setOtpHint]      = useState(false)

  const redirectTo = location.state?.from?.pathname || roleDefaultRoute(role)

  function roleDefaultRoute(r) {
    if (r === 'ngo')       return '/dashboard'
    if (r === 'volunteer') return '/volunteer'
    return '/report'
  }

  async function handleSendOTP() {
    if (phone.length < 10) {
      setError('Enter a valid 10-digit mobile number.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`
      await sendOTP(fullPhone)
      setOtpHint(true)
      setStep('otp')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP() {
    if (otp.length !== 6) {
      setError('OTP must be 6 digits.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`
      const user = await verifyOTP(fullPhone, otp, role)
      login(user)
      navigate(redirectTo, { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 52px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', zIndex: 1,
    }}>

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderTop: '2px solid var(--accent-amber)',
        borderRadius: 6, overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '28px 28px 20px',
          borderBottom: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 44, height: 44, margin: '0 auto 16px',
            background: 'var(--accent-amber)',
            clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
          }} />
          <div style={{
            fontSize: 18, fontWeight: 700, letterSpacing: '0.2em',
            color: 'var(--text-primary)', marginBottom: 4,
          }}>VANGUARD</div>
          <div style={{
            fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em',
          }}>THE VERIFIED IMPACT PIPELINE</div>
        </div>

        <div style={{ padding: 28 }}>

          {/* ── STEP 1: Role + Phone ── */}
          {step === 'phone' && (
            <>
              {/* Role selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  fontSize: 9, letterSpacing: '0.2em',
                  color: 'var(--text-secondary)', display: 'block', marginBottom: 10,
                }}>SELECT YOUR ROLE</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ROLES.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px',
                        background: role === r.id ? `${r.color}12` : 'var(--bg-card)',
                        border: `1px solid ${role === r.id ? r.color : 'var(--border)'}`,
                        borderRadius: 4, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s', color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700,
                          letterSpacing: '0.1em', color: role === r.id ? r.color : 'var(--text-primary)',
                        }}>{r.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
                          {r.desc}
                        </div>
                      </div>
                      {role === r.id && (
                        <ChevronRight size={14} style={{ color: r.color }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 9, letterSpacing: '0.2em',
                  color: 'var(--text-secondary)', display: 'block', marginBottom: 8,
                }}>MOBILE NUMBER</label>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 4, overflow: 'hidden',
                }}>
                  <span style={{
                    padding: '0 12px', color: 'var(--text-dim)',
                    fontSize: 12, borderRight: '1px solid var(--border)',
                    height: '100%', display: 'flex', alignItems: 'center',
                  }}>🇮🇳 +91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value.replace(/\D/g, ''))
                      setError(null)
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                    placeholder="9876543210"
                    style={{
                      flex: 1, padding: '12px 14px',
                      background: 'transparent', border: 'none',
                      color: 'var(--text-primary)', fontSize: 14,
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <Phone size={14} style={{ color: 'var(--text-dim)', marginRight: 12 }} />
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              <button
                onClick={handleSendOTP}
                disabled={loading}
                style={primaryButtonStyle(loading)}
              >
                {loading ? 'SENDING OTP...' : 'SEND OTP →'}
              </button>
            </>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 'otp' && (
            <>
              <div style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 4, padding: '10px 14px', marginBottom: 20,
                fontSize: 10, color: '#22c55e', lineHeight: 1.6,
              }}>
                OTP sent to +91{phone}
                {otpHint && (
                  <span style={{ color: 'var(--accent-amber)', marginLeft: 6 }}>
                    (Demo: use <strong>123456</strong>)
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 9, letterSpacing: '0.2em',
                  color: 'var(--text-secondary)', display: 'block', marginBottom: 8,
                }}>ENTER 6-DIGIT OTP</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center',
                    background: 'var(--bg-card)',
                    border: `1px solid ${otp.length === 6 ? 'var(--accent-green)' : 'var(--border)'}`,
                    borderRadius: 4, overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}>
                    <Hash size={14} style={{ color: 'var(--text-dim)', marginLeft: 12 }} />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={e => {
                        setOtp(e.target.value.replace(/\D/g, ''))
                        setError(null)
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                      placeholder="123456"
                      autoFocus
                      style={{
                        flex: 1, padding: '14px 12px',
                        background: 'transparent', border: 'none',
                        color: 'var(--text-primary)', fontSize: 22,
                        fontFamily: 'inherit', outline: 'none',
                        letterSpacing: '0.3em', textAlign: 'center',
                      }}
                    />
                  </div>
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                style={primaryButtonStyle(loading || otp.length !== 6)}
              >
                {loading ? 'VERIFYING...' : 'AUTHENTICATE →'}
              </button>

              <button
                onClick={() => { setStep('phone'); setOtp(''); setError(null) }}
                style={{
                  width: '100%', marginTop: 10, padding: '10px 0',
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', borderRadius: 4,
                  fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >← CHANGE NUMBER</button>
            </>
          )}

          {/* Demo hint */}
          <div style={{
            marginTop: 20, paddingTop: 16,
            borderTop: '1px solid var(--border)',
            fontSize: 9, color: 'var(--text-dim)',
            textAlign: 'center', letterSpacing: '0.08em',
          }}>
            HACKATHON DEMO — OTP IS ALWAYS 123456
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────
function ErrorBox({ message }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 4, padding: '10px 12px', marginBottom: 16,
      fontSize: 11, color: '#ef4444',
    }}>
      <AlertCircle size={12} style={{ marginTop: 1, flexShrink: 0 }} />
      {message}
    </div>
  )
}

function primaryButtonStyle(disabled) {
  return {
    width: '100%', padding: '13px 0',
    background: disabled ? 'var(--bg-card)' : 'var(--accent-amber)',
    color: disabled ? 'var(--text-dim)' : '#000',
    border: 'none', borderRadius: 4,
    fontSize: 12, fontWeight: 700, letterSpacing: '0.15em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', transition: 'all 0.2s',
  }
}