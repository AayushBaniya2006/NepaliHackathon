import { motion } from 'framer-motion';
import './VoicePlayer.css';

export default function VoicePlayer({
  isPlaying,
  loading,
  onReplay,
  onStop,
  voices,
  selectedVoice,
  onSelectVoice,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
}) {
  return (
    <div className="voice-player glass">
      <div className="voice-player-header">
        <div className="voice-visual">
          {isPlaying && (
            <div className="ripple-container">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="ripple-ring"
                  animate={{
                    scale: [1, 2.5],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: 'easeOut',
                  }}
                />
              ))}
              <div className="ripple-core" />
            </div>
          )}
          {loading && (
            <motion.div
              className="voice-loading"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              ⟳
            </motion.div>
          )}
        </div>

        <div className="voice-controls">
          <button
            className="btn btn-sm btn-secondary"
            onClick={isPlaying ? onStop : onReplay}
            disabled={loading}
          >
            {isPlaying ? '⏸ Pause' : '▶ Replay'}
          </button>

          <button
            className="btn-icon"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="volume-slider"
          />
        </div>
      </div>

      <div className="voice-selector">
        <span className="voice-selector-label">Voice:</span>
        <div className="voice-options">
          {voices.map((v) => (
            <button
              key={v.id}
              className={`voice-chip ${selectedVoice.id === v.id ? 'active' : ''}`}
              onClick={() => onSelectVoice(v)}
            >
              {v.name}
              <span className="voice-chip-desc">{v.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
