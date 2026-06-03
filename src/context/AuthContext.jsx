import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../pages/supabase'
import { loadPreLoginChat, clearPreLoginChat } from '../utils/preLoginChat'

const AuthContext = createContext(null)

const DOCTOR_TOKEN_KEY  = 'medivora_doctor_token'
const DOCTOR_USER_KEY   = 'medivora_doctor_user'
const PATIENT_TOKEN_KEY = 'medivora_patient_token'
const PATIENT_USER_KEY  = 'medivora_patient_user'
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

function parseDoctorToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession]         = useState(null)   // Supabase session object
  const [user, setUser]               = useState(null)   // Supabase user object
  // Skip Supabase spinner if a custom JWT (doctor or patient) is already stored
  const hasDoctorJwt  = !!localStorage.getItem(DOCTOR_TOKEN_KEY)
  const hasPatientJwt = !!localStorage.getItem(PATIENT_TOKEN_KEY)
  const [loading, setLoading]         = useState(!hasDoctorJwt && !hasPatientJwt)
  const [initialized, setInitialized] = useState(hasDoctorJwt || hasPatientJwt)

  // Doctor JWT from custom backend auth (persisted in localStorage)
  const [doctorToken, setDoctorToken] = useState(() => localStorage.getItem(DOCTOR_TOKEN_KEY) || null)
  const [doctorUser,  setDoctorUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(DOCTOR_USER_KEY) || 'null') } catch { return null }
  })

  // Patient JWT from custom backend auth via MSG91 OTP (replaces Supabase phone OTP)
  const [patientToken, setPatientToken] = useState(() => localStorage.getItem(PATIENT_TOKEN_KEY) || null)
  const [patientUser,  setPatientUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(PATIENT_USER_KEY) || 'null') } catch { return null }
  })

  const [pendingChatRestore, setPendingChatRestore] = useState(null)

  const isAuthenticated = !!session || !!doctorToken || !!patientToken
  const role = doctorToken
    ? 'doctor'
    : patientToken
    ? 'patient'
    : (user?.user_metadata?.role || 'patient')
  const isDoctor  = role === 'doctor'
  const isPatient = isAuthenticated && role === 'patient'

  // ─── Restore session & subscribe to auth changes ─────────────────────────

  useEffect(() => {
    // Get the current session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
      setInitialized(true)
    })

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
      setInitialized(true)
      // On login, check if there's a pre-login chat to restore
      if (event === 'SIGNED_IN') {
        const pending = loadPreLoginChat()
        if (pending) setPendingChatRestore(pending)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ─── Login with email + password ─────────────────────────────────────────

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  }

  // ─── Sign up with email + password + full name ───────────────────────────

  async function signup(email, password, fullName) {
    const nameParts = (fullName || '').trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName  = nameParts.slice(1).join(' ') || ''
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:  fullName,   // kept for Supabase auth metadata compatibility
          first_name: firstName,
          last_name:  lastName,
        },
      },
    })
    if (error) throw new Error(error.message)
    // Supabase returns a fake success for duplicate emails (enumeration prevention).
    // Identities array is empty when the email is already registered.
    if (data?.user && data.user.identities?.length === 0) {
      throw new Error('This email is already registered. Please log in instead.')
    }
    return data
  }

  // ─── Phone OTP — send (MSG91 via backend) ───────────────────────────────
  // phone must be in E.164 format, e.g. "+919876543210"

  // ─── Phone OTP — send (proxied via backend to avoid browser CORS on Supabase) ──

  async function sendPhoneOtp(phone) {
    const res = await fetch(`${API_BASE}/auth/send-patient-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.detail || 'Failed to send OTP')
  }

  // ─── Phone OTP — verify (MSG91 via backend) ─────────────────────────────
  // Backend validates OTP, creates patient profile if new, returns custom JWT.

  async function verifyPhoneOtp(phone, otp) {
    // Try patient-otp first; if backend returns 404 (doctor-only profile),
    // fall back to the dual-otp endpoint which handles both roles.
    let res = await fetch(`${API_BASE}/auth/verify-patient-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      // 400 = wrong OTP — surface immediately, don't retry
      if (res.status === 400) throw new Error(errData?.detail || 'Invalid or expired OTP')
      // Any other failure (e.g. doctor profile) — try the dual endpoint
      res = await fetch(`${API_BASE}/auth/verify-dual-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      })
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.detail || 'Invalid or expired OTP')
    const patientInfo = {
      id:        data.user_id,
      full_name: data.full_name || '',
      phone,
      role:      'patient',
      is_new_user: data.is_new_user,
    }
    localStorage.setItem(PATIENT_TOKEN_KEY, data.token)
    localStorage.setItem(PATIENT_USER_KEY,  JSON.stringify(patientInfo))
    setPatientToken(data.token)
    setPatientUser(patientInfo)
    const pending = loadPreLoginChat()
    if (pending) setPendingChatRestore(pending)
    return data
  }

  // ─── Doctor OTP — send (via Medivora backend → MSG91) ───────────────────

  async function sendDoctorOtp(phone) {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.detail || 'Failed to send OTP')
    return data
  }

  // ─── Doctor OTP — verify (backend custom JWT) ───────────────────────────
  // Uses the same /auth/verify-otp endpoint as patients.
  // Rejects if the verified account is not a doctor.

  async function verifyDoctorOtp(phone, otp) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.detail || 'Invalid or expired OTP')

    if (data.user_type !== 'doctor') {
      throw new Error('No doctor account found for this phone number. Please contact admin.')
    }

    const token = data.token
    const payload = parseDoctorToken(token)
    const doctorInfo = {
      id:        data.user_id || payload?.sub,
      full_name: data.full_name || payload?.name || 'Doctor',
      email:     payload?.email || '',
      phone,
      role:      'doctor',
    }
    localStorage.setItem(DOCTOR_TOKEN_KEY, token)
    localStorage.setItem(DOCTOR_USER_KEY,  JSON.stringify(doctorInfo))
    setDoctorToken(token)
    setDoctorUser(doctorInfo)
    return { token, doctor: doctorInfo }
  }

  // ─── Doctor Login (custom backend JWT) ───────────────────────────────────

  async function doctorLogin(phone, password) {
    const formData = new FormData()
    formData.append('phone', phone)
    formData.append('password', password)
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const res = await fetch(`${API_BASE}/doctors/login`, { method: 'POST', body: formData })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.detail || 'Doctor login failed')
    const token = data.token
    const payload = parseDoctorToken(token)
    const doctorInfo = {
      id:        payload?.sub || data.doctor?.id,
      full_name: data.doctor?.name || data.doctor?.full_name || payload?.name || 'Doctor',
      email:     data.doctor?.email || payload?.email || '',
      phone:     data.doctor?.phone || phone,
      role:      'doctor',
    }
    localStorage.setItem(DOCTOR_TOKEN_KEY, token)
    localStorage.setItem(DOCTOR_USER_KEY,  JSON.stringify(doctorInfo))
    setDoctorToken(token)
    setDoctorUser(doctorInfo)
    return { token, doctor: doctorInfo }
  }

  // ─── Update doctor user info (after profile save) ────────────────────────

  function updateDoctorUser(patch) {
    const updated = { ...doctorUser, ...patch }
    localStorage.setItem(DOCTOR_USER_KEY, JSON.stringify(updated))
    setDoctorUser(updated)
  }

  // ─── Logout ──────────────────────────────────────────────────────────────

  async function logout() {
    // Clear persisted chat history so the next user starts fresh
    sessionStorage.removeItem('medivora_chat_session')
    clearPreLoginChat()
    setPendingChatRestore(null)
    // Clear doctor JWT
    localStorage.removeItem(DOCTOR_TOKEN_KEY)
    localStorage.removeItem(DOCTOR_USER_KEY)
    setDoctorToken(null)
    setDoctorUser(null)
    // Clear patient JWT
    localStorage.removeItem(PATIENT_TOKEN_KEY)
    localStorage.removeItem(PATIENT_USER_KEY)
    setPatientToken(null)
    setPatientUser(null)
    await supabase.auth.signOut()
  }

  function clearPendingRestore() {
    setPendingChatRestore(null)
    clearPreLoginChat()
  }

  // ─── Get auth token (doctor JWT → patient JWT → Supabase session) ────────

  function getToken() {
    if (doctorToken)  return doctorToken
    if (patientToken) return patientToken
    return session?.access_token || null
  }

  // ─── Derived helpers ─────────────────────────────────────────────────────

  /** The user's display name, falling back to email prefix */
  const _metaFirstName = user?.user_metadata?.first_name || ''
  const _metaLastName  = user?.user_metadata?.last_name  || ''
  const _metaFullName  = (_metaFirstName + ' ' + _metaLastName).trim()
  const displayName =
    doctorUser?.full_name ||
    patientUser?.full_name ||
    _metaFullName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'

  const currentUser = doctorUser || patientUser || user

  // ─── Context ─────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{
      session,
      user: currentUser,
      role,
      loading,
      initialized,
      isAuthenticated,
      isDoctor,
      isPatient,
      displayName,
      doctorToken,
      doctorUser,
      patientToken,
      patientUser,
      login,
      signup,
      sendPhoneOtp,
      verifyPhoneOtp,
      sendDoctorOtp,
      verifyDoctorOtp,
      doctorLogin,
      updateDoctorUser,
      logout,
      getToken,
      pendingChatRestore,
      clearPendingRestore,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
