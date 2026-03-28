import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import { DRAWING_PROMPTS, WEEKLY_GOAL } from '../utils/drawingPrompts';
import CareBoard from '../components/CareBoard';
import StressChart from '../components/StressChart';
import './Dashboard.css';

const MOOD_EMOJIS = [
  { emoji: '😊', label: 'Happy', color: 'var(--teal-500)' },
  { emoji: '😌', label: 'Calm', color: 'var(--sky-500)' },
  { emoji: '😤', label: 'Angry', color: 'var(--coral-500)' },
  { emoji: '😢', label: 'Sad', color: 'var(--violet-500)' },
  { emoji: '😰', label: 'Anxious', color: 'var(--rose-500)' },
  { emoji: '😶', label: 'Numb', color: 'var(--gray-400)' },
];

const PROMPT_STYLES = [
  { bg: 'linear-gradient(135deg, var(--coral-50), var(--coral-100))', border: 'var(--coral-200)', accent: 'var(--coral-500)', tag: 'badge-yellow' },
  { bg: 'linear-gradient(135deg, var(--rose-50), var(--rose-100))', border: 'var(--rose-200)', accent: 'var(--rose-500)', tag: 'badge-red' },
  { bg: 'linear-gradient(135deg, var(--sky-50), var(--sky-100))', border: 'var(--sky-100)', accent: 'var(--sky-500)', tag: 'badge-blue' },
  { bg: 'linear-gradient(135deg, var(--teal-50), var(--teal-100))', border: 'var(--teal-200)', accent: 'var(--teal-500)', tag: 'badge-green' },
  { bg: 'linear-gradient(135deg, var(--violet-50), var(--violet-100))', border: 'var(--violet-100)', accent: 'var(--violet-500)', tag: 'badge-violet' },
];

function ProgressRing({ current, total, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(current / total, 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="progress-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--gray-100)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="url(#teal-gradient)" strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16,1,0.3,1] }}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <defs>
          <linearGradient id="teal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--teal-400)" />
            <stop offset="100%" stopColor="var(--lime-500)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="progress-ring-inner">
        <span className="progress-ring-pct">{Math.round(pct * 100)}%</span>
        <span className="progress-ring-label">completed</span>
      </div>
    </div>
  );
}

const MOOD_STORAGE_KEY = 'mc_last_mood';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, sessions, getWeekNumber, getWeekSessions, getAverageStress } = useStorage();
  const [selectedMood, setSelectedMood] = useState(null);

  useEffect(() => {
    try {
      const last = sessionStorage.getItem(MOOD_STORAGE_KEY);
      if (last) setSelectedMood(last);
    } catch {
      /* ignore */
    }
  }, []);

  const weekNum = getWeekNumber();
  const weekSessions = getWeekSessions();
  const avgStress = getAverageStress();

  const recentByPrompt = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      if (!map[s.promptId] || new Date(s.timestamp) > new Date(map[s.promptId].timestamp)) map[s.promptId] = s;
    });
    return map;
  }, [sessions]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="container">
          <div className="dash-header-inner">
            <div className="dash-brand" onClick={() => navigate('/')}>
              <span className="brand-icon">🧠</span>
              <span className="brand-text">MindCanvas</span>
            </div>
          </div>
        </div>
      </header>

      <main className="dash-body">
        <div className="container">
          {/* Hero greeting */}
          <motion.section className="dash-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="hero-left">
              <h1>{greeting}, {profile?.name || 'there'} 👋</h1>
              <p>How are you feeling today? Track your mood and start a drawing session.</p>
              <div className="mood-row">
                {MOOD_EMOJIS.map((m, i) => (
                  <motion.button
                    key={m.label}
                    type="button"
                    className={`mood-btn${selectedMood === m.label ? ' mood-btn-selected' : ''}`}
                    title={`${m.label} — start drawing`}
                    aria-pressed={selectedMood === m.label}
                    whileHover={{ scale: 1.15, y: -3 }}
                    whileTap={{ scale: 0.92 }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.06, type: 'spring' }}
                    onClick={() => {
                      setSelectedMood(m.label);
                      try {
                        sessionStorage.setItem(MOOD_STORAGE_KEY, m.label);
                      } catch {
                        /* ignore */
                      }
                      navigate('/draw', {
                        state: { promptId: 'energy', preSessionMood: m.label },
                      });
                    }}
                  >
                    <span className="mood-face">{m.emoji}</span>
                    <span className="mood-name">{m.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Stat cards row */}
          <motion.section className="dash-stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="stat-card stat-card-progress">
              <div className="sc-header">
                <h3>Your progress</h3>
                <span className="badge badge-green">Week {weekNum}</span>
              </div>
              <ProgressRing current={weekSessions.length} total={WEEKLY_GOAL} />
              <p className="sc-detail">{weekSessions.length} of {WEEKLY_GOAL} drawings this week</p>
            </div>

            <div className="stat-card stat-card-stress">
              <div className="sc-header">
                <h3>Avg. Stress</h3>
                <span className={`badge ${avgStress >= 7 ? 'badge-red' : avgStress >= 5 ? 'badge-yellow' : 'badge-green'}`}>
                  {avgStress >= 7 ? 'High' : avgStress >= 5 ? 'Moderate' : 'Low'}
                </span>
              </div>
              <div className="stress-display">
                <span className="stress-num" style={{ color: avgStress >= 7 ? 'var(--error)' : avgStress >= 5 ? 'var(--warning)' : 'var(--success)' }}>
                  {avgStress > 0 ? avgStress.toFixed(1) : '—'}
                </span>
                <span className="stress-max">/10</span>
              </div>
              <p className="sc-detail">{sessions.length} total sessions recorded</p>
            </div>

            <div className="stat-card stat-card-streak">
              <div className="sc-header">
                <h3>Total Sessions</h3>
                <span className="badge badge-blue">All time</span>
              </div>
              <div className="streak-num">{sessions.length}</div>
              <p className="sc-detail">Keep going — consistency builds evidence</p>
            </div>
          </motion.section>

          {/* Stress Trajectory Chart */}
          {sessions.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <StressChart sessions={sessions} />
            </motion.section>
          )}

          {/* Drawing Prompts */}
          <motion.section className="dash-prompts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="section-head">
              <h2>Today's Drawing Prompts</h2>
              <p>Tap to start. Point your finger at the webcam to draw.</p>
            </div>

            <div className="prompts-grid">
              {DRAWING_PROMPTS.map((prompt, i) => {
                const recent = recentByPrompt[prompt.id];
                const done = recent && new Date(recent.timestamp).toDateString() === new Date().toDateString();
                const style = PROMPT_STYLES[i % PROMPT_STYLES.length];
                return (
                  <motion.button
                    key={prompt.id}
                    className={`prompt-card ${done ? 'prompt-done' : ''}`}
                    style={{ '--pc-bg': style.bg, '--pc-border': style.border, '--pc-accent': style.accent }}
                    onClick={() => navigate('/draw', { state: { promptId: prompt.id } })}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    whileHover={{ y: -5, boxShadow: '0 12px 28px rgba(0,0,0,0.1)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {done && <span className="done-chip">✓ Done</span>}
                    <span className="pc-icon">{prompt.icon}</span>
                    <h3 className="pc-title">{prompt.title}</h3>
                    <p className="pc-desc">{prompt.description}</p>
                    <span className="pc-arrow">→</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>

          {/* Care Board */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <CareBoard />
          </motion.section>

          {/* Recent sessions */}
          {sessions.length > 0 && (
            <motion.section className="dash-recent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2>Recent Sessions</h2>
              <div className="recent-list">
                {sessions.slice(-5).reverse().map((session) => {
                  const prompt = DRAWING_PROMPTS.find(p => p.id === session.promptId);
                  const si = DRAWING_PROMPTS.findIndex(p => p.id === session.promptId);
                  const style = PROMPT_STYLES[si % PROMPT_STYLES.length];
                  return (
                    <div key={session.id} className="recent-row">
                      <div className="recent-thumb" style={{ background: style?.bg || 'var(--gray-100)' }}>
                        {session.imageUrl ? <img src={session.imageUrl} alt="" /> : <span>{prompt?.icon || '🎨'}</span>}
                      </div>
                      <div className="recent-info">
                        <h4>{prompt?.title || 'Drawing'}</h4>
                        <span className="recent-date">
                          {new Date(session.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <span className={`score-pill ${(session.stressScore||0) >= 7 ? 'score-high' : (session.stressScore||0) >= 5 ? 'score-mid' : 'score-low'}`}>
                        {session.stressScore?.toFixed(1) || '—'}/10
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {weekSessions.length < WEEKLY_GOAL && (
            <motion.div className="dash-nudge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <span className="nudge-icon">⚡</span>
              <p><strong>Missed a drawing?</strong> A 2-minute mood check builds your clinical evidence. <button className="link-btn" onClick={() => navigate('/draw', { state: { promptId: 'energy' } })}>Quick draw now →</button></p>
            </motion.div>
          )}

          {/* Footer links */}
          <motion.div className="dash-footer-links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
            <button className="dash-footer-btn" onClick={() => navigate('/find-doctor')}>
              🌍 Find a Doctor
            </button>
            <button className="dash-footer-btn" onClick={() => navigate('/resources')}>
              💊 Free Care Resources
            </button>
            <a className="dash-footer-btn" href="tel:988">
              📞 Crisis Line: 988
            </a>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
