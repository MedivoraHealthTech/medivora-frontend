import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, Brain, Thermometer, Bone, Eye, Baby, Pill, Stethoscope,
  Calendar, FileText, Video, Star, Lock, MessageSquare, ArrowRight,
  ChevronDown, UserCheck, Shield, Users, LayoutDashboard, Clock, ClipboardList
} from 'lucide-react'
import Logo from '../components/Logo'
import ComingSoonModal from '../components/ComingSoonModal'
import { sendMessage as chatSend } from '../api/chat'
import { savePreLoginMessages } from '../utils/preLoginChat'
import { useBreakpoint } from '../hooks/useBreakpoint'

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
  { icon: Bone,        label: 'Pain',       q: 'I have pain' },
  { icon: Thermometer, label: 'Fever',      q: 'I have fever' },
  { icon: Brain,       label: 'Headache',   q: 'I have headache' },
  { icon: Activity,    label: 'Heart',      q: 'Heart palpitations' },
  { icon: Eye,         label: 'Vision',     q: 'Eye / vision issues' },
  { icon: Baby,        label: 'Child/Preg', q: 'Child or pregnancy concern' },
  { icon: Pill,        label: 'Medicine',   q: 'Medicine related query' },
  { icon: Stethoscope, label: 'General',    q: 'General health checkup' },
]

const LISTENING_CARDS = [
  { num: '01', icon: '👂', title: 'Listens to your signals',     body: 'Your symptoms, concerns, context — Medivora hears them in plain language and understands what they mean.' },
  { num: '02', icon: '🔍', title: 'Assesses your symptoms',      body: 'Multi-layer AI cross-checks symptoms with severity markers, history, and clinical patterns. No guesswork.' },
  { num: '03', icon: '💓', title: 'Monitors your vitals',        body: 'BP, sleep, activity, lab trends — all in one place, watched continuously, surfaced when relevant.' },
  { num: '04', icon: '🔔', title: 'Notifies before it escalates', body: 'Trends going wrong? Test result off? Medivora flags it early and routes you to the right specialist.' },
]

const JOURNEY_STEPS = [
  { num: '01', icon: '💬', title: 'AI Pre-Consultation', body: 'Describe symptoms in plain language. AI listens with context.' },
  { num: '02', icon: '🎯', title: 'Intelligent Triage',  body: 'Routed to the right specialist before any booking.' },
  { num: '03', icon: '👨‍⚕️', title: 'Video Consultation',  body: 'Doctor already has your context. No repeating your story.' },
  { num: '04', icon: '📋', title: 'Digital Prescription', body: 'Generated instantly. Stored in your health record forever.' },
  { num: '05', icon: '💊', title: 'Order Medicines',     body: 'Delivered home. Dosage reminders set automatically.' },
  { num: '06', icon: '🧪', title: 'Book Lab Tests',      body: 'Diagnostics from home. Reports auto-uploaded to your record.' },
  { num: '07', icon: '📈', title: 'Track Recovery',      body: 'AI watches your vitals, flags if you need follow-up.' },
  { num: '08', icon: '📚', title: 'Knowledge & Insights', body: 'Curated content tailored to your active health journey.' },
]

const ALERT_CARDS = [
  { icon: '🌫️', iconClass: 'lp-amber', label: 'Air Quality', title: 'AQI 312 in Delhi NCR',           body: 'Severe. Asthma risk elevated. Carry inhaler. Avoid outdoor activity after 6pm.',                                                                                           tag: 'External signal' },
  { icon: '🌡️', iconClass: 'lp-rose',  label: 'Outbreak',    title: 'Dengue surge — your area',        body: 'Cases up 34% in Gurugram this week. Stay hydrated. CBC if fever persists.',                                                                                             tag: 'Epidemiological' },
  { icon: '💊', iconClass: 'lp-cyan',  label: 'Adherence',   title: 'Metformin — 2 doses missed',      body: 'HbA1c trending up. Consistent dosing critical this week.',                                                                                                              tag: 'Personal data' },
  { icon: '🧬', iconClass: 'lp-violet',label: 'Lab Result',  title: 'TSH elevated — 6.2 mIU/L',       body: 'Thyroid report flagged. Dr. Mehta notified. Follow-up in 48h.',                                                                                                         tag: 'Lab integration' },
  { icon: '🌟', iconClass: 'lp-cyan',  label: 'Forecast',    title: 'Your weekly health outlook',      body: "High AQI + your respiratory history + monsoon humidity = elevated asthma risk Thursday–Saturday. We've notified your pulmonologist and pre-scheduled an alert.",         tag: 'AI Intelligence Layer', wide: true },
]

const DOCTOR_BENEFITS = [
  { icon: '🎯', title: 'Patients arrive prepared',         body: 'AI pre-triages every patient. You see their full symptom summary and severity before the call starts.' },
  { icon: '📋', title: 'Generate prescriptions in seconds', body: 'Review the AI-suggested Rx, modify if needed, sign digitally. Delivered instantly to the patient.' },
  { icon: '📈', title: 'Grow your practice',               body: "Join India's largest verified doctor network. Reach patients across 50+ cities. Full consultation dashboard included." },
]

const TESTIMONIALS = [
  { name: 'Rahul V.',    city: 'Delhi',     stars: 5, text: 'Midnight mein chest pain tha — Medivora ne 90 seconds mein triage kiya aur ek doctor se connect kiya. Lifesaver!' },
  { name: 'Priya S.',    city: 'Mumbai',    stars: 5, text: 'Pregnancy ke time doctor milna mushkil tha. Yahan instant appointment mila — bahut comfortable experience tha.' },
  { name: 'Dr. Amit K.', city: 'Bangalore', stars: 5, text: 'Doctor side se bhi bahut useful hai — AI already patient summary deta hai, toh consultation quality much better hoti hai.' },
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
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

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
    font-family: 'Geist', system-ui, sans-serif;
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
    font-family:'Instrument Serif',serif; font-size:24px; font-weight:400;
    color:var(--lp-ink); letter-spacing:-0.5px; text-decoration:none;
    display:flex; align-items:center; gap:4px;
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
    cursor:pointer; transition:all .2s; font-family:'Geist',sans-serif;
    text-decoration:none; display:inline-block;
  }
  .lp-nav-cta:hover { background:var(--lp-blue-bright); box-shadow:0 8px 24px rgba(45,91,255,.3); }

  /* ── HERO ── */
  .lp-hero {
    position:relative; margin-top:70px;
    padding:4rem 2rem 5rem;
    min-height:90vh;
    display:flex; align-items:center; justify-content:center;
  }
  .lp-hero-blue {
    position:relative; width:100%; max-width:1280px;
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
    display:grid; grid-template-columns:1.3fr 1fr;
    gap:4rem; align-items:center;
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
    font-family:'Instrument Serif',serif; font-weight:400;
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
    cursor:pointer; transition:all .2s; font-family:'Geist',sans-serif;
    box-shadow:0 8px 24px rgba(0,0,0,.15);
    text-decoration:none; display:inline-block;
  }
  .lp-btn-primary:hover { transform:translateY(-2px); box-shadow:0 16px 32px rgba(0,0,0,.2); }
  .lp-btn-ghost {
    background:rgba(255,255,255,.08); color:var(--lp-white);
    border:1px solid rgba(255,255,255,.2); border-radius:100px;
    padding:14px 24px; font-size:14px; font-weight:500;
    cursor:pointer; transition:all .2s; font-family:'Geist',sans-serif;
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
    color:white; font-family:'Instrument Serif',serif;
    font-size:22px; line-height:1.2; margin-bottom:1rem;
  }
  .lp-mock-vitals { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .lp-mock-vital {
    background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.08);
    border-radius:12px; padding:.85rem;
  }
  .lp-mv-label { font-size:10px; color:rgba(255,255,255,.5); text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }
  .lp-mv-value  { color:white; font-size:18px; font-weight:500; font-family:'Geist',sans-serif; }
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
    font-size:12px;
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
    font-family:'Instrument Serif',serif; font-style:italic;
    font-size:2.4rem; line-height:1;
    background:linear-gradient(135deg,var(--lp-blue-deep),var(--lp-blue-bright));
    -webkit-background-clip:text; background-clip:text;
    -webkit-text-fill-color:transparent;
    margin-bottom:.4rem;
  }
  .lp-stat-label { font-size:12px; font-weight:500; color:var(--lp-ink-3); letter-spacing:.04em; }

  /* ── SECTIONS ── */
  .lp-section { padding:6rem 2rem; }
  .lp-container { max-width:1280px; margin:0 auto; }
  .lp-eyebrow { font-size:11px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--lp-blue-bright); margin-bottom:.75rem; }
  .lp-section-title {
    font-family:'Instrument Serif',serif; font-weight:400;
    font-size:clamp(2rem,4vw,3.2rem);
    line-height:1.1; letter-spacing:-1.2px;
    color:var(--lp-ink); max-width:720px;
  }
  .lp-section-title .lp-it { font-style:italic; color:var(--lp-blue-bright); }
  .lp-section-sub { font-size:16px; color:var(--lp-ink-2); line-height:1.65; margin-top:1rem; max-width:560px; }

  /* ── LISTENING ── */
  .lp-listening { background:var(--lp-white); }
  .lp-ls-grid { margin-top:3.5rem; display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  .lp-ls-card {
    background:var(--lp-white); border:1px solid var(--lp-line);
    border-radius:20px; padding:1.75rem;
    transition:all .3s; position:relative; overflow:hidden;
  }
  .lp-ls-card:hover { transform:translateY(-4px); box-shadow:0 24px 48px -12px rgba(45,91,255,.12); border-color:rgba(45,91,255,.3); }
  .lp-ls-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,var(--lp-blue-bright),var(--lp-cyan));
    transform:scaleX(0); transform-origin:left; transition:transform .3s;
  }
  .lp-ls-card:hover::before { transform:scaleX(1); }
  .lp-ls-icon {
    width:44px; height:44px;
    background:linear-gradient(135deg,rgba(45,91,255,.1),rgba(0,212,255,.1));
    border-radius:12px; display:flex; align-items:center; justify-content:center;
    font-size:22px; margin-bottom:1.25rem;
  }
  .lp-ls-num   { font-size:11px; font-weight:500; color:var(--lp-blue-bright); letter-spacing:.08em; margin-bottom:.5rem; }
  .lp-ls-title { font-family:'Instrument Serif',serif; font-weight:400; font-size:22px; line-height:1.2; color:var(--lp-ink); margin-bottom:.5rem; letter-spacing:-.5px; }
  .lp-ls-body  { font-size:13.5px; line-height:1.6; color:var(--lp-ink-2); }

  /* ── TRY MEDIVORA (chat section) ── */
  .lp-chat-section {
    position:relative; overflow:hidden;
    background:
      radial-gradient(ellipse 70% 60% at 80% 0%,  rgba(0,212,255,.2) 0%, transparent 55%),
      radial-gradient(ellipse 50% 70% at 10% 100%, rgba(77,124,255,.25) 0%, transparent 55%),
      linear-gradient(135deg, #0A1B47 0%, #1B3FB8 55%, #2D5BFF 100%);
    padding:6rem 2rem;
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
    font-family:'Instrument Serif',serif; font-weight:400;
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
    display:grid; grid-template-columns:repeat(8,1fr);
    gap:10px; max-width:900px; margin:0 auto 2.5rem;
  }
  .lp-symp-chip {
    display:flex; flex-direction:column; align-items:center; gap:8px;
    padding:14px 10px; border-radius:16px;
    background:rgba(255,255,255,.07);
    border:1px solid rgba(255,255,255,.13);
    color:rgba(255,255,255,.85); font-size:11.5px; font-weight:500;
    cursor:pointer; transition:all .2s; font-family:'Geist',sans-serif;
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
  .lp-df-num   { font-family:'Instrument Serif',serif; font-size:28px; line-height:1; color:var(--lp-blue-bright); font-style:italic; flex-shrink:0; min-width:32px; }
  .lp-df-title { font-family:'Instrument Serif',serif; font-weight:400; font-size:19px; color:var(--lp-ink); margin-bottom:4px; line-height:1.3; }
  .lp-df-body  { font-size:13.5px; color:var(--lp-ink-2); line-height:1.6; }

  /* ── JOURNEY ── */
  .lp-journey { background:var(--lp-white); }
  .lp-j-flow { margin-top:3.5rem; position:relative; }
  .lp-j-line {
    position:absolute; top:28px; left:8%; right:8%; height:1px;
    background:linear-gradient(90deg,transparent,rgba(45,91,255,.3) 15%,rgba(45,91,255,.5) 50%,rgba(45,91,255,.3) 85%,transparent);
  }
  .lp-j-line::before {
    content:''; position:absolute; top:-2px; left:0;
    width:4px; height:4px; border-radius:50%;
    background:var(--lp-cyan); box-shadow:0 0 12px var(--lp-cyan);
    animation:lp-travel 3s linear infinite;
  }
  .lp-j-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:0; position:relative; }
  .lp-j-step { text-align:center; padding:0 .75rem 1rem; position:relative; z-index:1; }
  .lp-j-icon-wrap {
    width:56px; height:56px; border-radius:50%;
    margin:0 auto 1rem; background:var(--lp-white);
    border:2px solid var(--lp-line);
    display:flex; align-items:center; justify-content:center;
    font-size:22px; transition:all .3s;
  }
  .lp-j-step:hover .lp-j-icon-wrap {
    border-color:var(--lp-blue-bright);
    background:linear-gradient(135deg,rgba(45,91,255,.05),rgba(0,212,255,.05));
    box-shadow:0 8px 24px -4px rgba(45,91,255,.2);
    transform:translateY(-3px);
  }
  .lp-j-num   { font-family:'Instrument Serif',serif; font-style:italic; font-size:11px; color:var(--lp-blue-bright); margin-bottom:.4rem; }
  .lp-j-title { font-size:13.5px; font-weight:500; color:var(--lp-ink); margin-bottom:.5rem; line-height:1.3; }
  .lp-j-body  { font-size:11.5px; color:var(--lp-ink-2); line-height:1.55; }
  .lp-j-row2  { display:grid; grid-template-columns:repeat(4,1fr); margin-top:2.5rem; position:relative; }

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
    font-size:22px;
  }
  .lp-doc-title { font-family:'Instrument Serif',serif; font-size:19px; line-height:1.25; color:var(--lp-ink); margin-bottom:5px; }
  .lp-doc-body  { font-size:13px; color:var(--lp-ink-2); line-height:1.6; }
  .lp-doc-cta {
    display:inline-flex; align-items:center; gap:8px; margin-top:2rem;
    padding:13px 26px; border-radius:100px;
    background:linear-gradient(135deg,var(--lp-purple),#5C35CC);
    color:white; font-size:14px; font-weight:600;
    cursor:pointer; border:none; font-family:'Geist',sans-serif;
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
  .lp-ac-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
  .lp-ac-icon.lp-cyan   { background:rgba(0,212,255,.12); }
  .lp-ac-icon.lp-amber  { background:rgba(245,158,11,.12); }
  .lp-ac-icon.lp-rose   { background:rgba(244,63,94,.1); }
  .lp-ac-icon.lp-violet { background:rgba(139,92,246,.1); }
  .lp-ac-label { font-size:10px; text-transform:uppercase; letter-spacing:.06em; color:var(--lp-ink-3); font-weight:500; }
  .lp-ac-title { font-family:'Instrument Serif',serif; font-size:17px; line-height:1.3; color:var(--lp-ink); margin-bottom:.4rem; }
  .lp-ac-body  { font-size:12px; color:var(--lp-ink-2); line-height:1.55; }
  .lp-ac-tag   { display:inline-block; margin-top:8px; font-size:10px; font-weight:500; padding:3px 8px; border-radius:6px; background:var(--lp-bg); color:var(--lp-ink-2); }

  /* ── TESTIMONIALS ── */
  .lp-testimonials { background:var(--lp-white); }
  .lp-testi-grid { margin-top:3rem; display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .lp-testi-card {
    background:var(--lp-white); border:1px solid var(--lp-line);
    border-radius:20px; padding:1.75rem;
    transition:all .3s; position:relative; overflow:hidden;
  }
  .lp-testi-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,var(--lp-blue-bright),var(--lp-cyan));
  }
  .lp-testi-card:hover { transform:translateY(-4px); box-shadow:0 24px 48px -12px rgba(45,91,255,.1); }
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
    cursor:pointer; text-align:left; font-family:'Geist',sans-serif;
  }
  .lp-faq-q    { font-family:'Instrument Serif',serif; font-size:16px; color:var(--lp-ink); line-height:1.4; }
  .lp-faq-chev { flex-shrink:0; transition:transform .25s cubic-bezier(.16,1,.3,1); color:var(--lp-blue-bright); }
  .lp-faq-chev.lp-open { transform:rotate(180deg); }
  .lp-faq-body { padding:0 22px 16px 22px; }
  .lp-faq-body ul { margin:0; padding-left:18px; list-style:disc; }
  .lp-faq-body li { font-size:13px; color:var(--lp-ink-2); line-height:1.75; margin-bottom:4px; }

  /* ── CTA ── */
  .lp-cta { padding:4rem 2rem; }
  .lp-cta-card {
    max-width:1280px; margin:0 auto;
    background:linear-gradient(135deg,#0A1B47 0%,#1B3FB8 50%,#2D5BFF 100%);
    border-radius:32px; padding:5rem 3rem; text-align:center;
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
    font-family:'Instrument Serif',serif; font-weight:400;
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
    outline:none; font-family:'Geist',sans-serif; transition:all .2s;
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
    .lp-hero-content, .lp-dash-grid, .lp-alerts-row { grid-template-columns:1fr; }
    .lp-ls-grid { grid-template-columns:1fr 1fr; }
    .lp-j-grid, .lp-j-row2 { grid-template-columns:1fr 1fr; gap:2rem; }
    .lp-j-line { display:none; }
    .lp-nav-links { display:none; }
    .lp-float-chip { display:none; }
    .lp-hero-blue { padding:3rem 1.5rem; }
    .lp-testi-grid { grid-template-columns:1fr 1fr; }
    .lp-stats-inner { grid-template-columns:1fr 1fr; }
    .lp-stat-item:nth-child(3)::before { display:none; }
    .lp-symp-grid { grid-template-columns:repeat(4,1fr); }
  }
  @media (max-width:600px) {
    .lp-ls-grid { grid-template-columns:1fr; }
    .lp-j-grid, .lp-j-row2 { grid-template-columns:1fr 1fr; }
    .lp-alerts-cards { grid-template-columns:1fr; }
    .lp-ac-wide { grid-column:span 1; }
    .lp-nav { padding:.75rem 1.25rem; }
    .lp-hero { padding:2rem 1rem 3rem; }
    .lp-cta-card { padding:3rem 1.5rem; }
    .lp-section { padding:4rem 1.25rem; }
    .lp-testi-grid { grid-template-columns:1fr; }
    .lp-stats-inner { grid-template-columns:1fr 1fr; }
    .lp-symp-grid { grid-template-columns:repeat(4,1fr); }
    .lp-chat-section { padding:4rem 1.25rem; }
  }
`

/* ─────────────────────────────────────────────
   EMBEDDED CHAT
───────────────────────────────────────────── */
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
  const anonSessionId = useRef(null)

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

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setIsVisible(true))
    else setIsVisible(false)
  }, [isOpen])

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
    if (!anonSessionId.current) anonSessionId.current = crypto.randomUUID()
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
        id: Date.now() + 1, side: 'ai', text: responseText,
        isReport, isBooking: !isReport && isBookingSuggestion(responseText),
      }
      setMessages(prev => {
        const updated = [...prev, aiMsg]
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
    <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue),var(--cyan))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:10, marginTop:2 }}>
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
        <div key={m.id} style={{ display:'flex' }}>
          {aiAvatar}
          <div style={{ maxWidth:'84%' }}>
            <div style={{ borderRadius:'4px 16px 16px 16px', fontSize:13.5, lineHeight:1.7, background:'#fff', color:'var(--g300)', border:'1px solid rgba(0,0,0,0.09)', overflow:'hidden' }}>
              <div style={{ padding:'14px 16px 10px' }} dangerouslySetInnerHTML={{ __html: previewText.replace(/\n/g,'<br/>') }} />
              {blurredText && (
                <div style={{ position:'relative' }}>
                  <div style={{ padding:'0 16px 14px', filter:'blur(4px)', userSelect:'none', pointerEvents:'none', opacity:0.6 }} dangerouslySetInnerHTML={{ __html: blurredText.replace(/\n/g,'<br/>') }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.85) 100%)', display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:18 }}>
                    <button onClick={() => navigate('/login')} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:20, background:'linear-gradient(135deg,var(--blue),var(--cyan))', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)', boxShadow:'0 4px 18px rgba(21,101,192,0.35)' }}>
                      <Lock size={13} /> View Your Full Results
                    </button>
                  </div>
                </div>
              )}
            </div>
            {!blurredText && (
              <button onClick={() => navigate('/login')} style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:20, background:'linear-gradient(135deg,var(--blue),var(--cyan))', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)', boxShadow:'0 4px 18px rgba(21,101,192,0.35)' }}>
                <Lock size={13} /> View Your Full Results
              </button>
            )}
          </div>
        </div>
      )
    }
    if (isAI && m.isBooking) {
      const stripped = m.text.replace(/\b(shall i|i can|i'll|let me|would you like me to)\s+book[^.!?\n]*/gi,'').replace(/\bbooking[^.!?\n]*/gi,'').trim()
      return (
        <div key={m.id} style={{ display:'flex' }}>
          {aiAvatar}
          <div style={{ maxWidth:'80%' }}>
            {stripped && <div style={{ padding:'12px 15px', marginBottom:10, borderRadius:'4px 16px 16px 16px', fontSize:14, lineHeight:1.65, background:'#fff', color:'var(--g300)', border:'1px solid rgba(0,0,0,0.09)' }} dangerouslySetInnerHTML={{ __html: stripped }} />}
            <button onClick={() => navigate('/login')} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 22px', borderRadius:20, background:'linear-gradient(135deg,var(--blue),var(--cyan))', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)', boxShadow:'0 4px 16px rgba(21,101,192,0.28)' }}>
              <Calendar size={14} /> Book Appointment
            </button>
          </div>
        </div>
      )
    }
    return (
      <div key={m.id} style={{ display:'flex', justifyContent:isAI?'flex-start':'flex-end' }}>
        {isAI && aiAvatar}
        <div style={{ maxWidth:'78%', padding:'12px 15px', borderRadius:isAI?'4px 16px 16px 16px':'16px 4px 16px 16px', fontSize:14, lineHeight:1.6, background:isAI?'#fff':'linear-gradient(135deg,var(--blue),#1448B5)', color:isAI?'var(--g300)':'#fff', border:isAI?'1px solid rgba(0,0,0,0.09)':'none' }}
          dangerouslySetInnerHTML={{ __html: m.text }}
        />
      </div>
    )
  }

  return (
    <>
      {/* Preview card */}
      <div style={{ borderRadius:20, overflow:'hidden', background:'#fff', border:'1px solid rgba(0,0,0,0.09)', boxShadow:'0 24px 60px rgba(0,0,0,0.1)' }}>
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
        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(0,0,0,0.06)', background:'#fff' }}>
          <button
            onClick={() => setIsOpen(true)}
            style={{ width:'100%', padding:'12px', borderRadius:12, background:'linear-gradient(135deg,var(--blue),var(--cyan))', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(21,101,192,0.25)' }}
          >
            <MessageSquare size={16} /> Start Chatting with AI
          </button>
        </div>
      </div>

      {/* Modal */}
      {isOpen && createPortal(
        <div
          onClick={e => { if (e.target === e.currentTarget) setIsOpen(false) }}
          style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(10,20,60,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, opacity:isVisible?1:0, transition:'opacity 0.25s ease' }}
        >
          <div style={{ width:'100%', maxWidth:isMobile?'100%':640, height:isMobile?'100svh':580, borderRadius:isMobile?0:24, overflow:'hidden', background:'#fff', boxShadow:'0 32px 100px rgba(0,0,0,0.35)', display:'flex', flexDirection:'column', transform:isVisible?'scale(1) translateY(0)':'scale(0.95) translateY(20px)', transition:'transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease', opacity:isVisible?1:0 }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:10, background:'rgba(240,246,255,0.97)', flexShrink:0 }}>
              <div style={{ width:9, height:9, borderRadius:'50%', background:'var(--ok)', animation:'lp-pulse 2s infinite' }} />
              <Logo size={20} />
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--g300)' }}>Medivora AI</div>
                <div style={{ fontSize:10, color:'var(--ok)' }}>● Active · Private · Zero-data</div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ marginLeft:'auto', width:32, height:32, borderRadius:'50%', background:'rgba(0,0,0,0.06)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'var(--g400)', flexShrink:0 }}>×</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'20px 20px 8px', display:'flex', flexDirection:'column', gap:14, background:'#f8faff' }}>
              {messages.map(m => renderMessage(m))}
              {isTyping && (
                <div style={{ display:'flex', gap:4, paddingLeft:38 }}>
                  {[0,150,300].map(d => <div key={d} style={{ width:7, height:7, borderRadius:'50%', background:'var(--cyan)', opacity:0.5, animation:`lp-typing 1.2s ease-in-out ${d}ms infinite` }} />)}
                </div>
              )}
              <div ref={endRef} />
            </div>
            <div style={{ padding:'12px 20px 16px', borderTop:'1px solid rgba(0,0,0,0.07)', flexShrink:0, background:'#fff' }}>
              <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                {SYMPTOMS.slice(0,4).map(({ icon: Icon, label, q }) => (
                  <button key={label} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 0) }}
                    style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, background:'rgba(25,48,170,0.05)', border:'1px solid rgba(25,48,170,0.15)', fontSize:12, fontWeight:600, color:'#1930AA', cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(25,48,170,0.1)'; e.currentTarget.style.borderColor='rgba(25,48,170,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(25,48,170,0.05)'; e.currentTarget.style.borderColor='rgba(25,48,170,0.15)' }}
                  >
                    <Icon size={11} /> {label}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap:10, marginBottom:12 }}>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                  onFocus={e => e.target.style.borderColor='rgba(0,188,212,0.5)'} onBlur={e => e.target.style.borderColor='rgba(0,0,0,0.09)'}
                  placeholder="Apne symptoms batao — Hindi ya English..."
                  style={{ flex:1, padding:'12px 16px', borderRadius:12, background:'#f4f6ff', border:'1.5px solid rgba(0,0,0,0.09)', fontSize:14, color:'var(--g300)', outline:'none', fontFamily:'var(--font)', transition:'border-color 0.2s' }}
                />
                <button onClick={send} disabled={!input.trim() || isTyping}
                  style={{ padding:'12px 20px', borderRadius:12, background:input.trim()?'linear-gradient(135deg,var(--blue),var(--cyan))':'rgba(0,0,0,0.05)', border:'none', color:input.trim()?'#fff':'var(--g700)', fontSize:13, fontWeight:700, cursor:input.trim()?'pointer':'default', fontFamily:'var(--font)', flexShrink:0 }}
                >Send</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
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

  function startChat(q) {
    sessionStorage.setItem('quick_symptom', q)
    navigate('/chat')
  }

  function handleWaitlist(e) {
    e.preventDefault()
    navigate('/signup')
  }

  return (
    <div className="lp-root">
      <style>{styles}</style>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-nav-logo">
          <span className="lp-dot" />Medivora
        </Link>
        <div className="lp-nav-links">
          <span className="lp-nav-link" onClick={() => document.getElementById('lp-how').scrollIntoView({ behavior:'smooth' })}>How it works</span>
          <span className="lp-nav-link" onClick={() => setComingSoon('Doctor Portal')}>For Doctors</span>
          <span className="lp-nav-link" onClick={() => setComingSoon('Mental Health')}>Mental Health</span>
          <span className="lp-nav-link" onClick={() => setComingSoon('Skin & Hair')}>Skin & Hair</span>
          <Link to="/login" className="lp-nav-link">Log in</Link>
        </div>
        <Link to="/signup" className="lp-nav-cta">Get early access</Link>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-blue">
          <div className="lp-hero-grid-bg" />
          <div className="lp-hero-orb" />
          <div className="lp-hero-orb-2" />
          <div className="lp-hero-content">
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
                <strong>Medivora is always on</strong> — listening to your health signals, assessing your symptoms, monitoring your vitals, notifying you before problems escalate, and routing you to the right specialist. <strong>One AI companion for your entire health journey.</strong>
              </p>
              <div className="lp-hero-actions">
                <Link to="/signup" className="lp-btn-primary">Get early access →</Link>
                <button className="lp-btn-ghost" onClick={() => document.getElementById('lp-how').scrollIntoView({ behavior:'smooth' })}>See it work</button>
              </div>
            </div>
            <div className="lp-hero-mockup">
              <div className="lp-float-chip lp-float-chip-1"><span className="lp-chip-icon">🎧</span><span>Listening to your symptoms…</span></div>
              <div className="lp-float-chip lp-float-chip-2"><span className="lp-chip-icon">⚡</span><span>Vitals normal · Last sync 2m</span></div>
              <div className="lp-float-chip lp-float-chip-3"><span className="lp-chip-icon">🔔</span><span>1 new insight ready</span></div>
              <div className="lp-glass-card lp-mock-main">
                <div className="lp-mock-row">
                  <div className="lp-mock-status"><span className="lp-live-dot" />Medivora · Active</div>
                  <div className="lp-mock-time">Today, 10:42</div>
                </div>
                <div className="lp-mock-greeting">Good morning, <em>Nikhil</em>.<br />All vitals on track.</div>
                <div className="lp-mock-vitals">
                  {[['Heart rate','68 bpm','↓ 4% · Resting'],['Sleep','7.2 h','↑ Quality good'],['Blood pressure','118/76','Optimal'],['Stress index','Low','↓ 12% this week']].map(([l,v,t],i) => (
                    <div className="lp-mock-vital" key={i}>
                      <div className="lp-mv-label">{l}</div>
                      <div className="lp-mv-value">{v}</div>
                      <div className="lp-mv-trend">{t}</div>
                    </div>
                  ))}
                </div>
                <div className="lp-mock-wave">
                  <div className="lp-mw-label"><span className="lp-mw-l1">Live signal capture</span><span className="lp-mw-l2">● Listening</span></div>
                  <svg className="lp-wave-svg" viewBox="0 0 240 40" preserveAspectRatio="none">
                    <defs><linearGradient id="lpwg" x1="0" x2="1"><stop offset="0%" stopColor="#00D4FF" stopOpacity="0.2"/><stop offset="50%" stopColor="#7CE7FF" stopOpacity="1"/><stop offset="100%" stopColor="#00D4FF" stopOpacity="0.2"/></linearGradient></defs>
                    <path d="M0 20 Q 15 5,30 20 T 60 20 Q 75 12,90 25 T 120 18 Q 135 8,150 22 T 180 20 Q 195 5,210 20 T 240 20" fill="none" stroke="url(#lpwg)" strokeWidth="2"/>
                  </svg>
                </div>
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
          <div className="lp-fi">
            <div className="lp-eyebrow">What Medivora does, every day</div>
            <h2 className="lp-section-title">Four things, <span className="lp-it">always.</span></h2>
            <p className="lp-section-sub">Not a booking app. Not a record-keeper. A companion built to live alongside you — quietly intelligent, always available, never tired.</p>
          </div>
          <div className="lp-ls-grid">
            {LISTENING_CARDS.map((c, i) => (
              <div className="lp-ls-card lp-fi" key={i} style={{ transitionDelay:`${i * 0.08}s` }}>
                <div className="lp-ls-icon">{c.icon}</div>
                <div className="lp-ls-num">{c.num}</div>
                <div className="lp-ls-title">{c.title}</div>
                <div className="lp-ls-body">{c.body}</div>
              </div>
            ))}
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
            <EmbeddedChat />
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
                  <div className="lp-dm-alert lp-urgent"><div className="lp-dm-ai">⚠️</div><div className="lp-dm-ac"><div className="lp-dm-at">Asthma risk elevated · Thursday</div><div className="lp-dm-as">High AQI + monsoon humidity. Inhaler reminder set. Pulmonologist notified.</div></div></div>
                  <div className="lp-dm-alert"><div className="lp-dm-ai">💊</div><div className="lp-dm-ac"><div className="lp-dm-at">Metformin — 2 doses missed</div><div className="lp-dm-as">HbA1c trending up. Schedule a check-in?</div></div></div>
                  <div className="lp-dm-alert"><div className="lp-dm-ai">🧪</div><div className="lp-dm-ac"><div className="lp-dm-at">TSH result · 6.2 mIU/L</div><div className="lp-dm-as">Slightly elevated. Endocrinology consult booked.</div></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── JOURNEY ── */}
      <section className="lp-section lp-journey">
        <div className="lp-container">
          <div className="lp-fi">
            <div className="lp-eyebrow">The full care journey</div>
            <h2 className="lp-section-title">First symptom to <span className="lp-it">full recovery.</span><br />One platform.</h2>
            <p className="lp-section-sub">Every step connected. Every outcome tracked. No more starting from scratch.</p>
          </div>
          <div className="lp-j-flow lp-fi">
            <div className="lp-j-grid">
              <div className="lp-j-line" />
              {JOURNEY_STEPS.slice(0,4).map((s,i) => (
                <div className="lp-j-step" key={i}>
                  <div className="lp-j-icon-wrap">{s.icon}</div>
                  <div className="lp-j-num">Step {s.num}</div>
                  <div className="lp-j-title">{s.title}</div>
                  <div className="lp-j-body">{s.body}</div>
                </div>
              ))}
            </div>
            <div className="lp-j-row2">
              <div className="lp-j-line" />
              {JOURNEY_STEPS.slice(4).map((s,i) => (
                <div className="lp-j-step" key={i}>
                  <div className="lp-j-icon-wrap">{s.icon}</div>
                  <div className="lp-j-num">Step {s.num}</div>
                  <div className="lp-j-title">{s.title}</div>
                  <div className="lp-j-body">{s.body}</div>
                </div>
              ))}
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
              <button className="lp-doc-cta" onClick={() => setComingSoon('Doctor registration')}>
                Join as Doctor <ArrowRight size={15} />
              </button>
            </div>
            <div className="lp-doc-cards lp-fi" style={{ transitionDelay:'0.1s' }}>
              {DOCTOR_BENEFITS.map((d, i) => (
                <div className="lp-doc-card" key={i}>
                  <div className="lp-doc-icon">{d.icon}</div>
                  <div>
                    <div className="lp-doc-title">{d.title}</div>
                    <div className="lp-doc-body">{d.body}</div>
                  </div>
                </div>
              ))}
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
          <div className="lp-testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="lp-testi-card lp-fi" key={i} style={{ transitionDelay:`${i * 0.1}s` }}>
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
            ))}
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
            <p className="lp-cta-sub">Join the Medivora waitlist. First 500 users get founding member access — free for 6 months.</p>
            <form className="lp-cta-form" onSubmit={handleWaitlist}>
              <input className="lp-cta-input" placeholder="Your phone or email" value={emailValue} onChange={e => setEmailValue(e.target.value)} />
              <button type="submit" className="lp-btn-primary">Join waitlist →</button>
            </form>
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
    </div>
  )
}
