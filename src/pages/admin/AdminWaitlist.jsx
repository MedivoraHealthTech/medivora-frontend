import { useState, useEffect } from 'react'
import { Users, RefreshCw, Phone, Mail, Calendar } from 'lucide-react'

const API_BASE = '/api'
function token() { return localStorage.getItem('medivora_admin_token') || '' }

function fmt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminWaitlist() {
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [search, setSearch]     = useState('')

  async function fetchWaitlist() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/admin/waitlist/patients`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setEntries(data.entries || [])
    } catch {
      setError('Could not load waitlist.')
    } finally {
      setLoading(false) }
  }

  useEffect(() => { fetchWaitlist() }, [])

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    return (
      (e.name  || '').toLowerCase().includes(q) ||
      (e.phone || '').includes(q) ||
      (e.email || '').toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A1B47', margin: 0 }}>Patient Waitlist</h1>
          <p style={{ fontSize: 13, color: '#718096', margin: '4px 0 0' }}>
            {entries.length} interested patient{entries.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by name, phone or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)',
              fontSize: 13, outline: 'none', minWidth: 240,
            }}
          />
          <button
            onClick={fetchWaitlist}
            style={{
              padding: '8px 14px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)',
              background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#a0aec0', fontSize: 14 }}>Loading…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#e53e3e', fontSize: 14 }}>{error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Users size={40} color="#e2e8f0" style={{ marginBottom: 12 }} />
          <p style={{ color: '#a0aec0', fontSize: 14 }}>
            {search ? 'No entries match your search.' : 'No waitlist entries yet.'}
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1.5fr',
            padding: '12px 20px', background: '#f7f8fa',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            <span>Name</span>
            <span>Phone</span>
            <span>Email</span>
            <span>Registered</span>
          </div>

          {filtered.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1.5fr',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={ev => ev.currentTarget.style.background = '#fafbff'}
              onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0A1B47' }}>{e.name}</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={12} color="#a0aec0" />
                <span style={{ fontSize: 13, color: '#444' }}>{e.phone}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={12} color="#a0aec0" />
                <span style={{ fontSize: 13, color: e.email ? '#444' : '#a0aec0' }}>{e.email || '—'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} color="#a0aec0" />
                <span style={{ fontSize: 12, color: '#718096' }}>{fmt(e.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
