import { useState, useEffect } from 'react';

export default function StampCooldownRing({ x, y, active, size = 40 }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      setVisible(false);
      return;
    }
    setVisible(true);
    const start = performance.now();
    const duration = 800;

    function step(now) {
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        setVisible(false);
      }
    }
    requestAnimationFrame(step);
  }, [active]);

  if (!visible) return null;

  const degrees = progress * 360;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        background: `conic-gradient(var(--peach) ${degrees}deg, transparent ${degrees}deg)`,
        borderRadius: '50%',
        mask: `radial-gradient(transparent ${size / 2 - 3}px, black ${size / 2 - 3}px)`,
        WebkitMask: `radial-gradient(transparent ${size / 2 - 3}px, black ${size / 2 - 3}px)`,
        opacity: 1 - progress * 0.5,
        pointerEvents: 'none',
      }}
    />
  );
}
