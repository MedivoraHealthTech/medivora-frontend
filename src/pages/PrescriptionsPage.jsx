import { useEffect, useMemo, useState } from 'react'
import { Search, Pill, Download, RefreshCw } from 'lucide-react'
import { supabase } from './supabase'
import ComingSoonModal from '../components/ComingSoonModal'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'
const STATUS_TABS = ['All', 'Approved', 'Pending', 'Expired']

async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch { return null }
}

async function apiFetchPrescriptions() {
  const token = await getToken()
  if (!token) return []
  const res = await fetch(`${API_BASE}/my/prescriptions`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return json.prescriptions || []
}

async function apiSeedDemoData() {
  const token = await getToken()
  if (!token) return
  await fetch(`${API_BASE}/demo/seed`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

function mapRow(rx) {
  // Build a flat shape from the prescriptions table row + prescription_items
  const items = rx.prescription_items || []
  const primaryItem = items[0] || {}
  const allMeds = items.map(i => i.medicine_name).join(', ')

  // Determine status display
  const statusMap = {
    approved:   'active',
    dispensed:  'active',
    expired:    'completed',
    cancelled:  'completed',
    rejected:   'completed',
    pending_approval: 'pending',
    draft:      'pending',
    modified:   'pending',
  }
  const status = statusMap[rx.status] || 'pending'

  return {
    id: rx.id,
    medication: allMeds || primaryItem.medicine_name || 'Prescription',
    dosage: primaryItem.frequency
      ? `${primaryItem.dosage || ''} ${primaryItem.frequency}`.trim()
      : rx.follow_up_instructions || '',
    doctorName: rx.doctor_name || 'Medivora Doctor',
    prescribedOn: rx.prescribed_at || rx.created_at,
    validUntil: rx.expires_at,
    status,
    refillsLeft: 0,
    items,
    rawStatus: rx.status,
    pdfUrl: rx.pdf_url || null,
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) }
  catch { return iso }
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [query, setQuery]                 = useState('')
  const [statusTab, setStatusTab]         = useState('All')
  const [comingSoon, setComingSoon]       = useState(false)

  const load = async (seed = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetchPrescriptions()
      if (data.length === 0 && seed) {
        // Auto-seed demo data on first load if empty
        await apiSeedDemoData()
        const seeded = await apiFetchPrescriptions()
        setPrescriptions(seeded.map(mapRow))
      } else {
        setPrescriptions(data.map(mapRow))
      }
    } catch (err) {
      setError('Could not load prescriptions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(true) }, [])

  const filtered = useMemo(() => {
    let list = prescriptions
    if (statusTab !== 'All') {
      const key = statusTab.toLowerCase()
      list = list.filter((p) => p.status === key)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        p.medication.toLowerCase().includes(q) ||
        p.doctorName.toLowerCase().includes(q) ||
        p.dosage.toLowerCase().includes(q),
      )
    }
    return list.sort((a, b) => new Date(b.prescribedOn) - new Date(a.prescribedOn))
  }, [query, statusTab, prescriptions])

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--dark)', fontFamily: 'var(--font)', overflow: 'hidden' }}>

      <div style={{ flexShrink: 0, padding: '20px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--g300)', margin: 0, fontFamily: 'var(--serif)' }}>
            Prescriptions
          </h1>
          <button onClick={() => load(false)} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g500)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: 4 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--g500)', margin: 0 }}>
          Your medications — search or filter by status.
        </p>

        <div style={{ marginTop: 16, position: 'relative', maxWidth: 480 }}>
          <Search size={18} color="var(--g500)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medication or prescribing doctor…"
            style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', fontSize: 14, fontFamily: 'var(--font)', outline: 'none', background: '#fff', color: 'var(--g300)', boxSizing: 'border-box' }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(0,175,239,0.45)' }}
            onBlur={(e)  => { e.target.style.borderColor = 'rgba(0,0,0,0.1)' }}
          />
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--g500)', marginRight: 4 }}>Status</span>
          {STATUS_TABS.map((tab) => {
            const active = statusTab === tab
            return (
              <button key={tab} onClick={() => setStatusTab(tab)} style={{ padding: '7px 14px', borderRadius: 50, border: active ? '1.5px solid rgba(25,48,170,0.35)' : '1px solid rgba(0,0,0,0.1)', background: active ? 'rgba(25,48,170,0.08)' : '#fff', color: active ? '#1930AA' : 'var(--g400)', fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--g500)' }}>
            <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Loading prescriptions…</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--err)', fontSize: 13 }}>
            {error}{' '}
            <button onClick={() => load(false)} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p style={{ fontSize: 12, color: 'var(--g500)', marginBottom: 14 }}>
              {filtered.length} prescription{filtered.length !== 1 ? 's' : ''}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {filtered.map((p) => (
                <article key={p.id} style={{ borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', padding: 18, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 12px rgba(25,48,170,0.06)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: p.status === 'active' ? 'rgba(0,175,239,0.12)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pill size={22} color={p.status === 'active' ? 'var(--cyan)' : 'var(--g500)'} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)', margin: '0 0 4px', lineHeight: 1.3 }}>
                        {p.medication}
                      </h2>
                      {p.dosage && <p style={{ fontSize: 12, color: 'var(--g500)', margin: 0, lineHeight: 1.45 }}>{p.dosage}</p>}
                    </div>
                  </div>

                  {/* Individual medicine items */}
                  {p.items.length > 1 && (
                    <div style={{ background: 'rgba(0,0,0,0.025)', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {p.items.map((item, i) => (
                        <div key={i} style={{ fontSize: 11, color: 'var(--g500)', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, color: 'var(--g400)' }}>{item.medicine_name}</span>
                          <span>{item.frequency}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: 'var(--g500)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--g400)' }}>Prescribed by</span>{' '}{p.doctorName}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: 'var(--g700)' }}>
                    <span>Issued {formatDate(p.prescribedOn)}</span>
                    {p.validUntil && <><span>·</span><span>Valid until {formatDate(p.validUntil)}</span></>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 50,
                      background: p.status === 'active' ? 'rgba(0,200,83,0.12)' : p.status === 'pending' ? 'rgba(255,160,0,0.12)' : 'rgba(0,0,0,0.06)',
                      color:      p.status === 'active' ? '#00C853'             : p.status === 'pending' ? '#FFA000'             : 'var(--g500)',
                      textTransform: 'capitalize',
                    }}>
                      {p.status === 'active' ? 'Active' : p.status === 'pending' ? 'Awaiting Approval' : 'Completed'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--g600)' }}>
                      {p.rawStatus && <span style={{ opacity: 0.6 }}>{p.rawStatus}</span>}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button
                      onClick={() => p.pdfUrl && window.open(p.pdfUrl, '_blank')}
                      disabled={!p.pdfUrl}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', color: p.pdfUrl ? 'var(--g400)' : 'var(--g700)', fontSize: 13, fontWeight: 600, cursor: p.pdfUrl ? 'pointer' : 'not-allowed', fontFamily: 'var(--font)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <Download size={15} /> PDF
                    </button>
                    <button
                      onClick={() => p.status === 'active' && setComingSoon(true)}
                      disabled={p.status !== 'active'}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none', background: p.status === 'active' ? 'linear-gradient(135deg, #1930AA, #00AFEF)' : 'rgba(0,0,0,0.06)', color: p.status === 'active' ? '#fff' : 'var(--g700)', fontSize: 13, fontWeight: 600, cursor: p.status === 'active' ? 'pointer' : 'not-allowed', fontFamily: 'var(--font)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <RefreshCw size={15} /> Refill
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--g500)', fontSize: 14 }}>
                No prescriptions match your search.
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {comingSoon && <ComingSoonModal feature="Prescription refill" onClose={() => setComingSoon(false)} />}
    </div>
  )
}
