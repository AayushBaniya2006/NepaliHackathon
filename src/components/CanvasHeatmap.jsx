import './CanvasHeatmap.css';

export default function CanvasHeatmap({ grid = [], cols = 10, rows = 8 }) {
  const cells = grid.length === cols * rows ? grid : new Array(cols * rows).fill(0);

  return (
    <div className="canvas-heatmap" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {cells.map((val, i) => (
        <div
          key={i}
          className="heatmap-cell"
          style={{
            background: val > 0
              ? `rgba(232, 168, 124, ${Math.min(val, 1) * 0.7 + 0.05})`
              : 'transparent',
          }}
        />
      ))}
    </div>
  );
}
