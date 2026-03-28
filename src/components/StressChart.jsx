import { useMemo } from 'react';
import { motion } from 'framer-motion';
import './StressChart.css';

const W = 560;
const H = 180;
const PAD = { top: 20, right: 20, bottom: 36, left: 36 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function scoreToY(score) {
  return PAD.top + INNER_H - (score / 10) * INNER_H;
}

function idxToX(i, total) {
  if (total === 1) return PAD.left + INNER_W / 2;
  return PAD.left + (i / (total - 1)) * INNER_W;
}

function polyline(points) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

function trendLabel(points) {
  if (points.length < 2) return null;
  const first = points[0][1];
  const last = points[points.length - 1][1];
  const diff = last - first;
  if (diff <= -0.5) return { text: '↓ You\'re making progress', cls: 'scc-trend-down' };
  if (diff >= 0.5)  return { text: '↑ Consider talking to your doctor', cls: 'scc-trend-up' };
  return { text: '→ Stress is stable', cls: 'scc-trend-flat' };
}

function dotColor(score) {
  if (score >= 8) return '#EF4444';
  if (score >= 5) return '#F59E0B';
  return '#10B981';
}

export default function StressChart({ sessions }) {
  const data = useMemo(() => {
    return sessions
      .filter(s => s.stressScore != null)
      .slice(-12)
      .map(s => ({
        score: s.stressScore,
        date: new Date(s.timestamp),
        label: new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      }));
  }, [sessions]);

  if (data.length === 0) {
    return (
      <div className="sc-empty">
        <span className="sc-empty-icon">📈</span>
        <p>Complete a drawing session to see your stress trend here.</p>
      </div>
    );
  }

  const points = data.map((d, i) => [idxToX(i, data.length), scoreToY(d.score)]);
  const trend = trendLabel(points);

  // build area path: line + closing back to bottom
  const areaPath = [
    `M ${points[0][0]} ${points[0][1]}`,
    ...points.slice(1).map(([x, y]) => `L ${x} ${y}`),
    `L ${points[points.length - 1][0]} ${PAD.top + INNER_H}`,
    `L ${points[0][0]} ${PAD.top + INNER_H}`,
    'Z',
  ].join(' ');

  const linePath = [
    `M ${points[0][0]} ${points[0][1]}`,
    ...points.slice(1).map(([x, y]) => `L ${x} ${y}`),
  ].join(' ');

  return (
    <div className="sc-wrap">
      <div className="sc-head">
        <div>
          <h3 className="sc-title">Stress Trajectory</h3>
          <p className="sc-subtitle">Last {data.length} session{data.length !== 1 ? 's' : ''}</p>
        </div>
        {trend && <span className={`sc-trend-badge ${trend.cls}`}>{trend.text}</span>}
      </div>

      <div className="sc-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="sc-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Color zone bands */}
          <rect x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H * 0.3} fill="#FEF2F2" opacity="0.6" />
          <rect x={PAD.left} y={PAD.top + INNER_H * 0.3} width={INNER_W} height={INNER_H * 0.3} fill="#FFFBEB" opacity="0.6" />
          <rect x={PAD.left} y={PAD.top + INNER_H * 0.6} width={INNER_W} height={INNER_H * 0.4} fill="#F0FDF4" opacity="0.6" />

          {/* Y-axis gridlines + labels */}
          {[0, 2, 4, 6, 8, 10].map(v => {
            const y = scoreToY(v);
            return (
              <g key={v}>
                <line x1={PAD.left} y1={y} x2={PAD.left + INNER_W} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 3" />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{v}</text>
              </g>
            );
          })}

          {/* Zone labels */}
          <text x={PAD.left + INNER_W - 4} y={PAD.top + 11} textAnchor="end" fontSize="9" fill="#EF4444" fontWeight="600">High</text>
          <text x={PAD.left + INNER_W - 4} y={PAD.top + INNER_H * 0.45} textAnchor="end" fontSize="9" fill="#F59E0B" fontWeight="600">Moderate</text>
          <text x={PAD.left + INNER_W - 4} y={PAD.top + INNER_H * 0.85} textAnchor="end" fontSize="9" fill="#10B981" fontWeight="600">Low</text>

          {/* Area fill */}
          <path d={areaPath} fill="url(#area-grad)" />

          {/* Line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="#14B8A6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Data points */}
          {points.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill={dotColor(data[i].score)} stroke="#fff" strokeWidth="2" />
              {/* X-axis date label — show for first, last, and every 3rd */}
              {(i === 0 || i === data.length - 1 || i % 3 === 0) && (
                <text x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#9CA3AF">
                  {data[i].label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="sc-legend">
        <span className="sc-leg-item"><span className="sc-leg-dot" style={{ background: '#10B981' }} />Low (0–4)</span>
        <span className="sc-leg-item"><span className="sc-leg-dot" style={{ background: '#F59E0B' }} />Moderate (5–7)</span>
        <span className="sc-leg-item"><span className="sc-leg-dot" style={{ background: '#EF4444' }} />High (8–10)</span>
      </div>
    </div>
  );
}
