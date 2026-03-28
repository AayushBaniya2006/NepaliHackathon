import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import heroBg from '../assets/hero-bg.png';
import './Landing.css';

/* ---------- Data ---------- */
const METRICS = [
  { value: 5, suffix: ' min', label: 'Average session length' },
  { value: 60, suffix: '%', label: 'Insurance appeal win rate' },
  { value: 3, suffix: 'x', label: 'Clinical documentation speed' },
  { value: 0, suffix: ' words', label: 'Required from the patient' },
];

const STEPS = [
  {
    num: '01',
    title: 'Draw',
    body: "Point your index finger. Move it across the screen. That's all. No keyboard. No words. No instructions needed.",
  },
  {
    num: '02',
    title: 'Analyzed',
    body: 'AI reads your drawing and your facial expressions simultaneously. Emotion surfaces without a single sentence.',
  },
  {
    num: '03',
    title: 'Heard',
    body: 'A voice speaks the interpretation back to you in your language. Your clinician receives the clinical picture.',
  },
];

const PLATFORM_ROWS = [
  {
    tag: 'EXPRESSION',
    title: 'Gesture Drawing',
    body: 'Draw with your hand in front of the camera. Index finger draws. Pinch erases. Open hand submits. No hardware needed beyond a webcam.',
    right: { type: 'stat', text: '9 gestures. Zero barriers.' },
  },
  {
    tag: 'UNDERSTANDING',
    title: 'AI Voice Interpretation',
    body: 'When you finish drawing, AI speaks back to you in your language. Nepali. Hindi. Arabic. Korean. 15 languages. Your words, finally.',
    right: { type: 'pills', langs: ['\u0928\u0947\u092A\u093E\u0932\u0940', '\u0939\u093F\u0928\u094D\u0926\u0940', '\uD55C\uAD6D\uC5B4', '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', '\u0E44\u0E17\u0E22', 'Espa\u00F1ol'] },
  },
  {
    tag: 'PROGRESS',
    title: 'Pattern Tracking',
    body: "Every session builds a picture over time. Your clinician sees what you've been carrying \u2014 without you having to explain it twice.",
    right: { type: 'stat', text: 'Sessions build. Patterns surface.' },
  },
];

const HUMAN_STATS = [
  { value: '1 in 5', desc: 'adults experience mental illness. Most never get help.' },
  { value: '47%', desc: 'of immigrants report language as a barrier to mental healthcare.' },
  { value: '0', desc: 'words required from a MindCanvas user.' },
];

const NAV_LINKS = [
  { label: 'How It Works', target: 'how-it-works' },
  { label: 'Platform', target: 'platform' },
];

/* ---------- Animated Counter ---------- */
function AnimatedCounter({ value, suffix, duration = 1200 }) {
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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const metricsStagger = {
  visible: {
    transition: { staggerChildren: 0.15 },
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

      {/* ===== METRICS BAND (dark) ===== */}
      <section className="ld-metrics-band" id="how-it-works">
        <motion.div
          className="ld-metrics-band-inner"
          variants={metricsStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {METRICS.map((m, i) => (
            <motion.div
              className="ld-metrics-band-item"
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
            >
              <div className="ld-metrics-band-value">
                <AnimatedCounter value={m.value} suffix={m.suffix} />
              </div>
              <div className="ld-metrics-band-label">{m.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== HOW IT WORKS / THE PROCESS (light) ===== */}
      <section className="ld-process-section" id="how-it-works-steps">
        <div className="ld-container">
          <motion.div
            className="ld-process-layout"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            {/* Left: Steps */}
            <div className="ld-process-left">
              <motion.p className="ld-section-label" variants={fadeUp} transition={{ duration: 0.4 }}>
                THE PROCESS
              </motion.p>
              <motion.h2 className="ld-process-headline" variants={fadeUp} transition={{ duration: 0.5 }}>
                <span>One drawing.</span>
                <span>A complete clinical picture.</span>
              </motion.h2>

              <div className="ld-process-steps">
                {STEPS.map((step, i) => (
                  <motion.div
                    className="ld-process-step"
                    key={step.num}
                    variants={fadeUp}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="ld-process-step-number">{step.num}</div>
                    <div className="ld-process-step-connector">
                      {i < STEPS.length - 1 && <span className="ld-process-step-line" />}
                    </div>
                    <div className="ld-process-step-content">
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Product screenshot placeholder */}
            <motion.div
              className="ld-process-visual"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              <p className="ld-process-shot-label">LIVE SESSION</p>
              <div className="ld-process-shot-frame">
                <div className="ld-process-shot-header">
                  <span>MINDCANVAS</span>
                  <span>SESSION ACTIVE</span>
                </div>
                <div className="ld-process-shot-body">
                  <div className="ld-process-shot-canvas">
                    <div className="ld-process-shot-grid" />
                    <div className="ld-process-shot-stroke ld-process-shot-stroke--one" />
                    <div className="ld-process-shot-stroke ld-process-shot-stroke--two" />
                    <div className="ld-process-shot-stroke ld-process-shot-stroke--three" />
                    <div className="ld-process-shot-cursor" />
                    <span className="ld-process-shot-cursor-label">Drawing</span>
                  </div>
                  <div className="ld-process-shot-sidebar">
                    <span className="ld-process-shot-sidebar-label">DETECTED EMOTION</span>
                    <div className="ld-process-shot-emotion-row">
                      <span>Heaviness</span>
                      <strong>78%</strong>
                    </div>
                    <div className="ld-process-shot-emotion-row">
                      <span>Tension</span>
                      <strong>62%</strong>
                    </div>
                    <div className="ld-process-shot-emotion-row">
                      <span>Release</span>
                      <strong>41%</strong>
                    </div>
                    <div className="ld-process-shot-wave">
                      <span /><span /><span /><span /><span /><span />
                    </div>
                    <div className="ld-process-shot-voice">
                      &ldquo;I see weight here. Something you&rsquo;ve been holding for a long time.&rdquo;
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== PLATFORM SPOTLIGHT (dark) ===== */}
      <section className="ld-platform-section" id="platform">
        <div className="ld-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.p className="ld-section-label" variants={fadeUp} transition={{ duration: 0.4 }}>
              THE PLATFORM
            </motion.p>
            <motion.h2 className="ld-platform-headline" variants={fadeUp} transition={{ duration: 0.5 }}>
              Draw what you&rsquo;ve never been able to say.
            </motion.h2>
            <motion.p className="ld-platform-subheadline" variants={fadeUp} transition={{ duration: 0.5 }}>
              MindCanvas is for people who fall through the cracks of traditional therapy.
              People who don&rsquo;t have the words, the language, or the access.
            </motion.p>
          </motion.div>

          <motion.div
            className="ld-platform-rows"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {PLATFORM_ROWS.map((row, i) => (
              <motion.div
                className="ld-platform-row"
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                <div className="ld-platform-row-copy">
                  <p className="ld-platform-row-label">{row.tag}</p>
                  <h3>{row.title}</h3>
                  <p>{row.body}</p>
                </div>
                <div className="ld-platform-row-detail">
                  {row.right.type === 'stat' ? (
                    <p className="ld-platform-callout">{row.right.text}</p>
                  ) : (
                    <div className="ld-platform-pill-wrap">
                      {row.right.langs.map(lang => (
                        <span className="ld-platform-pill" key={lang}>{lang}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== HUMAN STORY (light) ===== */}
      <section className="ld-story-section">
        <div className="ld-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.p className="ld-section-label" variants={fadeUp} transition={{ duration: 0.4 }}>
              WHY IT EXISTS
            </motion.p>
          </motion.div>

          <motion.div
            className="ld-story-layout"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {/* Left: Pull-quote */}
            <motion.div className="ld-story-left" variants={fadeUp} transition={{ duration: 0.5 }}>
              <blockquote className="ld-story-quote">
                <span>Raju is 14. He moved from Kathmandu to Ohio eighteen months ago.</span>
                <span>He has not spoken to a therapist, because he cannot find the words in English for the heaviness he carries.</span>
              </blockquote>
              <p className="ld-story-body">
                He doesn&rsquo;t need a vocabulary lesson. He needs a way to show what he feels.
                MindCanvas lets him draw it, and hears it back to him in Nepali.
              </p>
            </motion.div>

            {/* Right: Stats */}
            <motion.div className="ld-story-stats" variants={fadeUp} transition={{ duration: 0.5 }}>
              {HUMAN_STATS.map((stat, i) => (
                <div className="ld-story-stat-row" key={i}>
                  <div className="ld-story-stat-value">{stat.value}</div>
                  <p className="ld-story-stat-body">{stat.desc}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== FINAL CTA (dark) ===== */}
      <section className="ld-final-cta">
        <div className="ld-container">
          <motion.div
            className="ld-final-cta-inner"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.h2
              className="ld-final-cta-headline"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              Begin.
            </motion.h2>
            <motion.p
              className="ld-final-cta-subtext"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Your feelings deserve to be understood.
            </motion.p>
            <motion.button
              className="ld-final-cta-button"
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              onClick={() => navigate('/onboarding')}
            >
              Start Drawing
            </motion.button>
            <motion.p
              className="ld-final-cta-meta"
              variants={fadeUp}
              transition={{ duration: 0.4 }}
            >
              Available in 15 languages &middot; No signup required
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER (ink) ===== */}
      <footer className="ld-footer">
        <div className="ld-container">
          <div className="ld-footer-top">
            <div className="ld-footer-column">
              <span className="ld-footer-brand">MindCanvas</span>
              <p className="ld-footer-tagline">Draw what you can&rsquo;t say.</p>
            </div>

            <div className="ld-footer-column ld-footer-links">
              <button className="ld-footer-link" onClick={() => scrollTo('how-it-works')}>How It Works</button>
              <button className="ld-footer-link" onClick={() => scrollTo('platform')}>Platform</button>
              <button className="ld-footer-link" onClick={() => navigate('/onboarding')}>Get Started</button>
            </div>

            <div className="ld-footer-column ld-footer-domain">
              <span>mindcanvas.app</span>
            </div>
          </div>

          <div className="ld-footer-bottom">
            <p>Demo only &mdash; Not a medical device. Not HIPAA compliant. Built for hackathon demonstration.</p>
            <p>&copy; 2026 MindCanvas. Nepal&ndash;US Hackathon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
