import { useState, useEffect } from 'react'
import {
  CalendarDays, Clock, CheckCircle, XCircle, Video,
  User, ChevronDown, ChevronUp, Calendar, AlertTriangle, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { doctorAPI } from '../../api/client'

const STATUS_TABS = ['All', 'Requested', 'Scheduled', 'Completed', 'Cancelled']

const statusColor = s => {
  if (s === 'requested')  return 'var(--warn)'
  if (s === 'scheduled')  return 'var(--cyan)'
  if (s === 'completed')  return 'var(--ok)'
  if (s === 'cancelled')  return 'var(--err)'
  if (s === 'ongoing')    return 'var(--blue)'
  return 'var(--g500)'
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--dark)', borderRadius: 16, padding: '28px 28px', width: '100%', maxWidth: 440, boxShadow: '0 12px 40px rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--g300)' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color='var(--g500)' /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function DoctorConsultations() {
  const { getToken } = useAuth()

  const [consultations, setConsultations] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [activeTab,     setActiveTab]     = useState('All')
  const [expanded,      setExpanded]      = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [error,         setError]         = useState('')

  // Schedule modal
  const [scheduleFor,   setScheduleFor]  = useState(null)
  const [scheduleTime,  setScheduleTime] = useState('')
  const [scheduleNote,  setScheduleNote] = useState('')

  // Reject modal
  const [rejectFor,     setRejectFor]    = useState(null)
  const [rejectReason,  setRejectReason] = useState('')

  useEffect(() => { fetchConsultations() }, [])

  async function fetchConsultations() {
    setLoading(true)
    try {
      const data = await doctorAPI.getConsultations(getToken())
      setConsultations(data?.sessions || [])
    } catch (e) {
      setError('Could not load consultations.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = consultations.filter(c => {
    if (activeTab === 'All')       return true
    if (activeTab === 'Requested') return c.status === 'requested'
    if (activeTab === 'Scheduled') return c.status === 'scheduled' || c.status === 'ongoing'
    if (activeTab === 'Completed') return c.status === 'completed'
    if (activeTab === 'Cancelled') return c.status === 'cancelled'
    return true
  })

  async function handleSchedule(e) {
    e.preventDefault()
    if (!scheduleTime) return
    setActionLoading('schedule')
    try {
      await doctorAPI.scheduleConsultation(scheduleFor.id, { scheduled_at: scheduleTime, note: scheduleNote }, getToken())
      setScheduleFor(null)
      setScheduleTime('')
      setScheduleNote('')
      await fetchConsultations()
    } catch (err) {
      setError(err.message || 'Failed to schedule consultation')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(e) {
    e.preventDefault()
    setActionLoading('reject')
    try {
      await doctorAPI.rejectConsultation(rejectFor.id, rejectReason, getToken())
      setRejectFor(null)
      setRejectReason('')
      await fetchConsultations()
    } catch (err) {
      setError(err.message || 'Failed to reject consultation')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleJoin(session) {
    setActionLoading(session.id)
    try {
      const data = await doctorAPI.joinConsultation(session.id, getToken())
      if (data?.room_url) window.open(data.room_url, '_blank')
    } catch (err) {
      setError(err.message || 'Failed to join consultation')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,188,212,0.2)', borderTopColor: 'var(--cyan)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: 'var(--dark)' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--g300)', fontFamily: 'var(--serif)', margin: '0 0 4px' }}>Consultations</h1>
        <p style={{ fontSize: 13, color: 'var(--g500)', margin: 0 }}>Manage patient consultation requests and scheduled sessions.</p>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,61,0,0.07)', border: '1px solid rgba(255,61,0,0.18)', color: '#d93a00', fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 0 }}>
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
            background: activeTab === tab ? 'rgba(25,48,170,0.07)' : 'transparent',
            color: activeTab === tab ? '#1930AA' : 'var(--g500)',
            borderBottom: activeTab === tab ? '2px solid #1930AA' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {tab}
            {tab === 'Requested' && consultations.filter(c => c.status === 'requested').length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 50, background: 'var(--warn)', color: '#fff' }}>
                {consultations.filter(c => c.status === 'requested').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--g500)' }}>
          <CalendarDays size={32} color='rgba(0,0,0,0.15)' style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: 14 }}>No consultations in this category</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ borderRadius: 14, background: 'var(--pw)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>

              {/* Card header */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(25,48,170,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={18} color='#1930AA' />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)', margin: '0 0 2px' }}>
                      {c.patient_name || 'Patient'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--g500)', margin: 0 }}>
                      {c.specialty || 'General Medicine'}
                      {c.scheduled_at && ` · ${new Date(c.scheduled_at).toLocaleString()}`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 50, background: `${statusColor(c.status)}18`, color: statusColor(c.status) }}>
                    {c.status}
                  </span>
                  {expanded === c.id ? <ChevronUp size={16} color='var(--g500)' /> : <ChevronDown size={16} color='var(--g500)' />}
                </div>
              </div>

              {/* Expanded details */}
              {expanded === c.id && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={detailBox}>
                      <span style={detailLabel}>Patient Note</span>
                      <span style={detailVal}>{c.patient_note || '—'}</span>
                    </div>
                    <div style={detailBox}>
                      <span style={detailLabel}>Consultation Type</span>
                      <span style={detailVal}>{c.consultation_type || 'video'}</span>
                    </div>
                    <div style={detailBox}>
                      <span style={detailLabel}>Requested At</span>
                      <span style={detailVal}>{c.created_at ? new Date(c.created_at).toLocaleString() : '—'}</span>
                    </div>
                    <div style={detailBox}>
                      <span style={detailLabel}>Phone</span>
                      <span style={detailVal}>{c.patient_phone || '—'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {c.status === 'requested' && (
                      <>
                        <button onClick={() => setScheduleFor(c)} style={{ ...actionBtn, color: 'var(--cyan)', borderColor: 'var(--cyan)', background: 'rgba(0,188,212,0.06)' }}>
                          <Calendar size={13} /> Approve & Schedule
                        </button>
                        <button onClick={() => setRejectFor(c)} style={{ ...actionBtn, color: 'var(--err)', borderColor: 'var(--err)', background: 'rgba(255,61,0,0.06)' }}>
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}
                    {(c.status === 'scheduled' || c.status === 'ongoing') && (
                      <>
                        {c.consultation_type === 'video' && (
                          <button onClick={() => handleJoin(c)} disabled={actionLoading === c.id} style={{ ...actionBtn, color: '#fff', borderColor: '#1930AA', background: '#1930AA' }}>
                            <Video size={13} /> {actionLoading === c.id ? 'Joining…' : 'Join Video Call'}
                          </button>
                        )}
                        <button onClick={() => setScheduleFor(c)} style={{ ...actionBtn, color: 'var(--cyan)', borderColor: 'var(--cyan)', background: 'rgba(0,188,212,0.06)' }}>
                          <Calendar size={13} /> Reschedule
                        </button>
                      </>
                    )}
                    {c.status === 'completed' && (
                      <span style={{ fontSize: 12, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={13} /> Consultation completed
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Schedule modal */}
      {scheduleFor && (
        <Modal title={scheduleFor.scheduled_at ? 'Reschedule Consultation' : 'Approve & Schedule'} onClose={() => setScheduleFor(null)}>
          <form onSubmit={handleSchedule}>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 16 }}>
              Patient: <strong style={{ color: 'var(--g300)' }}>{scheduleFor.patient_name || 'Patient'}</strong>
            </p>
            <label style={formLabel}>Date & Time</label>
            <input
              type="datetime-local" required
              value={scheduleTime}
              onChange={e => setScheduleTime(e.target.value)}
              style={{ ...formInput, marginBottom: 14 }}
            />
            <label style={formLabel}>Note for patient (optional)</label>
            <textarea
              placeholder="Any note about the appointment…"
              value={scheduleNote}
              onChange={e => setScheduleNote(e.target.value)}
              rows={3}
              style={{ ...formInput, resize: 'vertical', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setScheduleFor(null)} style={{ ...actionBtn, flex: 1, padding: '12px 0', justifyContent: 'center', color: 'var(--g500)', borderColor: 'rgba(0,0,0,0.12)', background: 'transparent' }}>
                Cancel
              </button>
              <button type="submit" disabled={actionLoading === 'schedule'} style={{ ...actionBtn, flex: 2, padding: '12px 0', justifyContent: 'center', color: '#fff', borderColor: '#1930AA', background: '#1930AA', opacity: actionLoading === 'schedule' ? 0.7 : 1 }}>
                <CheckCircle size={14} /> {actionLoading === 'schedule' ? 'Scheduling…' : 'Confirm Schedule'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject modal */}
      {rejectFor && (
        <Modal title="Reject Consultation" onClose={() => setRejectFor(null)}>
          <form onSubmit={handleReject}>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 16 }}>
              Patient: <strong style={{ color: 'var(--g300)' }}>{rejectFor.patient_name || 'Patient'}</strong>
            </p>
            <label style={formLabel}>Reason (optional)</label>
            <textarea
              placeholder="Reason for rejection…"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              style={{ ...formInput, resize: 'vertical', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setRejectFor(null)} style={{ ...actionBtn, flex: 1, padding: '12px 0', justifyContent: 'center', color: 'var(--g500)', borderColor: 'rgba(0,0,0,0.12)', background: 'transparent' }}>
                Go back
              </button>
              <button type="submit" disabled={actionLoading === 'reject'} style={{ ...actionBtn, flex: 1, padding: '12px 0', justifyContent: 'center', color: '#fff', borderColor: 'var(--err)', background: 'var(--err)', opacity: actionLoading === 'reject' ? 0.7 : 1 }}>
                <XCircle size={14} /> {actionLoading === 'reject' ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

const detailBox = { background: 'rgba(0,0,0,0.02)', borderRadius: 9, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid rgba(0,0,0,0.04)' }
const detailLabel = { fontSize: 10, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 0.8 }
const detailVal   = { fontSize: 13, color: 'var(--g300)', fontWeight: 500 }
const actionBtn   = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, transition: 'opacity 0.2s', background: 'transparent' }
const formLabel   = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--g400)', marginBottom: 6 }
const formInput   = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.02)', color: 'var(--g300)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box', display: 'block' }
