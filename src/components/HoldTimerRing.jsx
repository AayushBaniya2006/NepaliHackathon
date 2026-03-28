export default function HoldTimerRing({ progress = 0, color = 'var(--peach)', size = 48 }) {
  if (progress <= 0) return null;
  const degrees = Math.min(progress, 1) * 360;
  return (
    <div
      className="hold-timer-ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${degrees}deg, transparent ${degrees}deg)`,
        borderRadius: '50%',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        mask: `radial-gradient(transparent ${size / 2 - 4}px, black ${size / 2 - 4}px)`,
        WebkitMask: `radial-gradient(transparent ${size / 2 - 4}px, black ${size / 2 - 4}px)`,
        pointerEvents: 'none',
        transition: 'opacity 0.15s ease',
      }}
    />
  );
}
