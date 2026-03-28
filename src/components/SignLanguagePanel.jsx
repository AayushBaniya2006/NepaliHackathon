import { motion, AnimatePresence } from 'framer-motion';
import './SignLanguagePanel.css';

export default function SignLanguagePanel({
  recognizedWords,
  currentSign,
  isRecognizing,
  onRemoveWord,
  onClearAll,
  onSendMessage,
  hasWords,
  embedded = false,
}) {
  return (
    <motion.div
      className={`sign-panel ${embedded ? 'sign-panel-embedded' : 'glass'}`}
      initial={{ opacity: 0, x: embedded ? 20 : 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: embedded ? 20 : 300 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="sign-panel-header">
        <h3>🤟 Sign Language</h3>
        <span className="sign-status">
          {isRecognizing ? (
            <span className="sign-active">
              <span className="sign-dot pulse" /> Recognizing...
            </span>
          ) : (
            <span className="sign-idle">Paused</span>
          )}
        </span>
      </div>

      {/* Current detection */}
      <AnimatePresence mode="wait">
        {currentSign && (
          <motion.div
            key={currentSign.sign}
            className="current-sign"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="current-sign-word">{currentSign.sign}</span>
            <span className={`current-sign-confidence ${currentSign.confidence}`}>
              {currentSign.confidence}
            </span>
            <p className="current-sign-desc">{currentSign.description}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accumulated words */}
      <div className="sign-words-container">
        <div className="sign-words-label">
          <span>Signed message:</span>
          {hasWords && (
            <button className="clear-words-btn" onClick={onClearAll}>
              ✕ Clear all
            </button>
          )}
        </div>
        <div className="sign-words">
          {recognizedWords.length === 0 ? (
            <p className="sign-placeholder">
              Start signing — your words will appear here...
            </p>
          ) : (
            <AnimatePresence>
              {recognizedWords.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  className="sign-word-chip"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {word}
                  <button
                    className="remove-word"
                    onClick={() => onRemoveWord(i)}
                    title="Remove word"
                  >
                    ×
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Send button */}
      {hasWords && (
        <motion.button
          className="btn btn-primary sign-send-btn"
          onClick={onSendMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          🗣️ Speak My Message
        </motion.button>
      )}

      {/* Instructions */}
      <div className="sign-instructions">
        <p>📌 Sign at the camera, words accumulate above</p>
        <p>🗣️ When ready, press "Speak My Message"</p>
        <p>🩺 Your message → voice → clinical note → doctor</p>
      </div>
    </motion.div>
  );
}
