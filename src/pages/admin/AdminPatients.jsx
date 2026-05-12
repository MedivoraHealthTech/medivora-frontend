import { useState, useEffect } from 'react'
import { Search, User, Phone, Calendar, MessageSquare, CheckCircle, XCircle, Users, X, Droplets } from 'lucide-react'

const API_BASE = ''
function token() { return localStorage.getItem('medivora_admin_token') || '' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FamilyModal({ patient, onClose }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/admin/patients/${patient.id}/family-members`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => setMembers(d.members || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patient.id])

  const name = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || '(no name)'

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,27,71,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 48px rgba(10,27,71,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0A1B47' }}>Family Members</div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: 4, borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 24px 24px', flex: 1 }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', fontSize: 13, padding: '24px 0' }}>Loading…</p>
          ) : members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Users size={32} color="#e2e8f0" style={{ marginBottom: 10 }} />
              <p style={{ color: '#a0aec0', fontSize: 13 }}>No family members added</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {members.map(m => (
                <div key={m.id} style={{ background: '#f7f9fc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e8eef8' }}>
                  {/* Name + relationship */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #e8f0ff, #ddf4ff)',
                      border: '1.5px solid #c7d7ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 800, color: '#1930AA',
                    }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0A1B47' }}>{m.name}</div>
                      {m.relationship && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: '#e8f0ff', color: '#1930AA', textTransform: 'capitalize' }}>
                          {m.relationship}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: m.medical_history || m.allergies || m.current_medications ? 10 : 0 }}>
                    {m.age && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fff', border: '1px solid #e2e8f0', color: '#4a5568' }}>{m.age} yrs</span>}
                    {m.gender && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fff', border: '1px solid #e2e8f0', color: '#4a5568', textTransform: 'capitalize' }}>{m.gender}</span>}
                    {m.blood_group && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fff0f1', border: '1px solid #fecdd3', color: '#e63946', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Droplets size={9} />{m.blood_group}
                      </span>
                    )}
                  </div>

                  {/* Medical info */}
                  {(m.medical_history || m.allergies || m.current_medications) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid #e8eef8', paddingTop: 8 }}>
                      {m.medical_history && (
                        <p style={{ fontSize: 12, color: '#555', margin: 0 }}><span style={{ fontWeight: 700 }}>History: </span>{m.medical_history}</p>
                      )}
                      {m.allergies && (
                        <p style={{ fontSize: 12, color: '#555', margin: 0 }}><span style={{ fontWeight: 700 }}>Allergies: </span>{m.allergies}</p>
                      )}
                      {m.current_medications && (
                        <p style={{ fontSize: 12, color: '#555', margin: 0 }}><span style={{ fontWeight: 700 }}>Medications: </span>{m.current_medications}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPatients() {
  const [patients, setPatients]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [familyPatient, setFamilyPatient] = useState(null) // patient whose family to show

  useEffect(() => {
    fetch(`${API_BASE}/admin/users?limit=200`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => setPatients(d.users || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p => {
    const q = search.toLowerCase()
    return (
      (p.first_name || '').toLowerCase().includes(q) ||
      (p.last_name  || '').toLowerCase().includes(q) ||
      (p.phone      || '').includes(q) ||
      (p.email      || '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0A1B47', marginBottom: 4 }}>Patients</h1>
        <p style={{ fontSize: 13, color: '#718096' }}>{patients.length} registered patient{patients.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email…"
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
          <div style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0', fontSize: 14 }}>Loading patients…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0', fontSize: 14 }}>
            {search ? 'No patients match your search.' : 'No patients yet.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8eef8', background: '#f7f9fc' }}>
                {['Patient', 'Phone', 'Email', 'Sessions', 'Family', 'Verified', 'Joined'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#718096',
                    letterSpacing: 0.5, textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id || i} style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid #f0f4fa' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7f9fc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#e8f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <User size={14} color="#1930AA" />
                      </div>
                      <div style={{ fontWeight: 600, color: '#0A1B47' }}>
                        {p.first_name || p.last_name ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : '(no name)'}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#4a5568' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} color="#a0aec0" />
                      {p.phone || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#4a5568' }}>{p.email || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4a5568' }}>
                      <MessageSquare size={12} color="#a0aec0" />
                      {p.session_count ?? 0}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {p.family_member_count > 0 ? (
                      <button
                        onClick={() => setFamilyPatient(p)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                          background: '#e8f0ff', color: '#1930AA', fontSize: 12, fontWeight: 700,
                          fontFamily: 'inherit', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#c7d7ff'}
                        onMouseLeave={e => e.currentTarget.style.background = '#e8f0ff'}
                        title="View family members"
                      >
                        <Users size={12} />
                        {p.family_member_count}
                      </button>
                    ) : (
                      <span style={{ color: '#cbd5e0', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {p.phone_verified
                      ? <CheckCircle size={15} color="#10b981" />
                      : <XCircle size={15} color="#e2e8f0" />
                    }
                  </td>
                  <td style={{ padding: '14px 16px', color: '#718096' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={12} color="#a0aec0" />
                      {formatDate(p.created_at)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Family members modal */}
      {familyPatient && (
        <FamilyModal patient={familyPatient} onClose={() => setFamilyPatient(null)} />
      )}
    </div>
  )
}
