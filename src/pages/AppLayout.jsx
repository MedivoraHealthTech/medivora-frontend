// v2
import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useBreakpoint'
import {
  Bell, Moon, Sun, Activity, LayoutDashboard,
  MessageSquare, Users, CalendarDays, ClipboardList,
  Thermometer, Brain, Heart, Baby, Bone, Eye, Stethoscope, Pill,
  FileText, Play, MapPin, UserCheck, TestTube, X, CheckCircle, Info, AlertTriangle,
  FlaskConical, ShoppingBag, ShoppingCart,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from './supabase'
import Logo from '../components/Logo'

/* ─── Nav Items ─── */
const navItems = [
  { id: 'dashboard',     label: 'Dashboard',      icon: LayoutDashboard, path: '/dashboard',   soon: false },
  { id: 'chat',          label: 'AI Chat',        icon: MessageSquare, path: '/chat',          soon: false },
  { id: 'doctors',       label: 'Find Doctors',   icon: Users,         path: '/doctors',       soon: false },
  { id: 'consultations', label: 'Consultations',  icon: CalendarDays,  path: '/consultations', soon: false },
  { id: 'prescriptions', label: 'Prescriptions',  icon: ClipboardList, path: '/prescriptions', soon: false },
  { id: 'book-test',     label: 'Book Test',      icon: FlaskConical,  path: null,             soon: true  },
  { id: 'order-med',     label: 'Order Medicine', icon: ShoppingCart,  path: null,             soon: true  },
]

/* ─── Quick Symptoms ─── */
const categories = [
  { name: 'Pain & Injury', icon: Bone,        message: "I'm having pain or an injury. Can you help?" },
  { name: 'Fever',         icon: Thermometer, message: "I have a fever. What should I do?" },
  { name: 'Mental Health', icon: Brain,        message: "I've been feeling anxious and overwhelmed. Can you help?" },
  { name: 'Heart & BP',    icon: Heart,        message: "I have concerns about my heart or blood pressure." },
  { name: 'Pregnancy',     icon: Baby,         message: "I have questions about my pregnancy." },
  { name: 'Vision',        icon: Eye,          message: "I'm having trouble with my vision. What could it be?" },
  { name: 'Checkup',       icon: Stethoscope,  message: "I'd like to book a general health checkup." },
  { name: 'Medications',   icon: Pill,          message: "I have questions about my medications." },
]

function statusColor(rawStatus) {
  if (rawStatus === 'completed') return 'var(--ok)'
  if (rawStatus === 'cancelled' || rawStatus === 'no_show') return 'var(--err)'
  return 'var(--cyan)'
}
function statusDot(rawStatus) {
  if (rawStatus === 'completed') return '#00C853'
  if (rawStatus === 'cancelled' || rawStatus === 'no_show') return '#FF3D00'
  return '#00AFEF'
}

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function notifTypeToUi(notification_type) {
  if (notification_type === 'prescription') return 'success'
  if (notification_type === 'consultation') return 'info'
  if (notification_type === 'reminder' || notification_type === 'health_tip') return 'warning'
  return 'info'
}

const notifIcon = (type) => {
  if (type === 'success') return <CheckCircle size={14} color='var(--ok)' />
  if (type === 'warning') return <AlertTriangle size={14} color='var(--warn)' />
  return <Info size={14} color='var(--cyan)' />
}

/* ─── Specialty-aware right-pane content ─── */
const SPECIALTY_CONTENT = {
  default: {
    articles: [
      { title: 'Understanding Chronic Headaches', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/headache.html' },
      { title: 'When to See a Doctor for Pain', source: 'WHO', tag: 'Guide', url: 'https://www.who.int/news-room/fact-sheets/detail/musculoskeletal-conditions' },
      { title: 'Heart Disease Prevention Tips', source: 'Mayo Clinic', tag: 'Article', url: 'https://www.mayoclinic.org/diseases-conditions/heart-disease/in-depth/heart-disease-prevention/art-20046502' },
      { title: 'Mental Health: Anxiety & Stress', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/anxiety-fear-panic/' },
    ],
    videos: [
      { title: 'Migraine Relief Exercises', channel: 'Bob & Brad', duration: '10:36', url: 'https://www.youtube.com/watch?v=mortZm5BeUs' },
      { title: 'Stress Management 101', channel: 'Psych2Go', duration: '12:05', url: 'https://www.youtube.com/watch?v=hnpQrMqDoqE' },
      { title: 'How to Lower Blood Pressure', channel: 'Cleveland Clinic', duration: '3:18', url: 'https://www.youtube.com/watch?v=7i29Dx77JD8' },
      { title: 'Yoga for Beginners – Full Body', channel: 'Yoga With Adriene', duration: '31:00', url: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' },
    ],
  },
  cardiology: {
    articles: [
      { title: 'Heart Diseases Overview', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/heartdiseases.html' },
      { title: 'High Blood Pressure', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/high-blood-pressure-hypertension/' },
      { title: 'Heart Attack Symptoms & Causes', source: 'Mayo Clinic', tag: 'Article', url: 'https://www.mayoclinic.org/diseases-conditions/heart-attack/symptoms-causes/syc-20373106' },
      { title: 'Cardiovascular Disease', source: 'WHO', tag: 'Guide', url: 'https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)' },
    ],
    videos: [
      { title: 'How to Lower Blood Pressure', channel: 'Cleveland Clinic', duration: '3:18', url: 'https://www.youtube.com/watch?v=7i29Dx77JD8' },
      { title: 'Heart Disease Explained', channel: 'YouTube Health', duration: '8:00', url: 'https://www.youtube.com/results?search_query=heart+disease+explained+medical' },
      { title: 'Warning Signs of a Heart Attack', channel: 'YouTube Health', duration: '5:00', url: 'https://www.youtube.com/results?search_query=heart+attack+warning+signs+doctor' },
      { title: 'Exercises for Heart Health', channel: 'YouTube Health', duration: '10:00', url: 'https://www.youtube.com/results?search_query=exercises+for+heart+health+cardiology' },
    ],
  },
  gynecology: {
    articles: [
      { title: "Women's Health", source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/womenshealth.html' },
      { title: 'Period Problems', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/periods/irregular-periods/' },
      { title: 'Pregnancy Overview', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/pregnancy.html' },
      { title: 'PCOS: What You Should Know', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/' },
    ],
    videos: [
      { title: "Women's Health Q&A", channel: 'YouTube Health', duration: '7:00', url: 'https://www.youtube.com/results?search_query=womens+health+gynecology+explained' },
      { title: 'PCOS Explained by Doctors', channel: 'YouTube Health', duration: '6:00', url: 'https://www.youtube.com/results?search_query=PCOS+explained+doctor' },
      { title: 'Menstrual Health Guide', channel: 'YouTube Health', duration: '5:30', url: 'https://www.youtube.com/results?search_query=menstrual+health+guide+medical' },
      { title: 'Pregnancy Health Tips', channel: 'YouTube Health', duration: '8:00', url: 'https://www.youtube.com/results?search_query=pregnancy+health+tips+doctor' },
    ],
  },
  psychiatry: {
    articles: [
      { title: 'Anxiety Disorders', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/anxiety.html' },
      { title: 'Depression Overview', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/depression.html' },
      { title: 'Mental Health Support', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/mental-health/' },
      { title: 'Stress & Your Health', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/stress.html' },
    ],
    videos: [
      { title: 'Stress Management 101', channel: 'Psych2Go', duration: '12:05', url: 'https://www.youtube.com/watch?v=hnpQrMqDoqE' },
      { title: 'Understanding Anxiety', channel: 'YouTube Health', duration: '7:00', url: 'https://www.youtube.com/results?search_query=understanding+anxiety+disorder+explained' },
      { title: 'How to Manage Depression', channel: 'YouTube Health', duration: '9:00', url: 'https://www.youtube.com/results?search_query=managing+depression+mental+health+tips' },
      { title: 'Mindfulness for Mental Health', channel: 'YouTube Health', duration: '10:00', url: 'https://www.youtube.com/results?search_query=mindfulness+meditation+mental+health' },
    ],
  },
  dermatology: {
    articles: [
      { title: 'Skin Conditions Overview', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/skinconditions.html' },
      { title: 'Acne: Causes & Treatment', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/acne/' },
      { title: 'Eczema (Atopic Dermatitis)', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/eczema.html' },
      { title: 'Skin Infections', source: 'MedlinePlus', tag: 'Guide', url: 'https://medlineplus.gov/skininfections.html' },
    ],
    videos: [
      { title: 'Acne Treatment by Dermatologist', channel: 'YouTube Health', duration: '8:00', url: 'https://www.youtube.com/results?search_query=acne+treatment+dermatologist+tips' },
      { title: 'Eczema Explained', channel: 'YouTube Health', duration: '5:00', url: 'https://www.youtube.com/results?search_query=eczema+treatment+explained+doctor' },
      { title: 'Skincare Routine for Healthy Skin', channel: 'YouTube Health', duration: '7:00', url: 'https://www.youtube.com/results?search_query=skincare+routine+dermatologist+recommended' },
      { title: 'Common Skin Rashes Guide', channel: 'YouTube Health', duration: '6:00', url: 'https://www.youtube.com/results?search_query=skin+rash+causes+treatment+doctor' },
    ],
  },
  orthopedics: {
    articles: [
      { title: 'Back Pain', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/backpain.html' },
      { title: 'Joint Disorders', source: 'MedlinePlus', tag: 'Guide', url: 'https://medlineplus.gov/jointdisorders.html' },
      { title: 'Back Pain: Treatment Options', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/back-pain/' },
      { title: 'Bone Diseases', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/bonediseases.html' },
    ],
    videos: [
      { title: 'Back Pain Relief Exercises', channel: 'Bob & Brad', duration: '10:36', url: 'https://www.youtube.com/watch?v=mortZm5BeUs' },
      { title: 'Knee Pain Exercises', channel: 'YouTube Health', duration: '8:00', url: 'https://www.youtube.com/results?search_query=knee+pain+exercises+physiotherapy' },
      { title: 'Posture Correction Guide', channel: 'YouTube Health', duration: '7:00', url: 'https://www.youtube.com/results?search_query=posture+correction+back+pain+relief' },
      { title: 'Joint Pain Management', channel: 'YouTube Health', duration: '9:00', url: 'https://www.youtube.com/results?search_query=joint+pain+management+orthopedic' },
    ],
  },
  neurology: {
    articles: [
      { title: 'Headache Overview', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/headache.html' },
      { title: 'Migraine: Symptoms & Treatment', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/migraine/' },
      { title: 'Stroke Overview', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/stroke.html' },
      { title: 'Neurological Diseases', source: 'MedlinePlus', tag: 'Guide', url: 'https://medlineplus.gov/neurologicdiseases.html' },
    ],
    videos: [
      { title: 'Migraine Relief Exercises', channel: 'Bob & Brad', duration: '10:36', url: 'https://www.youtube.com/watch?v=mortZm5BeUs' },
      { title: 'Headache Types Explained', channel: 'YouTube Health', duration: '6:00', url: 'https://www.youtube.com/results?search_query=types+of+headaches+explained+neurologist' },
      { title: 'Stroke Warning Signs (FAST)', channel: 'YouTube Health', duration: '4:00', url: 'https://www.youtube.com/results?search_query=stroke+warning+signs+FAST+method' },
      { title: 'Epilepsy & Seizure First Aid', channel: 'YouTube Health', duration: '7:00', url: 'https://www.youtube.com/results?search_query=epilepsy+seizure+first+aid+management' },
    ],
  },
  endocrinology: {
    articles: [
      { title: 'Diabetes Mellitus', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/diabetes.html' },
      { title: 'Thyroid Diseases', source: 'MedlinePlus', tag: 'Guide', url: 'https://medlineplus.gov/thyroiddiseases.html' },
      { title: 'Type 2 Diabetes', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/type-2-diabetes/' },
      { title: 'Hormonal Disorders', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/hormones.html' },
    ],
    videos: [
      { title: 'Diabetes Management Guide', channel: 'YouTube Health', duration: '9:00', url: 'https://www.youtube.com/results?search_query=diabetes+management+blood+sugar+tips' },
      { title: 'Thyroid Disease Explained', channel: 'YouTube Health', duration: '7:00', url: 'https://www.youtube.com/results?search_query=thyroid+disease+hypothyroid+hyperthyroid' },
      { title: 'Insulin Resistance Explained', channel: 'YouTube Health', duration: '8:00', url: 'https://www.youtube.com/results?search_query=insulin+resistance+explained+doctor' },
      { title: 'Diet for Diabetics', channel: 'YouTube Health', duration: '10:00', url: 'https://www.youtube.com/results?search_query=best+diet+for+diabetes+type+2' },
    ],
  },
  pulmonology: {
    articles: [
      { title: 'Asthma', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/asthma.html' },
      { title: 'COPD Overview', source: 'MedlinePlus', tag: 'Guide', url: 'https://medlineplus.gov/copd.html' },
      { title: 'Breathing Problems', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/shortness-of-breath/' },
      { title: 'Lung Diseases', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/lungdiseases.html' },
    ],
    videos: [
      { title: 'Asthma Management Tips', channel: 'YouTube Health', duration: '6:00', url: 'https://www.youtube.com/results?search_query=asthma+management+tips+inhaler+use' },
      { title: 'Breathing Exercises for Lungs', channel: 'YouTube Health', duration: '8:00', url: 'https://www.youtube.com/results?search_query=breathing+exercises+lung+health' },
      { title: 'COPD Living Guide', channel: 'YouTube Health', duration: '7:00', url: 'https://www.youtube.com/results?search_query=COPD+living+management+guide' },
      { title: 'Chest Infection Treatment', channel: 'YouTube Health', duration: '5:00', url: 'https://www.youtube.com/results?search_query=chest+infection+treatment+recovery' },
    ],
  },
  pediatrics: {
    articles: [
      { title: "Children's Health", source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/childrenshealth.html' },
      { title: 'Child Development', source: 'MedlinePlus', tag: 'Guide', url: 'https://medlineplus.gov/childdevelopment.html' },
      { title: 'Fever in Children', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/fever-in-children/' },
      { title: 'Childhood Vaccines', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/childrensvaccines.html' },
    ],
    videos: [
      { title: 'Fever in Children: When to Worry', channel: 'YouTube Health', duration: '5:00', url: 'https://www.youtube.com/results?search_query=fever+in+children+when+to+see+doctor' },
      { title: 'Child Nutrition Guide', channel: 'YouTube Health', duration: '8:00', url: 'https://www.youtube.com/results?search_query=child+nutrition+healthy+diet+kids' },
      { title: 'Childhood Vaccination Explained', channel: 'YouTube Health', duration: '6:00', url: 'https://www.youtube.com/results?search_query=childhood+vaccination+importance+schedule' },
      { title: "Baby's First Year Health Tips", channel: 'YouTube Health', duration: '10:00', url: 'https://www.youtube.com/results?search_query=baby+first+year+health+tips+pediatrician' },
    ],
  },
  ent: {
    articles: [
      { title: 'Ear Infections', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/earinfections.html' },
      { title: 'Sinusitis', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/sinusitis-sinus-infection/' },
      { title: 'Tonsillitis', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/tonsillitis/' },
      { title: 'Hearing Loss', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/hearingloss.html' },
    ],
    videos: [
      { title: 'Ear Infection Treatment', channel: 'YouTube Health', duration: '5:00', url: 'https://www.youtube.com/results?search_query=ear+infection+treatment+home+remedies' },
      { title: 'Sinus Relief Methods', channel: 'YouTube Health', duration: '6:00', url: 'https://www.youtube.com/results?search_query=sinus+congestion+relief+methods' },
      { title: 'Sore Throat Remedies', channel: 'YouTube Health', duration: '4:00', url: 'https://www.youtube.com/results?search_query=sore+throat+remedies+ENT+doctor' },
      { title: 'Nose Bleeding First Aid', channel: 'YouTube Health', duration: '3:00', url: 'https://www.youtube.com/results?search_query=nose+bleed+how+to+stop+first+aid' },
    ],
  },
  sexology: {
    articles: [
      { title: 'Sexual Health Overview', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/sexualhealth.html' },
      { title: 'Sexual Health Services', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/live-well/sexual-health/' },
      { title: 'Erectile Dysfunction', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/erectiledysfunction.html' },
      { title: 'STD Overview', source: 'MedlinePlus', tag: 'Guide', url: 'https://medlineplus.gov/sexuallytransmitteddiseases.html' },
    ],
    videos: [
      { title: 'Sexual Health Education', channel: 'YouTube Health', duration: '7:00', url: 'https://www.youtube.com/results?search_query=sexual+health+education+medical' },
      { title: 'Reproductive Health Guide', channel: 'YouTube Health', duration: '8:00', url: 'https://www.youtube.com/results?search_query=reproductive+health+guide+doctor' },
      { title: 'STI Prevention & Testing', channel: 'YouTube Health', duration: '5:00', url: 'https://www.youtube.com/results?search_query=STI+prevention+testing+sexual+health' },
      { title: 'Hormonal Health for Men', channel: 'YouTube Health', duration: '6:00', url: 'https://www.youtube.com/results?search_query=male+hormonal+health+testosterone+doctor' },
    ],
  },
  general_physician: {
    articles: [
      { title: 'Annual Health Checkup Guide', source: 'MedlinePlus', tag: 'Guide', url: 'https://medlineplus.gov/healthcheckup.html' },
      { title: 'Common Cold', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/commoncold.html' },
      { title: 'Fever Overview', source: 'NHS UK', tag: 'Guide', url: 'https://www.nhs.uk/conditions/fever/' },
      { title: 'Preventive Health Care', source: 'MedlinePlus', tag: 'Article', url: 'https://medlineplus.gov/preventivecare.html' },
    ],
    videos: [
      { title: 'When to See a Doctor', channel: 'YouTube Health', duration: '5:00', url: 'https://www.youtube.com/results?search_query=when+should+you+see+a+doctor+symptoms' },
      { title: 'Managing Fever at Home', channel: 'YouTube Health', duration: '4:00', url: 'https://www.youtube.com/results?search_query=fever+management+home+remedies+doctor' },
      { title: 'Cold & Flu Recovery Tips', channel: 'YouTube Health', duration: '6:00', url: 'https://www.youtube.com/results?search_query=cold+flu+recovery+tips+doctor' },
      { title: 'Preventive Health Checkups', channel: 'YouTube Health', duration: '7:00', url: 'https://www.youtube.com/results?search_query=preventive+health+checkup+importance' },
    ],
  },
}

function resolveContentKey(specialty) {
  if (!specialty) return 'default'
  const s = specialty.toLowerCase().replace(/[\s-]/g, '_')
  if (SPECIALTY_CONTENT[s]) return s
  for (const key of Object.keys(SPECIALTY_CONTENT)) {
    if (key === 'default') continue
    if (s.includes(key) || key.includes(s)) return key
  }
  return 'default'
}

const RETURNING_KEY = 'medivora_returning_user'

/* ─── Skeleton loader for right pane sections ─── */
function RightPaneSkeleton({ n = 3, darkMode }) {
  const bg = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{
          borderRadius: 10, padding: '10px', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          background: darkMode ? '#1e2530' : '#fff',
        }}>
          <div style={{ height: 10, borderRadius: 6, background: bg, marginBottom: 8, animation: 'rp-pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
          <div style={{ height: 8, borderRadius: 6, background: bg, width: '60%', animation: 'rp-pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.15 + 0.1}s` }} />
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
export default function AppLayout() {
  const { user, displayName, role, getToken, logout, pendingChatRestore } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { isMobile, isSmallScreen } = useBreakpoint()
  const [ctbDismissed, setCtbDismissed] = useState(() => localStorage.getItem('ctb_dismissed') === 'true')

  /* ── Returning user detection ── */
  const [isReturningUser, setIsReturningUser] = useState(() => sessionStorage.getItem(RETURNING_KEY) === 'true')

  /* ── If a pre-login chat is pending restore, send the user to /chat ── */
  useEffect(() => {
    const hasPaymentError = new URLSearchParams(location.search).has('payment_error')
    if (pendingChatRestore && location.pathname !== '/chat' && !hasPaymentError) {
      navigate('/chat', { replace: true })
    }
  }, [pendingChatRestore]) // eslint-disable-line react-hooks/exhaustive-deps


  /* ── Dark mode ── */
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  /* ── Notifications sidebar ── */
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const unreadCount = notifications.filter(n => !n.is_read).length

  // Always get a fresh token — avoids stale closure in setInterval
  const getFreshToken = async () => {
    // Doctor JWT from localStorage
    const drToken = localStorage.getItem('medivora_doctor_token')
    if (drToken) return drToken
    // Supabase — getSession() always returns the current (auto-refreshed) token
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  const fetchNotifications = async () => {
    try {
      const token = await getFreshToken()
      if (!token) return
      const res = await fetch(`${API_BASE}/my/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch {
      // silently ignore fetch errors
    }
  }

  const notifStartedRef = useRef(false)
  useEffect(() => {
    if (!user || notifStartedRef.current) return
    notifStartedRef.current = true
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => { clearInterval(interval); notifStartedRef.current = false }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    try {
      const token = await getFreshToken()
      if (token) {
        await fetch(`${API_BASE}/my/notifications/${id}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch { /* ignore */ }
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    try {
      const token = await getFreshToken()
      if (token) {
        await fetch(`${API_BASE}/my/notifications/read-all`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch { /* ignore */ }
  }

  /* ── Sidebar data: recent consultations + recommended doctors ── */
  /* All sidebar data loaded in ONE effect to avoid duplicate API calls.     */
  /* useRef gate ensures it only runs once even if `user` fires multiple     */
  /* times (getSession + onAuthStateChange both update user state).          */
  const [recentConsults, setRecentConsults] = useState([])
  const [recommendedDoctors, setRecommendedDoctors] = useState([])
  const sidebarFetchedRef = useRef(false)

  // ── Dynamic right-pane content driven by chat specialty ────────────────
  const [rightPaneLoading,  setRightPaneLoading]  = useState(false)
  const [rightPaneSpecialty, setRightPaneSpecialty] = useState(() =>
    sessionStorage.getItem('medivora_recommended_specialty') || null
  )
  const rightContent = SPECIALTY_CONTENT[resolveContentKey(rightPaneSpecialty)] || SPECIALTY_CONTENT.default

  useEffect(() => {
    // Reset gate when user logs out
    if (!user) { sidebarFetchedRef.current = false; return }
    if (sidebarFetchedRef.current) return
    sidebarFetchedRef.current = true

    ;(async () => {
      try {
        const token = await getFreshToken()
        if (!token) return
        const headers = { Authorization: `Bearer ${token}` }
        const [cRes, dRes] = await Promise.all([
          fetch(`${API_BASE}/consultation/my`, { headers }),
          fetch(`${API_BASE}/doctors`,          { headers }),
        ])
        if (cRes.ok) {
          const cData = await cRes.json()
          const sessions = cData.sessions || []
          setRecentConsults(sessions.slice(0, 3))
          if (!isReturningUser && sessions.length > 0) {
            sessionStorage.setItem(RETURNING_KEY, 'true')
            setIsReturningUser(true)
          }
        }
        if (dRes.ok) {
          const dData = await dRes.json()
          setRecommendedDoctors((dData.doctors || []).slice(0, 3))
        }
      } catch { /* ignore */ }
    })()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Listen for specialty changes dispatched by ChatPage ───────────────
  useEffect(() => {
    const handler = async (e) => {
      const specialty = e.detail?.specialty
      if (!specialty || specialty === rightPaneSpecialty) return

      setRightPaneLoading(true)
      setRightPaneSpecialty(specialty)

      // Re-fetch doctors filtered by specialty
      try {
        const token   = await getFreshToken()
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res     = await fetch(
          `${API_BASE}/doctors?specialty=${encodeURIComponent(specialty)}`, { headers }
        )
        if (res.ok) {
          const data = await res.json()
          if ((data.doctors || []).length > 0) {
            setRecommendedDoctors((data.doctors || []).slice(0, 3))
          }
        }
      } catch { /* keep existing list */ }

      // Brief delay so the loader is visible even for fast updates
      setTimeout(() => setRightPaneLoading(false), 600)
    }

    window.addEventListener('medivora:specialty-changed', handler)
    return () => window.removeEventListener('medivora:specialty-changed', handler)
  }, [rightPaneSpecialty]) // eslint-disable-line react-hooks/exhaustive-deps

  const initials = displayName.charAt(0).toUpperCase()

  const handleSymptomClick = (cat) => {
    navigate('/chat', { state: { autoMessage: cat.message } })
  }

  /* ── Dynamic styles that respond to dark mode ── */
  const headerBg = darkMode
    ? 'rgba(13,17,23,0.97)'
    : 'rgba(245,248,252,0.97)'
  const sidebarBg = darkMode ? '#161b22' : '#ffffff'
  const rightPaneBg = darkMode ? '#151c27' : '#eef3fb'
  const borderCol = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const cardBg = darkMode ? '#21262d' : '#f8fafc'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'

  const dynRecentCard = { ...recentCard, background: cardBg, border: `1px solid ${cardBorder}` }
  const dynSymBtn = { ...symBtn, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }
  const rightPaneCard = darkMode
    ? { borderRadius: 10, padding: '10px', border: '1px solid rgba(255,255,255,0.09)', background: '#1e2530' }
    : { borderRadius: 10, padding: '10px', border: '1px solid rgba(0,0,0,0.07)', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
  const sectionLabel = (color) => ({
    fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
    color, display: 'flex', alignItems: 'center', gap: 5, margin: '0 0 8px',
    paddingBottom: 6, borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
  })

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--dark)', fontFamily: 'var(--font)' }}>

      {/* ── Top Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 24px', height: 56, flexShrink: 0, position: 'relative', zIndex: 100,
        borderBottom: `1px solid ${borderCol}`,
        background: headerBg, backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo size={38} showText={true} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Bell — notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setNotifOpen(o => !o); fetchNotifications() }}
              style={{ ...btnIcon, background: notifOpen ? 'rgba(0,188,212,0.1)' : 'transparent' }}
              title="Notifications"
            >
              <Bell size={15} color={notifOpen ? 'var(--cyan)' : 'var(--g500)'} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4, width: 8, height: 8,
                  borderRadius: '50%', background: 'var(--err)', border: '1.5px solid var(--dark)',
                }} />
              )}
            </button>
          </div>

          {/* Profile avatar */}
          <button
            onClick={() => navigate('/settings')}
            title="Profile & Settings"
            style={{
              width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(0,175,239,0.35)',
              background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginLeft: 6, flexShrink: 0, transition: 'box-shadow 0.2s',
              boxShadow: '0 2px 8px rgba(25,48,170,0.15)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,175,239,0.35)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(25,48,170,0.15)'}
          >
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font)' }}>{initials}</span>
          </button>
        </div>
      </header>

      {/* ── Body: Left + Center (Outlet) + Right ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={{
          width: 220, flexShrink: 0, borderRight: `1px solid ${borderCol}`,
          background: sidebarBg, display: 'flex', flexDirection: 'column',
          padding: '20px 12px 24px', overflowY: 'auto',
        }} className="hide-mobile">

          {/* User profile block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px 20px', borderBottom: `1px solid ${borderCol}`, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #1930AA, #00AFEF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{initials}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </p>
              <p style={{ fontSize: 11, color: 'var(--g500)', margin: 0, textTransform: 'capitalize' }}>{role}</p>
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
            {navItems.map(item => {
              const isActive = item.path && location.pathname === item.path
              return (
                <button
                  key={item.id}
                  onClick={() => item.path && navigate(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font)', fontSize: 14, fontWeight: isActive ? 600 : 500,
                    textAlign: 'left', transition: 'all 0.2s',
                    background: isActive ? 'rgba(25,48,170,0.07)' : 'transparent',
                    color: isActive ? '#1930AA' : 'var(--g400)',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <item.icon size={18} color={isActive ? '#1930AA' : 'var(--g500)'} strokeWidth={isActive ? 2.2 : 1.8} />
                  {item.label}
                  {item.soon && <span style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,188,212,0.1)', color: 'var(--cyan)', fontWeight: 700 }}>Soon</span>}
                  {!item.soon && isActive && <span style={{ marginLeft: 'auto', fontSize: 14, color: '#1930AA' }}>›</span>}
                </button>
              )
            })}
          </nav>

          <>
            {/* Divider */}
            <div style={{ height: 1, background: borderCol, margin: '0 4px 16px' }} />

            {/* ── Quick Symptoms ── */}
            <p style={panelLabel}>Quick Symptoms</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
              {categories.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => handleSymptomClick(cat)}
                  style={dynSymBtn}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,188,212,0.35)'; e.currentTarget.style.background = 'rgba(0,188,212,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}
                >
                  <cat.icon size={12} color='var(--cyan)' />
                  <span style={{ fontSize: 10, color: 'var(--g400)', fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* ── Recent Consultations ── */}
            <p style={panelLabel}>Recent Consultations</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {recentConsults.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--g700)', margin: 0, padding: '4px 0' }}>
                  No consultations yet
                </p>
              ) : recentConsults.map((c, i) => {
                const topic     = c.patient_note || c.specialty || 'Consultation'
                const specialty = (c.specialty || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                const dateStr   = c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
                const dot        = statusDot(c.status)
                const statusText = c.status === 'scheduled'
                  ? 'Booking confirmed'
                  : c.status === 'completed'
                  ? 'Completed'
                  : c.status === 'cancelled' || c.status === 'no_show'
                  ? 'Cancelled'
                  : 'Requested'
                return (
                  <div key={c.id || i} style={dynRecentCard} onClick={() => navigate('/consultations')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--g700)' }}>{dateStr}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: dot, fontWeight: 600 }}>{statusText}</span>
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--g400)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic}</p>
                    {specialty && <p style={{ fontSize: 10, color: 'var(--cyan)', margin: 0 }}>{specialty}</p>}
                  </div>
                )
              })}
            </div>

            {/* ── Health Signals ── (commented out — not yet functional)
            <p style={panelLabel}>Health Signals</p>
            <div style={{ ...dynRecentCard, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={16} color='var(--cyan)' />
              <div>
                <p style={{ fontSize: 11, color: 'var(--g300)', fontWeight: 600, margin: 0 }}>All vitals normal</p>
                <p style={{ fontSize: 9, color: 'var(--g700)', margin: 0 }}>Last updated 2h ago</p>
              </div>
            </div>
            ── */}
          </>

          {/* ── Logout ── */}
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button
              onClick={() => { sessionStorage.removeItem(RETURNING_KEY); logout() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'var(--g500)', fontFamily: 'var(--font)',
                fontSize: 13, fontWeight: 500, textAlign: 'left', transition: 'all 0.18s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,61,0,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </aside>

        {/* ── Center: nested route content ── */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          className={isSmallScreen ? 'has-bottom-nav' : ''}>
          <Outlet />
        </div>

        {/* ── RIGHT PANE ── */}
        <aside style={{
          width: 240, flexShrink: 0, borderLeft: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(25,48,170,0.12)'}`,
          background: rightPaneBg, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 16,
        }} className="hide-mobile">

          {/* AI Analysis — commented out — not yet functional
          <div>
            <p style={sectionLabel('#E08000')}><Activity size={11} />AI Analysis</p>
            <div style={{ ...rightPaneCard, background: darkMode ? '#1e2530' : '#fffbf0', border: `1px solid ${darkMode ? 'rgba(255,179,0,0.15)' : 'rgba(224,128,0,0.18)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#E08000', fontWeight: 700 }}>Condition Match</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#E08000' }}>87.2%</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', marginBottom: 8 }}>
                <div style={{ width: '87.2%', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#E08000,#FFB300)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--g500)' }}>Category</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--g300)' }}>Neurology</span>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 50, background: 'rgba(0,188,212,0.14)', color: 'var(--cyan)', fontWeight: 600 }}>Headache</span>
                <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 50, background: 'rgba(124,77,255,0.14)', color: 'var(--purple)', fontWeight: 600 }}>Tension</span>
              </div>
            </div>
          </div>
          */}

          {/* Recommended Doctors — updates when chat specialty changes */}
          <div>
            <p style={sectionLabel('var(--cyan)')}>
              <UserCheck size={11} />Recommended Doctors
              {rightPaneSpecialty && !rightPaneLoading && (
                <span style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,188,212,0.12)', color: 'var(--cyan)', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>
                  {rightPaneSpecialty.replace(/_/g, ' ')}
                </span>
              )}
            </p>
            {rightPaneLoading ? <RightPaneSkeleton n={3} darkMode={darkMode} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recommendedDoctors.length === 0 ? (
                  <p style={{ fontSize: 11, color: 'var(--g500)', margin: 0 }}>No doctors available</p>
                ) : recommendedDoctors.map((d, i) => (
                  <div key={d.id || i} style={{ ...rightPaneCard, cursor: 'pointer' }} onClick={() => navigate('/doctors', rightPaneSpecialty ? { state: { specialty: rightPaneSpecialty } } : undefined)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,188,212,0.35)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <p style={{ fontSize: 11, color: 'var(--g300)', fontWeight: 700, margin: 0 }}>{[d.first_name, d.last_name].filter(Boolean).join(' ')}</p>
                      {d.rating > 0 && <span style={{ fontSize: 10, color: '#E08000', fontWeight: 700 }}>★ {Number(d.rating).toFixed(1)}</span>}
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--cyan)', margin: 0, fontWeight: 600 }}>{d.specialization}</p>
                    {d.experience_years > 0 && (
                      <p style={{ fontSize: 9, color: 'var(--g500)', margin: '3px 0 0' }}>{d.experience_years} yrs exp</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggested Tests — commented out — not yet functional
          <div>
            <p style={sectionLabel('var(--purple)')}><TestTube size={11} />Suggested Tests</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tests.map((t, i) => (
                <div key={i} style={{ ...rightPaneCard, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--g300)', fontWeight: 500 }}>{t.name}</span>
                  <span style={{
                    fontSize: 9, padding: '3px 8px', borderRadius: 50, fontWeight: 700,
                    background: t.urgency === 'recommended' ? 'rgba(255,179,0,0.15)' : 'rgba(0,188,212,0.12)',
                    color: t.urgency === 'recommended' ? '#E08000' : 'var(--cyan)',
                  }}>{t.urgency}</span>
                </div>
              ))}
            </div>
          </div>

          Nearby Clinic — commented out — not yet functional
          <div>
            <p style={sectionLabel('var(--ok)')}><MapPin size={11} />Nearby Clinic</p>
            <div style={{ ...rightPaneCard, background: darkMode ? '#1a2a1e' : '#f0faf3', border: `1px solid ${darkMode ? 'rgba(0,200,83,0.15)' : 'rgba(0,200,83,0.18)'}`, height: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <MapPin size={18} color='var(--ok)' />
              <p style={{ fontSize: 10, color: 'var(--g500)', textAlign: 'center', margin: 0 }}>Map integration available</p>
              <span style={{ fontSize: 10, color: 'var(--ok)', cursor: 'pointer', fontWeight: 600 }}>Enable location →</span>
            </div>
          </div>
          */}

          {/* Health Articles — dynamic per specialty */}
          <div>
            <p style={sectionLabel('var(--cyan)')}><FileText size={11} />Health Articles</p>
            {rightPaneLoading ? <RightPaneSkeleton n={4} darkMode={darkMode} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rightContent.articles.map((a, i) => (
                  <div key={i} style={{ ...rightPaneCard, cursor: 'pointer' }}
                    onClick={() => window.open(a.url, '_blank', 'noopener,noreferrer')}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,188,212,0.35)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'}
                  >
                    <p style={{ fontSize: 11, color: 'var(--g300)', fontWeight: 600, marginBottom: 5, lineHeight: 1.4 }}>{a.title}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 9, color: 'var(--g500)' }}>{a.source}</span>
                      <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, fontWeight: 700, background: 'rgba(0,188,212,0.12)', color: 'var(--cyan)' }}>{a.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medical Videos — dynamic per specialty */}
          <div>
            <p style={sectionLabel('#7C3AED')}><Play size={11} />Medical Videos</p>
            {rightPaneLoading ? <RightPaneSkeleton n={4} darkMode={darkMode} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rightContent.videos.map((v, i) => (
                  <div key={i} style={{ ...rightPaneCard, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    onClick={() => window.open(v.url, '_blank', 'noopener,noreferrer')}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.25))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Play size={12} color='#7C3AED' fill='#7C3AED' />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: 'var(--g300)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{v.title}</p>
                      <p style={{ fontSize: 9, color: 'var(--g500)', margin: '2px 0 0' }}>{v.channel} · {v.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </aside>

        {/* ── NOTIFICATIONS SIDEBAR ── */}
        {notifOpen && (
          <div
            onClick={() => setNotifOpen(false)}
            style={{
              position: 'absolute', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.25)',
            }}
          />
        )}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: isMobile ? '100%' : 320, zIndex: 201,
          background: darkMode ? '#161b22' : '#ffffff',
          borderLeft: `1px solid ${borderCol}`,
          display: 'flex', flexDirection: 'column',
          transform: notifOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: notifOpen ? '-4px 0 24px rgba(0,0,0,0.12)' : 'none',
        }}>
          {/* Notif header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: `1px solid ${borderCol}`, flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={15} color='var(--cyan)' />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 50,
                  background: 'var(--err)', color: '#fff',
                }}>{unreadCount}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--cyan)' }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setNotifOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X size={16} color='var(--g500)' />
              </button>
            </div>
          </div>

          {/* Notif list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--g500)', fontSize: 13 }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => {
                const uiType = notifTypeToUi(n.notification_type)
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', transition: 'background 0.2s',
                      background: n.is_read ? 'transparent' : (darkMode ? 'rgba(0,188,212,0.06)' : 'rgba(0,188,212,0.04)'),
                      borderBottom: `1px solid ${borderCol}`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : (darkMode ? 'rgba(0,188,212,0.06)' : 'rgba(0,188,212,0.04)')}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {notifIcon(uiType)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: n.is_read ? 500 : 700, color: 'var(--g300)' }}>{n.title}</span>
                          {!n.is_read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', flexShrink: 0 }} />}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--g500)', margin: '0 0 4px', lineHeight: 1.45 }}>{n.message}</p>
                        <span style={{ fontSize: 10, color: 'var(--g700)' }}>{relativeTime(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      {isSmallScreen && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
          height: 64, display: 'flex', alignItems: 'stretch',
          background: darkMode ? '#161b22' : '#ffffff',
          borderTop: `1px solid ${borderCol}`,
          boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
        }}>
          {navItems.filter(item => !item.soon).map(item => {
            const isActive = item.path && location.pathname === item.path
            return (
              <button
                key={item.id}
                onClick={() => item.path && navigate(item.path)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 4, border: 'none', cursor: 'pointer',
                  background: 'transparent', fontFamily: 'var(--font)',
                  color: isActive ? '#1930AA' : 'var(--g500)',
                  borderTop: isActive ? '2px solid #1930AA' : '2px solid transparent',
                  transition: 'color 0.2s',
                }}
              >
                <item.icon size={20} color={isActive ? '#1930AA' : 'var(--g500)'} strokeWidth={isActive ? 2.2 : 1.8} />
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
              </button>
            )
          })}
          <button
            onClick={() => navigate('/settings')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 4, border: 'none', cursor: 'pointer',
              background: 'transparent', fontFamily: 'var(--font)',
              color: location.pathname === '/settings' ? '#1930AA' : 'var(--g500)',
              borderTop: location.pathname === '/settings' ? '2px solid #1930AA' : '2px solid transparent',
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{initials}</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: location.pathname === '/settings' ? 700 : 500 }}>Profile</span>
          </button>
        </nav>
      )}

      {/* ── Call to Book floating button ── */}
      {!ctbDismissed && location.pathname === '/chat' && (
        <div style={{
          position: 'fixed',
          bottom: isSmallScreen ? 80 : 28,
          right: isSmallScreen ? 16 : 28,
          zIndex: 400,
          display: 'flex', alignItems: 'center',
          background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
          borderRadius: 50,
          boxShadow: '0 4px 20px rgba(25,48,170,0.35)',
          animation: 'ctbSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          {/* Phone + label */}
          <button
            onClick={() => { window.location.href = 'tel:+919971615161' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px 11px 14px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}
          >
            {/* Icon circle */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.27 6.27l1.17-1.17a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            {/* Text */}
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Call to</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Book</div>
            </div>
          </button>

          {/* Dismiss */}
          <button
            onClick={() => { setCtbDismissed(true); localStorage.setItem('ctb_dismissed', 'true') }}
            style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 10px 0 0',
            }}
          >
            <X size={13} color="#fff" />
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes rp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes ctbSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.92); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (max-width: 1023px) { .hide-mobile { display: none !important; } }
      `}</style>
    </div>
  )
}

/* ─── Styles ─── */
const panelLabel = {
  fontSize: 10, fontWeight: 700, color: 'var(--cyan)', letterSpacing: 1.2,
  textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', margin: '0 0 10px',
}
const recentCard = {
  borderRadius: 10, background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)',
  padding: '10px', cursor: 'pointer', transition: 'border-color 0.25s',
}
const symBtn = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
  padding: '10px 6px', borderRadius: 10, background: 'rgba(0,0,0,0.02)',
  border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.25s',
}
const btnIcon = {
  position: 'relative',
  width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  transition: 'background 0.25s',
}
