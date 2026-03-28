import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import './Landing.css';

const EMPLOYER_STATS = [
  { value: '$500B', label: 'Lost annually to untreated mental health in the US', icon: '💸' },
  { value: '25M', label: 'Limited English workers with no mental health access', icon: '🌍' },
  { value: '$2', label: 'Per employee per month — less than a coffee', icon: '☕' },
];

const EMPLOYER_STEPS = [
  { icon: '🏢', title: 'Connect via Gusto or Rippling', desc: 'One click inside your existing HR benefits dashboard.' },
  { icon: '🌐', title: 'Language auto-detected', desc: "Employee's language and insurance is pre-filled — zero friction." },
  { icon: '🎨', title: 'Employee draws, AI interprets', desc: 'No words needed. 5-minute sessions generate clinical records.' },
  { icon: '⚖️', title: 'Claims handled automatically', desc: 'Reclaimant fights insurance denials. You get a healthier team.' },
];

const STATS = [
  { value: '10M+', label: 'Nonverbal Americans underdiagnosed', icon: '🧠' },
  { value: '2×', label: 'Higher depression in disabled adults', icon: '📊' },
  { value: '60%', label: 'Appeal win rate with evidence', icon: '⚖️' },
  { value: '0 words', label: 'Needed — just webcam gestures', icon: '📷' },
];

const STEPS = [
  { num: 1, title: 'Gesture Draw', desc: 'Point your finger at the webcam to draw. No mouse, no keyboard needed.', icon: '☝️' },
  { num: 2, title: 'AI Analysis', desc: 'AI detects clinical stress patterns and scores emotional state in real-time.', icon: '🔬' },
  { num: 3, title: 'EHR Export', desc: 'Auto-generate FHIR-compliant clinical reports for any provider.', icon: '📋' },
  { num: 4, title: 'Reclaimant', desc: 'Auto-appeal denied claims using 15 years of legal precedents.', icon: '⚖️' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isOnboarded, profile } = useStorage();
  const [hoveredRole, setHoveredRole] = useState(null);
  const [partnerToast, setPartnerToast] = useState(false);

  function handlePartner() {
    setPartnerToast(true);
    setTimeout(() => setPartnerToast(false), 3500);
  }

  const handleRoleSelect = (role) => {
    if (isOnboarded() && profile) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding', { state: { role } });
    }
  };

  const handleReturningUser = () => {
    if (isOnboarded()) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>

        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="hero-badge-dot" />
            Mental Health Accessibility Hackathon
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Draw Your Feelings,
            <br />
            <span className="hero-title-accent">Get Help That Works</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Point your finger at the webcam to draw. Sign language to speak.
            No words needed — just gestures that become clinical evidence.
          </motion.p>

          <motion.div
            className="role-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <p className="role-prompt">I am...</p>
            <div className="role-buttons">
              <button
                className={`role-card ${hoveredRole === 'patient' ? 'role-card-active' : ''}`}
                onClick={() => handleRoleSelect('patient')}
                onMouseEnter={() => setHoveredRole('patient')}
                onMouseLeave={() => setHoveredRole(null)}
              >
                <span className="role-icon">✋</span>
                <span className="role-label">The Patient</span>
                <span className="role-desc">I want to express myself through drawing</span>
              </button>

              <button
                className={`role-card ${hoveredRole === 'caregiver' ? 'role-card-active' : ''}`}
                onClick={() => handleRoleSelect('caregiver')}
                onMouseEnter={() => setHoveredRole('caregiver')}
                onMouseLeave={() => setHoveredRole(null)}
              >
                <span className="role-icon">🛡️</span>
                <span className="role-label">A Caregiver</span>
                <span className="role-desc">I'm helping someone who can't reliably speak</span>
              </button>
            </div>
          </motion.div>

          {isOnboarded() && (
            <motion.button
              className="btn btn-outline returning-btn"
              onClick={handleReturningUser}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Welcome back — Go to Dashboard
            </motion.button>
          )}
        </div>
      </section>

      <motion.section
        className="stats-bar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="container">
          <div className="stats-grid">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                className="stat-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
              >
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="how-section">
        <div className="container">
          <motion.h2
            className="section-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            From First Drawing to Insurance Payout
          </motion.h2>
          <p className="section-subheading">
            A complete clinical pipeline that turns 5-minute sessions into undeniable evidence.
          </p>

          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                className="step-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="step-num">{step.num}</div>
                <span className="step-icon">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="clinician-cta">
        <div className="container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="cta-content">
              <h2>Are you a clinician?</h2>
              <p>
                Reviews, SOAP notes, insurance workflows, and claims run in the separate{' '}
                <strong>VoiceCanvas Clinic</strong> (doctor) application — not in this patient app.
              </p>
            </div>
            <div className="cta-stats">
              <div className="cta-stat">
                <span className="cta-stat-value">$35k</span>
                <span className="cta-stat-label">Avg. annual recovery per practice</span>
              </div>
              <div className="cta-stat">
                <span className="cta-stat-value">60%</span>
                <span className="cta-stat-label">Auto-appeal win rate</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Employer / PEO section */}
      <section className="employer-section" id="employers">
        <div className="container">
          <motion.div
            className="employer-inner"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="employer-header">
              <span className="employer-badge">For Employers</span>
              <h2>Offer mental health care your employees can actually use</h2>
              <p>
                1 in 4 of your employees has never accessed mental health care — not because they don't need it,
                but because they can't articulate their symptoms. VoiceCanvas removes that barrier.
              </p>
            </div>

            <div className="employer-stats">
              {EMPLOYER_STATS.map((s, i) => (
                <motion.div
                  key={i}
                  className="employer-stat"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="employer-stat-icon">{s.icon}</span>
                  <span className="employer-stat-value">{s.value}</span>
                  <span className="employer-stat-label">{s.label}</span>
                </motion.div>
              ))}
            </div>

            <div className="employer-steps">
              {EMPLOYER_STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  className="employer-step"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <span className="employer-step-icon">{step.icon}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button className="employer-cta-btn" onClick={handlePartner}>
              Partner with us →
            </button>

            {partnerToast && (
              <motion.div
                className="employer-toast"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                🎉 We'll be in touch! Thank you for your interest.
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>
          Demo only — Not a medical device. Not HIPAA compliant. Built for hackathon demonstration.
        </p>
      </footer>
    </div>
  );
}
