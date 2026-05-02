import { useState, useEffect } from 'react'
import {
  ClipboardList, CheckCircle, XCircle, Edit3, FileText,
  ChevronDown, ChevronUp, AlertTriangle, User, X, Plus, Trash2, Download,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { doctorAPI } from '../../api/client'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { formatSpecialty } from '../../utils/labels'

const RISK_COLOR = r => {
  const l = (r || '').toLowerCase()
  if (l === 'emergency' || l === 'critical') return 'var(--err)'
  if (l === 'high')   return '#ff7043'
  if (l === 'medium') return 'var(--warn)'
  return 'var(--ok)'
}

const STATUS_BADGE = {
  pending:         { label: 'Pending Review',  bg: 'rgba(255,179,0,0.12)',  color: 'var(--warn)' },
  approved:        { label: 'Approved',        bg: 'rgba(0,200,83,0.12)',   color: 'var(--ok)'   },
  modified:        { label: 'Modified',        bg: 'rgba(0,188,212,0.12)',  color: 'var(--cyan)' },
  rejected:        { label: 'Rejected',        bg: 'rgba(255,61,0,0.1)',    color: 'var(--err)'  },
}

function Modal({ title, onClose, children, wide = false }) {
  const { isMobile, isTablet } = useBreakpoint()
  const maxWidth = wide
    ? (isMobile ? 'calc(100vw - 32px)' : isTablet ? 'calc(100vw - 48px)' : '680px')
    : (isMobile ? 'calc(100vw - 32px)' : '480px')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
      <div style={{ background: 'var(--dark)', borderRadius: 16, padding: '28px', width: '100%', maxWidth, boxShadow: '0 12px 40px rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.08)', marginTop: 'auto', marginBottom: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--g300)' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color='var(--g500)' /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function MedRow({ med, idx, onChange, onRemove }) {
  const { isMobile, isTablet } = useBreakpoint()
  const gridCols = isMobile
    ? 'repeat(2, 1fr)'
    : isTablet
    ? 'repeat(3, 1fr)'
    : '2fr 1fr 1fr 1fr 1fr 32px'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 8, marginBottom: 8, alignItems: 'start' }}>
      {[
        ['medicine_name', 'Medicine name'],
        ['dosage',        'Dosage'],
        ['frequency',     'Frequency'],
        ['duration',      'Duration'],
        ['instructions',  'Instructions'],
      ].map(([k, ph]) => (
        <input key={k} value={med[k] || ''} onChange={e => onChange(idx, k, e.target.value)} placeholder={ph}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.02)', color: 'var(--g300)', fontFamily: 'var(--font)', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
      ))}
      <button type="button" onClick={() => onRemove(idx)} style={{ padding: 6, borderRadius: 7, border: '1px solid rgba(255,61,0,0.2)', background: 'rgba(255,61,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Trash2 size={13} color='var(--err)' />
      </button>
    </div>
  )
}

export default function PrescriptionReview() {
  const { displayName, getToken } = useAuth()
  const { isMobile, isTablet } = useBreakpoint()

  const [tab,        setTab]        = useState('sent')   // 'sent' | 'ai'
  const [approvals,  setApprovals]  = useState([])
  const [sentRx,     setSentRx]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [expanded,   setExpanded]   = useState(null)
  const [error,      setError]      = useState('')
  const [actionOk,   setActionOk]   = useState('')

  // Modals
  const [approveFor, setApproveFor] = useState(null)
  const [rejectFor,  setRejectFor]  = useState(null)
  const [modifyFor,  setModifyFor]  = useState(null)

  // Approve form
  const [approveNotes, setApproveNotes] = useState('')
  const [approveNmc,   setApproveNmc]   = useState('')

  // Reject form
  const [rejectReason, setRejectReason] = useState('')

  // Modify form
  const [modifyMeds,  setModifyMeds]  = useState([])
  const [modifyNotes, setModifyNotes] = useState('')
  const [modifyNmc,   setModifyNmc]   = useState('')

  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [aData, sData] = await Promise.allSettled([
        doctorAPI.getPendingApprovals(getToken()),
        doctorAPI.getDoctorPrescriptions(getToken()),
      ])
      setApprovals(aData.status === 'fulfilled' ? (aData.value?.approvals || []) : [])
      setSentRx(sData.status === 'fulfilled' ? (sData.value?.prescriptions || []) : [])
    } catch (e) {
      setError('Could not load prescriptions.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchApprovals() {
    try {
      const data = await doctorAPI.getPendingApprovals(getToken())
      setApprovals(data?.approvals || [])
    } catch (e) {
      setError('Could not load prescription approvals.')
    }
  }

  function openModify(approval) {
    const rx = approval.proposed_prescription || approval.modified_prescription || {}
    const meds = Array.isArray(rx.medications) ? rx.medications : (rx.medications ? [rx.medications] : [{ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
    setModifyMeds(meds.map(m => ({ ...m })))
    setModifyNotes('')
    setModifyNmc(approveNmc || '')
    setModifyFor(approval)
  }

  function updateMed(idx, key, val) {
    setModifyMeds(prev => prev.map((m, i) => i === idx ? { ...m, [key]: val } : m))
  }
  function addMed() {
    setModifyMeds(prev => [...prev, { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  }
  function removeMed(idx) {
    setModifyMeds(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleApprove(e) {
    e.preventDefault()
    setActionLoading('approve')
    try {
      await doctorAPI.approveRx(approveFor.approval_id, { notes: approveNotes, nmc_number: approveNmc }, getToken())
      // Also generate PDF
      try { await doctorAPI.generatePdf(approveFor.approval_id, getToken()) } catch {}
      setApproveFor(null); setApproveNotes(''); setApproveNmc('')
      setActionOk('Prescription approved and signed!')
      await fetchApprovals()
    } catch (err) {
      setError(err.message || 'Failed to approve prescription.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(e) {
    e.preventDefault()
    setActionLoading('reject')
    try {
      await doctorAPI.rejectRx(rejectFor.approval_id, { reason: rejectReason }, getToken())
      setRejectFor(null); setRejectReason('')
      setActionOk('Prescription rejected.')
      await fetchApprovals()
    } catch (err) {
      setError(err.message || 'Failed to reject prescription.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleModify(e) {
    e.preventDefault()
    if (!modifyNotes.trim()) { setError('Justification notes are required when modifying.'); return }
    setActionLoading('modify')
    try {
      const modified = { medications: modifyMeds }
      await doctorAPI.modifyRx(modifyFor.approval_id, {
        modified_prescription: JSON.stringify(modified),
        notes: modifyNotes,
        nmc_number: modifyNmc,
      }, getToken())
      try { await doctorAPI.generatePdf(modifyFor.approval_id, getToken()) } catch {}
      setModifyFor(null)
      setActionOk('Prescription modified and signed!')
      await fetchApprovals()
    } catch (err) {
      setError(err.message || 'Failed to modify prescription.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDownloadPdf(approval) {
    try {
      const token = getToken()
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_BASE}/prescriptions/${approval.approval_id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setError('PDF not available yet. Please generate it first.'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `prescription_${approval.approval_id}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download PDF.')
    }
  }

  async function handleDownloadSentPdf(rx) {
    try {
      const token = getToken()
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_BASE}/prescriptions/${rx.id}/download-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setError('PDF not available.'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `prescription_${rx.prescription_number || rx.id}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download PDF.')
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

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--g300)', fontFamily: 'var(--serif)', margin: '0 0 4px' }}>Prescriptions</h1>
        <p style={{ fontSize: 13, color: 'var(--g500)', margin: 0 }}>Your sent prescriptions and AI-triage approvals.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid rgba(0,0,0,0.06)', paddingBottom: 0 }}>
        {[
          { id: 'sent', label: `Sent Prescriptions${sentRx.length ? ` (${sentRx.length})` : ''}` },
          { id: 'ai',   label: `AI Triage Review${approvals.filter(a => a.status === 'pending').length ? ` (${approvals.filter(a => a.status === 'pending').length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 18px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
            background: tab === t.id ? 'var(--pw)' : 'transparent',
            color: tab === t.id ? 'var(--g300)' : 'var(--g500)',
            borderBottom: tab === t.id ? '2px solid #1930AA' : '2px solid transparent',
            marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,61,0,0.07)', border: '1px solid rgba(255,61,0,0.18)', color: '#d93a00', fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}<button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}
      {actionOk && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.18)', color: '#00a852', fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} />{actionOk}</span>
          <button onClick={() => setActionOk('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {/* ── Sent Prescriptions Tab ── */}
      {tab === 'sent' && (
        sentRx.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <FileText size={40} color='var(--g700)' style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--g300)', marginBottom: 4 }}>No prescriptions sent yet</p>
            <p style={{ fontSize: 13, color: 'var(--g500)' }}>Prescriptions you submit from consultations will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sentRx.map(rx => {
              const items = rx.prescription_items || []
              const isExp = expanded === rx.id
              return (
                <div key={rx.id} style={{ borderRadius: 14, background: 'var(--pw)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    onClick={() => setExpanded(isExp ? null : rx.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,200,83,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={18} color='var(--ok)' />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)', margin: '0 0 2px' }}>{rx.patient_name || 'Patient'}</p>
                        <p style={{ fontSize: 12, color: 'var(--g500)', margin: 0 }}>
                          {rx.prescription_number} · {items.length} medication{items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 50, background: 'rgba(0,200,83,0.12)', color: 'var(--ok)' }}>Sent</span>
                      <span style={{ fontSize: 11, color: 'var(--g700)' }}>{rx.prescribed_at ? new Date(rx.prescribed_at).toLocaleDateString() : ''}</span>
                      {isExp ? <ChevronUp size={16} color='var(--g500)' /> : <ChevronDown size={16} color='var(--g500)' />}
                    </div>
                  </div>

                  {isExp && (
                    <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <div style={{ paddingTop: 16, marginBottom: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ok)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Medications</p>
                        {items.length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--g500)', fontStyle: 'italic' }}>No medications recorded.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {items.map((med, mi) => (
                              <div key={mi} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,200,83,0.04)', border: '1px solid rgba(0,200,83,0.12)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)' }}>{med.medicine_name}</span>
                                  {med.generic_name && <span style={{ fontSize: 11, color: 'var(--g500)', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 50 }}>{med.generic_name}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                  {med.dosage     && <span style={rxTag}>Dosage: {med.dosage}</span>}
                                  {med.frequency  && <span style={rxTag}>Frequency: {med.frequency}</span>}
                                  {med.duration   && <span style={rxTag}>Duration: {med.duration}</span>}
                                </div>
                                {med.instructions && <p style={{ fontSize: 12, color: 'var(--g500)', margin: '6px 0 0', fontStyle: 'italic' }}>{med.instructions}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {Array.isArray(rx.general_instructions) && rx.general_instructions.length > 0 && (
                        <div style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 9, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--g700)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>General Instructions</p>
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {rx.general_instructions.map((inst, i) => <li key={i} style={{ fontSize: 12, color: 'var(--g400)', marginBottom: 2 }}>{inst}</li>)}
                          </ul>
                        </div>
                      )}

                      {rx.follow_up_instructions && (
                        <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 9, background: 'rgba(0,188,212,0.04)', border: '1px solid rgba(0,188,212,0.1)' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Follow-up</p>
                          <p style={{ fontSize: 13, color: 'var(--g400)', margin: 0, lineHeight: 1.55 }}>{rx.follow_up_instructions}</p>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={13} /> Prescription sent
                        </span>
                        <button onClick={() => handleDownloadSentPdf(rx)} style={{ ...actionBtn, color: '#1930AA', borderColor: '#1930AA', background: 'rgba(25,48,170,0.06)' }}>
                          <Download size={13} /> Download PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── AI Triage Approvals Tab ── */}
      {tab === 'ai' && (
      approvals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <CheckCircle size={40} color='var(--ok)' style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--g300)', marginBottom: 4 }}>All caught up!</p>
          <p style={{ fontSize: 13, color: 'var(--g500)' }}>No pending prescription reviews at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {approvals.map(a => {
            const assessment  = a.ai_assessment || a.assessment_data || {}
            const proposedRx  = a.proposed_prescription || {}
            const meds        = Array.isArray(proposedRx.medications) ? proposedRx.medications : []
            const risk        = assessment.risk_level || 'ROUTINE'
            const badge       = STATUS_BADGE[a.status] || STATUS_BADGE.pending
            const isExpanded  = expanded === a.approval_id

            return (
              <div key={a.approval_id} style={{ borderRadius: 14, background: 'var(--pw)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                {/* Header row */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => setExpanded(isExpanded ? null : a.approval_id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${RISK_COLOR(risk)}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={18} color={RISK_COLOR(risk)} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)', margin: '0 0 2px' }}>
                        {a.patient_name || 'Patient'}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--g500)', margin: 0 }}>
                        {assessment.primary_condition || assessment.diagnosis || assessment.chief_complaint || 'Assessment'}
                        {' · '}
                        <span style={{ color: RISK_COLOR(risk), fontWeight: 600 }}>{risk}</span>
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 50, background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--g700)' }}>
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                    </span>
                    {isExpanded ? <ChevronUp size={16} color='var(--g500)' /> : <ChevronDown size={16} color='var(--g500)' />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>

                    {/* AI Assessment Summary */}
                    <div style={{ paddingTop: 16, marginBottom: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>AI Assessment</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                        {[
                          ['Chief Complaint', assessment.chief_complaint || '—'],
                          ['Preliminary Diagnosis', assessment.primary_condition || assessment.diagnosis || '—'],
                          ['Risk Level', risk],
                          ['Confidence', assessment.confidence_score != null ? `${Math.round(assessment.confidence_score * 100)}%` : '—'],
                          ['Recommended Specialty', formatSpecialty(assessment.suggested_specialty || assessment.specialty) || '—'],
                          ['Follow-up Required', assessment.follow_up_required ? 'Yes' : 'No'],
                        ].map(([label, val], i) => (
                          <div key={i} style={{ borderRadius: 9, padding: '10px 12px', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--g700)', textTransform: 'uppercase', letterSpacing: 0.6, margin: '0 0 4px' }}>{label}</p>
                            <p style={{ fontSize: 13, color: 'var(--g300)', margin: 0, fontWeight: 500 }}>{String(val)}</p>
                          </div>
                        ))}
                      </div>
                      {assessment.clinical_reasoning && (
                        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 9, background: 'rgba(0,188,212,0.04)', border: '1px solid rgba(0,188,212,0.1)' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Clinical Reasoning</p>
                          <p style={{ fontSize: 13, color: 'var(--g400)', margin: 0, lineHeight: 1.55 }}>{assessment.clinical_reasoning}</p>
                        </div>
                      )}
                    </div>

                    {/* Proposed Prescription */}
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--warn)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={12} /> Proposed Prescription (AI Generated)
                      </p>
                      {meds.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--g500)', fontStyle: 'italic' }}>No medications proposed.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {meds.map((med, mi) => (
                            <div key={mi} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,179,0,0.04)', border: '1px solid rgba(255,179,0,0.12)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)' }}>{med.medicine_name || med.name || `Medication ${mi + 1}`}</span>
                                {med.strength && <span style={{ fontSize: 11, color: 'var(--g500)', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 50 }}>{med.strength}</span>}
                              </div>
                              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                {med.dosage     && <span style={rxTag}>Dosage: {med.dosage}</span>}
                                {med.frequency  && <span style={rxTag}>Frequency: {med.frequency}</span>}
                                {med.duration   && <span style={rxTag}>Duration: {med.duration}</span>}
                              </div>
                              {med.instructions && <p style={{ fontSize: 12, color: 'var(--g500)', margin: '6px 0 0', fontStyle: 'italic' }}>{med.instructions}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* General instructions */}
                      {(proposedRx.general_instructions?.length > 0) && (
                        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 9, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--g700)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>General Instructions</p>
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {proposedRx.general_instructions.map((inst, i) => (
                              <li key={i} style={{ fontSize: 12, color: 'var(--g400)', marginBottom: 2 }}>{inst}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {a.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={() => { setApproveFor(a); setApproveNotes(''); }} style={{ ...actionBtn, color: '#fff', borderColor: 'var(--ok)', background: 'var(--ok)' }}>
                          <CheckCircle size={13} /> Approve Prescription
                        </button>
                        <button onClick={() => openModify(a)} style={{ ...actionBtn, color: '#1930AA', borderColor: '#1930AA', background: 'rgba(25,48,170,0.07)' }}>
                          <Edit3 size={13} /> Modify & Sign
                        </button>
                        <button onClick={() => { setRejectFor(a); setRejectReason('') }} style={{ ...actionBtn, color: 'var(--err)', borderColor: 'var(--err)', background: 'rgba(255,61,0,0.06)' }}>
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                    {(a.status === 'approved' || a.status === 'modified') && (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={13} /> Prescription signed
                        </span>
                        <button onClick={() => handleDownloadPdf(a)} style={{ ...actionBtn, color: '#1930AA', borderColor: '#1930AA', background: 'rgba(25,48,170,0.06)' }}>
                          <Download size={13} /> Download PDF
                        </button>
                      </div>
                    )}
                    {a.status === 'rejected' && (
                      <span style={{ fontSize: 12, color: 'var(--err)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={13} /> Prescription rejected
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )
      )}

      {/* ── Approve Modal ── */}
      {approveFor && (
        <Modal title="Approve Prescription" onClose={() => setApproveFor(null)}>
          <form onSubmit={handleApprove}>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 4 }}>
              You are approving the AI-generated prescription for:
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)', marginBottom: 16 }}>
              {approveFor.patient_name || 'Patient'}
            </p>

            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,200,83,0.04)', border: '1px solid rgba(0,200,83,0.15)', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--ok)', fontWeight: 600, margin: '0 0 4px' }}>By approving you confirm:</p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li style={{ fontSize: 12, color: 'var(--g400)', marginBottom: 2 }}>You have reviewed the AI assessment and proposed medications</li>
                <li style={{ fontSize: 12, color: 'var(--g400)', marginBottom: 2 }}>The prescription is clinically appropriate for this patient</li>
                <li style={{ fontSize: 12, color: 'var(--g400)' }}>Your NMC number will be used to digitally sign this document</li>
              </ul>
            </div>

            <label style={ml}>NMC / License Number (required for signature)</label>
            <input value={approveNmc} onChange={e => setApproveNmc(e.target.value)} placeholder="e.g. NMC-12345" style={mi} />

            <label style={ml}>Clinical Notes (optional)</label>
            <textarea value={approveNotes} onChange={e => setApproveNotes(e.target.value)} placeholder="Any additional notes for the patient…" rows={3} style={{ ...mi, resize: 'vertical', marginBottom: 20 }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setApproveFor(null)} style={{ ...actionBtn, flex: 1, padding: '12px 0', justifyContent: 'center', color: 'var(--g500)', borderColor: 'rgba(0,0,0,0.12)', background: 'transparent' }}>
                Cancel
              </button>
              <button type="submit" disabled={actionLoading === 'approve'} style={{ ...actionBtn, flex: 2, padding: '12px 0', justifyContent: 'center', color: '#fff', borderColor: 'var(--ok)', background: 'var(--ok)', opacity: actionLoading === 'approve' ? 0.7 : 1 }}>
                <CheckCircle size={14} /> {actionLoading === 'approve' ? 'Approving…' : 'Approve & Sign'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Reject Modal ── */}
      {rejectFor && (
        <Modal title="Reject Prescription" onClose={() => setRejectFor(null)}>
          <form onSubmit={handleReject}>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 16 }}>
              Patient: <strong style={{ color: 'var(--g300)' }}>{rejectFor.patient_name || 'Patient'}</strong>
            </p>
            <label style={ml}>Reason for rejection (optional)</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Clinical reason or notes…" rows={3} style={{ ...mi, resize: 'vertical', marginBottom: 20 }} />
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

      {/* ── Modify Modal ── */}
      {modifyFor && (
        <Modal title="Modify Prescription" onClose={() => setModifyFor(null)} wide>
          <form onSubmit={handleModify}>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 16 }}>
              Edit the medications below. All changes are logged for audit.
            </p>

            {/* Medication editor */}
            <div style={{ padding: '4px 0 12px' }}>
              {!isMobile && !isTablet && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 32px', gap: 8, marginBottom: 6, paddingLeft: 2 }}>
                  {['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--g700)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</span>
                  ))}
                </div>
              )}
              {modifyMeds.map((med, idx) => (
                <MedRow key={idx} med={med} idx={idx} onChange={updateMed} onRemove={removeMed} />
              ))}
              <button type="button" onClick={addMed} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--cyan)', background: 'none', border: '1.5px dashed rgba(0,188,212,0.4)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600, marginTop: 4 }}>
                <Plus size={12} /> Add Medication
              </button>
            </div>

            <label style={ml}>NMC Number (for signature)</label>
            <input value={modifyNmc} onChange={e => setModifyNmc(e.target.value)} placeholder="NMC-XXXXX" style={mi} />

            <label style={ml}>Justification Notes <span style={{ color: 'var(--err)' }}>*</span></label>
            <textarea required value={modifyNotes} onChange={e => setModifyNotes(e.target.value)} placeholder="Explain why you modified the AI prescription…" rows={3} style={{ ...mi, resize: 'vertical', marginBottom: 20 }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setModifyFor(null)} style={{ ...actionBtn, flex: 1, padding: '12px 0', justifyContent: 'center', color: 'var(--g500)', borderColor: 'rgba(0,0,0,0.12)', background: 'transparent' }}>
                Cancel
              </button>
              <button type="submit" disabled={actionLoading === 'modify'} style={{ ...actionBtn, flex: 2, padding: '12px 0', justifyContent: 'center', color: '#fff', borderColor: '#1930AA', background: '#1930AA', opacity: actionLoading === 'modify' ? 0.7 : 1 }}>
                <Edit3 size={14} /> {actionLoading === 'modify' ? 'Saving…' : 'Modify & Sign'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

const rxTag  = { fontSize: 11, color: 'var(--g400)', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 50 }
const actionBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, border: '1.5px solid', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, transition: 'opacity 0.2s', background: 'transparent' }
const ml = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--g500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const mi = { width: '100%', padding: '11px 13px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.02)', color: 'var(--g300)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box', display: 'block', marginBottom: 14 }
