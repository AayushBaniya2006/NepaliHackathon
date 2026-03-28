export default function LiveSparkline({ data = [], maxPoints = 60, width = 120, height = 32, color = 'var(--peach)' }) {
  const points = data.slice(-maxPoints);
  if (points.length < 2) return <div style={{ width, height }} />;

  const max = Math.max(...points, 1);
  const stepX = width / (maxPoints - 1);
  const coords = points.map((val, i) => {
    const x = i * stepX;
    const y = height - (val / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
