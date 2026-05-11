import { useState, useEffect } from 'react'
import { Search, User, Phone, Calendar, MessageSquare, CheckCircle, XCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
function token() { return localStorage.getItem('medivora_admin_token') || '' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminPatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

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
                {['Patient', 'Phone', 'Email', 'Sessions', 'Verified', 'Joined'].map(h => (
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
    </div>
  )
}
