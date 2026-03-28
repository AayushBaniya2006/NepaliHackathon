import './GestureConfidenceBar.css';

export default function GestureConfidenceBar({ confidence = 0 }) {
  const pct = Math.round(Math.min(Math.max(confidence, 0), 1) * 100);
  const color = confidence > 0.8
    ? 'var(--success)'
    : confidence > 0.5
      ? 'var(--warning)'
      : 'var(--error)';

  return (
    <div className="confidence-bar">
      <div className="confidence-track">
        <div
          className="confidence-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="confidence-pct">{pct}%</span>
    </div>
  );
}
