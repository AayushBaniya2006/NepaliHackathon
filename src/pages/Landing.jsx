import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import heroBg from '../assets/hero-bg.png';
import { IntegrationShowcase } from '../components/IntegrationShowcase';
import '../components/IntegrationShowcase.css';
import './Landing.css';

/* ---------- Data ---------- */
const METRICS = [
  { value: 85, suffix: '%', label: 'Higher denial rate for behavioral health vs medical claims' },
  { value: 60, suffix: '%+', label: 'Mental health denials citing "medical necessity"' },
  { value: 47, suffix: '%', label: 'Of immigrants cite language as a major healthcare barrier' },
  { value: 0, suffix: ' words', label: 'Required from the patient in MindHaven' },
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
            mindhaven
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
        <div className="ld-hero-content">
          <div className="ld-hero-text">
            <motion.h1
              className="ld-hero-title"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Your Mind Matters.<br />
              Let’s Heal, Together.
            </motion.h1>

            <motion.p
              className="ld-hero-subtitle"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Turn 5-minute drawing sessions into clinical evidence. No words. No keyboard. Just you being understood.
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
                Book an Appointment
              </button>
            </motion.div>
          </div>

          <motion.div 
            className="ld-hero-illustration"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <img src="/Untitled design (3)/Feelings Quiz Presentation in Colorful Illustrative Style.svg" alt="Mindhaven Illustration" />
          </motion.div>
        </div>
      </section>

      {/* ===== PROBLEM SECTION: What we are solving ===== */}
      <section className="ld-problem-section">
        <div className="ld-container">
          <div className="section-header-centered">
            <span className="section-tag">THE PROBLEM</span>
            <h2>Mental health is failing because<br />communication is broken.</h2>
            <p>Traditional therapy relies on words. But for nonverbal patients, neurodivergent individuals, or those with language barriers, the right words don't exist.</p>
          </div>

          <div className="problem-grid">
            <div className="problem-card">
              <img src="/Untitled design (3)/rainbow-mental-health.svg" alt="Language" className="problem-icon-img" />
              <h3>Language Barriers</h3>
              <p>Research indicates that <strong>47% of immigrants</strong> report language as a major barrier to mental healthcare. Translation is slow, and clinical terms lose cultural nuance.<sup>1</sup></p>
            </div>
            <div className="problem-card">
              <img src="/Untitled design (3)/sporty-brain.svg" alt="Insurance" className="problem-icon-img" />
              <h3>Insurance Denials</h3>
              <p>Following parity reports, behavioral health claims are denied at rates <strong>85% higher</strong> than medical claims, with over 60% rejected for "lack of medical necessity."<sup>2</sup></p>
            </div>
            <div className="problem-card">
              <img src="/Untitled design (3)/love-brain.svg" alt="Stigma" className="problem-icon-img" />
              <h3>Stigma & Burnout</h3>
              <p>Stigma prevents early support in culturally conservative communities. Meanwhile, students & professionals face unprecedented, silent occupational burnout.<sup>3</sup></p>
            </div>
          </div>
          
          <div className="citations-text">
             <p><sup>1</sup> NIMHD / Healthcare utilization disparity studies.</p>
             <p><sup>2</sup> Counterforce Health / APA MHPAEA parity violation reports.</p>
             <p><sup>3</sup> MDPI / Psychology Today research on cultural stigma.</p>
          </div>
        </div>
      </section>

      {/* ===== MISSION STATEMENTS ===== */}
      <section className="ld-mission-section">
        <div className="ld-container">
           <div className="mission-statements-grid">
              <div className="mission-statement-card">
                 <span className="mission-number">Statement 1</span>
                 <h3>Reducing Stress & Burnout</h3>
                 <p>Students and professionals feel a lot of stress from work and school. But going to therapy and talking about it is exhausting. MindHaven makes it simple. You just take 5 minutes to draw how you feel—no words needed. You can also send positive notes or photos to a friendly public "Wellness Wall." It's a safe, easy way to release stress without looking at a scary, confusing clinical dashboard.</p>
              </div>
              <div className="mission-statement-card">
                 <span className="mission-number">Statement 2</span>
                 <h3>Breaking Stigma & Borders</h3>
                 <p>In places like Nepal, people are afraid to seek help because of judgment—even from local doctors. MindHaven acts like a digital "free health camp" for immigrants and disabled users. A person can draw their feelings, and our ElevenLabs AI translates the session so a volunteer doctor in the US or India can help them entirely in their own language.</p>
                 <br />
                 <p><strong>For Doctors & Clinics:</strong> Insurance companies reject a lot of mental health claims. MindHaven fixes this by automatically creating the exact reports doctors need to get insurance approved, saving them hours of paperwork.</p>
              </div>
           </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS: DUAL PERSPECTIVE ===== */}
      <section className="ld-how-it-works-dual" id="how-it-works-steps">
         <div className="ld-container">
            <div className="section-header-centered">
               <span className="section-tag">HOW IT WORKS</span>
               <h2>Bridging the gap between<br />experience and diagnosis.</h2>
            </div>
            
            <div className="dual-perspective-grid">
               <div className="perspective-card patient-perspective">
                  <div className="perspective-header">
                     <img src="/Untitled design (3)/cute-brain.svg" alt="Patient" className="perspective-icon-img" />
                     <h3>For the Patient</h3>
                  </div>
                  <ul className="perspective-list">
                     <li>
                        <strong>1. Express Without Words:</strong> Just drag your finger across the camera. No keyboard, no talking required.
                     </li>
                     <li>
                        <strong>2. Overcome Stigma:</strong> Draw in complete privacy. AI analyzes your kinetic movement and facial micro-expressions.
                     </li>
                     <li>
                        <strong>3. Hear It Back:</strong> The AI speaks your emotional state back to you in your native language (15+ languages), validating your feelings.
                     </li>
                  </ul>
                  <div className="helps-highlight">
                     <strong>How this helps:</strong> Lowers the barrier to entry for culturally conservative communities where talking to a therapist is taboo. It provides an immediate release for burnt-out students and professionals who lack the energy to explain their stress.
                  </div>
               </div>

               <div className="perspective-card clinic-perspective">
                  <div className="perspective-header">
                     <img src="/Untitled design (3)/brain-and-flowers.svg" alt="Clinic" className="perspective-icon-img" />
                     <h3>For the Clinic & Provider</h3>
                  </div>
                  <ul className="perspective-list">
                     <li>
                        <strong>1. Objective Data Capture:</strong> Stop relying entirely on subjective self-reporting. Capture quantifiable kinetic and emotional data.
                     </li>
                     <li>
                        <strong>2. Automated Charting:</strong> Every session automatically generates clinical documentation mapped to diagnostic criteria.
                     </li>
                     <li>
                        <strong>3. Defeat Insurance Denials:</strong> Provide the concrete "medical necessity" proof needed to fight the 85% higher denial rate for behavioral health claims.
                     </li>
                  </ul>
                  <div className="helps-highlight">
                     <strong>How this helps:</strong> Gives clinicians the hard evidence needed to secure insurance approvals. It reduces massive administrative burdens, allowing providers to focus on actual patient care.
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* ===== AUDIENCE SECTION: Who this is for ===== */}
      <section className="ld-audience-section">
        <div className="ld-container">
          <div className="audience-layout">
            <div className="audience-text">
              <span className="section-tag">AUDIENCE</span>
              <h2>Built for the people<br />who fall through the cracks.</h2>
              <div className="audience-list">
                <div className="audience-item">
                  <strong>🏠 Families & Caregivers</strong>
                  <p>Understand the emotional state of non-communicative loved ones without the guesswork.</p>
                </div>
                <div className="audience-item">
                  <strong>🏥 Clinical Facilities</strong>
                  <p>Empower your speech therapists and social workers with AI-driven emotional diagnostic data.</p>
                </div>
                <div className="audience-item">
                  <strong>🏢 Modern HR Teams</strong>
                  <p>Support diverse, global workforces who need mental health support in their own cultural context.</p>
                </div>
              </div>
            </div>
            <div className="audience-visual">
              <img src="/Untitled design (3)/cute-brain.svg" alt="Supportive brain" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== TOOLKIT SECTION (Illustrative Cards) ===== */}
      <section className="ld-toolkit-section">
        <div className="ld-container">
          <div className="ld-toolkit-header">
            <span className="section-tag">THE TOOLKIT</span>
            <h2>Your Mental Wellness<br />Toolkit, Always Within Reach</h2>
            <p>Therapy is just the beginning; we give you everything you need to keep moving forward.</p>
          </div>

          <div className="ld-toolkit-grid">
            <div className="toolkit-card">
              <div className="toolkit-img">
                <img src="/Untitled design (3)/healthy-brain-boy.svg" alt="Sessions" />
              </div>
              <h3>Live Video & Chat Sessions</h3>
              <p>Connect at your pace, anytime, with our specialist network.</p>
            </div>
            <div className="toolkit-card">
              <div className="toolkit-img">
                <img src="/Untitled design (3)/sporty-brain.svg" alt="Tracking" />
              </div>
              <h3>Mood & Progress Tracking</h3>
              <p>See how far you've come with real-time analytics.</p>
            </div>
            <div className="toolkit-card">
              <div className="toolkit-img">
                <img src="/Untitled design (3)/brain-and-flowers.svg" alt="Exercises" />
              </div>
              <h3>Meditation & Exercises</h3>
              <p>For stress, sleep, and emotional balance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INTEGRATION SHOWCASE: PEO & HR TOOLS ===== */}
      <IntegrationShowcase
        title="Connect your ~favorite~ tools."
        subtitle="MindHaven connects seamlessly with your existing HR and communication stack to provide frictionless mental health benefits."
        illustrationSrc="/Untitled design (3)/sporty-brain.svg"
        illustrationAlt="Connectivity illustration"
        integrations={[
          {
            name: "Gusto",
            description: "Sync payroll and employee benefits automatically.",
            iconSrc: "https://cdn.worldvectorlogo.com/logos/gusto-1.svg"
          },
          {
            name: "Rippling",
            description: "Automate onboarding and clinical access controls.",
            iconSrc: "https://www.vectorlogo.zone/logos/rippling/rippling-icon.svg"
          },
          {
            name: "ADP",
            description: "Enterprise-grade workforce management sync.",
            iconSrc: "https://www.vectorlogo.zone/logos/adp/adp-icon.svg"
          },
          {
            name: "Gmail / Workspace",
            description: "Direct alerts and session summaries via email.",
            iconSrc: "https://www.vectorlogo.zone/logos/google_gmail/google_gmail-icon.svg"
          }
        ]}
      />

      {/* Process section removed, replaced by DUAL PERSPECTIVE above */}

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
              <span className="ld-footer-brand">mindhaven</span>
              <p className="ld-footer-tagline">Welcome, tips directly to your inbox</p>
            </div>

            <div className="ld-footer-column ld-footer-links">
              <div>
                <strong>LINKS</strong>
                <button className="ld-footer-link" onClick={() => scrollTo('hero')}>About Us</button>
                <button className="ld-footer-link" onClick={() => scrollTo('hero')}>Services</button>
              </div>
              <div>
                <strong>LEGAL</strong>
                <button className="ld-footer-link">Privacy</button>
                <button className="ld-footer-link">Contact</button>
              </div>
            </div>
          </div>

          <div className="ld-footer-extra">
            <h1 className="footer-big-brand">mindhaven</h1>
          </div>
          
          <div className="ld-footer-bottom">
            <p>&copy; 2026 mindhaven. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
