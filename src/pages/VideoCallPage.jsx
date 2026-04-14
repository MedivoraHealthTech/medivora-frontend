import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Video, AlertCircle, Loader, CheckCircle, FileText, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

export default function VideoCallPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { getToken, initialized } = useAuth()

  const isDoctor = location.pathname.startsWith('/doctor/')

  const iframeRef = useRef(null)

  const [callDetails, setCallDetails]         = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState('')
  const [ended, setEnded]                     = useState(false)

  // Doctor-side states
  const [completing, setCompleting]           = useState(false)
  const [doctorCompleted, setDoctorCompleted] = useState(false)

  // Patient-side states
  const [consultStatus, setConsultStatus]     = useState(null)
  const pollRef                               = useRef(null)

  // ── Fetch call details ─────────────────────────────────────────
  useEffect(() => {
    if (!initialized) return
    ;(async () => {
      try {
        const token = getToken()
        if (!token) { setError('Please log in to join the call.'); setLoading(false); return }

        const res = await fetch(`${API_BASE}/consultation/${id}/call-details`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.detail || `Error ${res.status}`)
        }
        const data = await res.json()
        setCallDetails(data)
        setConsultStatus(data.status)

        if (data.role !== 'doctor') {
          fetch(`${API_BASE}/consultation/${id}/patient-join`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {})
        }
      } catch (e) {
        setError(e.message || 'Could not load call details.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, initialized])

  // ── Detect leave via Daily's postMessage ───────────────────────
  // Daily's prebuilt UI sends window.postMessage({action:'left-meeting'})
  // when the participant clicks the Leave button inside the iframe.
  useEffect(() => {
    if (!callDetails) return
    const handler = (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.action === 'left-meeting') setEnded(true)
      } catch { /* malformed message — ignore */ }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [callDetails])

  // ── Poll consultation status on patient's ended screen ─────────
  useEffect(() => {
    if (!ended || isDoctor) return

    const poll = async () => {
      try {
        const token = getToken()
        if (!token) return
        const res = await fetch(`${API_BASE}/consultation/${id}/call-details`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setConsultStatus(data.status)
        if (data.status === 'completed') clearInterval(pollRef.current)
      } catch { /* ignore */ }
    }

    pollRef.current = setInterval(poll, 4000)
    return () => clearInterval(pollRef.current)
  }, [ended, id, getToken])

  // Clicking our "Exit" button: blank the iframe (disconnects from Daily)
  // and show the ended screen.
  const exitCall = useCallback(() => {
    if (iframeRef.current) iframeRef.current.src = 'about:blank'
    setEnded(true)
  }, [])

  const handleComplete = useCallback(async () => {
    setCompleting(true)
    try {
      const token = getToken()
      await fetch(`${API_BASE}/consultation/${id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setDoctorCompleted(true)
    } catch {
      setDoctorCompleted(true)
    } finally {
      setCompleting(false)
    }
  }, [id, getToken])

  const goToConsultations = useCallback(() => {
    navigate(isDoctor ? '/doctor/consultations' : '/consultations')
  }, [navigate, isDoctor])

  /* ── Loading ── */
  if (loading) return (
    <div style={overlay}>
      <Loader size={28} color="#00AFEF" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#888', fontSize: 14, marginTop: 12 }}>Connecting to your room…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  /* ── Error ── */
  if (error) return (
    <div style={overlay}>
      <AlertCircle size={32} color="#d93a00" />
      <p style={{ color: '#d93a00', fontSize: 14, marginTop: 12, maxWidth: 320, textAlign: 'center' }}>{error}</p>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>← Go back</button>
    </div>
  )

  /* ── Ended: Doctor screen ── */
  if (ended && isDoctor) return (
    <div style={overlay}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: doctorCompleted ? 'rgba(0,200,83,0.1)' : 'rgba(25,48,170,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        {doctorCompleted ? <CheckCircle size={28} color="#00C853" /> : <Video size={26} color="#1930AA" />}
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
        {doctorCompleted ? 'Consultation Completed' : 'Call Ended'}
      </h2>
      <p style={{ fontSize: 13, color: '#888', margin: '0 0 28px', maxWidth: 300, textAlign: 'center' }}>
        {doctorCompleted
          ? 'You can now generate a prescription for this patient.'
          : 'Click below to mark the consultation as complete and proceed to the prescription.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
        {!doctorCompleted ? (
          <button onClick={handleComplete} disabled={completing}
            style={{ ...primaryBtn, background: 'linear-gradient(135deg,#1930AA,#00AFEF)', opacity: completing ? 0.75 : 1 }}>
            {completing
              ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Completing…</>
              : <><CheckCircle size={14} /> Complete Consultation</>}
          </button>
        ) : (
          <button onClick={goToConsultations} style={{ ...primaryBtn, background: 'linear-gradient(135deg,#059669,#10b981)' }}>
            <FileText size={14} /> Generate Prescription
          </button>
        )}
        <button onClick={goToConsultations} style={ghostBtn}>Back to Consultations</button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  /* ── Ended: Patient screen ── */
  if (ended) {
    const isCompleted = consultStatus === 'completed'
    return (
      <div style={overlay}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: isCompleted ? 'rgba(0,200,83,0.1)' : 'rgba(0,175,239,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          {isCompleted ? <CheckCircle size={28} color="#00C853" /> : <Video size={26} color="#00AFEF" />}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
          {isCompleted ? 'Consultation Completed' : 'Call Left'}
        </h2>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 28px', maxWidth: 300, textAlign: 'center' }}>
          {isCompleted
            ? 'Your doctor has completed the consultation. Your prescription will appear in the Prescriptions tab shortly.'
            : 'The call has ended. You can rejoin if the session is still active, or wait for the doctor to complete.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
          {!isCompleted && (
            <button onClick={() => setEnded(false)}
              style={{ ...primaryBtn, background: 'linear-gradient(135deg,#1930AA,#00AFEF)' }}>
              <RefreshCw size={14} /> Rejoin Call
            </button>
          )}
          <button onClick={goToConsultations} style={ghostBtn}>Back to Consultations</button>
        </div>
        {!isCompleted && (
          <p style={{ fontSize: 11, color: '#bbb', marginTop: 20 }}>Waiting for doctor to complete the consultation…</p>
        )}
      </div>
    )
  }

  /* ── Active call ── */
  // Pure iframe approach — no Daily JS SDK on the host page.
  // The token is passed as the `t` URL parameter (Daily's documented method).
  // The `allow` attribute grants camera/mic to Daily's cross-origin iframe.
  // StrictMode-safe: React manages the iframe as a normal DOM element and does
  // NOT unmount/remount it during the double-invoke of effects.
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', padding: '10px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', pointerEvents: 'none' }}>
        <button
          onClick={exitCall}
          style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(6px)' }}
        >
          <ArrowLeft size={14} /> Exit
        </button>
        <div style={{ marginLeft: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {callDetails?.specialty
              ? callDetails.specialty.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase())
              : 'Video Consultation'}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginLeft: 10 }}>
            Powered by Daily
          </span>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        src={`${callDetails.room_url}?t=${callDetails.auth_token}`}
        allow="camera *; microphone *; autoplay *; display-capture *; picture-in-picture *; clipboard-write *"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        title="Video Consultation"
      />
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: '#f0f4fa', fontFamily: 'var(--font)',
}

const primaryBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '12px 24px', borderRadius: 12, border: 'none',
  color: '#fff', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit', width: '100%',
}

const ghostBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '11px 24px', borderRadius: 12,
  border: '1.5px solid rgba(0,0,0,0.12)', background: 'transparent',
  color: '#555', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit', width: '100%',
}

const backBtnStyle = {
  marginTop: 20, padding: '10px 22px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
  color: '#fff', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
}
