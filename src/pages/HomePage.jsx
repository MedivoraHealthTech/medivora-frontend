import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { sendMessage as chatSend } from '../api/chat'
import { savePreLoginMessages } from '../utils/preLoginChat'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, MessageSquare, Activity, Users, Calendar, FileText,
  Stethoscope, Shield, CheckCircle, Clock, Video, ChevronRight, ChevronDown,
  Star, Zap, Lock, Heart, Brain, Thermometer, Bone, Eye, Baby, Pill,
  Mail, Phone, MapPin, UserCheck, ClipboardList, LayoutDashboard,
} from 'lucide-react'
import Logo from '../components/Logo'
import ComingSoonModal from '../components/ComingSoonModal'
import { useBreakpoint } from '../hooks/useBreakpoint'

function useReveal() {
  const ref = useRef(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, v]
}
function Rv({ children, delay = 0 }) {
  const [ref, v] = useReveal()
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s` }}>{children}</div>
}
function Tag({ children, color = 'var(--cyan)' }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, padding: '3px 10px', borderRadius: 50, background: `${color}18`, border: `1px solid ${color}28` }}>{children}</span>
}

const PATIENT_STEPS = [
  { icon: Activity,      label: 'Symptom Intake',         desc: 'Describe what you feel — AI listens carefully',         to: '/symptoms',      color: '#FF6D00' },
  { icon: Brain,         label: 'AI Triage',               desc: 'Smart severity assessment in seconds',                  to: '/symptoms',      color: 'var(--purple)' },
  { icon: Stethoscope,   label: 'Doctor Match',            desc: 'AI recommends the right specialist for you',           to: '/doctors',       color: 'var(--cyan)' },
  { icon: Calendar,      label: 'Book Consultation',       desc: 'Instant video booking — no waiting rooms',             to: '/consultations', color: 'var(--ok)' },
  { icon: Video,         label: 'Video Consultation',      desc: 'Face-to-face with your doctor, from home',             to: '/consultations', color: 'var(--sky)' },
  { icon: FileText,      label: 'Prescription',            desc: 'Doctor-approved, digitally signed Rx — downloadable',  to: '/prescriptions', color: 'var(--warn)' },
]
const DOCTOR_STEPS = [
  { icon: UserCheck,       label: 'Doctor Signup',          desc: 'Register with your NMC credentials',                  to: '/doctor/signup',       color: '#7C4DFF' },
  { icon: Shield,          label: 'NMC Verification',       desc: 'License verified — identity secured',                 to: '/doctor/verification', color: 'var(--ok)' },
  { icon: Users,           label: 'Profile Listing',        desc: 'Appear on Medivora — patients find you',              to: '/doctor/profile',      color: 'var(--cyan)' },
  { icon: LayoutDashboard, label: 'Consultation Dashboard', desc: 'Manage live sessions, get patient alerts',            to: '/doctor/dashboard',    color: 'var(--sky)' },
  { icon: Clock,           label: 'Patient History View',   desc: 'AI summary + full case history at a glance',          to: '/doctor/patients',     color: 'var(--warn)' },
  { icon: ClipboardList,   label: 'Prescription Generation',desc: 'Review AI Rx, modify, sign digitally & deliver',      to: '/doctor/approvals',    color: '#FF6D00' },
]
const SYMPTOMS = [
  { icon: Bone,        label: 'Pain',         q: 'I have pain' },
  { icon: Thermometer, label: 'Fever',        q: 'I have fever' },
  { icon: Brain,       label: 'Headache',     q: 'I have headache' },
  { icon: Heart,       label: 'Heart',        q: 'Heart palpitations' },
  { icon: Eye,         label: 'Vision',       q: 'Eye / vision issues' },
  { icon: Baby,        label: 'Child/Preg',   q: 'Child or pregnancy concern' },
  { icon: Pill,        label: 'Medicine',     q: 'Medicine related query' },
  { icon: Stethoscope, label: 'General',      q: 'General health checkup' },
]
const STATS = [
  { val: '50K+', label: 'Patients Served' },
  { val: '1,200+', label: 'Verified Doctors' },
  { val: '4.9★', label: 'Average Rating' },
  { val: '<2 min', label: 'Avg. Triage Time' },
]
const TESTIMONIALS = [
  { name: 'Rahul V.', city: 'Delhi',     text: 'Midnight mein chest pain tha — Medivora ne 90 seconds mein triage kiya aur ek doctor se connect kiya. Lifesaver!', stars: 5 },
  { name: 'Priya S.', city: 'Mumbai',    text: 'Pregnancy ke time doctor milna mushkil tha. Yahan instant appointment mila — bahut comfortable experience tha.', stars: 5 },
  { name: 'Dr. Amit K.', city: 'Bangalore', text: 'Doctor side se bhi bahut useful hai — AI already patient summary deta hai, toh consultation quality much better hoti hai.', stars: 5 },
]
const FAQS = [
  {
    q: 'Is Medivora a replacement for visiting a doctor in person?',
    points: [
      'No — Medivora connects you with real, verified doctors via video consultation.',
      'It is not a substitute for emergency care. If you have a life-threatening emergency, call 102/108 immediately.',
      'Our AI triage helps assess severity and routes you to the right specialist, but all final medical decisions are made by licensed doctors.',
    ],
  },
  {
    q: 'How does the AI triage work? Is it safe?',
    points: [
      'You describe your symptoms in Hindi or English and the AI analyses them to estimate severity (mild, moderate, or urgent).',
      'The triage result is a recommendation — it does not diagnose or prescribe anything on its own.',
      'A verified doctor reviews your case and provides the actual consultation, diagnosis, and prescription.',
      'All conversations are encrypted and stored securely.',
    ],
  },
  {
    q: 'Are the doctors on Medivora verified and licensed?',
    points: [
      'Yes. Every doctor undergoes NMC (National Medical Commission) license verification before being listed.',
      'Doctor profiles display their specialty, experience, and ratings from past consultations.',
      'You can view a doctor\'s credentials before booking an appointment.',
    ],
  },
  {
    q: 'How do I get a prescription? Is it valid?',
    points: [
      'After your consultation, the doctor reviews the AI-suggested prescription, modifies it if needed, and signs it digitally.',
      'Digital prescriptions issued by Medivora doctors are legally valid in India.',
      'You can download the signed prescription directly from your account.',
    ],
  },
  {
    q: 'What happens to my health data and chat history?',
    points: [
      'Your symptom data and chat history are private and only visible to you and the doctor you consult.',
      'Medivora does not sell personal health data to third parties.',
      'Data is stored with industry-standard encryption and complies with applicable Indian data protection regulations.',
    ],
  },
  {
    q: 'Can I use Medivora if I don\'t have an account yet?',
    points: [
      'Yes — you can start a symptom chat without logging in. Your conversation is saved temporarily.',
      'To book a consultation, receive a prescription, or view your history, you will need to create a free account.',
      'Sign-up takes under a minute and only requires basic details.',
    ],
  },
  {
    q: 'What languages does Medivora support?',
    points: [
      'The AI agent understands both Hindi and English, and can switch between them mid-conversation.',
      'Doctor consultations are conducted in the language both you and the doctor are comfortable with.',
      'More regional language support is planned in future updates.',
    ],
  },
]

function EmbeddedChat() {
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [messages, setMessages] = useState([
    { id: 'welcome', side: 'ai', text: 'Namaste! 🙏 Apne symptoms batao — Hindi ya English, dono mein baat kar sakte hain.' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [convId, setConvId] = useState(null)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  // Stable anonymous session ID — generated on first user message, persists for the session
  const anonSessionId = useRef(null)

  // Animated preview messages cycling in the hero card
  const previewMsgs = [
    { side: 'user', text: 'Sar mein 2 din se dard hai, neend nahi aa rahi...' },
    { side: 'ai',   text: 'Yeh migraine ya tension headache ke symptoms lag rahe hain. Koi fever hai?' },
    { side: 'user', text: 'Haan, thoda sa fever bhi hai.' },
    { side: 'ai',   text: '🧠 AI Triage: Moderate — Neurologist recommended.' },
  ]
  const [previewShown, setPreviewShown] = useState(1)
  useEffect(() => {
    if (isOpen || previewShown >= previewMsgs.length) return
    const t = setTimeout(() => setPreviewShown(s => s + 1), 1600)
    return () => clearTimeout(t)
  }, [previewShown, isOpen])

  // Trigger entrance animation on open
  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setIsVisible(true))
    else setIsVisible(false)
  }, [isOpen])

  // Focus input when modal opens; scroll to bottom on new messages
  useEffect(() => {
    if (!isOpen) return
    setTimeout(() => inputRef.current?.focus(), 60)
  }, [isOpen])
  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, isOpen])

  function isBookingSuggestion(text) {
    const l = text.toLowerCase()
    return l.includes('book an appointment') || l.includes('book a appointment') ||
      l.includes('shall i book') || l.includes("i'll book") || l.includes('i can book') ||
      l.includes('let me book') || l.includes('would you like me to book') || l.includes('i have booked') ||
      (l.includes('booking') && l.includes('appointment'))
  }

  async function send() {
    const text = input.trim()
    if (!text || isTyping) return

    // Generate a stable anonymous session ID on the first real message
    if (!anonSessionId.current) {
      anonSessionId.current = crypto.randomUUID()
    }

    const userMsg = { id: Date.now(), side: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    try {
      const data = await chatSend(text, convId)
      if (data.session_id) setConvId(data.session_id)
      const responseText = data.response || 'Ek second...'
      const isReport = !!(data.additional_data?.is_medical_report) ||
        (responseText.includes('📋') && responseText.toLowerCase().includes('medical assessment'))
      const aiMsg = {
        id: Date.now() + 1,
        side: 'ai',
        text: responseText,
        isReport,
        isBooking: !isReport && isBookingSuggestion(responseText),
      }
      setMessages(prev => {
        const updated = [...prev, aiMsg]
        // Persist after every AI reply so the user can restore after login
        savePreLoginMessages(anonSessionId.current, updated)
        return updated
      })
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, side: 'ai', text: 'Connection issue. Please try again.' }])
    } finally {
      setIsTyping(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const aiAvatar = (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--blue),var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, marginTop: 2 }}>
      <Logo size={13} />
    </div>
  )

  function renderMessage(m) {
    const isAI = m.side === 'ai'

    if (isAI && m.isReport) {
      const lines = m.text.split('\n')
      const previewText = lines.slice(0, 6).join('\n')
      const blurredText = lines.slice(6).join('\n')
      return (
        <div key={m.id} style={{ display: 'flex' }}>
          {aiAvatar}
          <div style={{ maxWidth: '84%' }}>
            <div style={{ borderRadius: '4px 16px 16px 16px', fontSize: 13.5, lineHeight: 1.7, background: '#fff', color: 'var(--g300)', border: '1px solid rgba(0,0,0,0.09)', overflow: 'hidden' }}>
              {/* Visible portion */}
              <div style={{ padding: '14px 16px 10px' }} dangerouslySetInnerHTML={{ __html: previewText.replace(/\n/g, '<br/>') }} />
              {/* Blurred portion */}
              {blurredText && (
                <div style={{ position: 'relative' }}>
                  <div
                    style={{ padding: '0 16px 14px', filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none', opacity: 0.6 }}
                    dangerouslySetInnerHTML={{ __html: blurredText.replace(/\n/g, '<br/>') }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.85) 100%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 18 }}>
                    <button
                      onClick={() => navigate('/login')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 20, background: 'linear-gradient(135deg,var(--blue),var(--cyan))', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 4px 18px rgba(21,101,192,0.35)' }}
                    >
                      <Lock size={13} /> View Your Full Results
                    </button>
                  </div>
                </div>
              )}
            </div>
            {!blurredText && (
              <button
                onClick={() => navigate('/login')}
                style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 20, background: 'linear-gradient(135deg,var(--blue),var(--cyan))', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 4px 18px rgba(21,101,192,0.35)' }}
              >
                <Lock size={13} /> View Your Full Results
              </button>
            )}
          </div>
        </div>
      )
    }

    if (isAI && m.isBooking) {
      const stripped = m.text
        .replace(/\b(shall i|i can|i'll|let me|would you like me to)\s+book[^.!?\n]*/gi, '')
        .replace(/\bbooking[^.!?\n]*/gi, '').trim()
      return (
        <div key={m.id} style={{ display: 'flex' }}>
          {aiAvatar}
          <div style={{ maxWidth: '80%' }}>
            {stripped && (
              <div style={{ padding: '12px 15px', marginBottom: 10, borderRadius: '4px 16px 16px 16px', fontSize: 14, lineHeight: 1.65, background: '#fff', color: 'var(--g300)', border: '1px solid rgba(0,0,0,0.09)' }}
                dangerouslySetInnerHTML={{ __html: stripped }}
              />
            )}
            <button
              onClick={() => navigate('/login')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 20, background: 'linear-gradient(135deg,var(--blue),var(--cyan))', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 4px 16px rgba(21,101,192,0.28)' }}
            >
              <Calendar size={14} /> Book Appointment
            </button>
          </div>
        </div>
      )
    }

    return (
      <div key={m.id} style={{ display: 'flex', justifyContent: isAI ? 'flex-start' : 'flex-end' }}>
        {isAI && aiAvatar}
        <div style={{ maxWidth: '78%', padding: '12px 15px', borderRadius: isAI ? '4px 16px 16px 16px' : '16px 4px 16px 16px', fontSize: 14, lineHeight: 1.6, background: isAI ? '#fff' : 'linear-gradient(135deg,var(--blue),#1448B5)', color: isAI ? 'var(--g300)' : '#fff', border: isAI ? '1px solid rgba(0,0,0,0.09)' : 'none' }}
          dangerouslySetInnerHTML={{ __html: m.text }}
        />
      </div>
    )
  }

  const quickActions = [
    { label: 'Book Consultation', icon: Calendar, to: '/consultations' },
    { label: 'Book Test',         icon: Activity, to: '/chat' },
    { label: 'Order Medicine',    icon: Pill,     to: '/chat' },
  ]

  return (
    <>
      {/* ── Hero preview card (static, no layout disruption) ── */}
      <div style={{ borderRadius: 20, overflow: 'hidden', background: '#fff', border: '1px solid rgba(0,0,0,0.09)', boxShadow: '0 24px 60px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(240,246,255,0.97)' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--ok)', animation: 'pulse 2s infinite' }} />
          <Logo size={18} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--g300)' }}>Medivora AI</div>
            <div style={{ fontSize: 10, color: 'var(--ok)' }}>● Active · Private</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Lock size={11} color="var(--g600)" />
            <span style={{ fontSize: 10, color: 'var(--g600)' }}>Zero-data</span>
          </div>
        </div>
        <div style={{ padding: '16px', minHeight: 200, background: '#f8faff', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {previewMsgs.slice(0, previewShown).map((m, i) => {
            const isAI = m.side === 'ai'
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isAI ? 'flex-start' : 'flex-end' }}>
                {isAI && (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,var(--blue),var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                    <Logo size={11} />
                  </div>
                )}
                <div style={{ maxWidth: '78%', padding: '8px 12px', borderRadius: isAI ? '4px 12px 12px 12px' : '12px 4px 12px 12px', fontSize: 12, lineHeight: 1.55, background: isAI ? '#fff' : 'linear-gradient(135deg,var(--blue),#1448B5)', color: isAI ? 'var(--g400)' : '#fff', border: isAI ? '1px solid rgba(0,0,0,0.08)' : 'none' }}
                  dangerouslySetInnerHTML={{ __html: m.text }}
                />
              </div>
            )
          })}
          {previewShown < previewMsgs.length && (
            <div style={{ display: 'flex', gap: 4, paddingLeft: 32 }}>
              {[0,150,300].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', opacity: 0.5, animation: `typing 1.2s ease-in-out ${d}ms infinite` }} />)}
            </div>
          )}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>
          <button
            onClick={() => setIsOpen(true)}
            style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,var(--blue),var(--cyan))', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(21,101,192,0.25)' }}
          >
            <MessageSquare size={16} /> Start Chatting with AI
          </button>
        </div>
      </div>

      {/* ── Chat popup modal (portal to body so CSS transforms don't break fixed positioning) ── */}
      {isOpen && createPortal(
        <div
          onClick={e => { if (e.target === e.currentTarget) setIsOpen(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,20,60,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, opacity: isVisible ? 1 : 0, transition: 'opacity 0.25s ease' }}
        >
          <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 640, height: isMobile ? '100svh' : 580, borderRadius: isMobile ? 0 : 24, overflow: 'hidden', background: '#fff', boxShadow: '0 32px 100px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)', transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease', opacity: isVisible ? 1 : 0 }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(240,246,255,0.97)', flexShrink: 0 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--ok)', animation: 'pulse 2s infinite' }} />
              <Logo size={20} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--g300)' }}>Medivora AI</div>
                <div style={{ fontSize: 10, color: 'var(--ok)' }}>● Active · Private · Zero-data</div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--g400)', flexShrink: 0 }}
              >×</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 14, background: '#f8faff' }}>
              {messages.map(m => renderMessage(m))}
              {isTyping && (
                <div style={{ display: 'flex', gap: 4, paddingLeft: 38 }}>
                  {[0,150,300].map(d => <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', opacity: 0.5, animation: `typing 1.2s ease-in-out ${d}ms infinite` }} />)}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input + quick actions */}
            <div style={{ padding: '12px 20px 16px', borderTop: '1px solid rgba(0,0,0,0.07)', flexShrink: 0, background: '#fff' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,188,212,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.09)'}
                  placeholder="Apne symptoms batao — Hindi ya English..."
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 12, background: '#f4f6ff', border: '1.5px solid rgba(0,0,0,0.09)', fontSize: 14, color: 'var(--g300)', outline: 'none', fontFamily: 'var(--font)', transition: 'border-color 0.2s' }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || isTyping}
                  style={{ padding: '12px 20px', borderRadius: 12, background: input.trim() ? 'linear-gradient(135deg,var(--blue),var(--cyan))' : 'rgba(0,0,0,0.05)', border: 'none', color: input.trim() ? '#fff' : 'var(--g700)', fontSize: 13, fontWeight: 700, cursor: input.trim() ? 'pointer' : 'default', fontFamily: 'var(--font)', flexShrink: 0 }}
                >Send</button>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {quickActions.map(({ label, icon: Icon, to }) => (
                  <button
                    key={label}
                    onClick={() => navigate(to)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 20, background: '#f4f6ff', border: '1px solid rgba(0,0,0,0.09)', fontSize: 11, fontWeight: 600, color: 'var(--g500)', cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.color = 'var(--cyan)'; e.currentTarget.style.background = 'rgba(0,188,212,0.07)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.09)'; e.currentTarget.style.color = 'var(--g500)'; e.currentTarget.style.background = '#f4f6ff' }}
                  >
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  )
}

function FlowCard({ steps, cta, ctaTo, onCtaClick, side }) {
  const btnStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '14px 0', borderRadius: 12, background: side === 'patient' ? 'linear-gradient(135deg,var(--blue),var(--cyan))' : 'linear-gradient(135deg,#7C4DFF,#5C35CC)', color: 'var(--g300)', fontSize: 14, fontWeight: 700, textDecoration: 'none', cursor: 'pointer', border: 'none', width: '100%', fontFamily: 'var(--font)' }
  return (
    <div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: i < steps.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={17} color={s.color} />
            </div>
            {i < steps.length - 1 && <div style={{ width: 1, height: 22, background: 'var(--g800)', marginTop: 6 }} />}
          </div>
          <div style={{ paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--g300)' }}>{s.label}</span>
              <span style={{ fontSize: 10, color: 'var(--g600)' }}>Step {i + 1}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--g500)', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
          </div>
        </div>
      ))}
      <div style={{ paddingTop: 20 }}>
        {ctaTo
          ? <Link to={ctaTo} style={btnStyle}>{cta} <ArrowRight size={15} /></Link>
          : <button onClick={onCtaClick} style={btnStyle}>{cta} <ArrowRight size={15} /></button>
        }
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [comingSoon, setComingSoon] = useState(null) // feature label or null
  const [openFaq, setOpenFaq] = useState(null)
  const [faqs, setFaqs] = useState(FAQS)
  const { isMobile, isTablet } = useBreakpoint()

  useEffect(() => {
    fetch('/api/faqs')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { if (data.length) setFaqs(data) })
      .catch(() => { /* keep hardcoded fallback */ })
  }, [])

  function startChat(symptom) {
    sessionStorage.setItem('quick_symptom', symptom)
    navigate('/chat')
  }

  return (
    <>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.5)}}
        @keyframes typing{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .animate-fade-up{animation:fadeUp .8s ease-out both}
        .animate-slide-in{animation:slideIn 1s ease-out .3s both}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
        @media(max-width:920px){
          .hero-grid{grid-template-columns:1fr!important}
          .flow-grid{grid-template-columns:1fr!important}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important}
          .how-grid{grid-template-columns:repeat(2,1fr)!important}
          .testi-grid{grid-template-columns:1fr!important}
          .symptom-grid{grid-template-columns:repeat(4,1fr)!important}
        }
        @media(max-width:500px){.symptom-grid{grid-template-columns:repeat(4,1fr)!important}}
      `}</style>

      <div style={{ fontFamily: 'var(--font)', background: 'var(--dark)', color: 'var(--g300)', overflowX: 'hidden' }}>

        {/* NAV */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px' : '0 40px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}><Logo size={28} showText={true} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {!isMobile && ['Features','Doctors','Contact'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--g400)', padding: '6px 10px', borderRadius: 6, textDecoration: 'none' }} onMouseEnter={e => e.target.style.color='var(--navy)'} onMouseLeave={e => e.target.style.color='var(--g400)'}>{l}</a>
            ))}
            {!isMobile && <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />}
            <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: 'var(--g300)', padding: '7px 12px', borderRadius: 8, textDecoration: 'none' }}>Log in</Link>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ padding: isMobile ? '48px 20px 40px' : '80px 40px 60px', maxWidth: 1140, margin: '0 auto' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 60, alignItems: 'center' }}>
            <div className="animate-fade-up">
              <Tag color="var(--cyan)">🇮🇳 Built for India</Tag>
              <h1 style={{ fontSize: 'clamp(34px,4.5vw,56px)', fontWeight: 800, color: 'var(--g300)', lineHeight: 1.1, margin: '18px 0 20px', fontFamily: 'var(--serif)', letterSpacing: -1 }}>
                Your First Stop.<br />
                <span style={{ background: 'linear-gradient(90deg,var(--blue),var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Every Symptom.</span>
              </h1>
              <p style={{ fontSize: 16, color: 'var(--g400)', lineHeight: 1.75, marginBottom: 36, maxWidth: 460 }}>
                Medivora AI sunta hai, triage karta hai, sahi doctor se milata hai — aur prescription tak poori journey manage karta hai. Hindi ya English — dono mein.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {[{ I: Lock, t: 'Zero-data Privacy' }, { I: Shield, t: 'NMC Verified Doctors' }, { I: Zap, t: 'AI Triage in 90s' }].map(({ I, t }) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--g500)', fontWeight: 500 }}><I size={13} color="var(--cyan)" />{t}</div>
                ))}
              </div>
            </div>
            <div className="animate-slide-in"><EmbeddedChat /></div>
          </div>
        </section>

        {/* QUICK SYMPTOM START */}
        <section style={{ padding: isMobile ? '0 20px 48px' : '0 40px 64px', maxWidth: 1140, margin: '0 auto' }}>
          <Rv>
            <div style={{ padding: '28px 32px', borderRadius: 20, background: '#fafbff', border: '1px solid var(--g800)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 4 }}>Quick Start</p>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--g300)', margin: 0 }}>What's bothering you?</h3>
                </div>
                <Link to="/chat" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--cyan)', textDecoration: 'none' }}>Full check <ChevronRight size={14} /></Link>
              </div>
              <div className="symptom-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4,1fr)' : 'repeat(8,1fr)', gap: 10 }}>
                {SYMPTOMS.map(s => (
                  <button key={s.q} onClick={() => startChat(s.q)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px', borderRadius: 12, background: '#fafbff', border: '1px solid rgba(0,0,0,0.09)', cursor: 'pointer', transition: 'all .2s', fontFamily: 'var(--font)' }} onMouseEnter={e => { e.currentTarget.style.borderColor='var(--cyan)'; e.currentTarget.style.background='rgba(0,188,212,0.06)' }} onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(0,0,0,0.09)'; e.currentTarget.style.background='rgba(255,255,255,0.02)' }}>
                    <s.icon size={20} color="var(--cyan)" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--g400)', textAlign: 'center', lineHeight: 1.3 }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </Rv>
        </section>

        {/* STATS */}
        <section style={{ padding: isMobile ? '0 20px 48px' : '0 40px 64px', maxWidth: 1140, margin: '0 auto' }}>
          <Rv>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14 }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ padding: '26px 22px', borderRadius: 14, background: '#ffffff', border: '1px solid var(--g800)', textAlign: 'center' }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--g300)', marginBottom: 5, fontFamily: 'var(--serif)' }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--g500)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Rv>
        </section>

        {/* DUAL FLOW */}
        <section id="features" style={{ padding: isMobile ? '0 20px 48px' : '0 40px 80px', maxWidth: 1140, margin: '0 auto' }}>
          <Rv>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <Tag color="var(--cyan)">Complete Journeys</Tag>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: 'var(--g300)', margin: '16px 0 10px', fontFamily: 'var(--serif)' }}>Two Paths. One Platform.</h2>
              <p style={{ fontSize: 15, color: 'var(--g500)', maxWidth: 480, margin: '0 auto' }}>Whether you are seeking care or providing it — Medivora guides every step.</p>
            </div>
          </Rv>
          <div className="flow-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : '1fr 1fr', gap: 24 }}>
            {/* Patient card */}
            <Rv delay={0.05}>
              <div style={{ borderRadius: 20, overflow: 'hidden', background: '#fafbff', border: '1px solid rgba(0,188,212,0.2)' }}>
                <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cyan)' }}>Patient Flow</span>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--g300)', margin: '12px 0 6px', fontFamily: 'var(--serif)' }}>Symptom to Cure</h3>
                  <p style={{ fontSize: 13, color: 'var(--g500)', margin: 0 }}>Login once — AI handles the rest. Symptom intake to prescription in minutes.</p>
                </div>
                <div style={{ padding: '8px 24px 24px' }}><FlowCard steps={PATIENT_STEPS} cta="Start as Patient" ctaTo="/signup" side="patient" /></div>
              </div>
            </Rv>
            {/* Doctor card */}
            <Rv delay={0.12}>
              <div style={{ borderRadius: 20, overflow: 'hidden', background: '#fafbff', border: '1px solid rgba(124,77,255,0.2)' }}>
                <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C4DFF' }}>Doctor Flow</span>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--g300)', margin: '12px 0 6px', fontFamily: 'var(--serif)' }}>Practice Smarter</h3>
                  <p style={{ fontSize: 13, color: 'var(--g500)', margin: 0 }}>Join India's verified doctor network. AI pre-triages — you focus on care.</p>
                </div>
                <div style={{ padding: '8px 24px 24px' }}><FlowCard steps={DOCTOR_STEPS} cta="Join as Doctor" ctaTo={null} onCtaClick={() => setComingSoon('Doctor registration')} side="doctor" /></div>
              </div>
            </Rv>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: isMobile ? '0 20px 48px' : '0 40px 80px', maxWidth: 1140, margin: '0 auto' }} id="doctors">
          <Rv>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Tag color="var(--purple)">How It Works</Tag>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--g300)', margin: '16px 0 0', fontFamily: 'var(--serif)' }}>Symptom to Prescription — 4 Steps</h2>
            </div>
          </Rv>
          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14 }}>
            {[
              { n:'01', icon: MessageSquare, title:'Describe Symptoms',  desc:'Chat in Hindi ya English. AI sunta hai bina judge kiye.',                 color:'var(--cyan)' },
              { n:'02', icon: Brain,         title:'AI Triage',          desc:'Severity assess karta hai — emergency ya routine, clearly batata hai.',    color:'var(--purple)' },
              { n:'03', icon: Video,         title:'Video Consult',      desc:'NMC-verified doctor se instant video call — ghar se.',                    color:'var(--ok)' },
              { n:'04', icon: FileText,      title:'Digital Rx',         desc:'Doctor-signed prescription — QR verified, downloadable PDF.',             color:'var(--warn)' },
            ].map((s, i) => (
              <Rv key={i} delay={i * 0.08}>
                <div style={{ padding: 22, borderRadius: 14, background: '#fafbff', border: '1px solid var(--g800)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 14, right: 16, fontSize: 30, fontWeight: 800, color: 'rgba(0,0,0,0.04)', fontFamily: 'var(--serif)' }}>{s.n}</div>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: `${s.color}14`, border: `1px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><s.icon size={19} color={s.color} /></div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)', marginBottom: 7 }}>{s.title}</h4>
                  <p style={{ fontSize: 12, color: 'var(--g500)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                </div>
              </Rv>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section style={{ padding: isMobile ? '0 20px 48px' : '0 40px 80px', maxWidth: 1140, margin: '0 auto' }}>
          <Rv>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <Tag color="var(--ok)">Real Stories</Tag>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--g300)', margin: '14px 0 0', fontFamily: 'var(--serif)' }}>Patients and Doctors Trust Medivora</h2>
            </div>
          </Rv>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 14 }}>
            {TESTIMONIALS.map((t, i) => (
              <Rv key={i} delay={i * 0.1}>
                <div style={{ padding: 22, borderRadius: 14, background: '#ffffff', border: '1px solid var(--g800)' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>{Array(t.stars).fill(0).map((_, j) => <Star key={j} size={12} color="var(--warn)" fill="var(--warn)" />)}</div>
                  <p style={{ fontSize: 13, color: 'var(--g300)', lineHeight: 1.7, marginBottom: 16 }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--blue),var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--g300)' }}>{t.name[0]}</div>
                    <div><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--g300)' }}>{t.name}</div><div style={{ fontSize: 11, color: 'var(--g600)' }}>{t.city}</div></div>
                  </div>
                </div>
              </Rv>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: isMobile ? '0 20px 48px' : '0 40px 80px', maxWidth: 1140, margin: '0 auto' }}>
          <Rv>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <Tag color="var(--purple)">FAQ</Tag>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--g300)', margin: '14px 0 8px', fontFamily: 'var(--serif)' }}>Frequently Asked Questions</h2>
              <p style={{ fontSize: 14, color: 'var(--g500)', maxWidth: 480, margin: '0 auto' }}>Everything you need to know before your first consultation.</p>
            </div>
          </Rv>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 780, margin: '0 auto' }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <Rv key={i} delay={i * 0.05}>
                  <div style={{ borderRadius: 14, border: `1px solid ${isOpen ? 'rgba(124,77,255,0.25)' : 'var(--g800)'}`, background: isOpen ? 'rgba(124,77,255,0.03)' : '#ffffff', overflow: 'hidden', transition: 'border-color 0.2s, background 0.2s' }}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)', lineHeight: 1.4 }}>{faq.question ?? faq.q}</span>
                      <ChevronDown size={17} color="var(--purple)" style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)' }} />
                    </button>
                    {isOpen && (
                      <ul style={{ margin: 0, padding: '0 22px 18px 38px', listStyle: 'disc' }}>
                        {faq.points.map((pt, j) => (
                          <li key={j} style={{ fontSize: 13, color: 'var(--g400)', lineHeight: 1.75, marginBottom: j < faq.points.length - 1 ? 6 : 0 }}>{pt}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Rv>
              )
            })}
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="contact" style={{ padding: isMobile ? '0 20px 48px' : '0 40px 80px', maxWidth: 1140, margin: '0 auto' }}>
          <Rv>
            <div style={{ padding: '52px 48px', borderRadius: 22, background: 'linear-gradient(135deg,rgba(21,101,192,0.1),rgba(0,188,212,0.06))', border: '1px solid rgba(0,188,212,0.14)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,188,212,0.06),transparent 70%)', pointerEvents: 'none' }} />
              <Tag color="var(--cyan)">Get Started Free</Tag>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--g300)', margin: '16px 0 10px', fontFamily: 'var(--serif)' }}>Ready to transform healthcare access?</h2>
              <p style={{ fontSize: 14, color: 'var(--g400)', marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>Patients get AI-powered care. Doctors get smarter workflows. Both get better outcomes.</p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 30px', borderRadius: 12, background: 'linear-gradient(135deg,var(--blue),var(--cyan))', color: 'var(--g300)', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 30px rgba(21,101,192,0.3)' }}>Start as Patient <ArrowRight size={15} /></Link>
                <button onClick={() => setComingSoon('Doctor registration')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 30px', borderRadius: 12, background: 'rgba(124,77,255,0.1)', border: '1px solid rgba(124,77,255,0.25)', color: '#7C4DFF', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}><Stethoscope size={14} />Join as Doctor</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 36, flexWrap: 'wrap' }}>
                {[{ I: Mail, v: 'nikhil.syal@themedivora.com' }, { I: Phone, v: '+91-9971615161' }, { I: MapPin, v: 'Gurgaon, Delhi NCR' }].map(({ I, v }) => (
                  <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--g500)' }}><I size={12} color="var(--cyan)" />{v}</div>
                ))}
              </div>
            </div>
          </Rv>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: isMobile ? '18px 20px' : '18px 40px', borderTop: '1px solid rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, maxWidth: 1140, margin: '0 auto' }}>
          <p style={{ fontSize: 11, color: 'var(--g700)' }}>© 2026 Medivora Health · themedivora.com</p>
          <p style={{ fontSize: 11, color: 'var(--g700)' }}>AI-assisted only — not a substitute for professional medical advice. Emergency: 102/108.</p>
        </footer>
      </div>

      {comingSoon && <ComingSoonModal feature={comingSoon} onClose={() => setComingSoon(null)} />}
    </>
  )
}
