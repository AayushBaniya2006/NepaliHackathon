export const STAMPS = [
  {
    id: 'person',
    name: 'Person',
    gesture: 'fingers_2',
    fingerCount: 2,
    draw: (ctx, x, y, size, color) => {
      const s = size;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.arc(x, y - s * 0.35, s * 0.14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.21);
      ctx.lineTo(x, y + s * 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.25, y - s * 0.05);
      ctx.lineTo(x, y - s * 0.12);
      ctx.lineTo(x + s * 0.25, y - s * 0.05);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.2, y + s * 0.45);
      ctx.lineTo(x, y + s * 0.15);
      ctx.lineTo(x + s * 0.2, y + s * 0.45);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'tree',
    name: 'Tree',
    gesture: 'fingers_3',
    fingerCount: 3,
    draw: (ctx, x, y, size, color) => {
      const s = size;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.45);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.35, y + s * 0.05);
      ctx.lineTo(x, y - s * 0.4);
      ctx.lineTo(x + s * 0.35, y + s * 0.05);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.28, y - s * 0.12);
      ctx.lineTo(x, y - s * 0.5);
      ctx.lineTo(x + s * 0.28, y - s * 0.12);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'heart',
    name: 'Heart',
    gesture: 'fingers_4',
    fingerCount: 4,
    draw: (ctx, x, y, size, color) => {
      const s = size * 0.45;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.7);
      ctx.bezierCurveTo(x - s * 1.2, y - s * 0.3, x - s * 0.4, y - s * 1.1, x, y - s * 0.4);
      ctx.bezierCurveTo(x + s * 0.4, y - s * 1.1, x + s * 1.2, y - s * 0.3, x, y + s * 0.7);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'house',
    name: 'House',
    gesture: 'manual',
    fingerCount: null,
    draw: (ctx, x, y, size, color) => {
      const s = size;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.rect(x - s * 0.4, y - s * 0.1, s * 0.8, s * 0.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.5, y - s * 0.1);
      ctx.lineTo(x, y - s * 0.55);
      ctx.lineTo(x + s * 0.5, y - s * 0.1);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(x - s * 0.1, y + s * 0.1, s * 0.2, s * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(x + s * 0.15, y, s * 0.15, s * 0.15);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'star',
    name: 'Star',
    gesture: 'manual',
    fingerCount: null,
    draw: (ctx, x, y, size, color) => {
      const s = size * 0.45;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        const ox = x + Math.cos(outerAngle) * s;
        const oy = y + Math.sin(outerAngle) * s;
        const ix = x + Math.cos(innerAngle) * s * 0.4;
        const iy = y + Math.sin(innerAngle) * s * 0.4;
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'cloud',
    name: 'Cloud',
    gesture: 'manual',
    fingerCount: null,
    draw: (ctx, x, y, size, color) => {
      const s = size * 0.4;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x - s * 0.5, y, s * 0.4, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(x - s * 0.1, y - s * 0.4, s * 0.45, Math.PI * 1.1, Math.PI * 1.85);
      ctx.arc(x + s * 0.4, y - s * 0.2, s * 0.4, Math.PI * 1.3, Math.PI * 0.2);
      ctx.arc(x + s * 0.5, y + s * 0.1, s * 0.35, Math.PI * 1.7, Math.PI * 0.5);
      ctx.lineTo(x - s * 0.5 + Math.cos(Math.PI * 0.5) * s * 0.4, y + Math.sin(Math.PI * 0.5) * s * 0.4);
      ctx.stroke();
      ctx.restore();
    },
  },
];

export function getStampByGesture(gesture) {
  return STAMPS.find(s => s.gesture === gesture);
}

export function getStampById(id) {
  return STAMPS.find(s => s.id === id);
}
