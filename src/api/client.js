// Medivora API Client — talks to the FastAPI backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Make an authenticated JSON request to the backend.
 */
export async function apiFetch(path, options = {}) {
  const { method = 'GET', body, token, headers: extra = {} } = options

  const headers = { 'Content-Type': 'application/json', ...extra }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = data?.detail
      ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
      : `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    throw err
  }

  return data
}

/**
 * Make a form-data request (api.py endpoints use Form(...) not JSON).
 */
export async function apiFormRequest(path, fields = {}, token = null, method = 'POST') {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value))
    }
  }

  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = data?.detail
      ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
      : `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    throw err
  }

  return data
}

// Backward compat alias
export const apiFormPost = apiFormRequest

// ─── Auth API (uses form-data to match api.py's Form(...) endpoints) ────

export const authAPI = {
  signup: (body) => apiFormPost('/auth/register', body),
  login: (body) => apiFormPost('/auth/login', body),
  sendOtp: (phone) => apiFormPost('/auth/send-otp', { phone }),
  verifyOtp: (body) => apiFormPost('/auth/verify-otp', body),
}

// ─── Profile API ──────────────────────────────────────────────────────

export const profileAPI = {
  getProfile: (userId, token) => apiFetch(`/auth/user/${userId}`, { token }),
  updateProfile: (userId, fields, token) => apiFormRequest(`/auth/user/${userId}`, fields, token, 'PUT'),
  deleteAccount: (token) => apiFetch('/account', { method: 'DELETE', token }),
}

// ─── Chat History API ─────────────────────────────────────────────────

export const chatHistoryAPI = {
  getSessions: (userId, token) => apiFetch(`/chat/sessions/${userId}`, { token }),
  getHistory: (sessionId, token) => apiFetch(`/chat/history/${sessionId}`, { token }),
  deleteSession: (sessionId, token) => apiFetch(`/chat/sessions/${sessionId}`, { method: 'DELETE', token }),
}

// ─── Patient API (legacy compat) ─────────────────────────────────────

export const patientAPI = {
  getProfile: (token) => apiFetch('/auth/user', { token }),
  updateProfile: (body, token) => apiFetch('/patients/profile', { method: 'PUT', body, token }),
  getMedicalRecords: (token) => apiFetch('/patients/medical-records', { token }),
  createMedicalRecord: (body, token) => apiFetch('/patients/medical-records', { method: 'POST', body, token }),
}

// ─── Consultation API ─────────────────────────────────────────────────────

export const consultationAPI = {
  getMy: (token) => apiFetch('/consultation/my', { token }),
}

// ─── Doctor API ───────────────────────────────────────────────────────────

export const doctorAPI = {
  // Profile
  getProfile: (token) =>
    apiFetch('/doctor/profile', { token }),
  updateProfile: (fields, token) =>
    apiFormRequest('/doctor/profile', fields, token, 'PUT'),

  // Consultations
  getConsultations: (token) =>
    apiFetch('/consultation/doctor', { token }),
  scheduleConsultation: (sessionId, fields, token) =>
    apiFormRequest(`/consultation/${sessionId}/schedule`, fields, token, 'PATCH'),
  rejectConsultation: (sessionId, reason, token) =>
    apiFormRequest(`/consultation/${sessionId}/reject`, { reason }, token, 'PATCH'),
  joinConsultation: (sessionId, token) =>
    apiFetch(`/consultation/${sessionId}/join`, { method: 'POST', token }),

  // Prescription approvals
  getPendingApprovals: (token) =>
    apiFetch('/approvals/pending', { token }),
  getApproval: (approvalId, token) =>
    apiFetch(`/approvals/${approvalId}`, { token }),
  approveRx: (approvalId, fields, token) =>
    apiFormRequest(`/approvals/${approvalId}/approve`, fields, token, 'POST'),
  rejectRx: (approvalId, fields, token) =>
    apiFormRequest(`/approvals/${approvalId}/reject`, fields, token, 'POST'),
  modifyRx: (approvalId, fields, token) =>
    apiFormRequest(`/approvals/${approvalId}/modify`, fields, token, 'POST'),
  generatePdf: (approvalId, token) =>
    apiFetch(`/prescriptions/${approvalId}/generate-pdf`, { method: 'POST', token }),

  // Patients
  getPatients: (token) =>
    apiFetch('/doctors/patients', { token }),
  getPatientDetail: (patientId, token) =>
    apiFetch(`/doctors/patients/${patientId}`, { token }),
}
