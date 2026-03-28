import { motion, AnimatePresence } from 'framer-motion';
import './GestureIndicator.css';

const GESTURE_MAP = {
  none: { label: 'Show your hand', sub: 'Position hand in frame', dot: 'var(--gray-400)' },
  index_up: { label: 'Drawing', sub: 'Move finger to draw', dot: 'var(--teal-500)' },
  pinch: { label: 'Erasing', sub: 'Pinch thumb + index', dot: 'var(--coral-500)' },
  open_hand: { label: 'Hold to submit...', sub: 'Keep all 5 fingers open 1.5s', dot: 'var(--lime-500)' },
  speak: { label: 'Processing...', sub: 'Interpreting your drawing', dot: 'var(--sky-500)' },
  fist_hold: { label: 'Hold to clear...', sub: 'Keep fist closed 2s', dot: 'var(--rose-500)' },
  fist: { label: 'Canvas cleared', sub: 'Open hand to start again', dot: 'var(--rose-500)' },
  fingers_2: { label: 'Stamp placed', sub: '2 fingers = Person', dot: 'var(--violet-500)' },
  fingers_3: { label: 'Stamp placed', sub: '3 fingers = Tree', dot: 'var(--violet-400)' },
  fingers_4: { label: 'Stamp placed', sub: '4 fingers = Heart', dot: 'var(--sky-500)' },
  other: { label: 'Adjusting...', sub: '', dot: 'var(--gray-400)' },
};

export default function GestureIndicator({ gesture = 'none', isProcessing = false, inline = false, stampName = '' }) {
  const current = isProcessing
    ? GESTURE_MAP.speak
    : (GESTURE_MAP[gesture] || GESTURE_MAP.none);

  const displayLabel = ['fingers_2', 'fingers_3', 'fingers_4'].includes(gesture) && stampName
    ? `Placed: ${stampName}` : current.label;

  return (
    <motion.div
      className={`gesture-indicator ${inline ? 'gesture-inline' : 'glass'}`}
      initial={{ opacity: 0, y: inline ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={gesture + isProcessing + stampName}
          className="gesture-content"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.25 }}
        >
          <span className="gesture-dot" style={{ background: current.dot }} />
          <div className="gesture-text">
            <span className="gesture-label">{displayLabel}</span>
            {current.sub && <span className="gesture-sub">{current.sub}</span>}
          </div>
        </motion.div>
      </AnimatePresence>
      {(gesture === 'open_hand' && !isProcessing) && (
        <div className="hold-progress">
          <motion.div className="hold-bar"
            initial={{ width: '0%' }} animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'linear' }} />
        </div>
      )}
      {(gesture === 'fist_hold' && !isProcessing) && (
        <div className="hold-progress">
          <motion.div className="hold-bar hold-bar-danger"
            initial={{ width: '0%' }} animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'linear' }} />
        </div>
      )}
    </motion.div>
  );
}
