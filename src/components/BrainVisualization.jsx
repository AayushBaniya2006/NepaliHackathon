import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BrainVisualization.css';

/**
 * Brain regions and their roles in mental health / communication
 */
const BRAIN_REGIONS = {
  prefrontal: {
    label: 'Prefrontal Cortex',
    role: 'Decision-making, planning, emotional regulation',
    emoji: '🧠',
    // SVG path for the frontal area
    path: 'M 95 65 Q 85 35, 115 25 Q 145 15, 175 25 Q 205 35, 195 65 Q 185 55, 145 50 Q 105 55, 95 65 Z',
    cx: 145, cy: 45,
  },
  motor: {
    label: 'Motor Cortex',
    role: 'Hand movement, drawing, fine motor control',
    emoji: '✋',
    path: 'M 85 70 Q 75 55, 95 50 Q 105 48, 115 50 Q 120 55, 115 70 Q 100 65, 85 70 Z',
    cx: 100, cy: 58,
  },
  broca: {
    label: "Broca's Area",
    role: 'Speech production, language processing',
    emoji: '🗣️',
    path: 'M 75 85 Q 65 70, 80 65 Q 90 62, 95 70 Q 95 80, 85 88 Q 78 90, 75 85 Z',
    cx: 82, cy: 76,
  },
  temporal: {
    label: 'Temporal Lobe',
    role: 'Hearing, language comprehension, memory',
    emoji: '👂',
    path: 'M 60 105 Q 50 90, 65 80 Q 75 75, 80 85 Q 82 95, 75 108 Q 68 115, 60 105 Z',
    cx: 68, cy: 95,
  },
  limbic: {
    label: 'Limbic System',
    role: 'Emotions, fear, anxiety, mood regulation',
    emoji: '💙',
    path: 'M 120 90 Q 110 75, 130 70 Q 150 65, 170 70 Q 185 78, 175 90 Q 165 100, 145 105 Q 125 100, 120 90 Z',
    cx: 145, cy: 85,
  },
  visual: {
    label: 'Visual Cortex',
    role: 'Visual processing, color and pattern recognition',
    emoji: '👁️',
    path: 'M 195 100 Q 210 85, 220 95 Q 230 105, 225 120 Q 218 130, 205 125 Q 195 115, 195 100 Z',
    cx: 212, cy: 108,
  },
  amygdala: {
    label: 'Amygdala',
    role: 'Fear response, threat detection, emotional memory',
    emoji: '⚡',
    path: 'M 138 95 Q 133 88, 140 85 Q 148 83, 153 88 Q 155 95, 148 100 Q 140 102, 138 95 Z',
    cx: 145, cy: 93,
  },
};

/**
 * Maps user activity to which brain regions should glow
 */
const ACTIVITY_MAP = {
  idle: [],
  drawing: ['motor', 'visual', 'prefrontal'],
  signing: ['motor', 'broca', 'visual', 'prefrontal'],
  speaking: ['broca', 'temporal', 'prefrontal'],
  processing: ['prefrontal', 'limbic', 'temporal'],
  emotional: ['limbic', 'amygdala', 'prefrontal'],
  listening: ['temporal', 'broca', 'limbic'],
};

/**
 * Maps detected emotions to brain regions
 */
const EMOTION_GLOW_MAP = {
  anxiety: ['amygdala', 'limbic', 'prefrontal'],
  sadness: ['limbic', 'prefrontal', 'temporal'],
  anger: ['amygdala', 'limbic', 'motor'],
  fear: ['amygdala', 'limbic'],
  calm: ['prefrontal', 'limbic'],
  joy: ['limbic', 'prefrontal', 'motor'],
};

const REGION_COLORS = {
  prefrontal: '#4ecdc4',
  motor: '#f5a623',
  broca: '#e88d97',
  temporal: '#b8a9c9',
  limbic: '#4ecdc4',
  visual: '#a8c5a0',
  amygdala: '#f5a623',
};

export default function BrainVisualization({
  activity = 'idle',
  emotion = null,
  isVisible = true,
  compact = false,
}) {
  const activeRegions = useMemo(() => {
    const fromActivity = ACTIVITY_MAP[activity] || [];
    const fromEmotion = emotion ? (EMOTION_GLOW_MAP[emotion] || []) : [];
    return [...new Set([...fromActivity, ...fromEmotion])];
  }, [activity, emotion]);

  if (!isVisible) return null;

  return (
    <motion.div
      className={`brain-viz ${compact ? 'brain-compact' : ''}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <div className="brain-header">
        <span className="brain-title">🧠 Neural Activity</span>
        {activity !== 'idle' && (
          <span className="brain-activity-badge">
            <span className="brain-pulse" />
            {activity}
          </span>
        )}
      </div>

      <div className="brain-svg-container">
        <svg
          viewBox="40 10 200 160"
          className="brain-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Brain outline */}
          <path
            d="M 60 120 Q 45 95, 55 70 Q 65 45, 90 30 Q 115 15, 145 20 Q 175 15, 200 30 Q 225 45, 235 70 Q 245 95, 230 120 Q 220 140, 200 148 Q 170 158, 145 155 Q 120 158, 90 148 Q 70 140, 60 120 Z"
            className="brain-outline"
          />

          {/* Brain stem */}
          <path
            d="M 135 148 Q 130 165, 135 175 Q 140 175, 145 165 Q 155 165, 155 175 Q 160 175, 158 148"
            className="brain-stem"
          />

          {/* Cerebellum hint */}
          <ellipse cx="147" cy="140" rx="25" ry="12" className="brain-cerebellum" />

          {/* Brain folds/sulci lines */}
          <path d="M 95 60 Q 120 55, 145 58 Q 170 55, 195 60" className="brain-fold" />
          <path d="M 85 80 Q 110 75, 135 78 Q 160 75, 185 82" className="brain-fold" />
          <path d="M 80 100 Q 105 95, 130 98 Q 155 95, 180 100" className="brain-fold" />
          <path d="M 90 115 Q 115 112, 140 115 Q 165 112, 190 118" className="brain-fold" />

          {/* Active region glows */}
          <AnimatePresence>
            {Object.entries(BRAIN_REGIONS).map(([key, region]) => {
              const isActive = activeRegions.includes(key);
              const color = REGION_COLORS[key];

              return (
                <g key={key}>
                  {/* Always show subtle base */}
                  <path
                    d={region.path}
                    fill={color}
                    opacity={0.08}
                    className="brain-region-base"
                  />

                  {/* Active glow */}
                  {isActive && (
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {/* Outer glow */}
                      <motion.path
                        d={region.path}
                        fill={color}
                        animate={{ opacity: [0.15, 0.35, 0.15] }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        filter="url(#glow)"
                      />
                      {/* Inner bright */}
                      <motion.path
                        d={region.path}
                        fill={color}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 0.3,
                        }}
                      />
                      {/* Center hotspot */}
                      <motion.circle
                        cx={region.cx}
                        cy={region.cy}
                        r={4}
                        fill="white"
                        animate={{
                          opacity: [0.4, 0.8, 0.4],
                          r: [3, 5, 3],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    </motion.g>
                  )}
                </g>
              );
            })}
          </AnimatePresence>

          {/* SVG filter for glow effect */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Active regions legend */}
      {!compact && activeRegions.length > 0 && (
        <motion.div
          className="brain-legend"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {activeRegions.map((key) => {
            const region = BRAIN_REGIONS[key];
            const color = REGION_COLORS[key];
            return (
              <motion.div
                key={key}
                className="brain-legend-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="legend-dot" style={{ background: color }} />
                <div className="legend-text">
                  <span className="legend-name">
                    {region.emoji} {region.label}
                  </span>
                  <span className="legend-role">{region.role}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
