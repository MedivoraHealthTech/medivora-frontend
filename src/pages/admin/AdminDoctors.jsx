import { useState, useEffect } from 'react'
import { Search, Stethoscope, Phone, Star, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
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

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [updating, setUpdating] = useState(null) // doctor_id being updated

  useEffect(() => {
    loadDoctors()
  }, [])

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
      const body = new FormData()
      body.append('status', newStatus)
      const res = await fetch(`${API_BASE}/admin/doctors/${doctorId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token()}` },
        body,
      })
      if (res.ok) {
        setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, available_status: newStatus } : d))
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
      (d.specialty   || '').toLowerCase().includes(q)
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
                  transition: 'background 0.15s',
                }}
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
                  <td style={{ padding: '14px 16px' }}>
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
    </div>
  )
}
