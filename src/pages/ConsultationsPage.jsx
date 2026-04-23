import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Video, CalendarClock, CheckCircle, Clock,
  AlertCircle, RefreshCw, X, FileText, Stethoscope, User,
  ChevronRight, ClipboardList, CreditCard, IndianRupee, Calendar,
} from 'lucide-react'
import { supabase } from './supabase'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { formatSpecialty, formatConsultationType, formatConsultationStatus } from '../utils/labels'
import TimeSlotPicker from '../components/TimeSlotPicker'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

const STATUS_TABS = ['All', 'Upcoming', 'Past']

function normaliseStatus(s, scheduledAt) {
  if (!s) return 'upcoming'
  if (s === 'completed') return 'completed'
  if (s === 'cancelled' || s === 'no_show') return 'cancelled'
  // If scheduled time has passed, treat as past
  if ((s === 'scheduled' || s === 'confirmed') && scheduledAt && new Date(scheduledAt) < new Date()) return 'completed'
  if (s === 'requested' || s === 'confirmed' || s === 'scheduled' || s === 'ongoing') return 'upcoming'
  return 'upcoming'
}

function mapRow(c) {
  const doctorName = c.doctor_name || 'Pending assignment'
  const specialty  = c.doctor_specialty || c.specialty || 'General Medicine'
  return {
    id:              c.id,
    doctorId:        c.doctor_id || null,
    doctorName,
    specialty:       formatSpecialty(specialty),
    topic:           c.patient_note || 'Consultation request',
    datetime:        c.scheduled_at || c.created_at,
    completedAt:     c.completed_at,
    startedAt:       c.started_at,
    patientJoinedAt: c.patient_joined_at || null,
    durationMin:     c.duration_minutes,
    status:          normaliseStatus(c.status, c.scheduled_at),
    rawStatus:       c.status,
    roomUrl:         c.room_url,
    patientToken:    c.patient_token,
    summary:         c.summary,
    followUpPlan:    c.follow_up_plan,
    consultType:     c.consultation_type || 'video',
    createdAt:       c.created_at,
    consultationFee: c.consultation_fee ?? null,
    clinicAddress:   c.clinic_address || '',
    prescriptionId:  c.prescription_id || null,
  }
}

function formatWhen(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return iso }
}

function canJoin(datetime, rawStatus, now) {
  if (rawStatus === 'ongoing') return true
  if (!datetime) return false
  return now >= new Date(datetime).getTime() - 5 * 60 * 1000
}

function JoinCallButton({ datetime, rawStatus, now, onClick, size = 'lg', rejoining = false }) {
  const enabled = rejoining || canJoin(datetime, rawStatus, now)
  const [showTip, setShowTip] = useState(false)
  const tipRef = useRef(null)

  const btnStyle = size === 'lg'
    ? { width: '100%', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none' }
    : { padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'var(--font)', display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none' }

  const icon  = rejoining ? <RefreshCw size={size === 'lg' ? 16 : 14} /> : <Video size={size === 'lg' ? 16 : 14} />
  const label = rejoining ? 'Rejoin Call' : 'Join Video Call'

  const enabledStyle  = rejoining
    ? { ...btnStyle, border: `1.5px solid #059669`, background: 'transparent', color: '#059669', cursor: 'pointer' }
    : { ...btnStyle, background: 'linear-gradient(135deg,#1930AA,#00AFEF)', color: '#fff', cursor: 'pointer' }
  const disabledStyle = { ...btnStyle, background: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.3)', cursor: 'not-allowed' }

  const scheduledAt = datetime ? new Date(datetime) : null
  const openAt = scheduledAt ? new Date(scheduledAt.getTime() - 5 * 60 * 1000) : null
  const tipText = openAt
    ? `Available at ${openAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    : 'Not yet available'

  return (
    <div style={{ position: 'relative', width: size === 'lg' ? '100%' : undefined }}
      onMouseEnter={() => !enabled && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <button
        type="button"
        onClick={enabled ? onClick : undefined}
        disabled={!enabled}
        style={enabled ? enabledStyle : disabledStyle}
      >
        {icon} {label}
      </button>
      {!enabled && showTip && (
        <div ref={tipRef} style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
          background: '#1a1a2e', color: '#fff', fontSize: 12, fontWeight: 500, padding: '7px 12px',
          borderRadius: 8, whiteSpace: 'nowrap', zIndex: 100, pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        }}>
          {tipText}
          <div style={{ position: 'absolute', top: '100%', left: 20, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1a1a2e' }} />
        </div>
      )}
    </div>
  )
}

function statusIcon(status) {
  if (status === 'upcoming')  return <Clock size={14} color="var(--cyan)" />
  return <CheckCircle size={14} color="var(--ok)" />
}

function statusLabel(rawStatus) {
  return formatConsultationStatus(rawStatus) || 'Upcoming'
}

/* ── Payment Modal ───────────────────────────────────── */
async function confirmPayment(consultation, token) {
  const res = await fetch(`${API_BASE}/consultation/${consultation.id}/confirm-payment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to confirm booking')
  }
  return await res.json()
}

function PaymentModal({ consultation, token, onSuccess, onClose }) {
  const { isMobile } = useBreakpoint()
  const fee   = consultation.consultationFee
  const [state, setState] = useState('idle') // idle | paying | success | error
  const [errMsg, setErrMsg] = useState('')

  const handlePay = async () => {
    setState('paying')
    setErrMsg('')
    try {
      await confirmPayment(consultation, token)
      setState('success')
      setTimeout(() => { onSuccess(); onClose() }, 1800)
    } catch (e) {
      setErrMsg(e.message || 'Payment failed. Please try again.')
      setState('error')
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 20, padding: isMobile ? '20px 16px' : '32px 28px', zIndex: 301,
        width: '100%', maxWidth: isMobile ? 'calc(100vw - 32px)' : 380, boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
        fontFamily: 'var(--font)', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(25,48,170,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} color="#1930AA" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--g300)' }}>Confirm Booking</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color="var(--g500)" /></button>
        </div>

        {/* Summary */}
        <div style={{ borderRadius: 12, background: '#f9fafb', border: '1px solid rgba(0,0,0,0.07)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--g500)' }}>Doctor</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--g300)' }}>{consultation.doctorName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--g500)' }}>Specialty</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cyan)' }}>{consultation.specialty}</span>
          </div>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--g500)' }}>Consultation Fee</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1930AA', display: 'flex', alignItems: 'center', gap: 2 }}>
              <IndianRupee size={14} strokeWidth={2.5} />
              {fee}
            </span>
          </div>
        </div>

        {state === 'error' && (
          <p style={{ fontSize: 12, color: 'var(--err)', margin: 0, textAlign: 'center' }}>{errMsg}</p>
        )}

        {state === 'success' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, background: 'rgba(0,200,83,0.1)', color: '#00C853', fontWeight: 700, fontSize: 14 }}>
            <CheckCircle size={18} /> Payment confirmed!
          </div>
        ) : (
          <button
            onClick={handlePay}
            disabled={state === 'paying'}
            style={{
              padding: '14px', borderRadius: 12, border: 'none', cursor: state === 'paying' ? 'default' : 'pointer',
              background: state === 'paying' ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg,#1930AA,#00AFEF)',
              color: state === 'paying' ? 'var(--g500)' : '#fff', fontSize: 14, fontWeight: 700,
              fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {state === 'paying' ? (
              <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
            ) : (
              <><CreditCard size={15} /> Pay ₹{fee} & Confirm</>
            )}
          </button>
        )}

        <p style={{ fontSize: 11, color: 'var(--g700)', textAlign: 'center', margin: 0 }}>
          Secure payment · 100% refundable if cancelled
        </p>
      </div>
    </>
  )
}

/* ── Detail Drawer ───────────────────────────────────── */
function DetailDrawer({ c, onClose, now, onReschedule }) {
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()
  if (!c) return null
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100 }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: isMobile ? '100%' : '440px',
        background: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.15)', fontFamily: 'var(--font)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
                padding: '4px 10px', borderRadius: 20, marginBottom: 10,
                background: c.status === 'completed' ? 'rgba(0,180,100,0.1)' : c.status === 'cancelled' ? 'rgba(255,61,0,0.08)' : 'rgba(0,175,239,0.1)',
                color: c.status === 'completed' ? '#00a855' : c.status === 'cancelled' ? '#d93a00' : '#0088cc',
              }}>
                {statusIcon(c.status)} {statusLabel(c.rawStatus)}
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--g300)', margin: '0 0 4px', fontFamily: 'var(--serif)' }}>
                {c.doctorName}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 600, margin: 0 }}>{c.specialty}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g500)', padding: 4, borderRadius: 8, marginTop: -2 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Chief complaint */}
          <Section icon={<Stethoscope size={15} color="var(--cyan)" />} title="Chief Complaint">
            <p style={{ fontSize: 14, color: 'var(--g400)', margin: 0, lineHeight: 1.6 }}>{c.topic}</p>
          </Section>

          {/* Timing */}
          <Section icon={<CalendarClock size={15} color="var(--cyan)" />} title="Appointment Details">
            <Row label="Type"       value={formatConsultationType(c.consultType)} />
            <Row label="Requested"  value={formatWhen(c.createdAt)} />
            {c.datetime && <Row label="Scheduled"  value={formatWhen(c.datetime)} />}
            {c.startedAt && <Row label="Started"    value={formatWhen(c.startedAt)} />}
            {c.completedAt && <Row label="Completed" value={formatWhen(c.completedAt)} />}
            {c.durationMin && <Row label="Duration"  value={`${c.durationMin} min`} />}
          </Section>

          {/* Doctor */}
          <Section icon={<User size={15} color="var(--cyan)" />} title="Doctor">
            <Row label="Name"      value={c.doctorName} />
            <Row label="Specialty" value={c.specialty} />
            {c.clinicAddress && <Row label="Clinic" value={c.clinicAddress} />}
          </Section>

          {/* Post-consultation summary */}
          {(c.summary || c.followUpPlan) && (
            <Section icon={<ClipboardList size={15} color="var(--cyan)" />} title="Post-Consultation Notes">
              {c.summary && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--g500)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Summary</p>
                  <p style={{ fontSize: 13, color: 'var(--g400)', margin: 0, lineHeight: 1.6 }}>{c.summary}</p>
                </div>
              )}
              {c.followUpPlan && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--g500)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Follow-up Plan</p>
                  <p style={{ fontSize: 13, color: 'var(--g400)', margin: 0, lineHeight: 1.6 }}>{c.followUpPlan}</p>
                </div>
              )}
            </Section>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {c.rawStatus === 'requested' && !c.roomUrl && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,160,0,0.07)', border: '1px solid rgba(255,160,0,0.25)', fontSize: 13, color: '#E65100', textAlign: 'center', fontWeight: 600 }}>
                💳 Please pay to confirm your consultation
              </div>
            )}
            {(c.rawStatus === 'scheduled' || c.rawStatus === 'ongoing') && c.consultType === 'video' && c.status !== 'completed' && (
              <JoinCallButton
                datetime={c.datetime}
                rawStatus={c.rawStatus}
                now={now}
                rejoining={!!c.patientJoinedAt}
                onClick={() => navigate(`/consultation/${c.id}/call`)}
                size="lg"
              />
            )}
            {(c.rawStatus === 'scheduled' || c.rawStatus === 'ongoing') && c.consultType !== 'video' && c.status !== 'completed' && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(0,180,100,0.07)', border: '1px solid rgba(0,180,100,0.25)', fontSize: 13, color: '#00a855', textAlign: 'center', fontWeight: 600 }}>
                Booking confirmed — visit {c.doctorName} at their clinic
                {c.clinicAddress && <div style={{ fontSize: 12, fontWeight: 400, marginTop: 4, color: '#00a855' }}>{c.clinicAddress}</div>}
              </div>
            )}
            {c.rawStatus === 'scheduled' && c.status === 'completed' && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,160,0,0.07)', border: '1px solid rgba(255,160,0,0.25)', fontSize: 13, color: '#E65100', textAlign: 'center', fontWeight: 600 }}>
                Appointment time has passed
              </div>
            )}
            {c.rawStatus === 'scheduled' && c.doctorId && c.status !== 'completed' && (
              <button
                type="button"
                onClick={() => onReschedule(c)}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid rgba(0,175,239,0.4)', background: 'rgba(0,175,239,0.06)', color: '#0088cc', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Calendar size={16} /> Reschedule Appointment
              </button>
            )}
            {c.rawStatus === 'completed' && c.prescriptionId && (
              <button
                type="button"
                onClick={() => navigate('/prescriptions')}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#1930AA,#00AFEF)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FileText size={16} /> View Prescription
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  )
}

function Section({ icon, title, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {icon}
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--g500)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{title}</p>
      </div>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <span style={{ fontSize: 12, color: 'var(--g500)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--g300)', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────── */
export default function ConsultationsPage() {
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()
  const [query, setQuery]               = useState('')
  const [statusTab, setStatusTab]       = useState('All')
  const [consultations, setConsultations] = useState([])
  const [loadingData, setLoadingData]   = useState(true)
  const [error, setError]               = useState('')
  const [selected, setSelected]         = useState(null)
  const [payTarget, setPayTarget]       = useState(null)  // consultation to pay for
  const [rescheduleTarget, setRescheduleTarget] = useState(null) // consultation to reschedule
  const [authToken, setAuthToken]       = useState('')
  const [now, setNow]                   = useState(Date.now())

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) setAuthToken(session.access_token)
    })
  }, [])

  async function fetchConsultations() {
    setLoadingData(true); setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setConsultations([]); return }

      const res = await fetch(`${API_BASE}/consultation/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      const rows = data?.sessions || []
      setConsultations(rows.map(mapRow))
    } catch (err) {
      console.error('Failed to load consultations:', err)
      setError('Could not load consultations. Please try again.')
    } finally { setLoadingData(false) }
  }

  useEffect(() => { fetchConsultations() }, [])

  async function handlePatientReschedule(slot) {
    if (!rescheduleTarget) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const form = new FormData()
      form.append('scheduled_at', slot.date + 'T' + slot.time + ':00')
      const res = await fetch(`/api/consultation/${rescheduleTarget.id}/slot`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) throw new Error('Failed to reschedule')
      setRescheduleTarget(null)
      setSelected(null)
      fetchConsultations()
    } catch (e) {
      console.error('Reschedule failed:', e)
    }
  }

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const filtered = useMemo(() => {
    let list = consultations
    if (statusTab !== 'All') {
      const key = statusTab.toLowerCase()
      list = list.filter(c =>
        key === 'upcoming' ? c.status === 'upcoming'
        : c.status === 'completed'
      )
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(c =>
        c.doctorName.toLowerCase().includes(q) ||
        c.topic.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
  }, [consultations, query, statusTab])

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--dark)', fontFamily: 'var(--font)', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, padding: isMobile ? '16px 16px 12px' : '20px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--g300)', margin: 0, fontFamily: 'var(--serif)' }}>
            Consultations
          </h1>
          <button
            onClick={() => fetchConsultations()}
            disabled={loadingData}
            title="Refresh"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g500)', padding: 6, borderRadius: 8, opacity: loadingData ? 0.4 : 1 }}
          >
            <RefreshCw size={16} style={{ animation: loadingData ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--g500)', margin: 0 }}>Tap any consultation to view full details.</p>

        <div style={{ marginTop: 16, position: 'relative', maxWidth: 480 }}>
          <Search size={18} color="var(--g500)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="search" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search doctor, topic, or specialty…"
            style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', fontSize: 14, fontFamily: 'var(--font)', outline: 'none', background: '#ffffff', color: 'var(--g300)', boxSizing: 'border-box' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,175,239,0.45)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)' }}
          />
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', overflowX: 'auto' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--g500)', marginRight: 4, flexShrink: 0 }}>Status</span>
          {STATUS_TABS.map(tab => {
            const active = statusTab === tab
            return (
              <button key={tab} type="button" onClick={() => setStatusTab(tab)} style={{
                padding: '7px 14px', borderRadius: 50,
                border: active ? '1.5px solid rgba(25,48,170,0.35)' : '1px solid rgba(0,0,0,0.1)',
                background: active ? 'rgba(25,48,170,0.08)' : '#ffffff',
                color: active ? '#1930AA' : 'var(--g400)',
                fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer', fontFamily: 'var(--font)',
              }}>{tab}</button>
            )
          })}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 16px 24px' : '16px 20px 24px' }}>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,61,0,0.06)', border: '1px solid rgba(255,61,0,0.15)', color: '#d93a00', fontSize: 13, marginBottom: 16 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loadingData && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--g500)', fontSize: 14 }}>
            Loading consultations…
          </div>
        )}

        {!loadingData && !error && (
          <>
            <p style={{ fontSize: 12, color: 'var(--g500)', marginBottom: 14 }}>
              {filtered.length} consultation{filtered.length !== 1 ? 's' : ''}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(c => (
                <article
                  key={c.id}
                  onClick={() => setSelected(c)}
                  style={{
                    borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', background: '#ffffff',
                    padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
                    boxShadow: '0 2px 12px rgba(25,48,170,0.06)',
                    cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(25,48,170,0.12)'; e.currentTarget.style.borderColor = 'rgba(0,175,239,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(25,48,170,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--g300)', margin: '0 0 4px' }}>{c.doctorName}</h2>
                      <p style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600, margin: 0 }}>{c.specialty}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--g500)' }}>
                        {statusIcon(c.status)}
                        <span>{statusLabel(c.rawStatus)}</span>
                      </div>
                      <ChevronRight size={14} color="var(--g700)" />
                    </div>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--g400)', margin: 0 }}>{c.topic}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g500)' }}>
                    <CalendarClock size={16} color="var(--cyan)" />
                    {formatWhen(c.datetime)}
                    {c.durationMin && <span style={{ color: 'var(--g700)' }}>· {c.durationMin} min</span>}
                  </div>

                  {/* Quick actions inline — stop propagation so card click doesn't also trigger */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }} onClick={e => e.stopPropagation()}>
                    {(c.rawStatus === 'scheduled' || c.rawStatus === 'ongoing') && c.consultType === 'video' && c.status !== 'completed' && (
                      <JoinCallButton
                        datetime={c.datetime}
                        rawStatus={c.rawStatus}
                        now={now}
                        rejoining={!!c.patientJoinedAt}
                        onClick={() => navigate(`/consultation/${c.id}/call`)}
                        size="sm"
                      />
                    )}
                    {c.rawStatus === 'scheduled' && c.doctorId && c.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => setRescheduleTarget(c)}
                        style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid rgba(0,175,239,0.4)', background: 'rgba(0,175,239,0.06)', color: '#0088cc', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <Calendar size={14} /> Reschedule
                      </button>
                    )}
                    {(c.rawStatus === 'scheduled' || c.rawStatus === 'ongoing') && c.consultType !== 'video' && c.status !== 'completed' && (
                      <span style={{ fontSize: 12, color: '#00a855', fontWeight: 600, alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <CheckCircle size={13} /> Visit {c.doctorName} at their clinic
                      </span>
                    )}
                    {c.rawStatus === 'requested' && !c.roomUrl && (
                      c.consultationFee != null ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setPayTarget(c)}
                            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#FF6D00,#FFA000)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                            <CreditCard size={14} /> Pay ₹{c.consultationFee}
                          </button>
                          <span style={{ fontSize: 11, color: 'var(--g500)', fontStyle: 'italic', alignSelf: 'center' }}>
                            Please pay to confirm
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--g500)', fontStyle: 'italic', alignSelf: 'center' }}>
                          Awaiting doctor assignment
                        </span>
                      )
                    )}
                    {c.status === 'completed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelected(c)}
                          style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', color: 'var(--g400)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={14} /> View summary
                        </button>
                        {c.prescriptionId && (
                          <button
                            type="button"
                            onClick={() => navigate('/prescriptions')}
                            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1930AA,#00AFEF)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={14} /> View Prescription
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--g500)', fontSize: 14 }}>
                {consultations.length === 0
                  ? 'No consultations yet. Ask the AI assistant to book one for you!'
                  : 'No consultations match your filters.'}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail Drawer ── */}
      {selected && <DetailDrawer c={selected} onClose={() => setSelected(null)} now={now} onReschedule={setRescheduleTarget} />}

      {/* ── Payment Modal ── */}
      {payTarget && (
        <PaymentModal
          consultation={payTarget}
          token={authToken}
          onClose={() => setPayTarget(null)}
          onSuccess={() => { setPayTarget(null); fetchConsultations() }}
        />
      )}

      {/* ── Reschedule Slot Picker ── */}
      {rescheduleTarget && rescheduleTarget.doctorId && (
        <TimeSlotPicker
          doctor={{ id: rescheduleTarget.doctorId, name: rescheduleTarget.doctorName }}
          onConfirm={handlePatientReschedule}
          onClose={() => setRescheduleTarget(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
