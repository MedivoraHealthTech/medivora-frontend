import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, Brain, Thermometer, Bone, Eye, Baby, Pill, Stethoscope,
  FileText, Video, Star, Lock, MessageSquare, ArrowRight,
  ChevronDown, UserCheck, Shield, Users, LayoutDashboard, Clock, ClipboardList,
  X, Send,
  Ear, ScanSearch, HeartPulse, BellRing,
  Bot, Target, FlaskConical, TrendingUp, BookOpen,
  Wind, Dna, Sparkles, AlertTriangle, Zap,
} from 'lucide-react'
import Logo from '../components/Logo'
import ComingSoonModal from '../components/ComingSoonModal'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { sendMessage as sendChatMessage } from '../api/chat'

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const STATS = [
  { val: '50K+',    label: 'Patients Served' },
  { val: '1,200+',  label: 'Verified Doctors' },
  { val: '4.9★',   label: 'Average Rating' },
  { val: '<2 min',  label: 'Avg. Triage Time' },
]

const SYMPTOMS = [
  { icon: Stethoscope, label: 'General Health',  q: 'General health checkup' },
  { icon: Brain,       label: 'Mental Health',   q: 'I am feeling anxious or stressed' },
  { icon: Baby,        label: "Women's Health",  q: 'I have a women\'s health concern' },
  { icon: Eye,         label: 'Skin & Hair',     q: 'I have a skin or hair concern' },
]

const LISTENING_CARDS = [
  { num: '01', icon: Ear,        title: 'Listens to your signals',     body: 'Your symptoms, concerns, context — Medivora hears them in plain language and understands what they mean.' },
  { num: '02', icon: ScanSearch, title: 'Assesses your symptoms',      body: 'Multi-layer AI cross-checks symptoms with severity markers, history, and clinical patterns. No guesswork.' },
  { num: '03', icon: HeartPulse, title: 'Monitors your vitals',        body: 'BP, sleep, activity, lab trends — all in one place, watched continuously, surfaced when relevant.' },
  { num: '04', icon: BellRing,   title: 'Notifies before it escalates', body: 'Trends going wrong? Test result off? Medivora flags it early and routes you to the right specialist.' },
]

const JOURNEY_STEPS = [
  { num: '01', icon: Bot,         title: 'AI Pre-Consultation', body: 'Describe symptoms in plain language. AI listens with context.' },
  { num: '02', icon: Target,      title: 'Intelligent Triage',  body: 'Routed to the right specialist before any booking.' },
  { num: '03', icon: Video,       title: 'Video Consultation',  body: 'Doctor already has your context. No repeating your story.' },
  { num: '04', icon: ClipboardList, title: 'Digital Prescription', body: 'Generated instantly. Stored in your health record forever.' },
  { num: '05', icon: Pill,        title: 'Order Medicines',     body: 'Delivered home. Dosage reminders set automatically.' },
  { num: '06', icon: FlaskConical, title: 'Book Lab Tests',     body: 'Diagnostics from home. Reports auto-uploaded to your record.' },
  { num: '07', icon: TrendingUp,  title: 'Track Recovery',      body: 'AI watches your vitals, flags if you need follow-up.' },
  { num: '08', icon: BookOpen,    title: 'Knowledge & Insights', body: 'Curated content tailored to your active health journey.' },
]

const ORBIT_PILLS = [
  { icon: Bot,          label:'AI Pre-Consultation',  desc:'Describe symptoms in plain language. AI listens with context.' },
  { icon: Target,       label:'Intelligent Triage',   desc:'Routed to the right specialist before any booking.' },
  { icon: Video,        label:'Video Consultation',   desc:'Doctor already has your context. No repeating your story.' },
  { icon: ClipboardList,label:'Digital Prescription', desc:'Generated instantly. Stored in your health record forever.' },
  { icon: Pill,         label:'Order Medicines',      desc:'Delivered home. Dosage reminders set automatically.' },
  { icon: FlaskConical, label:'Book Lab Tests',       desc:'Diagnostics from home. Reports auto-uploaded to your record.' },
  { icon: TrendingUp,   label:'Track Recovery',       desc:'AI watches your vitals, flags if you need follow-up.' },
  { icon: BookOpen,     label:'Knowledge & Insights', desc:'Curated content tailored to your active health journey.' },
]

const ALERT_CARDS = [
  { icon: Wind,        iconClass: 'lp-amber', label: 'Air Quality', title: 'AQI 312 in Delhi NCR',           body: 'Severe. Asthma risk elevated. Carry inhaler. Avoid outdoor activity after 6pm.',                                                                                    tag: 'External signal' },
  { icon: Thermometer, iconClass: 'lp-rose',  label: 'Outbreak',    title: 'Dengue surge — your area',        body: 'Cases up 34% in Gurugram this week. Stay hydrated. CBC if fever persists.',                                                                                        tag: 'Epidemiological' },
  { icon: Pill,        iconClass: 'lp-cyan',  label: 'Adherence',   title: 'Metformin — 2 doses missed',      body: 'HbA1c trending up. Consistent dosing critical this week.',                                                                                                         tag: 'Personal data' },
  { icon: Dna,         iconClass: 'lp-violet',label: 'Lab Result',  title: 'TSH elevated — 6.2 mIU/L',       body: 'Thyroid report flagged. Dr. Mehta notified. Follow-up in 48h.',                                                                                                    tag: 'Lab integration' },
  { icon: Sparkles,    iconClass: 'lp-cyan',  label: 'Forecast',    title: 'Your weekly health outlook',      body: "High AQI + your respiratory history + monsoon humidity = elevated asthma risk Thursday–Saturday. We've notified your pulmonologist and pre-scheduled an alert.",    tag: 'AI Intelligence Layer', wide: true },
]

const DOCTOR_BENEFITS = [
  { icon: UserCheck,    title: 'Patients arrive prepared',         body: 'AI pre-triages every patient. You see their full symptom summary and severity before the call starts.' },
  { icon: ClipboardList,title: 'Generate prescriptions in seconds', body: 'Review the AI-suggested Rx, modify if needed, sign digitally. Delivered instantly to the patient.' },
  { icon: TrendingUp,   title: 'Grow your practice',               body: "Join India's largest verified doctor network. Reach patients across 50+ cities. Full consultation dashboard included." },
]

const TESTIMONIALS = [
  { name: 'Iravati N.',    city: 'Pune',       stars: 5, text: 'Midnight mein chest pain tha — Medivora ne 90 seconds mein triage kiya aur ek doctor se connect kiya. Lifesaver!' },
  { name: 'Zubeen P.',     city: 'Surat',      stars: 5, text: 'Pregnancy ke time doctor milna mushkil tha. Yahan instant appointment mila — bahut comfortable experience tha.' },
  { name: 'Dr. Tavishi R.', city: 'Bangalore', stars: 5, text: 'Doctor side se bhi bahut useful hai — AI already patient summary deta hai, toh consultation quality much better hoti hai.' },
  { name: 'Kairavi S.',    city: 'Nagpur',     stars: 5, text: 'Skin allergy ke liye itna detailed triage pehle kabhi nahi mila. Dermatologist se consultation bhi turant hua.' },
  { name: 'Omkar D.',      city: 'Kochi',      stars: 5, text: 'Mental health ke liye baat karna easy tha — koi judgement nahi, seedha therapist tak pahuncha. Thank you Medivora.' },
]

const FAQS_DEFAULT = [
  { q: 'Is Medivora a replacement for visiting a doctor in person?', points: ['No — Medivora connects you with real, verified doctors via video consultation.', 'It is not a substitute for emergency care. If you have a life-threatening emergency, call 102/108 immediately.', 'Our AI triage helps assess severity and routes you to the right specialist, but all final medical decisions are made by licensed doctors.'] },
  { q: 'How does the AI triage work? Is it safe?', points: ['You describe your symptoms in Hindi or English and the AI analyses them to estimate severity (mild, moderate, or urgent).', 'The triage result is a recommendation — it does not diagnose or prescribe anything on its own.', 'A verified doctor reviews your case and provides the actual consultation, diagnosis, and prescription.', 'All conversations are encrypted and stored securely.'] },
  { q: 'Are the doctors on Medivora verified and licensed?', points: ['Yes. Every doctor undergoes NMC (National Medical Commission) license verification before being listed.', 'Doctor profiles display their specialty, experience, and ratings from past consultations.', "You can view a doctor's credentials before booking an appointment."] },
  { q: 'How do I get a prescription? Is it valid?', points: ['After your consultation, the doctor reviews the AI-suggested prescription, modifies it if needed, and signs it digitally.', 'Digital prescriptions issued by Medivora doctors are legally valid in India.', 'You can download the signed prescription directly from your account.'] },
  { q: 'What happens to my health data and chat history?', points: ['Your symptom data and chat history are private and only visible to you and the doctor you consult.', 'Medivora does not sell personal health data to third parties.', 'Data is stored with industry-standard encryption and complies with applicable Indian data protection regulations.'] },
  { q: "Can I use Medivora if I don't have an account yet?", points: ["Yes — you can start a symptom chat without logging in. Your conversation is saved temporarily.", 'To book a consultation, receive a prescription, or view your history, you will need to create a free account.', 'Sign-up takes under a minute and only requires basic details.'] },
  { q: 'What languages does Medivora support?', points: ['The AI agent understands both Hindi and English, and can switch between them mid-conversation.', 'Doctor consultations are conducted in the language both you and the doctor are comfortable with.', 'More regional language support is planned in future updates.'] },
]

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Fraunces:ital,wght@0,400;0,600;1,400;1,600&display=swap');

  :root {
    --lp-blue-deep:    #0A1B47;
    --lp-blue-mid:     #1B3FB8;
    --lp-blue-bright:  #2D5BFF;
    --lp-cyan:         #00D4FF;
    --lp-cyan-soft:    #7CE7FF;
    --lp-white:        #FFFFFF;
    --lp-bg:           #FAFAFA;
    --lp-ink:          #0A1428;
    --lp-ink-2:        #4A5568;
    --lp-ink-3:        #8B95A8;
    --lp-line:         rgba(10,27,71,0.08);
    --lp-purple:       #7C4DFF;
  }

  * { margin:0; padding:0; box-sizing:border-box; }

  .lp-root {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: var(--lp-white);
    color: var(--lp-ink);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── ANIMATIONS ── */
  @keyframes lp-pulse   { 0%,100%{opacity:1;transform:scale(1)}  50%{opacity:.4;transform:scale(1.5)} }
  @keyframes lp-breathe { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.15);opacity:1} }
  @keyframes lp-float   { 0%,100%{transform:translateY(0)}        50%{transform:translateY(-10px)} }
  @keyframes lp-travel  { 0%{left:0%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{left:100%;opacity:0} }
  @keyframes lp-fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lp-typing  { 0%,100%{opacity:.25;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }

  .lp-fi { opacity:0; transform:translateY(20px); transition:opacity .7s ease, transform .7s ease; }
  .lp-fi.lp-in { opacity:1; transform:translateY(0); }

  /* ── NAV ── */
  .lp-nav {
    position:fixed; top:0; left:0; right:0; z-index:100;
    display:flex; align-items:center; justify-content:space-between;
    padding:1rem 2.5rem;
    background:rgba(255,255,255,0.7);
    backdrop-filter:blur(24px) saturate(180%);
    -webkit-backdrop-filter:blur(24px) saturate(180%);
    border-bottom:1px solid var(--lp-line);
  }
  .lp-nav-logo {
    font-family:'Fraunces',serif; font-size:24px; font-weight:400;
    color:var(--lp-ink); letter-spacing:-0.5px; text-decoration:none;
    display:flex; align-items:center; gap:10px;
  }
  .lp-dot {
    display:inline-block; width:6px; height:6px;
    background:var(--lp-blue-bright); border-radius:50%;
    animation:lp-pulse 2s infinite;
  }
  .lp-nav-links { display:flex; gap:2rem; align-items:center; }
  .lp-nav-link {
    font-size:13px; font-weight:400; color:var(--lp-ink-2);
    text-decoration:none; cursor:pointer; transition:color .2s;
  }
  .lp-nav-link:hover { color:var(--lp-blue-bright); }
  .lp-nav-cta {
    background:var(--lp-ink); color:var(--lp-white);
    border:none; border-radius:100px;
    padding:9px 20px; font-size:13px; font-weight:500;
    cursor:pointer; transition:all .2s; font-family:'Plus Jakarta Sans',sans-serif;
    text-decoration:none; display:inline-block;
  }
  .lp-nav-cta:hover { background:var(--lp-blue-bright); box-shadow:0 8px 24px rgba(45,91,255,.3); }

  /* ── HERO ── */
  .lp-hero {
    position:relative; margin-top:70px;
    padding:3.2rem 2rem 4rem;
    min-height:80vh;
    display:flex; align-items:stretch; justify-content:center;
    gap:1.5rem; max-width:1380px; margin-left:auto; margin-right:auto;
  }
  .lp-hero-blue {
    position:relative; flex:1; min-width:0;
    border-radius:32px;
    background:
      radial-gradient(ellipse 80% 60% at 80% 0%,  rgba(0,212,255,.25) 0%, transparent 60%),
      radial-gradient(ellipse 60% 80% at 20% 100%, rgba(77,124,255,.3) 0%, transparent 60%),
      linear-gradient(135deg, #0A1B47 0%, #1B3FB8 50%, #2D5BFF 100%);
    overflow:hidden; padding:5rem 3rem;
    box-shadow:0 40px 80px -20px rgba(10,27,71,.4), 0 0 0 1px rgba(255,255,255,.08) inset;
  }
  .lp-hero-grid-bg {
    position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
    background-size:80px 80px;
    mask-image:radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%);
    -webkit-mask-image:radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%);
  }
  .lp-hero-orb {
    position:absolute; width:480px; height:480px; border-radius:50%;
    top:-120px; right:-120px;
    background:radial-gradient(circle, rgba(0,212,255,.4) 0%, transparent 70%);
    filter:blur(60px); animation:lp-breathe 6s ease-in-out infinite;
  }
  .lp-hero-orb-2 {
    position:absolute; width:360px; height:360px; border-radius:50%;
    bottom:-100px; left:-100px;
    background:radial-gradient(circle, rgba(124,231,255,.3) 0%, transparent 70%);
    filter:blur(80px); animation:lp-breathe 8s ease-in-out infinite reverse;
  }
  .lp-hero-content {
    position:relative; z-index:2;
    display:grid; grid-template-columns:1.2fr 1fr;
    gap:3rem; align-items:center;
  }
  .lp-hero-doc-wrap {
    flex-shrink:0; width:280px;
    display:flex; align-items:stretch;
    animation:lp-fadeUp 1s .2s ease both;
  }
  .lp-hero-doc-img {
    width:100%; display:block;
    border-radius:28px;
    box-shadow:0 40px 80px -20px rgba(0,0,0,.5);
    object-fit:cover; object-position:top center;
  }
  .lp-hero-eyebrow {
    display:inline-flex; align-items:center; gap:8px;
    background:rgba(255,255,255,.08); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.18); border-radius:100px;
    padding:7px 14px; font-size:12px; font-weight:400;
    color:rgba(255,255,255,.9); letter-spacing:.02em;
    margin-bottom:1.5rem; animation:lp-fadeUp .7s ease both;
  }
  .lp-live-dot {
    width:6px; height:6px; border-radius:50%;
    background:var(--lp-cyan-soft);
    box-shadow:0 0 8px var(--lp-cyan-soft);
    animation:lp-pulse 1.5s infinite;
  }
  .lp-hero-title {
    font-family:'Fraunces',serif; font-weight:400;
    font-size:clamp(2.8rem,5.5vw,4.8rem);
    line-height:1.05; letter-spacing:-2px; color:var(--lp-white);
    margin-bottom:1.75rem; animation:lp-fadeUp .8s .1s ease both;
  }
  .lp-hero-title .lp-accent {
    font-style:italic;
    background:linear-gradient(135deg,var(--lp-cyan-soft),var(--lp-cyan));
    -webkit-background-clip:text; background-clip:text;
    -webkit-text-fill-color:transparent;
  }
  .lp-hero-statement {
    font-size:16px; line-height:1.7; font-weight:400;
    color:rgba(255,255,255,.78);
    margin-bottom:2.25rem; max-width:560px;
    animation:lp-fadeUp .8s .2s ease both;
  }
  .lp-hero-statement strong { color:var(--lp-white); font-weight:500; }
  .lp-hero-actions { display:flex; gap:12px; animation:lp-fadeUp .8s .3s ease both; }

  .lp-btn-primary {
    background:var(--lp-white); color:var(--lp-blue-deep);
    border:none; border-radius:100px;
    padding:14px 28px; font-size:14px; font-weight:600;
    cursor:pointer; transition:all .2s; font-family:'Plus Jakarta Sans',sans-serif;
    box-shadow:0 8px 24px rgba(0,0,0,.15);
    text-decoration:none; display:inline-block;
  }
  .lp-btn-primary:hover { transform:translateY(-2px); box-shadow:0 16px 32px rgba(0,0,0,.2); }
  .lp-btn-ghost {
    background:rgba(255,255,255,.08); color:var(--lp-white);
    border:1px solid rgba(255,255,255,.2); border-radius:100px;
    padding:14px 24px; font-size:14px; font-weight:500;
    cursor:pointer; transition:all .2s; font-family:'Plus Jakarta Sans',sans-serif;
    backdrop-filter:blur(12px);
  }
  .lp-btn-ghost:hover { background:rgba(255,255,255,.15); }

  /* HERO MOCKUP */
  .lp-hero-mockup { position:relative; animation:lp-fadeUp 1s .4s ease both; }
  .lp-glass-card {
    background:rgba(255,255,255,.08);
    backdrop-filter:blur(24px) saturate(180%);
    -webkit-backdrop-filter:blur(24px) saturate(180%);
    border:1px solid rgba(255,255,255,.18); border-radius:20px;
    box-shadow:0 20px 40px -10px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.04) inset;
  }
  .lp-mock-main { padding:1.5rem; transform:rotate(-2deg); }
  .lp-mock-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; }
  .lp-mock-status { display:flex; align-items:center; gap:8px; font-size:11px; color:rgba(255,255,255,.7); }
  .lp-mock-time   { font-size:11px; color:rgba(255,255,255,.5); }
  .lp-mock-greeting {
    color:white; font-family:'Fraunces',serif;
    font-size:22px; line-height:1.2; margin-bottom:1rem;
  }
  .lp-mock-vitals { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .lp-mock-vital {
    background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.08);
    border-radius:12px; padding:.85rem;
  }
  .lp-mv-label { font-size:10px; color:rgba(255,255,255,.5); text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }
  .lp-mv-value  { color:white; font-size:18px; font-weight:500; font-family:'Plus Jakarta Sans',sans-serif; }
  .lp-mv-trend  { font-size:10px; color:var(--lp-cyan-soft); margin-top:2px; }
  .lp-mock-wave {
    background:rgba(0,212,255,.08);
    border:1px solid rgba(0,212,255,.2);
    border-radius:12px; padding:.85rem; margin-top:8px;
  }
  .lp-mw-label { display:flex; justify-content:space-between; margin-bottom:8px; font-size:10px; }
  .lp-mw-l1 { color:rgba(255,255,255,.7); }
  .lp-mw-l2 { color:var(--lp-cyan-soft); font-weight:500; }
  .lp-wave-svg { width:100%; height:40px; }

  .lp-float-chip {
    position:absolute; padding:10px 14px; border-radius:14px;
    background:rgba(255,255,255,.12); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.22); color:white;
    font-size:12px; display:flex; align-items:center; gap:8px;
    box-shadow:0 16px 32px rgba(0,0,0,.2);
    z-index:3;
  }
  .lp-float-chip-1 { top:-20px; left:-30px; animation:lp-float 4s ease-in-out infinite; }
  .lp-float-chip-2 { bottom:40px; right:-20px; animation:lp-float 4s ease-in-out 1.5s infinite; }
  .lp-float-chip-3 { top:50%; left:-50px; animation:lp-float 4s ease-in-out 3s infinite; }
  .lp-chip-icon {
    width:22px; height:22px; background:rgba(0,212,255,.2);
    border-radius:6px; display:flex; align-items:center; justify-content:center;
  }

  /* ── STATS STRIP ── */
  .lp-stats {
    background:var(--lp-white);
    border-bottom:1px solid var(--lp-line);
  }
  .lp-stats-inner {
    max-width:1280px; margin:0 auto;
    display:grid; grid-template-columns:repeat(4,1fr);
    padding:0 2rem;
  }
  .lp-stat-item {
    text-align:center; padding:2rem 1rem;
    position:relative;
  }
  .lp-stat-item + .lp-stat-item::before {
    content:''; position:absolute; left:0; top:25%; bottom:25%;
    width:1px; background:var(--lp-line);
  }
  .lp-stat-val {
    font-family:'Fraunces',serif; font-style:italic;
    font-size:2.4rem; line-height:1;
    background:linear-gradient(135deg,var(--lp-blue-deep),var(--lp-blue-bright));
    -webkit-background-clip:text; background-clip:text;
    -webkit-text-fill-color:transparent;
    margin-bottom:.4rem;
  }
  .lp-stat-label { font-size:12px; font-weight:500; color:var(--lp-ink-3); letter-spacing:.04em; }

  /* ── SECTIONS ── */
  .lp-section { padding:4.8rem 2rem; }
  .lp-container { max-width:1280px; margin:0 auto; }
  .lp-eyebrow { font-size:11px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--lp-blue-bright); margin-bottom:.75rem; }
  .lp-section-title {
    font-family:'Fraunces',serif; font-weight:400;
    font-size:clamp(2rem,4vw,3.2rem);
    line-height:1.1; letter-spacing:-1.2px;
    color:var(--lp-ink); max-width:720px;
  }
  .lp-section-title .lp-it { font-style:italic; color:var(--lp-blue-bright); }
  .lp-section-sub { font-size:16px; color:var(--lp-ink-2); line-height:1.65; margin-top:1rem; max-width:560px; }

  /* ── CHAT POPUP ── */
  .lp-cpop-overlay {
    position:fixed; inset:0; z-index:1000;
    background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);
    display:flex; align-items:flex-end; justify-content:flex-end;
    padding:24px;
  }
  .lp-cpop {
    width:420px; max-width:calc(100vw - 32px);
    height:580px; max-height:calc(100vh - 48px);
    background:#fff; border-radius:24px;
    display:flex; flex-direction:column;
    box-shadow:0 32px 80px rgba(0,0,0,0.3);
    overflow:hidden;
    animation:lp-fadeUp .25s ease both;
  }
  .lp-cpop-hd {
    padding:14px 18px; border-bottom:1px solid rgba(0,0,0,0.06);
    display:flex; align-items:center; gap:10px;
    background:rgba(240,246,255,0.97); flex-shrink:0;
  }
  .lp-cpop-msgs {
    flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px;
    background:#f8faff;
  }
  .lp-cpop-msg-ai   { display:flex; gap:8px; align-items:flex-start; }
  .lp-cpop-msg-user { display:flex; justify-content:flex-end; }
  .lp-cpop-bubble-ai   { max-width:80%; padding:9px 13px; border-radius:4px 14px 14px 14px; font-size:13px; line-height:1.55; background:#fff; border:1px solid rgba(0,0,0,0.08); color:#333; }
  .lp-cpop-bubble-user { max-width:80%; padding:9px 13px; border-radius:14px 4px 14px 14px; font-size:13px; line-height:1.55; background:linear-gradient(135deg,#1448B5,#1930AA); color:#fff; }
  .lp-cpop-input-row {
    padding:12px 14px; border-top:1px solid rgba(0,0,0,0.06); background:#fff;
    display:flex; gap:8px; align-items:center; flex-shrink:0;
  }
  .lp-cpop-input {
    flex:1; padding:10px 14px; border-radius:100px;
    border:1.5px solid rgba(0,0,0,0.1); background:#f8faff;
    font-size:13px; outline:none; font-family:'Plus Jakarta Sans',sans-serif;
    color:#222; transition:border-color .2s;
  }
  .lp-cpop-input:focus { border-color:var(--lp-blue-bright); }
  .lp-cpop-send {
    width:38px; height:38px; border-radius:50%;
    background:linear-gradient(135deg,var(--lp-blue-deep),var(--lp-blue-bright));
    border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    transition:opacity .2s;
  }
  .lp-cpop-send:disabled { opacity:.5; cursor:default; }
  .lp-cpop-fullchat {
    display:flex; align-items:center; gap:6px;
    font-size:12px; color:var(--lp-blue-bright); font-weight:600;
    background:none; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif;
    text-decoration:none; padding:0;
  }
  @media (max-width:480px) {
    .lp-cpop-overlay { padding:0; align-items:flex-end; }
    .lp-cpop { width:100%; border-radius:24px 24px 0 0; height:70vh; }
  }

  /* ── LISTENING ── */
  .lp-listening { background:var(--lp-bg); }
  .lp-ls-2col { display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center; }

  /* Left — 4 listening cards */
  .lp-feat-col { display:flex; flex-direction:column; }
  .lp-ls-grid { margin-top:2rem; display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .lp-ls-card {
    background:var(--lp-white); border:1px solid var(--lp-line);
    border-radius:14px; padding:1rem 1.1rem; transition:all .3s;
  }
  .lp-ls-card:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(45,91,255,.08); border-color:rgba(45,91,255,.2); }
  .lp-ls-icon { width:36px; height:36px; background:rgba(45,91,255,.07); border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:.65rem; }
  .lp-ls-num   { font-size:10px; font-weight:600; color:var(--lp-blue-bright); letter-spacing:.1em; margin-bottom:.3rem; }
  .lp-ls-title { font-family:'Fraunces',serif; font-weight:400; font-size:15px; line-height:1.25; color:var(--lp-ink); margin-bottom:.3rem; }
  .lp-ls-body  { font-size:12px; line-height:1.55; color:var(--lp-ink-2); }

  /* Right — orbit scene */
  @keyframes lp-sphere-spin  { to { transform:rotate(360deg); } }

  .lp-orbit-scene {
    position:relative; width:560px; height:560px;
    overflow:visible; flex-shrink:0; margin:0 auto;
  }
  .lp-sphere-inner {
    position:absolute; top:60px; left:60px; width:440px; height:440px;
  }
  .lp-sphere-svg {
    display:block; width:100%; height:100%;
    animation:lp-sphere-spin 90s linear infinite;
  }
  .lp-sphere-doc {
    position:absolute; top:50%; left:50%;
    transform:translate(-50%,-50%);
    width:186px; height:248px;
    border-radius:22px; object-fit:cover; object-position:top center;
    box-shadow:0 24px 60px rgba(10,27,71,0.4), 0 0 0 4px rgba(255,255,255,0.95);
    z-index:2;
  }
  /* Rotating ring — rotation driven by JS rAF via inline style */
  .lp-orbit-ring { position:absolute; inset:0; }
  /* Each pill positioner */
  .lp-orbit-pos { position:absolute; width:0; height:0; overflow:visible; }
  /* Inner wrapper: inline transform applied in JSX */
  .lp-orbit-inner { position:absolute; white-space:nowrap; }
  /* Pill styles */
  .lp-op {
    display:inline-flex; align-items:center; gap:6px;
    padding:7px 14px; border-radius:100px;
    background:rgba(255,255,255,0.82); backdrop-filter:blur(12px);
    border:1.5px solid rgba(200,210,240,0.9);
    color:var(--lp-ink-2); font-size:11.5px; font-weight:500;
    box-shadow:0 2px 12px rgba(10,27,71,0.08);
    font-family:'Plus Jakarta Sans',sans-serif;
    transition:all .4s ease;
  }
  .lp-op.lp-op-active {
    background:var(--lp-blue-bright); border-color:var(--lp-blue-bright);
    color:#fff; font-weight:600; font-size:12.5px;
    box-shadow:0 6px 24px rgba(45,91,255,0.42);
    padding:9px 18px;
  }
  /* Feature description card (below sphere) */
  .lp-feat-active-card {
    background:var(--lp-white); border-radius:18px;
    border:1px solid rgba(45,91,255,0.15);
    padding:1.25rem 1.5rem;
    box-shadow:0 4px 24px rgba(10,27,71,0.07);
    max-width:440px; margin:0 auto;
    animation:lp-fadeUp .3s ease both;
  }
  .lp-feat-active-title {
    font-family:'Fraunces',serif; font-size:18px; font-weight:400;
    color:var(--lp-ink); margin-bottom:.4rem; letter-spacing:-.3px;
  }
  .lp-feat-active-body {
    font-size:13px; line-height:1.65; color:var(--lp-ink-2);
  }

  @media (max-width:980px) {
    .lp-orbit-scene { width:400px; height:400px; }
    .lp-sphere-inner { top:40px; left:40px; width:320px; height:320px; }
    .lp-sphere-doc { width:136px; height:182px; }
    .lp-ls-grid { grid-template-columns:1fr 1fr; }
  }
  @media (max-width:600px) {
    .lp-orbit-scene { display:none; }
    .lp-ls-grid { grid-template-columns:1fr; }
  }

  /* ── TRY MEDIVORA (chat section) ── */
  .lp-chat-section {
    position:relative; overflow:hidden;
    background:
      radial-gradient(ellipse 70% 60% at 80% 0%,  rgba(0,212,255,.2) 0%, transparent 55%),
      radial-gradient(ellipse 50% 70% at 10% 100%, rgba(77,124,255,.25) 0%, transparent 55%),
      linear-gradient(135deg, #0A1B47 0%, #1B3FB8 55%, #2D5BFF 100%);
    padding:4.8rem 2rem;
  }
  .lp-chat-section::before {
    content:''; position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size:80px 80px;
    mask-image:radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 80%);
    -webkit-mask-image:radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 80%);
  }
  .lp-chat-orb {
    position:absolute; width:500px; height:500px; border-radius:50%;
    top:-150px; right:-150px;
    background:radial-gradient(circle, rgba(0,212,255,.25) 0%, transparent 70%);
    filter:blur(80px); animation:lp-breathe 7s ease-in-out infinite;
    pointer-events:none;
  }
  .lp-chat-inner { position:relative; z-index:1; max-width:1280px; margin:0 auto; }
  .lp-chat-header { text-align:center; margin-bottom:3rem; }
  .lp-chat-eyebrow {
    display:inline-flex; align-items:center; gap:8px;
    background:rgba(255,255,255,.08); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.15); border-radius:100px;
    padding:6px 14px; font-size:11px; font-weight:500;
    color:rgba(255,255,255,.8); letter-spacing:.06em;
    text-transform:uppercase; margin-bottom:1.25rem;
  }
  .lp-chat-title {
    font-family:'Fraunces',serif; font-weight:400;
    font-size:clamp(2rem,3.5vw,3rem);
    line-height:1.1; letter-spacing:-1.5px; color:var(--lp-white);
    margin-bottom:.75rem;
  }
  .lp-chat-title .lp-it-c {
    font-style:italic;
    background:linear-gradient(135deg,var(--lp-cyan-soft),var(--lp-cyan));
    -webkit-background-clip:text; background-clip:text;
    -webkit-text-fill-color:transparent;
  }
  .lp-chat-sub { font-size:15px; color:rgba(255,255,255,.65); max-width:480px; margin:0 auto; line-height:1.65; }

  .lp-symp-grid {
    display:grid; grid-template-columns:repeat(4,1fr);
    gap:12px; max-width:680px; margin:0 auto 2.5rem;
  }
  .lp-symp-chip {
    display:flex; flex-direction:column; align-items:center; gap:8px;
    padding:14px 10px; border-radius:16px;
    background:rgba(255,255,255,.07);
    border:1px solid rgba(255,255,255,.13);
    color:rgba(255,255,255,.85); font-size:11.5px; font-weight:500;
    cursor:pointer; transition:all .2s; font-family:'Plus Jakarta Sans',sans-serif;
  }
  .lp-symp-chip:hover {
    background:rgba(255,255,255,.14);
    border-color:var(--lp-cyan-soft);
    transform:translateY(-3px);
    color:var(--lp-white);
  }
  .lp-symp-chip-icon {
    width:36px; height:36px; border-radius:10px;
    background:rgba(0,212,255,.15);
    display:flex; align-items:center; justify-content:center;
  }
  .lp-chat-widget-wrap { max-width:520px; margin:0 auto; }

  /* ── DASHBOARD ── */
  .lp-dashboard { background:var(--lp-bg); position:relative; overflow:hidden; }
  .lp-dash-grid { margin-top:3rem; display:grid; grid-template-columns:1fr 1.2fr; gap:4rem; align-items:center; }
  .lp-dash-mock {
    position:relative;
    background:linear-gradient(135deg,#0A1B47 0%,#1B3FB8 50%,#2D5BFF 100%);
    border-radius:24px; padding:1.5rem;
    box-shadow:0 32px 64px -16px rgba(10,27,71,.3);
    overflow:hidden;
  }
  .lp-dash-mock::before {
    content:''; position:absolute; inset:0;
    background:
      radial-gradient(circle at 20% 30%, rgba(0,212,255,.15), transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(124,231,255,.1), transparent 50%);
  }
  .lp-dm-content { position:relative; z-index:1; }
  .lp-dm-hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; }
  .lp-dm-hd-title { color:white; font-size:13px; font-weight:500; }
  .lp-dm-hd-sub   { font-size:11px; color:rgba(255,255,255,.5); margin-top:2px; }
  .lp-dm-hd-pill  {
    background:rgba(0,212,255,.15); border:1px solid rgba(0,212,255,.3);
    color:var(--lp-cyan-soft); border-radius:100px;
    padding:4px 10px; font-size:10px; font-weight:500;
    display:flex; align-items:center; gap:6px;
  }
  .lp-dm-rings { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:1rem; }
  .lp-dm-ring {
    background:rgba(255,255,255,.08); backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,.1); border-radius:14px;
    padding:1rem .75rem; text-align:center;
  }
  .lp-dm-ring-circle { width:56px; height:56px; margin:0 auto .5rem; position:relative; }
  .lp-dm-ring-circle svg { width:56px; height:56px; transform:rotate(-90deg); }
  .lp-dm-ring-circle .lp-rlabel { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:14px; font-weight:600; color:white; }
  .lp-dm-ring-name { font-size:10px; color:rgba(255,255,255,.6); text-transform:uppercase; letter-spacing:.06em; }
  .lp-dm-section-title { color:rgba(255,255,255,.7); font-size:10px; text-transform:uppercase; letter-spacing:.08em; font-weight:500; margin-bottom:8px; }
  .lp-dm-alert { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:.85rem; display:flex; align-items:center; gap:10px; margin-bottom:8px; }
  .lp-dm-alert.lp-urgent { background:linear-gradient(135deg,rgba(0,212,255,.15),rgba(45,91,255,.1)); border-color:rgba(0,212,255,.3); }
  .lp-dm-ai { width:32px; height:32px; background:rgba(255,255,255,.08); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
  .lp-dm-ac { flex:1; min-width:0; }
  .lp-dm-at { color:white; font-size:12px; font-weight:500; margin-bottom:2px; }
  .lp-dm-as { color:rgba(255,255,255,.55); font-size:11px; line-height:1.4; }
  .lp-dash-features { display:flex; flex-direction:column; gap:1.25rem; margin-top:2rem; }
  .lp-df-row { display:flex; gap:1rem; align-items:flex-start; padding-bottom:1.25rem; border-bottom:1px solid var(--lp-line); }
  .lp-df-row:last-child { border-bottom:none; padding-bottom:0; }
  .lp-df-num   { font-family:'Fraunces',serif; font-size:28px; line-height:1; color:var(--lp-blue-bright); font-style:italic; flex-shrink:0; min-width:32px; }
  .lp-df-title { font-family:'Fraunces',serif; font-weight:400; font-size:19px; color:var(--lp-ink); margin-bottom:4px; line-height:1.3; }
  .lp-df-body  { font-size:13.5px; color:var(--lp-ink-2); line-height:1.6; }


  /* ── DOCTORS ── */
  .lp-doctors { background:#F8F5FF; }
  .lp-doc-layout { display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center; margin-top:3rem; }
  .lp-doc-cards  { display:flex; flex-direction:column; gap:14px; }
  .lp-doc-card {
    display:flex; gap:1rem; align-items:flex-start;
    background:var(--lp-white);
    border:1px solid rgba(124,77,255,.12);
    border-radius:18px; padding:1.5rem;
    transition:all .3s;
  }
  .lp-doc-card:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(124,77,255,.1); border-color:rgba(124,77,255,.3); }
  .lp-doc-icon {
    width:48px; height:48px; flex-shrink:0;
    background:linear-gradient(135deg,rgba(124,77,255,.1),rgba(77,124,255,.1));
    border-radius:14px; display:flex; align-items:center; justify-content:center;
  }
  .lp-doc-title { font-family:'Fraunces',serif; font-size:19px; line-height:1.25; color:var(--lp-ink); margin-bottom:5px; }
  .lp-doc-body  { font-size:13px; color:var(--lp-ink-2); line-height:1.6; }
  .lp-doc-cta {
    display:inline-flex; align-items:center; gap:8px; margin-top:2rem;
    padding:13px 26px; border-radius:100px;
    background:linear-gradient(135deg,var(--lp-purple),#5C35CC);
    color:white; font-size:14px; font-weight:600;
    cursor:pointer; border:none; font-family:'Plus Jakarta Sans',sans-serif;
    transition:all .2s;
  }
  .lp-doc-cta:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(124,77,255,.35); }
  .lp-doc-eyebrow { color:var(--lp-purple); }
  .lp-section-title .lp-it-p { font-style:italic; color:var(--lp-purple); }

  /* ── ALERTS ── */
  .lp-alerts { background:linear-gradient(180deg,var(--lp-bg) 0%,#F0F4FF 100%); }
  .lp-alerts-row { margin-top:3rem; display:grid; grid-template-columns:1.2fr 2fr; gap:3rem; }
  .lp-alerts-cards { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .lp-ac {
    background:rgba(255,255,255,.7); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.6); border-radius:16px;
    padding:1.25rem; box-shadow:0 4px 12px rgba(10,27,71,.04);
    transition:all .25s;
  }
  .lp-ac:hover { transform:translateY(-3px); background:rgba(255,255,255,.9); box-shadow:0 16px 32px rgba(10,27,71,.08); }
  .lp-ac-wide { grid-column:span 2; }
  .lp-ac-head { display:flex; align-items:center; gap:10px; margin-bottom:.75rem; }
  .lp-ac-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .lp-ac-icon.lp-cyan   { background:rgba(0,212,255,.12); }
  .lp-ac-icon.lp-amber  { background:rgba(245,158,11,.12); }
  .lp-ac-icon.lp-rose   { background:rgba(244,63,94,.1); }
  .lp-ac-icon.lp-violet { background:rgba(139,92,246,.1); }
  .lp-ac-label { font-size:10px; text-transform:uppercase; letter-spacing:.06em; color:var(--lp-ink-3); font-weight:500; }
  .lp-ac-title { font-family:'Fraunces',serif; font-size:17px; line-height:1.3; color:var(--lp-ink); margin-bottom:.4rem; }
  .lp-ac-body  { font-size:12px; color:var(--lp-ink-2); line-height:1.55; }
  .lp-ac-tag   { display:inline-block; margin-top:8px; font-size:10px; font-weight:500; padding:3px 8px; border-radius:6px; background:var(--lp-bg); color:var(--lp-ink-2); }

  /* ── TESTIMONIALS CAROUSEL ── */
  /*
    Layout: viewport = 100%.
    Each card = 60% wide. Gap between cards = 2%.
    Card step = 62%.
    Track starts offset left by 20% so the first card is centered:
      left edge of active card = 20% = (100% - 60%) / 2
    translateX per step = -62%.
  */
  .lp-testimonials { background:var(--lp-white); }
  .lp-testi-carousel {
    margin-top:3rem; position:relative; overflow:hidden;
    padding:1.5rem 0 1.5rem;
    /* Fade edges so prev/next bleed in naturally */
    mask-image: linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%);
  }
  .lp-testi-track { display:flex; }
  .lp-testi-card {
    min-width:60%; margin-right:2%;
    background:var(--lp-white); border:1px solid var(--lp-line);
    border-radius:20px; padding:1.75rem;
    position:relative; overflow:hidden; flex-shrink:0;
    transition:transform .6s cubic-bezier(.4,0,.2,1), opacity .6s ease, box-shadow .6s ease;
    opacity:.55; transform:scale(.96);
  }
  .lp-testi-card.lp-testi-active {
    opacity:1; transform:scale(1);
    box-shadow:0 16px 48px rgba(10,27,71,.1);
  }
  .lp-testi-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,var(--lp-blue-bright),var(--lp-cyan));
  }
  .lp-testi-nav {
    display:flex; align-items:center; justify-content:center; gap:16px; margin-top:2rem;
  }
  .lp-testi-btn {
    width:38px; height:38px; border-radius:50%;
    border:1.5px solid var(--lp-line); background:var(--lp-white);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all .2s; color:var(--lp-ink-2);
  }
  .lp-testi-btn:hover { border-color:var(--lp-blue-bright); color:var(--lp-blue-bright); }
  .lp-testi-dots { display:flex; gap:6px; }
  .lp-testi-dot {
    width:6px; height:6px; border-radius:50%;
    background:var(--lp-line); transition:all .2s; cursor:pointer;
  }
  .lp-testi-dot.lp-active { background:var(--lp-blue-bright); width:20px; border-radius:3px; }
  .lp-testi-stars { display:flex; gap:3px; margin-bottom:1rem; }
  .lp-testi-quote { font-size:13.5px; color:var(--lp-ink-2); line-height:1.7; margin-bottom:1.25rem; font-style:italic; }
  .lp-testi-author { display:flex; align-items:center; gap:10px; }
  .lp-testi-avatar {
    width:36px; height:36px; border-radius:50%; flex-shrink:0;
    background:linear-gradient(135deg,var(--lp-blue-deep),var(--lp-blue-bright));
    display:flex; align-items:center; justify-content:center;
    font-size:13px; font-weight:700; color:white;
  }
  .lp-testi-name { font-size:13px; font-weight:600; color:var(--lp-ink); }
  .lp-testi-city { font-size:11px; color:var(--lp-ink-3); }
  @media (max-width:600px) {
    .lp-testi-card { min-width:calc(100% - 0px); margin-right:0; }
  }

  /* ── FAQ ── */
  .lp-faq { background:var(--lp-bg); }
  .lp-faq-layout { display:grid; grid-template-columns:1fr 1.6fr; gap:4rem; align-items:start; margin-top:3rem; }
  .lp-faq-list  { display:flex; flex-direction:column; gap:8px; }
  .lp-faq-item  {
    border-radius:14px; border:1px solid var(--lp-line);
    background:var(--lp-white); overflow:hidden;
    transition:border-color .2s, background .2s;
  }
  .lp-faq-item.lp-open { border-color:rgba(45,91,255,.25); background:rgba(45,91,255,.02); }
  .lp-faq-btn {
    width:100%; display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:17px 22px; background:none; border:none;
    cursor:pointer; text-align:left; font-family:'Plus Jakarta Sans',sans-serif;
  }
  .lp-faq-q    { font-family:'Fraunces',serif; font-size:16px; color:var(--lp-ink); line-height:1.4; }
  .lp-faq-chev { flex-shrink:0; transition:transform .25s cubic-bezier(.16,1,.3,1); color:var(--lp-blue-bright); }
  .lp-faq-chev.lp-open { transform:rotate(180deg); }
  .lp-faq-body { padding:0 22px 16px 22px; }
  .lp-faq-body ul { margin:0; padding-left:18px; list-style:disc; }
  .lp-faq-body li { font-size:13px; color:var(--lp-ink-2); line-height:1.75; margin-bottom:4px; }

  /* ── CTA ── */
  .lp-cta { padding:3.2rem 2rem; }
  .lp-cta-card {
    max-width:1280px; margin:0 auto;
    background:linear-gradient(135deg,#0A1B47 0%,#1B3FB8 50%,#2D5BFF 100%);
    border-radius:32px; padding:4rem 3rem; text-align:center;
    position:relative; overflow:hidden;
    box-shadow:0 40px 80px -20px rgba(10,27,71,.4);
  }
  .lp-cta-bg {
    position:absolute; inset:0;
    background:
      radial-gradient(ellipse 60% 80% at 50% 100%, rgba(0,212,255,.25) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at 80% 0%, rgba(124,231,255,.15) 0%, transparent 60%);
  }
  .lp-cta-content { position:relative; z-index:1; }
  .lp-cta-title {
    font-family:'Fraunces',serif; font-weight:400;
    font-size:clamp(2.4rem,4.5vw,3.6rem);
    line-height:1.1; letter-spacing:-1.5px; color:var(--lp-white); margin-bottom:1rem;
  }
  .lp-cta-title .lp-it {
    font-style:italic;
    background:linear-gradient(135deg,var(--lp-cyan-soft),var(--lp-cyan));
    -webkit-background-clip:text; background-clip:text;
    -webkit-text-fill-color:transparent;
  }
  .lp-cta-sub { font-size:16px; color:rgba(255,255,255,.7); line-height:1.6; max-width:480px; margin:0 auto 2.5rem; }
  .lp-cta-form { display:flex; gap:10px; max-width:460px; margin:0 auto; flex-wrap:wrap; justify-content:center; }
  .lp-cta-input {
    flex:1; min-width:220px;
    background:rgba(255,255,255,.08); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.18); border-radius:100px;
    padding:14px 20px; color:white; font-size:14px;
    outline:none; font-family:'Plus Jakarta Sans',sans-serif; transition:all .2s;
  }
  .lp-cta-input::placeholder { color:rgba(255,255,255,.45); }
  .lp-cta-input:focus { background:rgba(255,255,255,.15); border-color:var(--lp-cyan-soft); }
  .lp-cta-disc { font-size:11.5px; color:rgba(255,255,255,.45); margin-top:1.25rem; }

  /* ── FOOTER ── */
  .lp-footer { padding:2rem 2rem; border-top:1px solid var(--lp-line); }
  .lp-footer-inner { max-width:1280px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; }
  .lp-footer-copy { font-size:12px; color:var(--lp-ink-3); }
  .lp-footer-contact { display:flex; gap:20px; flex-wrap:wrap; }
  .lp-footer-link { font-size:12px; color:var(--lp-ink-3); text-decoration:none; transition:color .2s; }
  .lp-footer-link:hover { color:var(--lp-blue-bright); }

  /* ── RESPONSIVE ── */
  @media (max-width:1024px) {
    .lp-doc-layout { grid-template-columns:1fr; }
    .lp-faq-layout { grid-template-columns:1fr; }
  }
  @media (max-width:980px) {
    .lp-hero-doc-wrap { display:none; }
    .lp-hero-content, .lp-dash-grid, .lp-alerts-row { grid-template-columns:1fr; }
    .lp-ls-2col { grid-template-columns:1fr; }
    .lp-nav-links { display:none; }
    .lp-float-chip { display:none; }
    .lp-hero-blue { padding:3rem 1.5rem; }
    .lp-testi-grid { grid-template-columns:1fr 1fr; }
    .lp-stats-inner { grid-template-columns:1fr 1fr; }
    .lp-stat-item:nth-child(3)::before { display:none; }
    .lp-symp-grid { grid-template-columns:repeat(2,1fr); }
    .lp-ls-doctor-img { max-width:300px; }
  }
  @media (max-width:600px) {
    .lp-ls-grid { grid-template-columns:1fr; }
    .lp-alerts-cards { grid-template-columns:1fr; }
    .lp-ac-wide { grid-column:span 1; }
    .lp-nav { padding:.75rem 1.25rem; }
    .lp-hero { padding:2rem 1rem 3rem; }
    .lp-cta-card { padding:2.4rem 1.5rem; }
    .lp-section { padding:3.2rem 1.25rem; }
    .lp-testi-grid { grid-template-columns:1fr; }
    .lp-stats-inner { grid-template-columns:1fr 1fr; }
    .lp-symp-grid { grid-template-columns:repeat(2,1fr); }
    .lp-chat-section { padding:3.2rem 1.25rem; }
  }
`

/* ─────────────────────────────────────────────
   EMBEDDED CHAT
───────────────────────────────────────────── */
function EmbeddedChat({ onOpen }) {
  const previewMsgs = [
    { side: 'user', text: 'Sar mein 2 din se dard hai, neend nahi aa rahi...' },
    { side: 'ai',   text: 'Yeh migraine ya tension headache ke symptoms lag rahe hain. Koi fever hai?' },
    { side: 'user', text: 'Haan, thoda sa fever bhi hai.' },
    { side: 'ai',   text: '🧠 AI Triage: Moderate — Neurologist recommended.' },
  ]
  const [previewShown, setPreviewShown] = useState(1)

  useEffect(() => {
    if (previewShown >= previewMsgs.length) return
    const t = setTimeout(() => setPreviewShown(s => s + 1), 1600)
    return () => clearTimeout(t)
  }, [previewShown])

  return (
    <div style={{ borderRadius:20, overflow:'hidden', background:'#fff', border:'1px solid rgba(0,0,0,0.09)', boxShadow:'0 24px 60px rgba(0,0,0,0.1)' }}>
      {/* header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:10, background:'rgba(240,246,255,0.97)' }}>
        <div style={{ width:9, height:9, borderRadius:'50%', background:'var(--ok)', animation:'lp-pulse 2s infinite' }} />
        <Logo size={18} />
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--g300)' }}>Medivora AI</div>
          <div style={{ fontSize:10, color:'var(--ok)' }}>● Active · Private</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5 }}>
          <Lock size={11} color="var(--g600)" />
          <span style={{ fontSize:10, color:'var(--g600)' }}>Zero-data</span>
        </div>
      </div>
      {/* animated preview messages */}
      <div style={{ padding:'16px', minHeight:200, background:'#f8faff', display:'flex', flexDirection:'column', gap:10 }}>
        {previewMsgs.slice(0, previewShown).map((m, i) => {
          const isAI = m.side === 'ai'
          return (
            <div key={i} style={{ display:'flex', justifyContent:isAI?'flex-start':'flex-end' }}>
              {isAI && (
                <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue),var(--cyan))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:8, marginTop:2 }}>
                  <Logo size={11} />
                </div>
              )}
              <div style={{ maxWidth:'78%', padding:'8px 12px', borderRadius:isAI?'4px 12px 12px 12px':'12px 4px 12px 12px', fontSize:12, lineHeight:1.55, background:isAI?'#fff':'linear-gradient(135deg,var(--blue),#1448B5)', color:isAI?'var(--g400)':'#fff', border:isAI?'1px solid rgba(0,0,0,0.08)':'none' }}
                dangerouslySetInnerHTML={{ __html: m.text }}
              />
            </div>
          )
        })}
        {previewShown < previewMsgs.length && (
          <div style={{ display:'flex', gap:4, paddingLeft:32 }}>
            {[0,150,300].map(d => <div key={d} style={{ width:6, height:6, borderRadius:'50%', background:'var(--cyan)', opacity:0.5, animation:`lp-typing 1.2s ease-in-out ${d}ms infinite` }} />)}
          </div>
        )}
      </div>
      {/* CTA — opens chat popup */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(0,0,0,0.06)', background:'#fff' }}>
        <button
          onClick={onOpen}
          style={{ width:'100%', padding:'12px', borderRadius:12, background:'linear-gradient(135deg,var(--blue),var(--cyan))', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(21,101,192,0.25)' }}
        >
          <MessageSquare size={16} /> Start Chatting with AI
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   SPHERE SVG
───────────────────────────────────────────── */
function MedivoraSphere() {
  return (
    <svg className="lp-sphere-svg" viewBox="0 0 400 400" fill="none">
      <defs>
        <radialGradient id="lp-sg" cx="38%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#edf0ff"/>
          <stop offset="52%"  stopColor="#c2cffa"/>
          <stop offset="100%" stopColor="#8fa8ef" stopOpacity="0.88"/>
        </radialGradient>
        <clipPath id="lp-sc"><circle cx="200" cy="200" r="190"/></clipPath>
      </defs>
      {/* Outer glow */}
      <circle cx="200" cy="200" r="197" fill="rgba(100,135,240,0.07)" stroke="rgba(100,135,240,0.13)" strokeWidth="1"/>
      {/* Base sphere */}
      <circle cx="200" cy="200" r="190" fill="url(#lp-sg)"/>
      {/* Latitude rings */}
      <g clipPath="url(#lp-sc)" stroke="rgba(50,80,200,0.17)" strokeWidth="1.5" fill="none">
        <ellipse cx="200" cy="72"  rx="86"  ry="13"/>
        <ellipse cx="200" cy="108" rx="143" ry="22"/>
        <ellipse cx="200" cy="146" rx="176" ry="28"/>
        <ellipse cx="200" cy="184" rx="190" ry="30"/>
        <ellipse cx="200" cy="222" rx="176" ry="28"/>
        <ellipse cx="200" cy="258" rx="148" ry="23"/>
        <ellipse cx="200" cy="294" rx="106" ry="17"/>
        <ellipse cx="200" cy="328" rx="55"  ry="9"/>
      </g>
      {/* Longitude rings */}
      <g clipPath="url(#lp-sc)" stroke="rgba(50,80,200,0.09)" strokeWidth="1.5" fill="none">
        <ellipse cx="200" cy="200" rx="52"  ry="190"/>
        <ellipse cx="200" cy="200" rx="115" ry="190"/>
        <ellipse cx="200" cy="200" rx="168" ry="190"/>
      </g>
      {/* Shine highlight */}
      <ellipse cx="150" cy="140" rx="52" ry="33" fill="rgba(255,255,255,0.23)" transform="rotate(-30 150 140)"/>
    </svg>
  )
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate()
  const [emailValue, setEmailValue] = useState('')
  const [comingSoon, setComingSoon] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)
  const [faqs, setFaqs] = useState(FAQS_DEFAULT)

  // ── Testimonial carousel — infinite loop, smooth, auto-advance ──
  // We clone all cards at the end. When we reach clones, instant-jump back.
  const testitPerPage = 2
  const testitCount = TESTIMONIALS.length            // 5
  const [testitIdx, setTestitIdx]   = useState(0)   // visual index into cloned list
  const [testitAnim, setTestitAnim] = useState(true) // transition on/off
  const testitTrackRef = useRef(null)
  const testitMax = testitCount  // cloned list length = 2× original; we loop at testitCount

  // Auto-advance
  useEffect(() => {
    const t = setInterval(() => setTestitIdx(i => i + 1), 5500)
    return () => clearInterval(t)
  }, [])

  // When we slide past the real items into clones, instantly reset
  useEffect(() => {
    if (testitIdx >= testitCount) {
      const t = setTimeout(() => {
        setTestitAnim(false)
        setTestitIdx(0)
      }, 500) // after transition completes
      return () => clearTimeout(t)
    }
  }, [testitIdx, testitCount])

  // Re-enable animation after instant jump
  useEffect(() => {
    if (!testitAnim) {
      const t = requestAnimationFrame(() => setTestitAnim(true))
      return () => cancelAnimationFrame(t)
    }
  }, [testitAnim])

  // ── Orbit — rAF with direct DOM mutation (no per-frame setState = no jank) ──
  const [orbitIdx, setOrbitIdx] = useState(0)
  const orbitRingRef  = useRef(null)
  const orbitPillRefs = useRef([])
  const orbitState    = useRef({ deg: 0, paused: false, pauseStart: 0, lastTs: 0, lastSlot: -1 })

  useEffect(() => {
    const SPEED    = 10    // °/s
    const PAUSE_MS = 2000  // ms pause at bottom
    const N        = ORBIT_PILLS.length  // 8
    let raf

    const applyDeg = (deg) => {
      if (orbitRingRef.current)
        orbitRingRef.current.style.transform = `rotate(${deg}deg)`
      orbitPillRefs.current.forEach(el => {
        if (el) el.style.transform = `translate(-50%,-50%) rotate(${-deg}deg)`
      })
    }

    const tick = (ts) => {
      const s = orbitState.current
      if (!s.lastTs) { s.lastTs = ts; raf = requestAnimationFrame(tick); return }

      const dt = Math.min((ts - s.lastTs) / 1000, 0.05)
      s.lastTs = ts

      if (s.paused) {
        if (ts - s.pauseStart >= PAUSE_MS) s.paused = false
        raf = requestAnimationFrame(tick)
        return
      }

      s.deg = (s.deg + SPEED * dt) % 360

      // Pill i is at CSS-bottom (y = cy+R, angle 90°) when (startAngle_i + deg) % 360 = 90°
      // startAngle_i = 270 - i*45  →  pill i at bottom when deg = i*45 - 180 (mod 360)
      // Equivalently, the "bottom slot" increments every 45° of (deg + 180).
      const slot = Math.floor((s.deg + 180) / 45)
      if (slot !== s.lastSlot) {
        s.lastSlot = slot
        // Snap deg so the pill sits exactly at bottom
        s.deg = ((slot * 45 - 180) % 360 + 360) % 360
        s.paused    = true
        s.pauseStart = ts
        const idx = ((slot % N) + N) % N
        setOrbitIdx(idx)   // only state call — once per 2s
      }

      applyDeg(s.deg)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Chat popup state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsgs, setChatMsgs] = useState([{ role:'ai', text:'Hi! Describe your symptoms in Hindi or English. I\'ll help you understand what\'s happening and guide you to the right care.' }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatSessionId, setChatSessionId] = useState(null)
  const chatBottomRef = useRef(null)

  useEffect(() => {
    fetch('/api/faqs')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { if (data.length) setFaqs(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-in') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.lp-fi').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function openChatPopup(prefill) {
    setChatOpen(true)
    if (prefill) setChatInput(prefill)
  }

  function startChat(q) {
    openChatPopup(q)
  }

  useEffect(() => {
    if (chatOpen) chatBottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [chatMsgs, chatOpen])

  async function handleChatSend(e) {
    e?.preventDefault()
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { role:'user', text:msg }])
    setChatLoading(true)
    try {
      const data = await sendChatMessage(msg, chatSessionId)
      setChatSessionId(data.session_id)
      setChatMsgs(prev => [...prev, { role:'ai', text:data.response }])
    } catch {
      setChatMsgs(prev => [...prev, { role:'ai', text:'Sorry, something went wrong. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  function handleWaitlist(e) {
    e.preventDefault()
    navigate('/welcome-doctor')
  }

  return (
    <div className="lp-root">
      <style>{styles}</style>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-nav-logo">
          <Logo size={32} />
          Medivora
        </Link>
        <div className="lp-nav-links">
          <span className="lp-nav-link" onClick={() => document.getElementById('lp-how').scrollIntoView({ behavior:'smooth' })}>How it works</span>
          <Link to="/doctor/login" className="lp-nav-link">For Doctors</Link>
          <span className="lp-nav-link" onClick={() => setComingSoon('Mental Health')}>Mental Health</span>
          <span className="lp-nav-link" onClick={() => setComingSoon('Skin & Hair')}>Skin & Hair</span>
          <Link to="/login" className="lp-nav-link">Log in</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        {/* Doctor image — outside the blue card */}
        <div className="lp-hero-doc-wrap">
          <img src="/doctor-hero-male.jpeg" alt="Medivora Doctor" className="lp-hero-doc-img" />
        </div>

        {/* Blue card — original text-left / mockup-right layout */}
        <div className="lp-hero-blue">
          <div className="lp-hero-grid-bg" />
          <div className="lp-hero-content">
            {/* ── Left: text + CTA ── */}
            <div>
              <div className="lp-hero-eyebrow">
                <span className="lp-live-dot" />
                Always on · Listening · Intelligent
              </div>
              <h1 className="lp-hero-title">
                Your <span className="lp-accent">always-on</span><br />
                health companion.
              </h1>
              <p className="lp-hero-statement">
                <strong>Medivora is always on</strong> — listening to your health signals, assessing your symptoms, and routing you to the right specialist. <strong>One AI companion for your entire health journey.</strong>
              </p>
              <div className="lp-hero-actions">
                <button className="lp-btn-primary" onClick={() => openChatPopup()}>Describe your symptoms →</button>
                <button className="lp-btn-ghost" onClick={() => document.getElementById('lp-how').scrollIntoView({ behavior:'smooth' })}>How It Works</button>
              </div>
            </div>

            {/* ── Right: mockup ── */}
            <div className="lp-hero-mockup" style={{ position:'relative', animation:'lp-fadeUp 1s .4s ease both' }}>
              <div className="lp-float-chip lp-float-chip-1">
                <div className="lp-chip-icon"><Ear size={13} color="#7CE7FF" /></div>
                <span style={{ fontSize:11 }}>Listening to your symptoms...</span>
              </div>
              <div className="lp-glass-card lp-mock-main">
                <div className="lp-mock-row">
                  <div className="lp-mock-status">
                    <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--lp-cyan-soft)', display:'inline-block', boxShadow:'0 0 6px var(--lp-cyan-soft)' }} />
                    Medivora · Active
                  </div>
                  <span className="lp-mock-time">Today, 10:42</span>
                </div>
                <div className="lp-mock-greeting">
                  Good morning, <em>Nikhil.</em><br />All vitals on track.
                </div>
                <div className="lp-mock-vitals">
                  {[
                    { label:'HEART RATE',     value:'68 bpm',  trend:'↓ 4% · Resting' },
                    { label:'SLEEP',          value:'7.2 h',   trend:'↑ Quality good' },
                    { label:'BLOOD PRESSURE', value:'118/76',  trend:'Optimal' },
                    { label:'STRESS INDEX',   value:'Low',     trend:'↓ 12% this week' },
                  ].map((v, i) => (
                    <div className="lp-mock-vital" key={i}>
                      <div className="lp-mv-label">{v.label}</div>
                      <div className="lp-mv-value">{v.value}</div>
                      <div className="lp-mv-trend">{v.trend}</div>
                    </div>
                  ))}
                </div>
                <div className="lp-mock-wave">
                  <div className="lp-mw-label">
                    <span className="lp-mw-l1">Live signal capture</span>
                    <span className="lp-mw-l2">● Listening</span>
                  </div>
                  <svg className="lp-wave-svg" viewBox="0 0 300 40" preserveAspectRatio="none">
                    <path d="M0,20 Q20,8 40,20 Q60,32 80,14 Q100,4 120,20 Q140,36 160,18 Q180,4 200,22 Q220,36 240,14 Q260,4 280,20 L300,20"
                      fill="none" stroke="var(--lp-cyan)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <div className="lp-float-chip lp-float-chip-3">
                <div className="lp-chip-icon"><BellRing size={13} color="#7CE7FF" /></div>
                <span style={{ fontSize:11 }}>1 new insight ready</span>
              </div>
              <div className="lp-float-chip lp-float-chip-2">
                <div className="lp-chip-icon"><Zap size={13} color="#7CE7FF" /></div>
                <span style={{ fontSize:11 }}>Vitals normal · Last sync 2m</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="lp-stats lp-fi">
        <div className="lp-stats-inner">
          {STATS.map((s, i) => (
            <div className="lp-stat-item" key={i}>
              <div className="lp-stat-val">{s.val}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LISTENING ── */}
      <section className="lp-section lp-listening">
        <div className="lp-container">
          <div className="lp-ls-2col">

            {/* Left: text + 4 listening cards */}
            <div className="lp-feat-col lp-fi">
              <div className="lp-eyebrow">What Medivora does, every day</div>
              <h2 className="lp-section-title">Four things, <span className="lp-it">always.</span></h2>
              <p className="lp-section-sub">Not a booking app. Not a record-keeper. A companion built to live alongside you — quietly intelligent, always available, never tired.</p>
              <div className="lp-ls-grid">
                {LISTENING_CARDS.map((c, i) => {
                  const CardIcon = c.icon
                  return (
                  <div className="lp-ls-card" key={i}>
                    <div className="lp-ls-icon"><CardIcon size={18} color="#2D5BFF" /></div>
                    <div className="lp-ls-num">{c.num}</div>
                    <div className="lp-ls-title">{c.title}</div>
                    <div className="lp-ls-body">{c.body}</div>
                  </div>
                )})}
              </div>
            </div>

            {/* Right: orbit scene + active feature description */}
            <div className="lp-fi" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1.5rem', overflow:'visible', transitionDelay:'0.15s' }}>
              <div className="lp-orbit-scene">
                {/* Static sphere + doctor image */}
                <div className="lp-sphere-inner">
                  <MedivoraSphere />
                  <img src="/doctor-hero.jpeg" alt="Medivora Doctor" className="lp-sphere-doc" />
                </div>

                {/* Rotating ring — DOM mutated directly via ref, no per-frame setState */}
                <div className="lp-orbit-ring" ref={orbitRingRef}>
                  {ORBIT_PILLS.map((pill, i) => {
                    const startAngle = (270 - i * 45) * Math.PI / 180
                    const R = 250, cx = 280, cy = 280
                    const x = cx + R * Math.cos(startAngle)
                    const y = cy + R * Math.sin(startAngle)
                    const PillIcon = pill.icon
                    return (
                      <div key={i} className="lp-orbit-pos" style={{ left: x, top: y }}>
                        <div
                          className="lp-orbit-inner"
                          ref={el => { orbitPillRefs.current[i] = el }}
                          style={{ transform:'translate(-50%,-50%)' }}
                        >
                          <div className={`lp-op${i === orbitIdx ? ' lp-op-active' : ''}`}>
                            <PillIcon size={12} style={{ marginRight:5, flexShrink:0 }} />
                            {pill.label}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Description for active feature — only shown for current active */}
              <div className="lp-feat-active-card" key={orbitIdx}>
                {(() => { const ActiveIcon = ORBIT_PILLS[orbitIdx].icon; return (
                  <div className="lp-feat-active-title" style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <ActiveIcon size={14} style={{ flexShrink:0 }} />
                    {ORBIT_PILLS[orbitIdx].label}
                  </div>
                )})()}
                <p className="lp-feat-active-body">{ORBIT_PILLS[orbitIdx].desc}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── TRY MEDIVORA ── */}
      <section className="lp-chat-section" id="lp-how">
        <div className="lp-chat-orb" />
        <div className="lp-chat-inner">
          <div className="lp-chat-header lp-fi">
            <div className="lp-chat-eyebrow"><span className="lp-live-dot" style={{ marginRight:6 }} />Live AI · Zero-data</div>
            <h2 className="lp-chat-title">Try Medivora, <span className="lp-it-c">right now.</span></h2>
            <p className="lp-chat-sub">Describe your symptoms in Hindi or English. No login needed — just talk.</p>
          </div>

          <div className="lp-symp-grid lp-fi" style={{ transitionDelay:'0.1s' }}>
            {SYMPTOMS.map(({ icon: Icon, label, q }) => (
              <button key={q} className="lp-symp-chip" onClick={() => startChat(q)}>
                <div className="lp-symp-chip-icon"><Icon size={18} color="#7CE7FF" /></div>
                {label}
              </button>
            ))}
          </div>

          <div className="lp-chat-widget-wrap lp-fi" style={{ transitionDelay:'0.2s' }}>
            <EmbeddedChat onOpen={() => openChatPopup()} />
          </div>
        </div>
      </section>

      {/* ── DASHBOARD ── */}
      <section className="lp-section lp-dashboard">
        <div className="lp-container">
          <div className="lp-dash-grid">
            <div className="lp-fi">
              <div className="lp-eyebrow">Always intelligent</div>
              <h2 className="lp-section-title" style={{ maxWidth:'520px' }}>Your health,<br /><span className="lp-it">aware</span> of itself.</h2>
              <p className="lp-section-sub">Medivora fuses your personal vitals with external signals — air quality, weather, outbreak data, lab trends — and acts before problems escalate.</p>
              <div className="lp-dash-features">
                {[
                  ['1','Personal data, watched continuously','Vitals, sleep, medication adherence, symptoms, mood — collected and correlated quietly in the background.'],
                  ['2','External signals, fused in','Local AQI, seasonal disease patterns, weather risks — matched against your profile in real time.'],
                  ['3','Action before crisis','Medivora alerts your doctor, not just you. Care happens earlier — sometimes before you even feel symptoms.'],
                ].map(([n, t, b]) => (
                  <div className="lp-df-row" key={n}>
                    <div className="lp-df-num">{n}</div>
                    <div><div className="lp-df-title">{t}</div><div className="lp-df-body">{b}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-fi">
              <div className="lp-dash-mock">
                <div className="lp-dm-content">
                  <div className="lp-dm-hd">
                    <div><div className="lp-dm-hd-title">Today's signals</div><div className="lp-dm-hd-sub">Synced 2 minutes ago</div></div>
                    <div className="lp-dm-hd-pill"><span style={{ width:5,height:5,borderRadius:'50%',background:'var(--lp-cyan-soft)',boxShadow:'0 0 6px var(--lp-cyan-soft)' }} />Live</div>
                  </div>
                  <div className="lp-dm-rings">
                    {[{pct:78,label:'78',name:'Recovery'},{pct:92,label:'92',name:'Sleep'},{pct:65,label:'65',name:'Activity'}].map((r,i) => (
                      <div className="lp-dm-ring" key={i}>
                        <div className="lp-dm-ring-circle">
                          <svg viewBox="0 0 56 56">
                            <defs><linearGradient id={`lpRG${i}`} x1="0" x2="1"><stop offset="0%" stopColor="#7CE7FF"/><stop offset="100%" stopColor="#00D4FF"/></linearGradient></defs>
                            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4"/>
                            <circle cx="28" cy="28" r="22" fill="none" stroke={`url(#lpRG${i})`} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(r.pct/100)*138} 138`}/>
                          </svg>
                          <span className="lp-rlabel">{r.label}</span>
                        </div>
                        <div className="lp-dm-ring-name">{r.name}</div>
                      </div>
                    ))}
                  </div>
                  <div className="lp-dm-section-title">Active intelligence</div>
                  <div className="lp-dm-alert lp-urgent"><div className="lp-dm-ai"><AlertTriangle size={14} color="#F59E0B" /></div><div className="lp-dm-ac"><div className="lp-dm-at">Asthma risk elevated · Thursday</div><div className="lp-dm-as">High AQI + monsoon humidity. Inhaler reminder set. Pulmonologist notified.</div></div></div>
                  <div className="lp-dm-alert"><div className="lp-dm-ai"><Pill size={14} color="#00D4FF" /></div><div className="lp-dm-ac"><div className="lp-dm-at">Metformin — 2 doses missed</div><div className="lp-dm-as">HbA1c trending up. Schedule a check-in?</div></div></div>
                  <div className="lp-dm-alert"><div className="lp-dm-ai"><FlaskConical size={14} color="#8B5CF6" /></div><div className="lp-dm-ac"><div className="lp-dm-at">TSH result · 6.2 mIU/L</div><div className="lp-dm-as">Slightly elevated. Endocrinology consult booked.</div></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR DOCTORS ── */}
      <section className="lp-section lp-doctors">
        <div className="lp-container">
          <div className="lp-doc-layout">
            <div className="lp-fi">
              <div className="lp-eyebrow lp-doc-eyebrow">For Doctors</div>
              <h2 className="lp-section-title">Built for doctors<br />who <span className="lp-it-p">care.</span></h2>
              <p className="lp-section-sub">Join India's verified doctor network. AI does the prep work — you focus entirely on the patient.</p>
              <Link to="/doctor/login" className="lp-doc-cta">
                Join as Doctor <ArrowRight size={15} />
              </Link>
            </div>
            <div className="lp-doc-cards lp-fi" style={{ transitionDelay:'0.1s' }}>
              {DOCTOR_BENEFITS.map((d, i) => {
                const DocIcon = d.icon
                return (
                <div className="lp-doc-card" key={i}>
                  <div className="lp-doc-icon"><DocIcon size={22} color="#7C4DFF" /></div>
                  <div>
                    <div className="lp-doc-title">{d.title}</div>
                    <div className="lp-doc-body">{d.body}</div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      </section>

      {/* ── ALERTS ── */}
      <section className="lp-section lp-alerts">
        <div className="lp-container">
          <div className="lp-alerts-row">
            <div className="lp-fi">
              <div className="lp-eyebrow">Smart alerts</div>
              <h2 className="lp-section-title">The kind of <span className="lp-it">attention</span> you couldn't pay yourself.</h2>
              <p className="lp-section-sub">Medivora watches the signals you'd miss — from your data, and from the world around you.</p>
            </div>
            <div className="lp-alerts-cards lp-fi" style={{ transitionDelay:'0.1s' }}>
              {ALERT_CARDS.map((a, i) => (
                <div className={`lp-ac ${a.wide ? 'lp-ac-wide' : ''}`} key={i}>
                  <div className="lp-ac-head">
                    <div className={`lp-ac-icon ${a.iconClass}`}>{a.icon}</div>
                    <div className="lp-ac-label">{a.label}</div>
                  </div>
                  <div className="lp-ac-title">{a.title}</div>
                  <div className="lp-ac-body">{a.body}</div>
                  <span className="lp-ac-tag">{a.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-section lp-testimonials">
        <div className="lp-container">
          <div className="lp-fi" style={{ textAlign:'center', marginBottom:'0.5rem' }}>
            <div className="lp-eyebrow" style={{ justifyContent:'center', display:'flex' }}>Real stories</div>
            <h2 className="lp-section-title" style={{ margin:'0 auto', textAlign:'center' }}>
              Patients and doctors <span className="lp-it">trust Medivora.</span>
            </h2>
          </div>
          <div className="lp-testi-carousel lp-fi" style={{ transitionDelay:'0.1s' }}>
            {/* Real cards + clones for seamless infinite loop */}
            <div
              ref={testitTrackRef}
              className="lp-testi-track"
              style={{
                // 20% initial offset centres card 0; each step shifts 62% (60% card + 2% gap)
                transform: `translateX(calc(20% - ${testitIdx} * 62%))`,
                transition: testitAnim ? 'transform 1.1s cubic-bezier(.4,0,.2,1)' : 'none',
              }}
            >
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => {
                const isActive = i === testitIdx
                return (
                  <div className={`lp-testi-card${isActive ? ' lp-testi-active' : ''}`} key={i}>
                    <div className="lp-testi-stars">
                      {Array(t.stars).fill(0).map((_, j) => <Star key={j} size={13} color="#F59E0B" fill="#F59E0B" />)}
                    </div>
                    <p className="lp-testi-quote">"{t.text}"</p>
                    <div className="lp-testi-author">
                      <div className="lp-testi-avatar">{t.name[0]}</div>
                      <div>
                        <div className="lp-testi-name">{t.name}</div>
                        <div className="lp-testi-city">{t.city}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Dots only — no arrows */}
          <div className="lp-testi-nav">
            <div className="lp-testi-dots">
              {TESTIMONIALS.map((_, i) => (
                <div key={i} className={`lp-testi-dot ${(testitIdx % testitCount) === i ? 'lp-active' : ''}`} onClick={() => setTestitIdx(i)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-section lp-faq">
        <div className="lp-container">
          <div className="lp-faq-layout">
            <div className="lp-fi">
              <div className="lp-eyebrow">FAQ</div>
              <h2 className="lp-section-title">Everything you need <span className="lp-it">to know.</span></h2>
              <p className="lp-section-sub">Before your first consultation, here are the most common questions we get.</p>
            </div>
            <div className="lp-faq-list lp-fi" style={{ transitionDelay:'0.1s' }}>
              {faqs.map((faq, i) => {
                const open = openFaq === i
                return (
                  <div className={`lp-faq-item ${open ? 'lp-open' : ''}`} key={i}>
                    <button className="lp-faq-btn" onClick={() => setOpenFaq(open ? null : i)}>
                      <span className="lp-faq-q">{faq.question ?? faq.q}</span>
                      <ChevronDown size={17} className={`lp-faq-chev ${open ? 'lp-open' : ''}`} />
                    </button>
                    {open && (
                      <div className="lp-faq-body">
                        <ul>{faq.points.map((pt, j) => <li key={j}>{pt}</li>)}</ul>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-cta-card">
          <div className="lp-cta-bg" />
          <div className="lp-cta-content lp-fi">
            <h2 className="lp-cta-title"><span className="lp-it">Right doctor.</span> First time.<br />Always there. Always you.</h2>
            <p className="lp-cta-sub">Join the Medivora waitlist. First 500 users get premium subscription free for 6 months.</p>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.5rem' }}>
              <button onClick={handleWaitlist} className="lp-btn-primary" style={{ fontSize:15, padding:'15px 36px' }}>Join the waitlist →</button>
            </div>
            <div className="lp-cta-disc">No spam. No marketing. Just a message when your city goes live.</div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span className="lp-footer-copy">© 2026 Medivora HealthTech · Gurugram, India · Built for 1.4 billion Indians.</span>
          <div className="lp-footer-contact">
            <a href="mailto:nikhil.syal@themedivora.com" className="lp-footer-link">nikhil.syal@themedivora.com</a>
            <a href="tel:+919971615161" className="lp-footer-link">+91-9971615161</a>
            <span className="lp-footer-copy">Gurgaon, Delhi NCR</span>
          </div>
        </div>
      </footer>

      {comingSoon && <ComingSoonModal feature={comingSoon} onClose={() => setComingSoon(null)} />}

      {/* ── CHAT POPUP ── */}
      {chatOpen && (
        <div className="lp-cpop-overlay" onClick={e => { if (e.target === e.currentTarget) setChatOpen(false) }}>
          <div className="lp-cpop">
            {/* Header */}
            <div className="lp-cpop-hd">
              <div style={{ width:9, height:9, borderRadius:'50%', background:'var(--ok)', animation:'lp-pulse 2s infinite', flexShrink:0 }} />
              <Logo size={18} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--g300)' }}>Medivora AI</div>
                <div style={{ fontSize:10, color:'var(--ok)' }}>● Active · No login needed</div>
              </div>
              <Link to="/chat" className="lp-cpop-fullchat" title="Open full chat">
                Full chat <ArrowRight size={12} />
              </Link>
              <button onClick={() => setChatOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, marginLeft:4 }}>
                <X size={16} color="var(--g500)" />
              </button>
            </div>

            {/* Messages */}
            <div className="lp-cpop-msgs">
              {chatMsgs.map((m, i) => (
                m.role === 'ai' ? (
                  <div className="lp-cpop-msg-ai" key={i}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue),var(--cyan))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                      <Logo size={11} />
                    </div>
                    <div className="lp-cpop-bubble-ai">{m.text}</div>
                  </div>
                ) : (
                  <div className="lp-cpop-msg-user" key={i}>
                    <div className="lp-cpop-bubble-user">{m.text}</div>
                  </div>
                )
              ))}
              {chatLoading && (
                <div className="lp-cpop-msg-ai">
                  <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue),var(--cyan))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                    <Logo size={11} />
                  </div>
                  <div className="lp-cpop-bubble-ai" style={{ display:'flex', gap:4, padding:'12px 14px' }}>
                    {[0,150,300].map(d => <div key={d} style={{ width:6, height:6, borderRadius:'50%', background:'var(--cyan)', opacity:0.5, animation:`lp-typing 1.2s ease-in-out ${d}ms infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <form className="lp-cpop-input-row" onSubmit={handleChatSend}>
              <input
                className="lp-cpop-input"
                placeholder="Describe your symptoms…"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                autoFocus
              />
              <button type="submit" className="lp-cpop-send" disabled={!chatInput.trim() || chatLoading}>
                <Send size={15} color="#fff" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
