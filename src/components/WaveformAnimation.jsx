import './WaveformAnimation.css';

const BAR_COUNT = 10;

export default function WaveformAnimation({ state = 'idle' }) {
  return (
    <div className={`waveform waveform--${state}`}>
      {state === 'loading' && <span className="waveform-loading-text">Generating...</span>}
      <div className="waveform-bars">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className="waveform-bar"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
    </div>
  );
}
