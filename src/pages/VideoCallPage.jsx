import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { JitsiMeeting } from '@jitsi/react-sdk'
import { ArrowLeft, Video, AlertCircle, Loader } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

export default function VideoCallPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getToken, initialized } = useAuth()

  const [callDetails, setCallDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ended, setEnded] = useState(false)

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
        setCallDetails(await res.json())
      } catch (e) {
        setError(e.message || 'Could not load call details.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, initialized])

  const handleReadyToClose = useCallback(async () => {
    setEnded(true)
    // Mark consultation as ended (best-effort)
    try {
      const token = getToken()
      if (token) {
        await fetch(`${API_BASE}/consultation/${id}/end`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch { /* ignore */ }
  }, [id, getToken])

  const goBack = () => {
    const isDoctor = callDetails?.role === 'doctor'
    navigate(isDoctor ? '/doctor/consultations' : '/consultations')
  }

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

  /* ── Ended ── */
  if (ended) return (
    <div style={overlay}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,200,83,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Video size={24} color="#00C853" />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>Call ended</h2>
      <p style={{ fontSize: 13, color: '#888', margin: '0 0 24px' }}>Thank you for using Medivora.</p>
      <button onClick={goBack} style={backBtnStyle}>← Back to Consultations</button>
    </div>
  )

  /* ── Active call ── */
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', padding: '10px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', pointerEvents: 'none' }}>
        <button
          onClick={goBack}
          style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(6px)' }}
        >
          <ArrowLeft size={14} /> Exit
        </button>
        <div style={{ marginLeft: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {callDetails.specialty
              ? callDetails.specialty.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase())
              : 'Video Consultation'}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginLeft: 10 }}>
            Powered by Jitsi Meet
          </span>
        </div>
      </div>

      {/* Jitsi iframe */}
      <JitsiMeeting
        domain={callDetails.domain}
        roomName={callDetails.room_name}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        }}
        interfaceConfigOverwrite={{
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          DISPLAY_WELCOME_FOOTER: false,
          APP_NAME: 'Medivora',
          NATIVE_APP_NAME: 'Medivora',
          PROVIDER_NAME: 'Medivora',
          DEFAULT_BACKGROUND: '#1a1a2e',
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop',
            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
            'settings', 'raisehand', 'videoquality', 'filmstrip', 'tileview',
          ],
        }}
        userInfo={{ displayName: callDetails.display_name }}
        onReadyToClose={handleReadyToClose}
        getIFrameRef={node => {
          if (node) {
            node.style.height = '100%'
            node.style.width = '100%'
            node.style.border = 'none'
          }
        }}
      />
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: '#f0f4fa', fontFamily: 'var(--font)',
}

const backBtnStyle = {
  padding: '10px 22px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
  color: '#fff', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
}
