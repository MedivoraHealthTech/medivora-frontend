import { useState, useEffect } from 'react'
import { X, Heart, User, Phone, Stethoscope, Leaf } from 'lucide-react'
import { supabase } from '../pages/supabase'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

async function getAuthUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session ? { token: session.access_token, userId: session.user.id } : null
  } catch { return null }
}

function SectionHeader({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 4 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'rgba(25,48,170,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={14} color="#1930AA" />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#1930AA', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </span>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>
        {label} <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span>
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1.5px solid rgba(0,0,0,0.1)', fontSize: 13,
  fontFamily: 'var(--font, Inter, sans-serif)', color: '#333',
  outline: 'none', boxSizing: 'border-box', background: '#fafafa',
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 38, height: 22, borderRadius: 11, flexShrink: 0,
          background: checked ? '#1930AA' : 'rgba(0,0,0,0.1)',
          position: 'relative', transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 19 : 3,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{label}</span>
    </label>
  )
}

// Arrays stored in DB come back as arrays; join them for the textarea
function arrToStr(val) {
  if (!val) return ''
  if (Array.isArray(val)) return val.filter(Boolean).join(', ')
  return String(val)
}

export default function MedicalInfoModal({ onClose, onSaved }) {
  const [saving,       setSaving]       = useState(false)
  const [loadingData,  setLoadingData]  = useState(true)
  const [error,        setError]        = useState(null)

  const [gender, setGender] = useState(null)

  const [form, setForm] = useState({
    blood_group: '',
    height: '',
    weight: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
    emergency_contact_relation: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    chronic_conditions: '',
    is_smoker: false,
    is_alcohol_user: false,
    is_pregnant: false,
    is_nursing: false,
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // Fetch existing medical info and pre-fill the form
  useEffect(() => {
    ;(async () => {
      try {
        const auth = await getAuthUser()
        if (!auth) return
        const res = await fetch(`${API_BASE}/auth/user/${auth.userId}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        })
        if (!res.ok) return
        const { user } = await res.json()
        if (!user) return
        if (user.gender) setGender(user.gender.toLowerCase())
        setForm(f => ({
          ...f,
          blood_group:                user.blood_group                || '',
          height:                     user.height_cm != null           ? String(user.height_cm) : '',
          weight:                     user.weight_kg != null           ? String(user.weight_kg) : '',
          emergency_contact_name:     user.emergency_contact_name     || '',
          emergency_contact_number:   user.emergency_contact_phone    || '',
          emergency_contact_relation: user.emergency_contact_relation || '',
          medical_history:            arrToStr(user.medical_history),
          allergies:                  arrToStr(user.allergies),
          current_medications:        arrToStr(user.current_medications),
          chronic_conditions:         arrToStr(user.chronic_conditions),
          is_smoker:       Boolean(user.is_smoker),
          is_alcohol_user: Boolean(user.is_alcohol_user),
          is_pregnant:     Boolean(user.is_pregnant),
          is_nursing:      Boolean(user.is_nursing),
        }))
      } catch { /* non-critical — form stays empty */ }
      finally { setLoadingData(false) }
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const auth = await getAuthUser()
      if (!auth) throw new Error('Not logged in')

      const body = new FormData()
      const csvOrEmpty = (val) => val.trim()

      if (form.blood_group)               body.append('blood_group',               form.blood_group)
      if (form.height.trim())             body.append('height_cm',                 form.height.trim())
      if (form.weight.trim())             body.append('weight_kg',                 form.weight.trim())
      if (form.emergency_contact_name.trim())     body.append('emergency_contact_name',     form.emergency_contact_name.trim())
      if (form.emergency_contact_number.trim())   body.append('emergency_contact_phone',    form.emergency_contact_number.trim())
      if (form.emergency_contact_relation.trim()) body.append('emergency_contact_relation', form.emergency_contact_relation.trim())
      if (form.medical_history.trim())    body.append('medical_history',    csvOrEmpty(form.medical_history))
      if (form.allergies.trim())          body.append('allergies',          csvOrEmpty(form.allergies))
      if (form.current_medications.trim()) body.append('current_medications', csvOrEmpty(form.current_medications))
      if (form.chronic_conditions.trim()) body.append('chronic_conditions', csvOrEmpty(form.chronic_conditions))
      body.append('is_smoker',       String(form.is_smoker))
      body.append('is_alcohol_user', String(form.is_alcohol_user))
      body.append('is_pregnant',     String(gender === 'male' ? false : form.is_pregnant))
      body.append('is_nursing',      String(form.is_nursing))

      const res = await fetch(`${API_BASE}/auth/user/${auth.userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${auth.token}` },
        body,
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.detail || 'Could not save information')
      }
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          fontFamily: 'var(--font, Inter, sans-serif)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Heart size={16} color="#1930AA" />
              <span style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>Help your doctor prepare</span>
            </div>
            <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.5 }}>
              All fields are optional. This information is shared with your doctor before the consultation.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: 'rgba(0,0,0,0.06)', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 12,
            }}
          >
            <X size={14} color="#666" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loadingData && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa', fontSize: 13 }}>
              Loading your health profile…
            </div>
          )}
          {!loadingData && <>

          {/* Vitals */}
          <SectionHeader icon={Stethoscope} label="Vitals" />
          <Field label="Blood Group">
            <select
              value={form.blood_group}
              onChange={e => set('blood_group', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Height (cm)">
                <input
                  type="number" placeholder="e.g. 170" min="50" max="250"
                  value={form.height} onChange={e => set('height', e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Weight (kg)">
                <input
                  type="number" placeholder="e.g. 65" min="1" max="300"
                  value={form.weight} onChange={e => set('weight', e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>

          {/* Emergency Contact */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16, marginTop: 6 }}>
            <SectionHeader icon={Phone} label="Emergency Contact" />
            <Field label="Contact Name">
              <input
                type="text" placeholder="Full name"
                value={form.emergency_contact_name}
                onChange={e => set('emergency_contact_name', e.target.value)}
                style={inputStyle}
              />
            </Field>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Field label="Phone Number">
                  <input
                    type="tel" placeholder="+91 98765 43210"
                    value={form.emergency_contact_number}
                    onChange={e => set('emergency_contact_number', e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Relation">
                  <input
                    type="text" placeholder="e.g. Spouse, Parent"
                    value={form.emergency_contact_relation}
                    onChange={e => set('emergency_contact_relation', e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Medical Background */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16, marginTop: 6 }}>
            <SectionHeader icon={User} label="Medical Background" />
            <p style={{ fontSize: 11, color: '#aaa', margin: '-8px 0 12px', lineHeight: 1.5 }}>
              Separate multiple entries with commas (e.g. Diabetes, Hypertension)
            </p>
            {[
              { key: 'medical_history',     label: 'Medical History',        placeholder: 'e.g. Diabetes, High BP' },
              { key: 'allergies',           label: 'Allergies',              placeholder: 'e.g. Penicillin, Dust' },
              { key: 'current_medications', label: 'Current Medications',    placeholder: 'e.g. Metformin 500mg' },
              { key: 'chronic_conditions',  label: 'Chronic Conditions',     placeholder: 'e.g. Asthma, PCOS' },
            ].map(({ key, label, placeholder }) => (
              <Field key={key} label={label}>
                <textarea
                  rows={2} placeholder={placeholder}
                  value={form[key]} onChange={e => set(key, e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </Field>
            ))}
          </div>

          {/* Lifestyle */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16, marginTop: 6 }}>
            <SectionHeader icon={Leaf} label="Lifestyle" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Toggle label="Smoker"       checked={form.is_smoker}       onChange={v => set('is_smoker', v)} />
              <Toggle label="Alcohol use"  checked={form.is_alcohol_user} onChange={v => set('is_alcohol_user', v)} />
              {gender !== 'male' && (
                <Toggle label="Pregnant" checked={form.is_pregnant} onChange={v => set('is_pregnant', v)} />
              )}
              <Toggle label="Nursing"      checked={form.is_nursing}      onChange={v => set('is_nursing', v)} />
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13,
              background: 'rgba(198,40,40,0.07)', color: '#c62828',
            }}>
              {error}
            </div>
          )}
          </>}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid rgba(0,0,0,0.07)',
          display: 'flex', gap: 10, flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: '1.5px solid rgba(0,0,0,0.1)', background: 'none',
              color: '#666', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loadingData}
            style={{
              flex: 2, padding: '11px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
              background: saving ? 'rgba(0,0,0,0.07)' : 'linear-gradient(135deg, #1930AA, #00AFEF)',
              color: saving ? '#bbb' : '#fff',
              boxShadow: saving ? 'none' : '0 4px 14px rgba(25,48,170,0.25)',
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Saving…' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
