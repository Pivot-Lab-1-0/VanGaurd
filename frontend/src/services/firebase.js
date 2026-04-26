/**
 * Vanguard Auth Service
 * 
 * DEMO MODE: OTP 123456 always works.
 * PRODUCTION: Uncomment Firebase lines and fill .env values.
 */

// ── Demo user profiles (one per role for hackathon) ──────────────────────
const DEMO_USERS = {
  villager: {
    id:    'villager-001',
    phone: '+919000000002',
    name:  'Ramesh Meena',
    role:  'villager',
  },
  volunteer: {
    id:    'vol-001',
    phone: '+919876543210',
    name:  'Arjun Sharma',
    role:  'volunteer',
    skills: ['medical', 'first_aid'],
  },
  ngo: {
    id:    'ngo-001',
    phone: '+919000000001',
    name:  'Seva Foundation',
    role:  'ngo',
  },
}

const DEMO_OTP     = '123456'
const OTP_DELAY_MS = 1200   // Simulate network latency

// In-memory store for "sent" OTPs
const pendingOTPs = new Map()

/**
 * Step 1 — Send OTP to phone number.
 * In demo mode: logs the OTP and resolves after fake delay.
 */
export async function sendOTP(phoneNumber) {
  await new Promise(r => setTimeout(r, OTP_DELAY_MS))

  // Store against phone for verification step
  pendingOTPs.set(phoneNumber, DEMO_OTP)

  console.info(`[Vanguard Auth] OTP for ${phoneNumber}: ${DEMO_OTP}`)
  return { success: true, message: 'OTP sent (demo: use 123456)' }

  /* ── PRODUCTION FIREBASE SWAP ────────────────────────────────
  const { getAuth, signInWithPhoneNumber, RecaptchaVerifier } = await import('firebase/auth')
  const auth = getAuth()
  const recaptcha = new RecaptchaVerifier('recaptcha-container', { size: 'invisible' }, auth)
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptcha)
  window._vanguardConfirmation = confirmationResult
  return { success: true }
  ─────────────────────────────────────────────────────────────── */
}

/**
 * Step 2 — Verify OTP + return user profile.
 * Role is selected on the login screen for demo purposes.
 */
export async function verifyOTP(phoneNumber, otp, selectedRole) {
  await new Promise(r => setTimeout(r, 800))

  const expected = pendingOTPs.get(phoneNumber)

  if (otp !== DEMO_OTP) {
    throw new Error('Invalid OTP. Use 123456 for demo.')
  }

  pendingOTPs.delete(phoneNumber)

  // Return role-specific demo user
  const profile = DEMO_USERS[selectedRole] || DEMO_USERS.villager
  return { ...profile, phone: phoneNumber }

  /* ── PRODUCTION FIREBASE SWAP ────────────────────────────────
  const confirmation = window._vanguardConfirmation
  const result = await confirmation.confirm(otp)
  const idToken = await result.user.getIdToken()
  // Then call your backend: POST /api/auth/verify { idToken }
  // Backend returns { user: { id, phone, name, role } }
  ─────────────────────────────────────────────────────────────── */
}