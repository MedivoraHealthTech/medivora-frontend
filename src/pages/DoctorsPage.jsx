import { useEffect, useMemo, useState } from 'react'
import { Search, MapPin, Star, Stethoscope, Video, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import ComingSoonModal from '../components/ComingSoonModal'
import TimeSlotPicker from '../components/TimeSlotPicker'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

const SPECIALIZATION_FILTERS = [
  'All', 'Neurology', 'Cardiology', 'Dermatology', 'General Physician',
  'Pediatrics', 'Orthopedics', 'Gynecology', 'Psychiatry', 'ENT', 'Pulmonology',
]

const STATUS_COLOR = {
  available: { bg: 'rgba(0,200,83,0.12)',  color: '#00C853', label: 'Available' },
  busy:      { bg: 'rgba(255,160,0,0.12)', color: '#FFA000', label: 'Busy' },
  offline:   { bg: 'rgba(0,0,0,0.06)',     color: '#9E9E9E', label: 'Offline' },
  on_leave:  { bg: 'rgba(0,0,0,0.06)',     color: '#9E9E9E', label: 'On Leave' },
}

function initials(name) {
  const parts = (name || '').replace(/^Dr\.\s*/i, '').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

async function apiFetchDoctors() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
    const res = await fetch(`${API_BASE}/doctors`, { headers })
    if (!res.ok) throw new Error(`${res.status}`)
    const json = await res.json()
    return json.doctors || []
  } catch {
    return []
  }
}

export default function DoctorsPage() {
  const navigate = useNavigate()
  const [doctors, setDoctors]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [query, setQuery]               = useState('')
  const [specialization, setSpecialization] = useState('All')
  const [comingSoon,      setComingSoon]      = useState(null)
  const [slotPickerDoc,   setSlotPickerDoc]   = useState(null) // doctor for slot picker popup

  const loadDoctors = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetchDoctors()
      setDoctors(data)
      if (data.length === 0) setError('No doctors found in the directory.')
    } catch {
      setError('Could not load doctors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDoctors() }, [])

  const filtered = useMemo(() => {
    let list = doctors
    if (specialization !== 'All') {
      list = list.filter((d) => d.specialization === specialization)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((d) =>
        (`${d.first_name || ''} ${d.last_name || ''}`).toLowerCase().includes(q) ||
        (d.city || '').toLowerCase().includes(q) ||
        (d.specialization || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [query, specialization, doctors])

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--dark)', fontFamily: 'var(--font)', overflow: 'hidden' }}>

      <div style={{ flexShrink: 0, padding: '20px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--g300)', margin: 0, fontFamily: 'var(--serif)' }}>
            Find Doctors
          </h1>
          <button onClick={loadDoctors} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g500)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: 4 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--g500)', margin: 0 }}>
          Search by name or city. Filter by specialization.
        </p>

        <div style={{ marginTop: 16, position: 'relative', maxWidth: 480 }}>
          <Search size={18} color="var(--g500)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctors, city, specialization…"
            style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', fontSize: 14, fontFamily: 'var(--font)', outline: 'none', background: '#fff', color: 'var(--g300)', boxSizing: 'border-box' }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(0,175,239,0.45)' }}
            onBlur={(e)  => { e.target.style.borderColor = 'rgba(0,0,0,0.1)' }}
          />
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--g500)', marginRight: 4 }}>Specialization</span>
          {SPECIALIZATION_FILTERS.map((spec) => {
            const active = specialization === spec
            return (
              <button key={spec} onClick={() => setSpecialization(spec)} style={{ padding: '7px 14px', borderRadius: 50, border: active ? '1.5px solid rgba(25,48,170,0.35)' : '1px solid rgba(0,0,0,0.1)', background: active ? 'rgba(25,48,170,0.08)' : '#fff', color: active ? '#1930AA' : 'var(--g400)', fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.2s' }}>
                {spec}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--g500)' }}>
            <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Loading doctors…</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--err)', fontSize: 13 }}>
            {error}{' '}
            <button onClick={loadDoctors} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p style={{ fontSize: 12, color: 'var(--g500)', marginBottom: 14 }}>
              {filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map((d) => {
                const status = STATUS_COLOR[d.available_status] || STATUS_COLOR.offline
                return (
                  <article key={d.id} style={{ borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', padding: 18, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 12px rgba(25,48,170,0.06)' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #1930AA, #00AFEF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>
                        {initials(`${d.first_name || ''} ${d.last_name || ''}`)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--g300)', margin: '0 0 4px', lineHeight: 1.3 }}>
                          {[d.first_name, d.last_name].filter(Boolean).join(' ') || 'Doctor'}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--cyan)', background: 'rgba(0,175,239,0.1)', padding: '3px 8px', borderRadius: 6 }}>
                            <Stethoscope size={12} /> {d.specialization || 'General Physician'}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 50, background: status.bg, color: status.color }}>
                            ● {status.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {d.city && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--g500)' }}>
                        <MapPin size={14} color="var(--cyan)" /> {d.city}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={15} color="#FFA000" fill="#FFA000" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)' }}>{d.rating ?? '—'}</span>
                        {d.experience_years && <span style={{ fontSize: 12, color: 'var(--g500)' }}>· {d.experience_years}+ yrs</span>}
                      </div>
                      {d.consultation_fee && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--g400)' }}>₹{d.consultation_fee}</span>
                      )}
                    </div>

                    {d.cases_handled > 0 && (
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--g600)' }}>
                        {Number(d.cases_handled).toLocaleString()} cases handled
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button
                        onClick={() => d.available_status === 'available' ? setSlotPickerDoc(d) : null}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none', background: d.available_status === 'available' ? 'linear-gradient(135deg, #1930AA, #00AFEF)' : 'rgba(0,0,0,0.06)', color: d.available_status === 'available' ? '#fff' : '#9E9E9E', fontSize: 13, fontWeight: 600, cursor: d.available_status === 'available' ? 'pointer' : 'not-allowed', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Video size={15} /> {d.available_status === 'available' ? 'Book Video' : 'Unavailable'}
                      </button>
                      <button
                        onClick={() => navigate(`/doctors/${d.id}`)}
                        style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', color: 'var(--g400)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                        Profile
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--g500)', fontSize: 14 }}>
                No doctors match your search. Try another keyword or specialization.
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {comingSoon && <ComingSoonModal feature={comingSoon} onClose={() => setComingSoon(null)} />}
      {slotPickerDoc && (
        <TimeSlotPicker
          doctor={slotPickerDoc}
          onClose={() => setSlotPickerDoc(null)}
          onConfirm={(slot) => {
            setSlotPickerDoc(null)
            navigate('/book-appointment', {
              state: { preSelectedDoctor: slotPickerDoc, videoConsultation: true, selectedSlot: slot },
            })
          }}
        />
      )}
    </div>
  )
}
