import { useState, useEffect } from 'react'
import { Search, Stethoscope, Phone, Star, CheckCircle, XCircle, Clock, AlertCircle, X, Mail, MapPin, GraduationCap, Award, IndianRupee, Activity } from 'lucide-react'

const API_BASE = '/api'
function token() { return localStorage.getItem('medivora_admin_token') || '' }

const STATUS_CONFIG = {
  available:  { label: 'Available',  color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
  suspended:  { label: 'Suspended',  color: '#ef4444', bg: '#fee2e2', icon: XCircle    },
  on_leave:   { label: 'On Leave',   color: '#f59e0b', bg: '#fef3c7', icon: Clock      },
  inactive:   { label: 'Inactive',   color: '#9ca3af', bg: '#f3f4f6', icon: AlertCircle },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.inactive
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color="#1930AA" />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 13, color: '#2d3748', fontWeight: 500, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )
}

function DoctorModal({ doc, onClose, onStatusChange }) {
  const name = `${doc.first_name || ''} ${doc.last_name || ''}`.trim() || '(no name)'
  const [updating, setUpdating] = useState(false)

  async function handleStatus(newStatus) {
    setUpdating(true)
    try {
      const res = await fetch(`${API_BASE}/admin/doctors/${doc.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) onStatusChange(doc.id, newStatus)
    } catch {}
    finally { setUpdating(false) }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,27,71,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(10,27,71,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #e8eef8', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e0f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {doc.profile_picture_url
              ? <img src={doc.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Stethoscope size={22} color="#00AFEF" />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0A1B47' }}>Dr. {name}</div>
            <div style={{ fontSize: 13, color: '#718096', marginTop: 2, textTransform: 'capitalize' }}>
              {doc.specialization || 'General Physician'}
              {doc.experience_years ? ` · ${doc.experience_years} yrs exp` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={doc.available_status} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: 4, borderRadius: 6 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px 24px', flex: 1 }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 22 }}>
            {[
              { label: 'Rating', value: doc.rating != null ? `${Number(doc.rating).toFixed(1)} ★` : '—', color: '#f59e0b' },
              { label: 'Reviews', value: doc.rating_count ?? '—', color: '#1930AA' },
              { label: 'Cases', value: doc.cases_handled ?? '—', color: '#10b981' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#f7f9fc', borderRadius: 12, padding: '12px 14px', textAlign: 'center', border: '1px solid #e8eef8' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DetailRow icon={Phone}        label="Phone"           value={doc.phone} />
            <DetailRow icon={Mail}         label="Email"           value={doc.email} />
            <DetailRow icon={MapPin}       label="Clinic"          value={doc.clinic_name ? `${doc.clinic_name}${doc.clinic_address ? ', ' + doc.clinic_address : ''}` : doc.clinic_address} />
            <DetailRow icon={Phone}        label="Clinic Phone"    value={doc.clinic_phone} />
            <DetailRow icon={IndianRupee}  label="Consultation Fee" value={doc.consultation_fee != null ? `₹${Number(doc.consultation_fee).toLocaleString('en-IN')}` : null} />
            <DetailRow icon={GraduationCap} label="Medical College" value={doc.medical_college} />
            <DetailRow icon={Award}        label="NMC Number"      value={doc.nmc_number} />
            <DetailRow icon={Activity}     label="License Verified" value={doc.license_verified ? 'Yes' : 'No'} />
          </div>

          {/* Joined */}
          {doc.created_at && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #f0f4fa', fontSize: 12, color: '#a0aec0' }}>
              Joined {new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Footer — status actions */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e8eef8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#718096', marginRight: 4 }}>Set status:</span>
          {['available', 'suspended', 'inactive'].map(s => {
            const cfg = STATUS_CONFIG[s]
            const active = doc.available_status === s
            return (
              <button
                key={s}
                disabled={updating || active}
                onClick={() => handleStatus(s)}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${active ? cfg.color : '#e2e8f0'}`,
                  background: active ? cfg.bg : '#fff', color: active ? cfg.color : '#718096',
                  fontSize: 12, fontWeight: 700, cursor: active || updating ? 'default' : 'pointer',
                  fontFamily: 'inherit', opacity: updating ? 0.6 : 1, transition: 'all 0.15s',
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [updating, setUpdating] = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)

  useEffect(() => { loadDoctors() }, [])

  async function loadDoctors() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/doctors`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const d = await res.json()
      setDoctors(d.doctors || [])
    } catch {}
    finally { setLoading(false) }
  }

  async function updateStatus(doctorId, newStatus) {
    setUpdating(doctorId)
    try {
      const res = await fetch(`${API_BASE}/admin/doctors/${doctorId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, available_status: newStatus } : d))
        if (selectedDoc?.id === doctorId) setSelectedDoc(prev => ({ ...prev, available_status: newStatus }))
      }
    } catch {}
    finally { setUpdating(null) }
  }

  const filtered = doctors.filter(d => {
    const q = search.toLowerCase()
    return (
      (d.first_name  || '').toLowerCase().includes(q) ||
      (d.last_name   || '').toLowerCase().includes(q) ||
      (d.phone       || '').includes(q) ||
      (d.specialization || '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0A1B47', marginBottom: 4 }}>Doctors</h1>
        <p style={{ fontSize: 13, color: '#718096' }}>{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} on platform</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, or specialty…"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 14px 10px 36px',
            border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13,
            fontFamily: 'inherit', outline: 'none', background: '#fff',
          }}
          onFocus={e => e.target.style.borderColor = '#1930AA'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8eef8', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0', fontSize: 14 }}>Loading doctors…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0', fontSize: 14 }}>
            {search ? 'No doctors match your search.' : 'No doctors yet.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8eef8', background: '#f7f9fc' }}>
                {['Doctor', 'Phone', 'Specialty', 'Rating', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#718096',
                    letterSpacing: 0.5, textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => (
                <tr key={doc.id || i} style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid #f0f4fa' : 'none',
                  transition: 'background 0.15s', cursor: 'pointer',
                }}
                  onClick={() => setSelectedDoc(doc)}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7f9fc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#e0f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        overflow: 'hidden',
                      }}>
                        {doc.profile_picture_url
                          ? <img src={doc.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Stethoscope size={16} color="#00AFEF" />
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0A1B47' }}>
                          Dr. {`${doc.first_name || ''} ${doc.last_name || ''}`.trim() || '(no name)'}
                        </div>
                        {doc.experience_years && (
                          <div style={{ fontSize: 11, color: '#a0aec0' }}>{doc.experience_years} yr exp</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#4a5568' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} color="#a0aec0" />
                      {doc.phone || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#4a5568' }}>{doc.specialization || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {doc.rating != null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={12} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontWeight: 600, color: '#0A1B47' }}>{Number(doc.rating).toFixed(1)}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={doc.available_status} />
                  </td>
                  <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                    <select
                      value={doc.available_status || 'inactive'}
                      disabled={updating === doc.id}
                      onChange={e => updateStatus(doc.id, e.target.value)}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                        fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                        background: '#fff', color: '#4a5568', outline: 'none',
                        opacity: updating === doc.id ? 0.5 : 1,
                      }}
                    >
                      <option value="available">Set Available</option>
                      <option value="suspended">Suspend</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedDoc && (
        <DoctorModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onStatusChange={(id, status) => {
            setDoctors(prev => prev.map(d => d.id === id ? { ...d, available_status: status } : d))
            setSelectedDoc(prev => ({ ...prev, available_status: status }))
          }}
        />
      )}
    </div>
  )
}
