// Centralised auth-token helpers.
// Priority: doctor custom JWT → patient custom JWT → Supabase session
// Replaces all per-file supabase.auth.getSession() token grabs.

import { supabase } from '../pages/supabase'

function jwtPayload(token) {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return null }
}

export async function getAuthToken() {
  const doctorToken = localStorage.getItem('medivora_doctor_token')
  if (doctorToken) return doctorToken
  const patientToken = localStorage.getItem('medivora_patient_token')
  if (patientToken) return patientToken
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch { return null }
}

export async function getAuthUser() {
  const doctorToken = localStorage.getItem('medivora_doctor_token')
  if (doctorToken) {
    const p = jwtPayload(doctorToken)
    return p ? { token: doctorToken, userId: p.sub } : null
  }
  const patientToken = localStorage.getItem('medivora_patient_token')
  if (patientToken) {
    const p = jwtPayload(patientToken)
    return p ? { token: patientToken, userId: p.sub } : null
  }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session ? { token: session.access_token, userId: session.user.id } : null
  } catch { return null }
}
