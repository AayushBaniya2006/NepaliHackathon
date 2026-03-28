import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import heroBg from '../assets/hero-bg.png';
import './Landing.css';

/* ---------- Data ---------- */
const METRICS = [
  { value: 4.2, suffix: 'x', label: 'Faster clinical documentation' },
  { value: 60, suffix: '%', label: 'Insurance appeal win rate' },
  { value: 5, suffix: ' min', label: 'Session to SOAP note' },
];

const PATIENT_CARDS = [
  {
    icon: '☝️',
    title: 'Gesture Drawing',
    desc: 'Point your finger at the webcam to draw. No mouse, no keyboard — just natural hand gestures.',
  },
  {
    icon: '🧠',
    title: 'AI-Powered Insight',
    desc: 'Every drawing is analyzed in real-time for stress patterns, emotional markers, and clinical indicators.',
  },
  {
    icon: '🗣️',
    title: 'Sign Language Mode',
    desc: 'Switch to sign language recognition. Your signs become words, your words become clinical notes.',
  },
];

const CLINICIAN_CARDS = [
  {
    icon: '📋',
    title: 'SOAP Note Generation',
    desc: 'AI auto-generates structured clinical notes from every patient session — Subjective, Objective, Assessment, Plan.',
  },
  {
    icon: '🏥',
    title: 'FHIR-Compliant Export',
    desc: 'One-click export to any EHR system. Standards-compliant Observation resources ready for integration.',
  },
  {
    icon: '⚖️',
    title: 'Reclaimant Engine',
    desc: '15 years of legal precedents. Auto-generate appeal letters for denied claims. 60% win rate.',
  },
];

const NAV_LINKS = [
  { label: 'How It Works', target: 'how-it-works' },
  { label: 'Platform', target: 'platform' },
  { label: 'For Clinicians', target: 'clinicians' },
];

/* ---------- Animated Counter ---------- */
function AnimatedCounter({ value, suffix, duration = 1500 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const isFloat = value % 1 !== 0;

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;
      setCount(isFloat ? parseFloat(current.toFixed(1)) : Math.round(current));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

/* ---------- Smooth Scroll ---------- */
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- Animation Variants ---------- */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

/* ---------- Auth Check ---------- */
function checkAuthToken() {
  try {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('session_token');
    return !!token;
  } catch {
    return false;
  }
}

/* ---------- Component ---------- */
export default function Landing() {
  const navigate = useNavigate();
  const { isOnboarded } = useStorage();
  const [navScrolled, setNavScrolled] = useState(false);
  const [liveCount, setLiveCount] = useState(null);
  const isReturningUser = checkAuthToken();

  useEffect(() => {
    function onScroll() {
      setNavScrolled(window.scrollY > 50);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Live session counter */
  useEffect(() => {
    let timer;
    async function fetchLive() {
      try {
        const res = await fetch('/api/metrics/live');
        const data = await res.json();
        const count = data.active_sessions;
        setLiveCount(count > 0 ? count : null);
      } catch {
        /* keep previous value or null */
      }
    }
    fetchLive();
    timer = setInterval(fetchLive, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-dark">
      {/* ===== NAVIGATION ===== */}
      <nav className={`ld-nav ${navScrolled ? 'ld-nav--scrolled' : ''}`}>
        <div className="ld-nav-inner">
          <a className="ld-nav-logo" href="/" onClick={e => { e.preventDefault(); scrollTo('hero'); }}>
            MindCanvas
          </a>

          <ul className="ld-nav-links">
            {NAV_LINKS.map(link => (
              <li key={link.target}>
                <button
                  className="ld-nav-link"
                  onClick={() => scrollTo(link.target)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="ld-nav-cta">
            <button
              className="ld-btn ld-btn-primary"
              onClick={() => navigate('/onboarding')}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="ld-hero" id="hero">
        <div
          className="ld-hero-bg"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="ld-hero-overlay" />

        <div className="ld-hero-content">
          {liveCount && (
            <motion.div
              className="ld-hero-badge"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="ld-live-pill">
                <span className="ld-live-dot" />
                {liveCount} people drawing right now
              </span>
            </motion.div>
          )}

          <motion.h1
            className="ld-hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className="ld-hero-line1">Draw what you can't say.</span>
            <br />
            <span className="ld-hero-line2">Hear it back.</span>
          </motion.h1>

          <motion.p
            className="ld-hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            No words. No keyboard. Just draw.
          </motion.p>

          <motion.div
            className="ld-hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <button
              className="ld-btn ld-btn-primary"
              onClick={() => navigate('/onboarding')}
            >
              Get Started
            </button>

            {isReturningUser && (
              <p className="returning-user-link">
                Welcome back — <a href="/clinic" onClick={e => { e.preventDefault(); navigate('/clinic'); }}>Go to Dashboard</a>
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ===== METRICS BAND ===== */}
      <section className="ld-metrics" id="how-it-works">
        <motion.div
          className="ld-metrics-inner"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {METRICS.map((m, i) => (
            <motion.div
              className="ld-metric"
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              <div className="ld-metric-value">
                <AnimatedCounter value={m.value} suffix={m.suffix} />
              </div>
              <div className="ld-metric-label">{m.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="ld-how-it-works" id="how-it-works-steps">
        <div className="ld-container">
          <motion.div
            className="ld-platform-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.p className="ld-category" variants={fadeUp} transition={{ duration: 0.5 }}>
              How It Works
            </motion.p>
            <motion.h2 className="ld-headline" variants={fadeUp} transition={{ duration: 0.6 }}>
              Three Steps to Clinical Evidence
            </motion.h2>
          </motion.div>

          <motion.div
            className="ld-steps-grid"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {/* Step 1 */}
            <motion.div className="ld-step-card" variants={fadeUp} transition={{ duration: 0.5 }}>
              <div className="ld-step-num">1</div>
              <div className="ld-step-icon">☝️</div>
              <h3 className="ld-step-title">Draw</h3>
              <p className="ld-step-desc">
                Use hand gestures to draw on your webcam. No mouse, no keyboard — just point and move.
              </p>
              <div className="ld-step-live">
                <span className="ld-live-dot" />
                <span>847 people drawing right now</span>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div className="ld-step-card" variants={fadeUp} transition={{ duration: 0.5 }}>
              <div className="ld-step-num">2</div>
              <div className="ld-step-icon">🔬</div>
              <h3 className="ld-step-title">AI Analyzes</h3>
              <p className="ld-step-desc">
                Real-time emotion detection, drawing pattern analysis, and clinical stress scoring — as you draw.
              </p>
              <div className="ld-step-live">
                <span className="ld-live-dot" />
                <span>Last detected: Heaviness · 2 min ago</span>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div className="ld-step-card" variants={fadeUp} transition={{ duration: 0.5 }}>
              <div className="ld-step-num">3</div>
              <div className="ld-step-icon">📋</div>
              <h3 className="ld-step-title">Get Help</h3>
              <p className="ld-step-desc">
                Instant SOAP notes, insurance pre-authorization, and clinical evidence — all from one session.
              </p>
              <div className="ld-step-live">
                <span className="ld-live-dot" />
                <span>12,403 SOAP notes generated</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================= */}
      {/* ===== CHAPTER 1: FOR PATIENTS (CLIENT) ===== */}
      {/* ============================================= */}
      <section className="ld-platform" id="platform">
        <motion.div
          className="ld-platform-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <motion.p className="ld-category" variants={fadeUp} transition={{ duration: 0.5 }}>
            For Patients &amp; Caregivers
          </motion.p>
          <motion.h2 className="ld-headline" variants={fadeUp} transition={{ duration: 0.6 }}>
            Your Feelings, Your Way
          </motion.h2>
          <motion.p className="ld-body" variants={fadeUp} transition={{ duration: 0.6 }} style={{ maxWidth: 560 }}>
            No words needed. Draw with hand gestures, sign in your language, and let AI
            translate your expression into the clinical evidence you deserve.
          </motion.p>
        </motion.div>

        <motion.div
          className="ld-cards-grid"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {PATIENT_CARDS.map((card, i) => (
            <motion.div
              className="ld-card"
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              <div className="ld-card-icon">{card.icon}</div>
              <h3 className="ld-card-title">{card.title}</h3>
              <p className="ld-card-desc">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== PATIENT CTA DIVIDER ===== */}
      <section className="ld-divider-cta">
        <motion.div
          className="ld-divider-cta-inner"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="ld-divider-cta-text">
            10M+ nonverbal Americans are underdiagnosed. MindCanvas gives them a voice without words.
          </p>
          <button
            className="ld-btn ld-btn-primary"
            onClick={() => navigate('/onboarding')}
          >
            Start Drawing
          </button>
        </motion.div>
      </section>

      {/* ================================================ */}
      {/* ===== CHAPTER 2: FOR CLINICIANS (B2B) ========== */}
      {/* ================================================ */}
      <section className="ld-platform ld-platform--b2b" id="clinicians">
        <motion.div
          className="ld-platform-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <motion.p className="ld-category" variants={fadeUp} transition={{ duration: 0.5 }}>
            For Clinicians &amp; Practices
          </motion.p>
          <motion.h2 className="ld-headline" variants={fadeUp} transition={{ duration: 0.6 }}>
            From Session to Insurance Payout
          </motion.h2>
          <motion.p className="ld-body" variants={fadeUp} transition={{ duration: 0.6 }} style={{ maxWidth: 580 }}>
            Auto-generate clinical documentation, export to any EHR, and fight denied claims
            with AI-powered legal appeals — all from one dashboard.
          </motion.p>
        </motion.div>

        <motion.div
          className="ld-cards-grid"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {CLINICIAN_CARDS.map((card, i) => (
            <motion.div
              className="ld-card"
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              <div className="ld-card-icon">{card.icon}</div>
              <h3 className="ld-card-title">{card.title}</h3>
              <p className="ld-card-desc">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== RECLAIMANT FEATURE ===== */}
      <section className="ld-reclaimant" id="reclaimant">
        <div className="ld-reclaimant-bg" />

        <div className="ld-reclaimant-content">
          <motion.div
            className="ld-reclaimant-badge"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="ld-badge ld-badge--dark">
              <span className="ld-badge-dot ld-badge-dot--accent" />
              Reclaimant
            </span>
          </motion.div>

          <motion.h2
            className="ld-reclaimant-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
          >
            Auto-Appeal Denied Claims
          </motion.h2>

          <motion.p
            className="ld-reclaimant-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            Our AI scans denial notices, matches against 15 years of legal precedents,
            and generates appeal letters citing Mental Health Parity Act violations.
            Practices recover an average of $35k annually.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <button
              className="ld-btn ld-btn-secondary-inv"
              onClick={() => navigate('/insurance')}
            >
              Learn More
              <span style={{ fontSize: '0.85em' }}>&rsaquo;</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ===== CLINICIAN STATS CTA ===== */}
      <section className="ld-clinician" id="clinician-cta">
        <div className="ld-clinician-inner">
          <motion.div
            className="ld-clinician-text"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.p className="ld-category" variants={fadeUp} transition={{ duration: 0.5 }}>
              Dashboard
            </motion.p>
            <motion.h2 className="ld-headline" variants={fadeUp} transition={{ duration: 0.6 }}>
              Everything in One Place
            </motion.h2>
            <motion.p className="ld-body" variants={fadeUp} transition={{ duration: 0.6 }}>
              Review patient sessions, track stress trends over time,
              generate FHIR observations, and submit insurance claims — all
              from a single clinician dashboard.
            </motion.p>
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <button
                className="ld-btn ld-btn-secondary"
                onClick={() => navigate('/clinician')}
              >
                Open Clinician Dashboard
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            className="ld-clinician-stats"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.div className="ld-stat-card" variants={fadeUp} transition={{ duration: 0.5 }}>
              <div className="ld-stat-card-value">$35k</div>
              <div className="ld-stat-card-label">Avg. annual recovery per practice</div>
            </motion.div>
            <motion.div className="ld-stat-card" variants={fadeUp} transition={{ duration: 0.5 }}>
              <div className="ld-stat-card-value">FHIR</div>
              <div className="ld-stat-card-label">Compliant clinical export</div>
            </motion.div>
            <motion.div className="ld-stat-card" variants={fadeUp} transition={{ duration: 0.5 }}>
              <div className="ld-stat-card-value">60%</div>
              <div className="ld-stat-card-label">Auto-appeal success rate</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="ld-footer">
        <div className="ld-footer-inner">
          <div className="ld-footer-brand">
            <span className="ld-footer-logo">MindCanvas</span>
            <p className="ld-footer-tagline">Draw what you can't say.</p>
          </div>

          <div className="ld-footer-crisis">
            <p className="ld-footer-crisis-title">In crisis? Get help now:</p>
            <div className="ld-footer-crisis-links">
              <a href="tel:988" className="ld-footer-crisis-link">
                📞 988 Suicide & Crisis Lifeline
              </a>
              <a href="sms:741741?body=HELLO" className="ld-footer-crisis-link">
                💬 Text HOME to 741741
              </a>
              <a href="tel:18002738255" className="ld-footer-crisis-link">
                📱 SAMHSA: 1-800-273-8255
              </a>
            </div>
          </div>

          <div className="ld-footer-disclaimer">
            <p>Demo only — Not a medical device. Not HIPAA compliant. Built for hackathon demonstration.</p>
            <p>© 2026 MindCanvas. Nepal–US Hackathon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
