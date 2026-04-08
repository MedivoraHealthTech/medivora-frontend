import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Stethoscope, MapPin, Star, Clock, Briefcase,
  BadgeCheck, Activity, IndianRupee, RefreshCw,
} from 'lucide-react'
import { supabase } from './supabase'
import { useBreakpoint } from '../hooks/useBreakpoint'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

const STATUS_META = {
  available: { bg: 'rgba(0,200,83,0.1)',  border: 'rgba(0,200,83,0.25)',  color: '#00C853', label: 'Available now' },
  busy:      { bg: 'rgba(255,160,0,0.1)', border: 'rgba(255,160,0,0.25)', color: '#FFA000', label: 'Currently busy' },
  offline:   { bg: 'rgba(0,0,0,0.05)',    border: 'rgba(0,0,0,0.12)',     color: '#9E9E9E', label: 'Offline' },
  on_leave:  { bg: 'rgba(0,0,0,0.05)',    border: 'rgba(0,0,0,0.12)',     color: '#9E9E9E', label: 'On leave' },
}

function initials(name) {
  const parts = (name || '').replace(/^Dr\.\s*/i, '').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

function StatCard({ icon: Icon, label, value, accent = '#1930AA' }) {
  return (
    <div style={{
      flex: '1 1 120px', minWidth: 110, borderRadius: 14, padding: '16px 14px',
      background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 2px 10px rgba(25,48,170,0.05)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${accent}14`, border: `1px solid ${accent}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={accent} />
      </div>
      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--g300)', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--g500)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

export default function DoctorPublicProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
        const res = await fetch(`${API_BASE}/doctors/${id}`, { headers })
        if (res.status === 404) { setError('Doctor not found.'); return }
        if (!res.ok) throw new Error(`${res.status}`)
        setDoctor(await res.json())
      } catch {
        setError('Could not load doctor profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const status = STATUS_META[doctor?.available_status] || STATUS_META.offline
  const name = ([doctor?.first_name, doctor?.last_name].filter(Boolean).join(' ') || 'Doctor').replace(/^Dr\.\s*/i, '')
  const specialties = doctor?.specialties || (doctor?.specialization ? [doctor.specialization] : [])

  return (
    <div style={{
      height: '100%', minHeight: 0, overflowY: 'auto',
      background: 'var(--dark)', fontFamily: 'var(--font)',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,248,252,0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        padding: isMobile ? '12px 16px' : '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff', border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: 'var(--g300)',
            fontFamily: 'var(--font)',
          }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--g300)' }}>
          Doctor Profile
        </span>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--g500)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 14 }}>Loading profile…</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--err)', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* ── Profile ── */}
      {!loading && doctor && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '16px 16px 48px' : '24px 20px 48px' }}>

          {/* ── Hero card ── */}
          <div style={{
            borderRadius: 18, background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 4px 24px rgba(25,48,170,0.08)',
            padding: '28px 24px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 20, alignItems: isMobile ? 'flex-start' : 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 26, fontWeight: 800,
                boxShadow: '0 4px 16px rgba(25,48,170,0.2)',
              }}>
                {initials(`${doctor.first_name || ''} ${doctor.last_name || ''}`)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{
                  fontSize: 22, fontWeight: 800, color: 'var(--g300)',
                  margin: '0 0 6px', fontFamily: 'var(--serif)',
                }}>
                  Dr. {name}
                </h1>

                {/* Specialties */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {specialties.map((s, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 12, fontWeight: 600, color: '#1930AA',
                      background: 'rgba(25,48,170,0.08)', padding: '4px 10px', borderRadius: 6,
                    }}>
                      <Stethoscope size={11} /> {s}
                    </span>
                  ))}
                </div>

                {/* Status badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600, color: status.color,
                  background: status.bg, border: `1px solid ${status.border}`,
                  padding: '5px 12px', borderRadius: 50,
                }}>
                  <Activity size={12} /> {status.label}
                </div>
              </div>
            </div>

            {/* Location */}
            {doctor.city && (
              <div style={{
                marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--g400)',
              }}>
                <MapPin size={15} color="var(--cyan)" />
                {doctor.city}
              </div>
            )}
          </div>

          {/* ── Stats row ── */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {doctor.rating != null && (
              <StatCard icon={Star} label="Rating" value={`${doctor.rating}/5`} accent="#FFA000" />
            )}
            {doctor.experience_years != null && (
              <StatCard icon={Briefcase} label="Experience" value={`${doctor.experience_years}+ yrs`} accent="#1930AA" />
            )}
            {doctor.cases_handled > 0 && (
              <StatCard icon={BadgeCheck} label="Cases handled" value={Number(doctor.cases_handled).toLocaleString()} accent="#00C853" />
            )}
            {doctor.consultation_fee != null && (
              <StatCard icon={IndianRupee} label="Consult fee" value={`₹${doctor.consultation_fee}`} accent="#00AFEF" />
            )}
          </div>

          {/* ── Details card ── */}
          <div style={{
            borderRadius: 16, background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 2px 12px rgba(25,48,170,0.05)', overflow: 'hidden',
          }}>
            {[
              doctor.nmc_number && { icon: BadgeCheck, label: 'NMC / License No.', value: doctor.nmc_number },
              doctor.experience_years != null && { icon: Briefcase, label: 'Years of experience', value: `${doctor.experience_years} years` },
              doctor.consultation_fee != null && { icon: IndianRupee, label: 'Consultation fee', value: `₹${doctor.consultation_fee}` },
              doctor.available_from && { icon: Clock, label: 'Available from', value: doctor.available_from },
            ].filter(Boolean).map((row, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '15px 20px',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'rgba(25,48,170,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <row.icon size={15} color="#1930AA" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--g500)', marginBottom: 2 }}>{row.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--g300)' }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── About / bio ── */}
          {doctor.bio && (
            <div style={{
              marginTop: 20, borderRadius: 16, background: '#fff',
              border: '1px solid rgba(0,0,0,0.07)', padding: '20px',
              boxShadow: '0 2px 12px rgba(25,48,170,0.05)',
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)', margin: '0 0 10px' }}>About</h3>
              <p style={{ fontSize: 13, color: 'var(--g400)', lineHeight: 1.7, margin: 0 }}>{doctor.bio}</p>
            </div>
          )}

        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
