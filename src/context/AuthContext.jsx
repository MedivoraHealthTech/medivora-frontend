import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../pages/supabase'
import { loadPreLoginChat, clearPreLoginChat } from '../utils/preLoginChat'

const AuthContext = createContext(null)

const DOCTOR_TOKEN_KEY = 'medivora_doctor_token'
const DOCTOR_USER_KEY  = 'medivora_doctor_user'

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
  // If a doctor JWT is already in localStorage we can skip the Supabase spinner
  const hasDoctorJwt = !!localStorage.getItem(DOCTOR_TOKEN_KEY)
  const [loading, setLoading]         = useState(!hasDoctorJwt)
  const [initialized, setInitialized] = useState(hasDoctorJwt)

  // Doctor JWT from custom backend auth (persisted in localStorage)
  const [doctorToken, setDoctorToken] = useState(() => localStorage.getItem(DOCTOR_TOKEN_KEY) || null)
  const [doctorUser,  setDoctorUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(DOCTOR_USER_KEY) || 'null') } catch { return null }
  })

  const [pendingChatRestore, setPendingChatRestore] = useState(null)

  const isAuthenticated = !!session || !!doctorToken
  const role = doctorToken
    ? 'doctor'
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

  // ─── Phone OTP — send (Supabase) ─────────────────────────────────────────
  // phone must be in E.164 format, e.g. "+919876543210"

  async function sendPhoneOtp(phone) {
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) throw new Error(error.message)
  }

  // ─── Phone OTP — verify (Supabase) ───────────────────────────────────────
  // Immediately syncs session state to avoid race condition on navigation.

  async function verifyPhoneOtp(phone, token) {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
    if (error) throw new Error(error.message)
    // Fix: set session synchronously so ProtectedRoute sees isAuthenticated=true
    // before navigate('/chat') causes a re-render.
    if (data.session) {
      setSession(data.session)
      setUser(data.user)
      const pending = loadPreLoginChat()
      if (pending) setPendingChatRestore(pending)
    }
    return data
  }

  // ─── Doctor OTP — send ───────────────────────────────────────────────────

  async function sendDoctorOtp(phone) {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const form = new FormData()
    form.append('phone', phone)
    const res = await fetch(`${API_BASE}/doctors/send-otp`, { method: 'POST', body: form })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.detail || 'Could not send OTP')
    return data
  }

  // ─── Doctor OTP — verify ─────────────────────────────────────────────────

  async function verifyDoctorOtp(phone, otp) {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const form = new FormData()
    form.append('phone', phone)
    form.append('otp', otp)
    const res = await fetch(`${API_BASE}/doctors/verify-otp`, { method: 'POST', body: form })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.detail || 'OTP verification failed')
    if (data.new_doctor) throw new Error('No doctor account found with this phone number.')
    const token = data.token
    const payload = parseDoctorToken(token)
    const doctorInfo = {
      id:        data.doctor?.id || payload?.sub,
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

  // ─── Logout ──────────────────────────────────────────────────────────────

  async function logout() {
    // Clear persisted chat history so the next user starts fresh
    sessionStorage.removeItem('medivora_chat_session')
    clearPreLoginChat()
    setPendingChatRestore(null)
    // Clear doctor JWT if present
    localStorage.removeItem(DOCTOR_TOKEN_KEY)
    localStorage.removeItem(DOCTOR_USER_KEY)
    setDoctorToken(null)
    setDoctorUser(null)
    await supabase.auth.signOut()
  }

  function clearPendingRestore() {
    setPendingChatRestore(null)
    clearPreLoginChat()
  }

  // ─── Get auth token (works for both Supabase + doctor JWT) ───────────────

  function getToken() {
    if (doctorToken) return doctorToken
    return session?.access_token || null
  }

  // ─── Derived helpers ─────────────────────────────────────────────────────

  /** The user's display name, falling back to email prefix */
  const _metaFirstName = user?.user_metadata?.first_name || ''
  const _metaLastName  = user?.user_metadata?.last_name  || ''
  const _metaFullName  = (_metaFirstName + ' ' + _metaLastName).trim()
  const displayName =
    doctorUser?.full_name ||
    _metaFullName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'

  const currentUser = doctorUser || user

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
      login,
      signup,
      sendPhoneOtp,
      verifyPhoneOtp,
      sendDoctorOtp,
      verifyDoctorOtp,
      doctorLogin,
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
