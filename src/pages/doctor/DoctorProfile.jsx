import { useState, useEffect } from 'react'
import {
  UserCircle, Save, Edit3, Activity, Phone, MapPin, DollarSign,
  Award, BookOpen, CheckCircle, AlertCircle, AlertTriangle, X,
  Clock, Plus, Trash2, Video, Building2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { doctorAPI, profileAPI } from '../../api/client'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { formatSpecialty } from '../../utils/labels'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_SLOTS = DAYS_OF_WEEK.map(day => ({ day, start: '09:00', end: '23:30', type: 'both' }))

const SPECIALTIES_LIST = [
  'general_medicine', 'cardiology', 'neurology', 'dermatology', 'pediatrics',
  'orthopedics', 'gynecology', 'psychiatry', 'ophthalmology', 'ent',
  'gastroenterology', 'endocrinology', 'nephrology', 'urology', 'oncology',
  'pulmonology', 'rheumatology', 'anesthesiology', 'radiology', 'surgery',
]

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available',  color: 'var(--ok)'  },
  { value: 'busy',      label: 'Busy',       color: 'var(--warn)' },
  { value: 'offline',   label: 'Offline',    color: 'var(--g500)' },
  { value: 'on_leave',  label: 'On Leave',   color: 'var(--err)'  },
]

export default function DoctorProfile() {
  const { displayName, getToken, logout, updateDoctorUser } = useAuth()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm,   setDeleteConfirm]   = useState('')
  const [deleting,        setDeleting]        = useState(false)
  const [deleteError,     setDeleteError]     = useState('')

  // Editable fields
  const [firstName,    setFirstName]    = useState('')
  const [lastName,     setLastName]     = useState('')
  const [email,        setEmail]        = useState('')
  const [clinicName,   setClinicName]   = useState('')
  const [clinicAddr,   setClinicAddr]   = useState('')
  const [clinicPhone,  setClinicPhone]  = useState('')
  const [fee,          setFee]          = useState('')
  const [status,       setStatus]       = useState('available')
  const [expYears,     setExpYears]     = useState('')
  const [nmc,          setNmc]          = useState('')
  const [specialties,  setSpecialties]  = useState([])
  const [slots,        setSlots]        = useState([])

  useEffect(() => {
    async function load() {
      try {
        const data = await doctorAPI.getProfile(getToken())
        setProfile(data)
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
        setEmail(data.email || '')
        setClinicName(data.clinic_name  || '')
        setClinicAddr(data.clinic_address || '')
        setClinicPhone(data.clinic_phone || '')
        setFee(data.consultation_fee != null ? String(data.consultation_fee) : '')
        setStatus(data.available_status || 'available')
        setExpYears(data.experience_years != null ? String(data.experience_years) : '')
        setNmc(data.nmc_number || '')
        setSpecialties(Array.isArray(data.specialties) ? data.specialties : [])
        const savedSlots = Array.isArray(data.available_slots) && data.available_slots.length > 0
          ? data.available_slots
          : DEFAULT_SLOTS
        setSlots(savedSlots)
      } catch (e) {
        setError('Could not load profile. ' + (e.message || ''))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function toggleSpecialty(s) {
    setSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  function addSlot() {
    setSlots(prev => [...prev, { day: 'Monday', start: '09:00', end: '23:30', type: 'both' }])
  }

  function removeSlot(idx) {
    setSlots(prev => prev.filter((_, i) => i !== idx))
  }

  function updateSlot(idx, field, value) {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      await doctorAPI.updateProfile({
        full_name:        `${firstName.trim()} ${lastName.trim()}`.trim(),
        email:            email,
        clinic_name:      clinicName,
        clinic_address:   clinicAddr,
        clinic_phone:     clinicPhone,
        consultation_fee: fee,
        available_status: status,
        experience_years: expYears,
        nmc_number:       nmc,
        specialties:      specialties.join(','),
        available_slots:  JSON.stringify(slots),
      }, getToken())
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      if (fullName) updateDoctorUser({ full_name: fullName })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true); setDeleteError('')
    try {
      await profileAPI.deleteAccount(getToken())
      await logout()
      navigate('/')
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account.')
      setDeleting(false)
    }
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,188,212,0.2)', borderTopColor: 'var(--cyan)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const liveName = `${firstName} ${lastName}`.trim() || displayName.replace(/^Dr\.\s*/i, '')
  const cleanName = liveName
  const initials = cleanName.charAt(0).toUpperCase()

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px 28px', background: 'var(--dark)' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--g300)', fontFamily: 'var(--serif)', margin: '0 0 4px' }}>My Profile</h1>
        <p style={{ fontSize: 13, color: 'var(--g500)', margin: 0 }}>Update your professional details, availability, and clinic information.</p>
      </div>

      {/* Avatar + basic info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', borderRadius: 14, background: 'var(--pw)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1930AA, #00AFEF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 26, fontWeight: 700 }}>{initials}</span>
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--g300)', margin: '0 0 4px' }}>Dr. {cleanName}</h2>
          <p style={{ fontSize: 13, color: 'var(--g500)', margin: '0 0 8px' }}>
            {profile?.email || ''}{profile?.phone ? ` · ${profile.phone}` : ''}
          </p>
          {/* Status badge */}
          {STATUS_OPTIONS.map(opt => opt.value === status && (
            <span key={opt.value} style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 50, background: `${opt.color}18`, color: opt.color }}>
              ● {opt.label}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,61,0,0.07)', border: '1px solid rgba(255,61,0,0.18)', color: '#d93a00', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {saved && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.18)', color: '#00a852', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={14} /> Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSave}>

        {/* Personal Information */}
        <section style={section}>
          <h3 style={sectionTitle}><UserCircle size={15} /> Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div>
              <label style={fieldLabel}>First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" style={fieldInput} />
            </div>
            <div>
              <label style={fieldLabel}>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" style={fieldInput} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={fieldLabel}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@example.com" style={fieldInput} />
            </div>
          </div>
        </section>

        {/* Availability */}
        <section style={section}>
          <h3 style={sectionTitle}><Activity size={15} /> Availability Status</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setStatus(opt.value)} style={{
                padding: '9px 20px', borderRadius: 50, border: `2px solid ${status === opt.value ? opt.color : 'rgba(0,0,0,0.1)'}`,
                background: status === opt.value ? `${opt.color}18` : 'transparent',
                color: status === opt.value ? opt.color : 'var(--g500)',
                cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Available Slots */}
        <section style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ ...sectionTitle, margin: 0 }}><Clock size={15} /> Available Slots</h3>
            <button type="button" onClick={addSlot} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
              border: '1.5px solid rgba(25,48,170,0.3)', background: 'rgba(25,48,170,0.06)',
              color: '#1930AA', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700,
            }}>
              <Plus size={13} /> Add Slot
            </button>
          </div>

          {slots.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--g600)', textAlign: 'center', padding: '16px 0', margin: 0 }}>
              No slots added yet. Click "Add Slot" to set your weekly availability.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {slots.map((slot, idx) => {
              const slotType = slot.type || 'both'
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', border: '1.5px solid rgba(0,0,0,0.07)' }}>
                  <select
                    value={slot.day}
                    onChange={e => updateSlot(idx, 'day', e.target.value)}
                    style={{ ...slotSelect, minWidth: 120 }}
                  >
                    {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <span style={{ fontSize: 12, color: 'var(--g500)', flexShrink: 0 }}>from</span>
                  <input
                    type="time"
                    value={slot.start}
                    onChange={e => updateSlot(idx, 'start', e.target.value)}
                    style={slotSelect}
                  />
                  <span style={{ fontSize: 12, color: 'var(--g500)', flexShrink: 0 }}>to</span>
                  <input
                    type="time"
                    value={slot.end}
                    onChange={e => updateSlot(idx, 'end', e.target.value)}
                    style={slotSelect}
                  />
                  {/* Slot type toggle */}
                  <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1.5px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
                    {[
                      { value: 'online',  label: 'Online',   icon: <Video size={12} /> },
                      { value: 'both',    label: 'Both',     icon: null },
                      { value: 'offline', label: 'In-Clinic', icon: <Building2 size={12} /> },
                    ].map((opt, i) => {
                      const active = slotType === opt.value
                      const color  = opt.value === 'online' ? '#1930AA' : opt.value === 'offline' ? '#00875A' : '#7B5EA7'
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateSlot(idx, 'type', opt.value)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '6px 10px',
                            background: active ? `${color}18` : 'transparent',
                            color: active ? color : 'var(--g500)',
                            border: 'none',
                            borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                            cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 11, fontWeight: active ? 700 : 500,
                            transition: 'all 0.15s',
                          }}
                        >
                          {opt.icon}{opt.label}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSlot(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g500)', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}
                    title="Remove slot"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Credentials */}
        <section style={section}>
          <h3 style={sectionTitle}><Award size={15} /> Credentials</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div>
              <label style={fieldLabel}>NMC / License Number</label>
              <input value={nmc} onChange={e => setNmc(e.target.value)} placeholder="e.g. NMC-12345" style={fieldInput} />
            </div>
            <div>
              <label style={fieldLabel}>Years of Experience</label>
              <input type="number" min="0" max="60" value={expYears} onChange={e => setExpYears(e.target.value)} placeholder="e.g. 8" style={fieldInput} />
            </div>
          </div>
        </section>

        {/* Specialties */}
        <section style={section}>
          <h3 style={sectionTitle}><BookOpen size={15} /> Specializations</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SPECIALTIES_LIST.map(s => {
              const active = specialties.includes(s)
              const label = formatSpecialty(s)
              return (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)} style={{
                  padding: '6px 14px', borderRadius: 50,
                  border: `1.5px solid ${active ? '#1930AA' : 'rgba(0,0,0,0.1)'}`,
                  background: active ? 'rgba(25,48,170,0.08)' : 'transparent',
                  color: active ? '#1930AA' : 'var(--g500)',
                  cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: active ? 700 : 500, transition: 'all 0.2s',
                }}>
                  {active && '✓ '}{label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Clinic */}
        <section style={section}>
          <h3 style={sectionTitle}><MapPin size={15} /> Clinic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={fieldLabel}>Clinic / Hospital Name</label>
              <input value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="e.g. City Health Clinic" style={fieldInput} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={fieldLabel}>Clinic Address</label>
              <input value={clinicAddr} onChange={e => setClinicAddr(e.target.value)} placeholder="Full address" style={fieldInput} />
            </div>
            <div>
              <label style={fieldLabel}><Phone size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Clinic Phone</label>
              <input value={clinicPhone} onChange={e => setClinicPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" style={fieldInput} />
            </div>
            <div>
              <label style={fieldLabel}><DollarSign size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Consultation Fee (₹)</label>
              <input type="number" min="0" value={fee} onChange={e => setFee(e.target.value)} placeholder="e.g. 499" style={fieldInput} />
            </div>
          </div>
        </section>

        <button type="submit" disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 12,
          border: 'none', background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
          color: '#fff', cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--font)',
          fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s',
        }}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      {/* Danger Zone */}
      <div style={{ marginTop: 32, borderRadius: 14, border: '1.5px solid rgba(255,61,0,0.2)', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <AlertTriangle size={15} color="#d93a00" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#d93a00' }}>Danger Zone</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--g500)', margin: '0 0 14px' }}>
          Permanently delete your doctor account. This action cannot be undone and will remove all your profile data.
        </p>
        <button onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); setDeleteError('') }} style={{
          padding: '10px 20px', borderRadius: 10, border: '1.5px solid rgba(255,61,0,0.3)',
          background: 'rgba(255,61,0,0.06)', color: '#d93a00', cursor: 'pointer',
          fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
        }}>
          Delete My Account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{ background: 'var(--pw)', borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: isMobile ? 'calc(100vw - 32px)' : '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={20} color="#d93a00" />
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--g300)', margin: 0 }}>Delete Account</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g500)', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 6 }}>
              This will <strong style={{ color: 'var(--g300)' }}>permanently delete</strong> your account and all associated data including profile, consultations, and prescriptions.
            </p>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 16 }}>
              Type <strong style={{ color: '#d93a00' }}>DELETE</strong> to confirm:
            </p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE here"
              style={{ ...fieldInput, marginBottom: 12, border: '1.5px solid rgba(255,61,0,0.3)' }}
            />
            {deleteError && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,61,0,0.07)', color: '#d93a00', fontSize: 13, marginBottom: 12 }}>
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)',
                background: 'transparent', color: 'var(--g500)', cursor: 'pointer',
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
              }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: deleteConfirm === 'DELETE' ? '#d93a00' : 'rgba(255,61,0,0.3)',
                  color: '#fff', cursor: deleteConfirm === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, transition: 'background 0.2s',
                }}
              >
                {deleting ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const section = { borderRadius: 14, background: 'var(--pw)', border: '1px solid rgba(0,0,0,0.06)', padding: '18px 20px', marginBottom: 16 }
const sectionTitle = { fontSize: 14, fontWeight: 700, color: 'var(--g300)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 7 }
const fieldLabel = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--g500)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.6 }
const fieldInput = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.02)', color: 'var(--g300)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box', display: 'block', transition: 'border-color 0.2s' }
const slotSelect = { padding: '9px 12px', borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.02)', color: 'var(--g300)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', cursor: 'pointer' }
