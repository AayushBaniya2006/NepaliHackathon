import { motion, AnimatePresence } from 'framer-motion';
import './DoctorGuide.css';

const GUIDE_PHASES = {
  canvas: {
    doctor: 'Dr. Bloom',
    role: 'AI Expressive Therapist',
    message: "Hi! I'm here to help you express yourself. Once you finish your drawing, click 'Analyze & Proceed' or hold your hand open to move to step 2.",
    tips: [
      { icon: '✨', label: 'Analyze Drawing', desc: 'Click the glowing button when done' },
      { icon: '🖐️', label: 'Hand Submission', desc: 'Hold open hand for 1.5s to submit' },
      { icon: '☝️', label: 'Draw Mode', desc: 'Index finger up = draw' }
    ]
  },
  results: {
    doctor: 'Dr. Mercer',
    role: 'Clinical AI Director',
    message: "I've analyzed your neural patterns and drawing. Review your clinical summary and let me know if it captures how you feel.",
    tips: [
      { icon: '📝', label: 'Review Note', desc: 'Check the auto-generated SOAP note' },
      { icon: '⚖️', label: 'Parity Check', desc: 'Next we will verify your insurance rights' },
      { icon: '📥', label: 'Export PDF', desc: 'Download your clinical record' }
    ]
  },
  insurance: {
    doctor: 'Dr. Quinn',
    role: 'Insurance Advocacy Expert',
    message: "Let's secure your coverage. I'm using the Reclaimant database (15 years of precedents) to scan for parity violations. Appeals here win 60% of the time!",
    tips: [
      { icon: '🛡️', label: 'Parity Guard', desc: 'Auto-detects federal law violations' },
      { icon: '💰', label: 'Claim Recovery', desc: 'Secure up to $35,000 annually' },
      { icon: '📜', label: 'Win Rate', desc: 'Appeal citing parity increase success' }
    ]
  }
};

export default function DoctorGuide({ phase = 'canvas' }) {
  const guide = GUIDE_PHASES[phase];

  return (
    <motion.div 
      className="doctor-guide glass-dark"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 }}
    >
      <div className="guide-header">
        <div className="doctor-avatar">
          <div className="avatar-orb" />
          <span className="avatar-icon">🧑‍⚕️</span>
        </div>
        <div className="doctor-info">
          <h4>{guide.doctor}</h4>
          <span>{guide.role}</span>
        </div>
      </div>

      <p className="guide-message">"{guide.message}"</p>

      <div className="guide-tips">
        {guide.tips.map((tip, i) => (
          <div key={i} className="guide-tip">
            <span className="tip-icon">{tip.icon}</span>
            <div className="tip-text">
              <strong>{tip.label}</strong>
              <p>{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="guide-status">
        <span className="pulse-dot" />
        AI Guide Listening...
      </div>
    </motion.div>
  );
}
