import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BrainActivity.css';

const BRAIN_REGIONS = [
  {
    id: 'prefrontal',
    name: 'Prefrontal Cortex',
    role: 'Decision Making & Planning',
    desc: 'Active when choosing colors, planning composition',
    x: 28, y: 22,
    baseActivity: 0.3,
  },
  {
    id: 'motor',
    name: 'Motor Cortex',
    role: 'Hand Movement Control',
    desc: 'Drives finger gestures for drawing',
    x: 42, y: 14,
    baseActivity: 0.2,
  },
  {
    id: 'parietal',
    name: 'Parietal Lobe',
    role: 'Spatial Awareness',
    desc: 'Processes where to place lines on canvas',
    x: 58, y: 18,
    baseActivity: 0.25,
  },
  {
    id: 'temporal',
    name: 'Temporal Lobe',
    role: 'Memory & Emotion',
    desc: 'Retrieves emotional memories while drawing',
    x: 32, y: 60,
    baseActivity: 0.35,
  },
  {
    id: 'occipital',
    name: 'Visual Cortex',
    role: 'Visual Processing',
    desc: 'Processes what you see on the canvas',
    x: 72, y: 38,
    baseActivity: 0.4,
  },
  {
    id: 'amygdala',
    name: 'Amygdala',
    role: 'Emotional Response',
    desc: 'Emotional reactions during self-expression',
    x: 45, y: 55,
    baseActivity: 0.45,
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    role: 'Fine Motor Coordination',
    desc: 'Coordinates precise hand movements',
    x: 75, y: 62,
    baseActivity: 0.2,
  },
];

function getActivityColor(level) {
  if (level > 0.8) return 'var(--coral-500)';
  if (level > 0.6) return 'var(--coral-400)';
  if (level > 0.4) return 'var(--teal-400)';
  if (level > 0.2) return 'var(--teal-300)';
  return 'var(--gray-300)';
}

function getActivityLabel(level) {
  if (level > 0.8) return 'Very High';
  if (level > 0.6) return 'High';
  if (level > 0.4) return 'Moderate';
  if (level > 0.2) return 'Low';
  return 'Minimal';
}

export default function BrainActivity({ gesture = 'none', mode = 'draw', isDrawing = false }) {
  const [activities, setActivities] = useState(() =>
    BRAIN_REGIONS.reduce((acc, r) => ({ ...acc, [r.id]: r.baseActivity }), {})
  );
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const boosts = {};

    if (gesture === 'index_up' || isDrawing) {
      boosts.motor = 0.85;
      boosts.prefrontal = 0.7;
      boosts.parietal = 0.75;
      boosts.occipital = 0.65;
      boosts.cerebellum = 0.8;
      boosts.amygdala = 0.55;
      boosts.temporal = 0.5;
    } else if (gesture === 'pinch') {
      boosts.motor = 0.7;
      boosts.prefrontal = 0.6;
      boosts.cerebellum = 0.65;
      boosts.parietal = 0.5;
    } else if (['fingers_2', 'fingers_3', 'fingers_4'].includes(gesture)) {
      boosts.prefrontal = 0.8;
      boosts.motor = 0.7;
      boosts.parietal = 0.7;
      boosts.occipital = 0.6;
      boosts.temporal = 0.5;
    } else if (gesture === 'fist') {
      boosts.prefrontal = 0.8;
      boosts.amygdala = 0.7;
      boosts.motor = 0.5;
    } else if (gesture === 'speak' || mode === 'sign') {
      boosts.temporal = 0.85;
      boosts.amygdala = 0.75;
      boosts.prefrontal = 0.65;
      boosts.motor = 0.6;
    }

    setActivities(prev => {
      const next = {};
      BRAIN_REGIONS.forEach(r => {
        const target = boosts[r.id] || r.baseActivity;
        const noise = (Math.random() - 0.5) * 0.08;
        next[r.id] = Math.min(1, Math.max(0, prev[r.id] + (target - prev[r.id]) * 0.3 + noise));
      });
      return next;
    });
    setPulseKey(k => k + 1);
  }, [gesture, mode, isDrawing]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev => {
        const next = {};
        BRAIN_REGIONS.forEach(r => {
          const noise = (Math.random() - 0.5) * 0.06;
          next[r.id] = Math.min(1, Math.max(0.05, prev[r.id] + noise));
        });
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const dominantRegion = useMemo(() => {
    let max = 0, id = '';
    Object.entries(activities).forEach(([k, v]) => { if (v > max) { max = v; id = k; } });
    return BRAIN_REGIONS.find(r => r.id === id);
  }, [activities]);

  return (
    <div className="brain-panel">
      <div className="brain-panel-header">
        <div className="brain-title-row">
          <span className="brain-dot-icon" />
          <h3>Brain Activity</h3>
        </div>
        <span className="brain-badge badge badge-green">Live</span>
      </div>

      <div className="brain-viz">
        <svg viewBox="0 0 100 80" className="brain-svg">
          <defs>
            {BRAIN_REGIONS.map(r => (
              <radialGradient key={r.id} id={`glow-${r.id}`}>
                <stop offset="0%" stopColor={getActivityColor(activities[r.id])} stopOpacity={activities[r.id]} />
                <stop offset="100%" stopColor={getActivityColor(activities[r.id])} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* Brain outline */}
          <path
            d="M50 5 C25 5 8 20 8 40 C8 55 15 65 25 70 C30 73 40 76 50 76 C60 76 70 73 75 70 C85 65 92 55 92 40 C92 20 75 5 50 5Z"
            fill="none" stroke="var(--gray-200)" strokeWidth="1.5"
            className="brain-outline"
          />
          <path
            d="M50 5 C50 5 48 25 50 40 C52 55 50 76 50 76"
            fill="none" stroke="var(--gray-200)" strokeWidth="0.8" strokeDasharray="3 3"
          />
          <path
            d="M15 35 C25 30 35 28 50 30 C65 28 75 30 85 35"
            fill="none" stroke="var(--gray-200)" strokeWidth="0.8" strokeDasharray="3 3"
          />

          {/* Activity regions */}
          {BRAIN_REGIONS.map(r => (
            <g key={r.id}>
              <motion.circle
                cx={r.x} cy={r.y}
                r={10 + activities[r.id] * 8}
                fill={`url(#glow-${r.id})`}
                animate={{ r: 10 + activities[r.id] * 8 }}
                transition={{ duration: 0.8 }}
              />
              <circle
                cx={r.x} cy={r.y} r={4}
                fill={getActivityColor(activities[r.id])}
                opacity={0.5 + activities[r.id] * 0.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredRegion(r.id)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              <motion.circle
                cx={r.x} cy={r.y} r={4}
                fill="transparent"
                stroke={getActivityColor(activities[r.id])}
                strokeWidth={0.8}
                animate={{ r: [4, 6 + activities[r.id] * 3, 4], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </g>
          ))}
        </svg>

        <AnimatePresence>
          {hoveredRegion && (() => {
            const r = BRAIN_REGIONS.find(reg => reg.id === hoveredRegion);
            return (
              <motion.div
                className="brain-tooltip"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
              >
                <strong>{r.name}</strong>
                <span className="bt-role">{r.role}</span>
                <div className="bt-bar-wrap">
                  <div className="bt-bar" style={{ width: `${activities[r.id] * 100}%`, background: getActivityColor(activities[r.id]) }} />
                </div>
                <span className="bt-level">{getActivityLabel(activities[r.id])}</span>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Region list */}
      <div className="brain-regions-list">
        {BRAIN_REGIONS.map(r => (
          <div
            key={r.id}
            className={`brain-region-row ${hoveredRegion === r.id ? 'region-hovered' : ''}`}
            onMouseEnter={() => setHoveredRegion(r.id)}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <div className="br-dot" style={{ background: getActivityColor(activities[r.id]) }} />
            <div className="br-info">
              <span className="br-name">{r.name}</span>
              <span className="br-role">{r.role}</span>
            </div>
            <div className="br-bar-wrap">
              <motion.div
                className="br-bar"
                style={{ background: getActivityColor(activities[r.id]) }}
                animate={{ width: `${activities[r.id] * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <span className="br-pct">{Math.round(activities[r.id] * 100)}%</span>
          </div>
        ))}
      </div>

      {dominantRegion && (
        <div className="brain-dominant">
          <span className="bd-label">Most Active</span>
          <span className="bd-name">{dominantRegion.name}</span>
          <span className="bd-desc">{dominantRegion.desc}</span>
        </div>
      )}
    </div>
  );
}
