import { useState, useEffect } from 'react'
import { X, Clock, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { supabase } from '../pages/supabase'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

async function getAuthToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch { return null }
}

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const tom   = new Date(today); tom.setDate(tom.getDate() + 1)
  const dZero = new Date(d); dZero.setHours(0,0,0,0)

  if (dZero.getTime() === today.getTime()) return { label: 'Today', sub: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) }
  if (dZero.getTime() === tom.getTime())  return { label: 'Tomorrow', sub: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) }
  return {
    label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    sub:   d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
  }
}

function groupByPeriod(slots) {
  const morning   = slots.filter(t => { const h = parseInt(t); return h >= 6  && h < 12 })
  const afternoon = slots.filter(t => { const h = parseInt(t); return h >= 12 && h < 17 })
  const evening   = slots.filter(t => { const h = parseInt(t); return h >= 17 })
  return { morning, afternoon, evening }
}

function fmt12(time24) {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12    = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${period}`
}

/* ══════════════════════════════════════════════════════════════
   TimeSlotPicker
   Props:
     doctor       — doctor object (must have .id and .full_name / .name)
     onConfirm(slot: { date, time, label }) — called when user confirms
     onClose()    — called when modal is dismissed
   ══════════════════════════════════════════════════════════════ */
export default function TimeSlotPicker({ doctor, onConfirm, onClose }) {
  const [slotsMap,      setSlotsMap]      = useState({})   // { "2026-04-03": ["09:00", ...] }
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [dates,         setDates]         = useState([])   // sorted ISO date strings
  const [dateIndex,     setDateIndex]     = useState(0)    // which date tab is active
  const [selectedSlot,  setSelectedSlot]  = useState(null) // { date, time }

  const rawName = [doctor?.first_name, doctor?.last_name].filter(Boolean).join(' ') || doctor?.name || 'Doctor'
  const docName = rawName.replace(/^Dr\.?\s*/i, '')

  useEffect(() => {
    if (!doctor?.id) return
    ;(async () => {
      try {
        const token   = await getAuthToken()
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res     = await fetch(`${API_BASE}/doctors/${doctor.id}/slots`, { headers })
        if (!res.ok) throw new Error(`${res.status}`)
        const data    = await res.json()
        const map     = data.slots || {}
        const sorted  = Object.keys(map).sort()
        setSlotsMap(map)
        setDates(sorted)
        setDateIndex(0)
      } catch {
        setError('Could not load available slots. Please try again.')
      } finally {
        setLoading(false)
      }
    })()
  }, [doctor?.id])

  const activeDate  = dates[dateIndex]
  const activeSlots = activeDate ? (slotsMap[activeDate] || []) : []
  const { morning, afternoon, evening } = groupByPeriod(activeSlots)

  const handleConfirm = () => {
    if (!selectedSlot) return
    const { label, sub } = formatDate(selectedSlot.date)
    onConfirm({
      date:  selectedSlot.date,
      time:  selectedSlot.time,
      label: `${label}, ${sub} at ${fmt12(selectedSlot.time)}`,
    })
  }

  const SlotBtn = ({ time, date }) => {
    const active = selectedSlot?.date === date && selectedSlot?.time === time
    return (
      <button
        onClick={() => setSelectedSlot({ date, time })}
        style={{
          padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
          border: active ? '1.5px solid #1930AA' : '1px solid rgba(0,0,0,0.1)',
          background: active ? 'rgba(25,48,170,0.08)' : '#fff',
          color: active ? '#1930AA' : '#444',
          boxShadow: active ? '0 2px 8px rgba(25,48,170,0.12)' : 'none',
        }}
      >
        {fmt12(time)}
      </button>
    )
  }

  const PeriodSection = ({ label, slots: list }) => {
    if (!list.length) return null
    return (
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>{label}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {list.map(t => <SlotBtn key={t} time={t} date={activeDate} />)}
        </div>
      </div>
    )
  }

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
          fontFamily: 'var(--font, Inter, sans-serif)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Calendar size={15} color="#1930AA" />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Select a Time Slot</span>
            </div>
            <p style={{ fontSize: 12, color: '#1930AA', margin: '3px 0 0', fontWeight: 600 }}>Dr. {docName}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} color="#666" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 20px', maxHeight: '72vh', overflowY: 'auto' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', fontSize: 13 }}>
              <Clock size={28} color="#ddd" style={{ marginBottom: 10 }} />
              <div>Loading available slots…</div>
            </div>
          )}

          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#d32f2f', fontSize: 13 }}>{error}</div>
          )}

          {!loading && !error && dates.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', fontSize: 13 }}>
              <Clock size={28} color="#ddd" style={{ marginBottom: 10 }} />
              <div>No slots available for the next 7 days.</div>
              <div style={{ fontSize: 11, marginTop: 6 }}>Please check back later or choose a different doctor.</div>
            </div>
          )}

          {!loading && !error && dates.length > 0 && (
            <>
              {/* Date tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <button
                  onClick={() => setDateIndex(i => Math.max(0, i - 1))}
                  disabled={dateIndex === 0}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', cursor: dateIndex === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: dateIndex === 0 ? 0.3 : 1 }}
                >
                  <ChevronLeft size={14} />
                </button>

                <div style={{ flex: 1, display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {dates.map((d, i) => {
                    const { label, sub } = formatDate(d)
                    const active = i === dateIndex
                    return (
                      <button
                        key={d}
                        onClick={() => { setDateIndex(i); setSelectedSlot(null) }}
                        style={{
                          flexShrink: 0, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                          border: active ? '1.5px solid #1930AA' : '1px solid rgba(0,0,0,0.1)',
                          background: active ? 'rgba(25,48,170,0.07)' : '#fff',
                          textAlign: 'center', transition: 'all 0.15s', fontFamily: 'inherit',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#1930AA' : '#333' }}>{label}</div>
                        <div style={{ fontSize: 10, color: active ? '#1930AA' : '#999', marginTop: 2 }}>{sub}</div>
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setDateIndex(i => Math.min(dates.length - 1, i + 1))}
                  disabled={dateIndex === dates.length - 1}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', cursor: dateIndex === dates.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: dateIndex === dates.length - 1 ? 0.3 : 1 }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Slot groups */}
              {activeSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 13 }}>No slots on this day.</div>
              ) : (
                <>
                  <PeriodSection label="Morning" slots={morning} />
                  <PeriodSection label="Afternoon" slots={afternoon} />
                  <PeriodSection label="Evening" slots={evening} />
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
          {selectedSlot && (
            <div style={{ flex: 1, fontSize: 12, color: '#555' }}>
              <span style={{ fontWeight: 700, color: '#1930AA' }}>
                {fmt12(selectedSlot.time)}
              </span>
              {' · '}{formatDate(selectedSlot.date).label}, {formatDate(selectedSlot.date).sub}
            </div>
          )}
          {!selectedSlot && <div style={{ flex: 1, fontSize: 12, color: '#bbb' }}>No slot selected</div>}
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none', cursor: selectedSlot ? 'pointer' : 'default',
              background: selectedSlot ? 'linear-gradient(135deg, #1930AA, #00AFEF)' : 'rgba(0,0,0,0.07)',
              color: selectedSlot ? '#fff' : '#bbb', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              boxShadow: selectedSlot ? '0 4px 14px rgba(25,48,170,0.22)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Confirm Slot
          </button>
        </div>
      </div>
    </div>
  )
}
