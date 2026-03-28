import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import { DRAWING_PROMPTS } from '../utils/drawingPrompts';
import DrawingSession from './DrawingSession';
import './AppExperience.css';

const MOOD_EMOJIS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😤', label: 'Angry' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😶', label: 'Numb' },
];

const PROMPT_COLORS = [
  { bg: '#FFF0E6', border: '#E8A87C' },
  { bg: '#FDE8E7', border: '#D9706C' },
  { bg: '#EDF1F7', border: '#A8B5C8' },
  { bg: '#E8F5EE', border: '#5BA88C' },
  { bg: '#F0ECF8', border: '#9B8EC4' },
];

export default function AppExperience() {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const { profile, getRecentSessions } = useStorage();
  const navigate = useNavigate();
  const recentSessions = getRecentSessions(3);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (selectedPrompt) {
    return <DrawingSession promptOverride={selectedPrompt} />;
  }

  return (
    <div className="app-experience">
      <div className="app-container">
        <motion.div
          className="app-greeting"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="app-greeting-title">
            {greeting}{profile?.name ? `, ${profile.name}` : ''}
          </h1>
          <p className="app-greeting-sub">How are you feeling today?</p>
        </motion.div>

        <motion.div
          className="app-moods"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          {MOOD_EMOJIS.map((mood) => (
            <button key={mood.label} className="app-mood-btn">
              <span className="app-mood-face">{mood.emoji}</span>
              <span className="app-mood-label">{mood.label}</span>
            </button>
          ))}
        </motion.div>

        <motion.div
          className="app-section"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="app-section-title">Choose a prompt to begin</h2>
          <p className="app-section-sub">Each session takes about 2 minutes.</p>
        </motion.div>

        <div className="app-prompts-grid">
          {DRAWING_PROMPTS.map((prompt, i) => {
            const colors = PROMPT_COLORS[i % PROMPT_COLORS.length];
            return (
              <motion.button
                key={prompt.id}
                className="app-prompt-card"
                style={{
                  background: colors.bg,
                  borderColor: colors.border,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.4 }}
                onClick={() => setSelectedPrompt(prompt)}
                whileHover={{ scale: 1.015 }}
              >
                <span className="app-prompt-icon">{prompt.icon}</span>
                <span className="app-prompt-title">{prompt.title}</span>
                <span className="app-prompt-desc">{prompt.description}</span>
              </motion.button>
            );
          })}
        </div>

        {recentSessions.length > 0 && (
          <motion.div
            className="app-recent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <h3 className="app-recent-title">Recent sessions</h3>
            <div className="app-recent-list">
              {recentSessions.map((session) => (
                <div key={session.id} className="app-recent-item">
                  <div className="app-recent-thumb" style={{ background: PROMPT_COLORS[0].bg }}>
                    {session.imageUrl ? (
                      <img src={session.imageUrl} alt="" />
                    ) : (
                      <span>🎨</span>
                    )}
                  </div>
                  <div className="app-recent-info">
                    <span className="app-recent-prompt">{session.promptId}</span>
                    <span className="app-recent-date">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {session.stressScore != null && (
                    <span className={`app-recent-score ${
                      session.stressScore >= 7 ? 'score-high' :
                      session.stressScore >= 4 ? 'score-mid' : 'score-low'
                    }`}>
                      {session.stressScore.toFixed(1)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
