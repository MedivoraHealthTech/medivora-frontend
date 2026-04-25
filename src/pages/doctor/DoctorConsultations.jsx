import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Clock, CheckCircle, XCircle, Video,
  User, ChevronDown, ChevronUp, Calendar, AlertTriangle, X,
  FileText, Plus, Trash2, Loader,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { doctorAPI } from '../../api/client'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { formatSpecialty, formatConsultationStatus } from '../../utils/labels'

const STATUS_TABS = ['All', 'Requested', 'Scheduled', 'Completed', 'Cancelled']

function fmtWhen(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return iso }
}

const statusColor = s => {
  if (s === 'requested')  return 'var(--warn)'
  if (s === 'scheduled')  return 'var(--cyan)'
  if (s === 'completed')  return 'var(--ok)'
  if (s === 'cancelled')  return 'var(--err)'
  if (s === 'ongoing')    return 'var(--blue)'
  return 'var(--g500)'
}

function Modal({ title, onClose, children, wide }) {
  const { isMobile, isTablet } = useBreakpoint()
  const maxWidth = wide
    ? (isMobile ? 'calc(100vw - 32px)' : isTablet ? 'calc(100vw - 48px)' : '720px')
    : (isMobile ? 'calc(100vw - 32px)' : '440px')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
      <div style={{ background: 'var(--dark)', borderRadius: 16, padding: '28px 28px', width: '100%', maxWidth, boxShadow: '0 12px 40px rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.08)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--g300)' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color='var(--g500)' /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const EMPTY_MEDICINE = () => ({
  medicine_name: '', generic_name: '', dosage: '', frequency: '', duration: '', instructions: '', before_food: false,
})

export default function DoctorConsultations() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const { isMobile, isTablet } = useBreakpoint()

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

  // Prescription modal
  const [rxFor,         setRxFor]         = useState(null)   // consultation object
  const [rxLoading,     setRxLoading]     = useState(false)
  const [rxDraft,       setRxDraft]       = useState(null)   // AI-generated draft
  const [rxMedicines,   setRxMedicines]   = useState([])
  const [rxGeneral,     setRxGeneral]     = useState('')
  const [rxDietary,     setRxDietary]     = useState('')
  const [rxWarning,     setRxWarning]     = useState('')
  const [rxFollowup,    setRxFollowup]    = useState('')
  const [rxSubmitting,  setRxSubmitting]  = useState(false)
  const [rxError,       setRxError]       = useState('')
  const [submittedRxIds, setSubmittedRxIds] = useState(new Set())

  useEffect(() => { fetchConsultations() }, [])

  async function fetchConsultations() {
    setLoading(true)
    try {
      const data = await doctorAPI.getConsultations(getToken())
      const sessions = data?.sessions || []
      setConsultations(sessions)
      // Pre-populate from backend so the state survives refresh
      const alreadySent = new Set(sessions.filter(s => s.has_prescription).map(s => s.id))
      setSubmittedRxIds(alreadySent)
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
      await doctorAPI.scheduleConsultation(scheduleFor.id, { scheduled_at: new Date(scheduleTime).toISOString(), note: scheduleNote }, getToken())
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
      await doctorAPI.joinConsultation(session.id, getToken())
    } catch (err) {
      // Non-fatal — navigate to call regardless
    } finally {
      setActionLoading(null)
    }
    navigate(`/doctor/consultation/${session.id}/call`)
  }

  async function handleComplete(session) {
    setActionLoading(`complete-${session.id}`)
    try {
      const token = getToken()
      await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'}/consultation/${session.id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetchConsultations()
    } catch (err) {
      setError('Failed to complete consultation.')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Prescription handlers ─────────────────────────────────────

  async function handleOpenRxModal(consultation) {
    setRxFor(consultation)
    setRxDraft(null)
    setRxMedicines([])
    setRxGeneral('')
    setRxDietary('')
    setRxWarning('')
    setRxFollowup('')
    setRxError('')
    setRxLoading(true)

    try {
      const result = await doctorAPI.generateConsultationPrescription(consultation.id, getToken())
      const draft = result.draft || {}
      setRxDraft(result)
      setRxMedicines((draft.medicines || []).map(m => ({ ...EMPTY_MEDICINE(), ...m })))
      setRxGeneral((draft.general_instructions || []).join('\n'))
      setRxDietary((draft.dietary_advice || []).join('\n'))
      setRxWarning((draft.warning_signs || []).join('\n'))
      setRxFollowup(draft.follow_up_instructions || '')
    } catch (err) {
      setRxError(err.message || 'Failed to generate prescription')
    } finally {
      setRxLoading(false)
    }
  }

  function handleCloseRxModal() {
    setRxFor(null)
    setRxDraft(null)
    setRxError('')
  }

  function updateMedicine(idx, field, value) {
    setRxMedicines(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  }

  function addMedicine() {
    setRxMedicines(prev => [...prev, EMPTY_MEDICINE()])
  }

  function removeMedicine(idx) {
    setRxMedicines(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmitPrescription() {
    if (rxMedicines.length === 0) {
      setRxError('Add at least one medicine.')
      return
    }
    setRxSubmitting(true)
    setRxError('')
    try {
      const payload = {
        medicines: rxMedicines,
        general_instructions: rxGeneral.split('\n').map(s => s.trim()).filter(Boolean),
        dietary_advice: rxDietary.split('\n').map(s => s.trim()).filter(Boolean),
        warning_signs: rxWarning.split('\n').map(s => s.trim()).filter(Boolean),
        follow_up_instructions: rxFollowup,
      }
      await doctorAPI.submitConsultationPrescription(rxFor.id, payload, getToken())
      setSubmittedRxIds(prev => new Set([...prev, rxFor.id]))
      handleCloseRxModal()
    } catch (err) {
      setRxError(err.message || 'Failed to submit prescription')
    } finally {
      setRxSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,188,212,0.2)', borderTopColor: 'var(--cyan)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : isTablet ? '20px 24px' : '28px 32px', background: 'var(--dark)' }}>

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
                      {formatSpecialty(c.specialty) || 'General Medicine'}
                      {c.scheduled_at && ` · ${fmtWhen(c.scheduled_at)}`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 50, background: `${statusColor(c.status)}18`, color: statusColor(c.status) }}>
                    {formatConsultationStatus(c.status)}
                  </span>
                  {expanded === c.id ? <ChevronUp size={16} color='var(--g500)' /> : <ChevronDown size={16} color='var(--g500)' />}
                </div>
              </div>

              {/* Expanded details */}
              {expanded === c.id && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ paddingTop: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
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
                      <span style={detailVal}>{fmtWhen(c.created_at)}</span>
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
                        {c.started_at && (
                          <button onClick={() => handleComplete(c)} disabled={actionLoading === `complete-${c.id}`} style={{ ...actionBtn, color: '#fff', borderColor: '#059669', background: '#059669' }}>
                            <CheckCircle size={13} /> {actionLoading === `complete-${c.id}` ? 'Completing…' : 'Complete Consultation'}
                          </button>
                        )}
                        <button onClick={() => setScheduleFor(c)} style={{ ...actionBtn, color: 'var(--cyan)', borderColor: 'var(--cyan)', background: 'rgba(0,188,212,0.06)' }}>
                          <Calendar size={13} /> Reschedule
                        </button>
                      </>
                    )}
                    {c.status === 'completed' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={13} /> Consultation completed
                        </span>
                        {submittedRxIds.has(c.id) ? (
                          <span style={{ fontSize: 12, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, background: 'rgba(0,200,83,0.08)', border: '1.5px solid rgba(0,200,83,0.3)' }}>
                            <FileText size={13} /> Prescription Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenRxModal(c)}
                            style={{ ...actionBtn, color: '#fff', borderColor: '#1930AA', background: '#1930AA' }}
                          >
                            <FileText size={13} /> Generate Prescription
                          </button>
                        )}
                      </div>
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

      {/* Generate Prescription modal */}
      {rxFor && (
        <Modal title={`Prescription — ${rxFor.patient_name || 'Patient'}`} onClose={handleCloseRxModal} wide>

          {/* Loading state */}
          {rxLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader size={32} color='#1930AA' style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ fontSize: 14, color: 'var(--g400)' }}>AI is generating the prescription…</p>
            </div>
          )}

          {/* Error state */}
          {!rxLoading && rxError && !rxDraft && (
            <div style={{ padding: '14px', borderRadius: 10, background: 'rgba(255,61,0,0.07)', border: '1px solid rgba(255,61,0,0.18)', color: '#d93a00', fontSize: 13 }}>
              {rxError}
            </div>
          )}

          {/* Prescription form */}
          {!rxLoading && rxDraft && (
            <>
              {/* Patient + diagnosis info */}
              <div style={{ background: 'rgba(25,48,170,0.05)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, border: '1px solid rgba(25,48,170,0.1)' }}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--g500)' }}>Patient: <strong style={{ color: 'var(--g300)' }}>{rxDraft.patient_name}</strong></span>
                  <span style={{ fontSize: 12, color: 'var(--g500)' }}>Age: <strong style={{ color: 'var(--g300)' }}>{rxDraft.patient_age || '—'}</strong></span>
                  <span style={{ fontSize: 12, color: 'var(--g500)' }}>Gender: <strong style={{ color: 'var(--g300)' }}>{rxDraft.patient_gender || '—'}</strong></span>
                  <span style={{ fontSize: 12, color: 'var(--g500)' }}>Specialty: <strong style={{ color: 'var(--g300)' }}>{formatSpecialty(rxDraft.specialty)}</strong></span>
                </div>
                {rxDraft.draft?.diagnosis && (
                  <p style={{ fontSize: 12, color: 'var(--g400)', margin: '8px 0 0' }}>
                    Diagnosis: <strong style={{ color: 'var(--g300)' }}>{rxDraft.draft.diagnosis}</strong>
                  </p>
                )}
                <p style={{ fontSize: 11, color: 'var(--warn)', margin: '8px 0 0' }}>
                  AI-generated — review and edit before submitting.
                </p>
              </div>

              {/* Medicines */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--g300)' }}>Medicines</span>
                  <button onClick={addMedicine} style={{ ...actionBtn, padding: '6px 12px', color: '#1930AA', borderColor: '#1930AA', background: 'rgba(25,48,170,0.06)', fontSize: 12 }}>
                    <Plus size={12} /> Add Medicine
                  </button>
                </div>

                {rxMedicines.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--g500)', textAlign: 'center', padding: '16px 0' }}>No medicines added yet.</p>
                )}

                {rxMedicines.map((med, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Medicine {idx + 1}</span>
                      <button onClick={() => removeMedicine(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                        <Trash2 size={14} color='var(--err)' />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={inlineLabel}>Medicine Name</label>
                        <input value={med.medicine_name} onChange={e => updateMedicine(idx, 'medicine_name', e.target.value)} style={formInput} placeholder="e.g. Paracetamol 500mg" />
                      </div>
                      <div>
                        <label style={inlineLabel}>Generic Name</label>
                        <input value={med.generic_name} onChange={e => updateMedicine(idx, 'generic_name', e.target.value)} style={formInput} placeholder="e.g. Acetaminophen" />
                      </div>
                      <div>
                        <label style={inlineLabel}>Dosage</label>
                        <input value={med.dosage} onChange={e => updateMedicine(idx, 'dosage', e.target.value)} style={formInput} placeholder="e.g. 500mg" />
                      </div>
                      <div>
                        <label style={inlineLabel}>Frequency</label>
                        <input value={med.frequency} onChange={e => updateMedicine(idx, 'frequency', e.target.value)} style={formInput} placeholder="e.g. Twice daily" />
                      </div>
                      <div>
                        <label style={inlineLabel}>Duration</label>
                        <input value={med.duration} onChange={e => updateMedicine(idx, 'duration', e.target.value)} style={formInput} placeholder="e.g. 5 days" />
                      </div>
                      <div>
                        <label style={inlineLabel}>Instructions</label>
                        <input value={med.instructions} onChange={e => updateMedicine(idx, 'instructions', e.target.value)} style={formInput} placeholder="e.g. After food" />
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer', fontSize: 12, color: 'var(--g400)' }}>
                      <input type="checkbox" checked={med.before_food} onChange={e => updateMedicine(idx, 'before_food', e.target.checked)} />
                      Before food
                    </label>
                  </div>
                ))}
              </div>

              {/* General Instructions */}
              <div style={{ marginBottom: 14 }}>
                <label style={formLabel}>General Instructions <span style={{ fontWeight: 400, color: 'var(--g500)' }}>(one per line)</span></label>
                <textarea value={rxGeneral} onChange={e => setRxGeneral(e.target.value)} rows={3} style={{ ...formInput, resize: 'vertical' }} placeholder="e.g. Take with water&#10;Avoid alcohol" />
              </div>

              {/* Dietary Advice */}
              <div style={{ marginBottom: 14 }}>
                <label style={formLabel}>Dietary Advice <span style={{ fontWeight: 400, color: 'var(--g500)' }}>(one per line)</span></label>
                <textarea value={rxDietary} onChange={e => setRxDietary(e.target.value)} rows={2} style={{ ...formInput, resize: 'vertical' }} placeholder="e.g. Avoid spicy food&#10;Light meals" />
              </div>

              {/* Warning Signs */}
              <div style={{ marginBottom: 14 }}>
                <label style={formLabel}>Warning Signs <span style={{ fontWeight: 400, color: 'var(--g500)' }}>(one per line)</span></label>
                <textarea value={rxWarning} onChange={e => setRxWarning(e.target.value)} rows={2} style={{ ...formInput, resize: 'vertical' }} placeholder="e.g. Severe rash&#10;Difficulty breathing" />
              </div>

              {/* Follow-up */}
              <div style={{ marginBottom: 20 }}>
                <label style={formLabel}>Follow-up Instructions</label>
                <textarea value={rxFollowup} onChange={e => setRxFollowup(e.target.value)} rows={2} style={{ ...formInput, resize: 'vertical' }} placeholder="e.g. Follow up after 7 days if symptoms persist." />
              </div>

              {/* Error */}
              {rxError && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,61,0,0.07)', border: '1px solid rgba(255,61,0,0.18)', color: '#d93a00', fontSize: 13, marginBottom: 14 }}>
                  {rxError}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={handleCloseRxModal} style={{ ...actionBtn, flex: 1, padding: '12px 0', justifyContent: 'center', color: 'var(--g500)', borderColor: 'rgba(0,0,0,0.12)', background: 'transparent' }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPrescription}
                  disabled={rxSubmitting}
                  style={{ ...actionBtn, flex: 2, padding: '12px 0', justifyContent: 'center', color: '#fff', borderColor: '#1930AA', background: '#1930AA', opacity: rxSubmitting ? 0.7 : 1 }}
                >
                  {rxSubmitting ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <><CheckCircle size={14} /> Submit Prescription</>}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}

const detailBox   = { background: 'rgba(0,0,0,0.02)', borderRadius: 9, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid rgba(0,0,0,0.04)' }
const detailLabel = { fontSize: 10, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 0.8 }
const detailVal   = { fontSize: 13, color: 'var(--g300)', fontWeight: 500 }
const actionBtn   = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, transition: 'opacity 0.2s', background: 'transparent' }
const formLabel   = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--g400)', marginBottom: 6 }
const inlineLabel = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--g500)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 }
const formInput   = { width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.02)', color: 'var(--g300)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', boxSizing: 'border-box', display: 'block' }
