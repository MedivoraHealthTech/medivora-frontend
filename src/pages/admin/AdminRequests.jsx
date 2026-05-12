import { useState, useEffect } from 'react'
import { Search, User, Phone, Mail, MapPin, GraduationCap, Award, Stethoscope, IndianRupee, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, X, AlertCircle, Copy } from 'lucide-react'

const API_BASE = '/api'
function token() { return localStorage.getItem('medivora_admin_token') || '' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: '#fef3c7', icon: Clock },
  approved: { label: 'Approved', color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#fee2e2', icon: XCircle },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>
      <Icon size={11} />{cfg.label}
    </span>
  )
}

function Field({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <Icon size={13} color="#a0aec0" style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        <span style={{ fontSize: 11, color: '#a0aec0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}: </span>
        <span style={{ fontSize: 13, color: '#2d3748' }}>{value}</span>
      </div>
    </div>
  )
}

function ApproveModal({ req, onClose, onApproved }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { doctor_id, temp_password }
  const [copied, setCopied] = useState(false)

  async function confirm() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/doctor-requests/${req.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Approval failed')
      setResult(data)
      onApproved(req.id)
    } catch (err) {
      alert(err.message)
      setLoading(false)
    }
  }

  function copyPw() {
    navigator.clipboard.writeText(result.temp_password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const name = `${req.first_name} ${req.last_name}`.trim()

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,27,71,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={!result ? onClose : undefined}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 420, padding: '28px 28px 24px', boxShadow: '0 20px 60px rgba(10,27,71,0.2)' }} onClick={e => e.stopPropagation()}>
        {!result ? (
          <>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0A1B47', marginBottom: 8 }}>Approve Dr. {name}?</div>
            <p style={{ fontSize: 13, color: '#718096', marginBottom: 24 }}>
              This will create a doctor account with a temporary password. Share the credentials with the doctor so they can log in and update their password.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#4a5568', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={confirm} disabled={loading} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1930AA, #00AFEF)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Approving…' : 'Approve'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CheckCircle size={22} color="#10b981" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0A1B47' }}>Dr. {name} Approved!</div>
              <p style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>Account created. Share the temporary password below.</p>
            </div>
            <div style={{ background: '#f7f9fc', borderRadius: 12, padding: '14px 16px', marginBottom: 20, border: '1px solid #e8eef8' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Temporary Password</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <code style={{ fontSize: 15, fontWeight: 700, color: '#0A1B47', flex: 1, fontFamily: 'monospace' }}>{result.temp_password}</code>
                <button onClick={copyPw} style={{ background: copied ? '#d1fae5' : '#e8f0ff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: copied ? '#10b981' : '#1930AA', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>
                  {copied ? 'Copied!' : <Copy size={13} />}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 6 }}>Phone: {req.phone}</div>
            </div>
            <button onClick={onClose} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', background: '#0A1B47', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function RequestCard({ req, onApproved, onRejected }) {
  const [expanded, setExpanded] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const name = `${req.first_name} ${req.last_name}`.trim()
  const isPending = req.status === 'pending'

  async function reject() {
    setRejecting(true)
    try {
      const res = await fetch(`${API_BASE}/admin/doctor-requests/${req.id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      })
      if (res.ok) onRejected(req.id)
      else {
        const d = await res.json()
        alert(d.detail || 'Rejection failed')
      }
    } catch {}
    finally { setRejecting(false) }
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8eef8', overflow: 'hidden', transition: 'box-shadow 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,27,71,0.08)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        {/* Card header */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #e8f0ff, #ddf4ff)', border: '1.5px solid #c7d7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 17, fontWeight: 800, color: '#1930AA' }}>
            {req.first_name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0A1B47' }}>Dr. {name}</div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 2, textTransform: 'capitalize' }}>
              {req.specialties} · {req.experience_years} yrs exp
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={req.status} />
            <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: 4, borderRadius: 6 }}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Quick info row */}
        <div style={{ padding: '0 20px 14px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {req.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4a5568' }}><Phone size={11} color="#a0aec0" />{req.phone}</div>}
          {req.email && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4a5568' }}><Mail size={11} color="#a0aec0" />{req.email}</div>}
          <div style={{ fontSize: 12, color: '#a0aec0', marginLeft: 'auto' }}>Applied {formatDate(req.created_at)}</div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={{ borderTop: '1px solid #f0f4fa', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: '#fafbff' }}>
            <Field icon={GraduationCap} label="Medical College" value={req.medical_college} />
            <Field icon={Award}         label="NMC / License No" value={req.nmc_number} />
            <Field icon={Stethoscope}   label="Clinic"           value={req.clinic_name ? `${req.clinic_name}${req.clinic_address ? ', ' + req.clinic_address : ''}` : req.clinic_address} />
            <Field icon={IndianRupee}   label="Consultation Fee" value={req.consultation_fee != null ? `₹${Number(req.consultation_fee).toLocaleString('en-IN')}` : null} />
            {req.notes && <Field icon={AlertCircle} label="Notes" value={req.notes} />}
          </div>
        )}

        {/* Actions */}
        {isPending && (
          <div style={{ borderTop: '1px solid #f0f4fa', padding: '12px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={reject} disabled={rejecting}
              style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #fed7d7', background: '#fff5f5', color: '#e53e3e', fontWeight: 700, fontSize: 13, cursor: rejecting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: rejecting ? 0.6 : 1 }}
            >
              {rejecting ? 'Rejecting…' : 'Reject'}
            </button>
            <button
              onClick={() => setShowApprove(true)}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1930AA, #00AFEF)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(25,48,170,0.2)' }}
            >
              Approve
            </button>
          </div>
        )}
      </div>

      {showApprove && (
        <ApproveModal
          req={req}
          onClose={() => setShowApprove(false)}
          onApproved={(id) => { setShowApprove(false); onApproved(id) }}
        />
      )}
    </>
  )
}

export default function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [search, setSearch]     = useState('')

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    try {
      const url = filter === 'all'
        ? `${API_BASE}/admin/doctor-requests`
        : `${API_BASE}/admin/doctor-requests?status=${filter}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } })
      const d = await res.json()
      setRequests(d.requests || [])
    } catch {}
    finally { setLoading(false) }
  }

  function handleApproved(id) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))
    if (filter === 'pending') setRequests(prev => prev.filter(r => r.id !== id))
  }

  function handleRejected(id) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
    if (filter === 'pending') setRequests(prev => prev.filter(r => r.id !== id))
  }

  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    return (
      (r.first_name || '').toLowerCase().includes(q) ||
      (r.last_name  || '').toLowerCase().includes(q) ||
      (r.phone      || '').includes(q) ||
      (r.specialties|| '').toLowerCase().includes(q) ||
      (r.nmc_number || '').toLowerCase().includes(q)
    )
  })

  const TABS = [
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all',      label: 'All' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0A1B47', marginBottom: 4 }}>Doctor Requests</h1>
        <p style={{ fontSize: 13, color: '#718096' }}>Review and approve doctors joining the platform</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            style={{
              padding: '7px 18px', borderRadius: 20, border: filter === t.key ? 'none' : '1.5px solid #e2e8f0',
              background: filter === t.key ? '#0A1B47' : '#fff',
              color: filter === t.key ? '#fff' : '#718096',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, or specialty…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
          onFocus={e => e.target.style.borderColor = '#1930AA'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0', fontSize: 14 }}>Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <User size={24} color="#a0aec0" />
          </div>
          <p style={{ color: '#a0aec0', fontSize: 14 }}>
            {search ? 'No requests match your search.' : `No ${filter === 'all' ? '' : filter} requests.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(req => (
            <RequestCard key={req.id} req={req} onApproved={handleApproved} onRejected={handleRejected} />
          ))}
        </div>
      )}
    </div>
  )
}
