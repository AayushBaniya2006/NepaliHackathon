import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

function canvasPixelToStampNorm(canvasX, canvasY, width, height) {
  return {
    x: Math.min(1, Math.max(0, 1 - canvasX / width)),
    y: Math.min(1, Math.max(0, canvasY / height)),
  };
}

const DrawingCanvas = forwardRef(({ width, height, currentColor, brushSize = 4, onStrokePoint }, ref) => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const prevPointRef = useRef(null);
  const prevPrevPointRef = useRef(null);
  const lastStampNormRef = useRef({ x: 0.5, y: 0.5 });

  const getColor = useCallback(() => {
    return currentColor || 'rgba(78, 205, 196, 0.8)';
  }, [currentColor]);

  const drawSmooth = useCallback((ctx, prev2, prev1, current) => {
    const color = getColor();
    const mx = (prev1.x + current.x) / 2;
    const my = (prev1.y + current.y) / 2;

    const layers = [
      { alpha: '0.08)', extra: 12 },
      { alpha: '0.2)', extra: 5 },
      { alpha: null, extra: 0 },
    ];

    for (const layer of layers) {
      ctx.beginPath();
      if (prev2) {
        const mx0 = (prev2.x + prev1.x) / 2;
        const my0 = (prev2.y + prev1.y) / 2;
        ctx.moveTo(mx0, my0);
        ctx.quadraticCurveTo(prev1.x, prev1.y, mx, my);
      } else {
        ctx.moveTo(prev1.x, prev1.y);
        ctx.lineTo(mx, my);
      }
      ctx.strokeStyle = layer.alpha ? color.replace(/[\d.]+\)$/, layer.alpha) : color;
      ctx.lineWidth = brushSize + layer.extra;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, [brushSize, getColor]);

  const drawLine = useCallback((ctx, x1, y1, x2, y2) => {
    const color = getColor();
    const layers = [
      { alpha: '0.08)', extra: 12 },
      { alpha: '0.2)', extra: 5 },
      { alpha: null, extra: 0 },
    ];
    for (const layer of layers) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = layer.alpha ? color.replace(/[\d.]+\)$/, layer.alpha) : color;
      ctx.lineWidth = brushSize + layer.extra;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, [brushSize, getColor]);

  const drawDot = useCallback((ctx, x, y) => {
    const color = getColor();
    ctx.beginPath();
    ctx.arc(x, y, brushSize + 3, 0, Math.PI * 2);
    ctx.fillStyle = color.replace(/[\d.]+\)$/, '0.08)');
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [brushSize, getColor]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    clear: () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, width, height);
      prevPointRef.current = null;
      prevPrevPointRef.current = null;
    },
    toDataURL: () => canvasRef.current?.toDataURL('image/png'),
    drawAt: (x, y) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      const canvasX = (1 - x) * width;
      const canvasY = y * height;
      lastStampNormRef.current = canvasPixelToStampNorm(canvasX, canvasY, width, height);
      const current = { x: canvasX, y: canvasY };

      if (prevPointRef.current) {
        drawSmooth(ctx, prevPrevPointRef.current, prevPointRef.current, current);
      } else {
        drawDot(ctx, canvasX, canvasY);
      }

      prevPrevPointRef.current = prevPointRef.current;
      prevPointRef.current = current;
      onStrokePoint?.({ x: canvasX, y: canvasY, t: Date.now() });
    },
    eraseAt: (x, y) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const canvasX = (1 - x) * width;
      const canvasY = y * height;
      lastStampNormRef.current = canvasPixelToStampNorm(canvasX, canvasY, width, height);
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    resetPrevPoint: () => {
      prevPointRef.current = null;
      prevPrevPointRef.current = null;
    },
    placeStamp: (x, y, stampDrawFn) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !stampDrawFn) return;
      const canvasX = (1 - x) * width;
      const canvasY = y * height;
      lastStampNormRef.current = canvasPixelToStampNorm(canvasX, canvasY, width, height);
      const size = Math.min(width, height) * 0.08;
      stampDrawFn(ctx, canvasX, canvasY, size, getColor());
    },
    getLastStampNorm: () => ({ ...lastStampNormRef.current }),
  }));

  // Mouse fallback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let mousePrev = null;
    let mousePrev2 = null;

    const clientToCanvas = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;
      return { cx, cy };
    };

    const trackPointerForStamp = (e) => {
      const { cx, cy } = clientToCanvas(e);
      if (cx >= 0 && cx <= width && cy >= 0 && cy <= height) {
        lastStampNormRef.current = canvasPixelToStampNorm(cx, cy, width, height);
      }
    };

    const handleMouseDown = (e) => {
      trackPointerForStamp(e);
      isDrawingRef.current = true;
      const { cx, cy } = clientToCanvas(e);
      mousePrev = { x: cx, y: cy };
      mousePrev2 = null;
      drawDot(canvas.getContext('2d'), mousePrev.x, mousePrev.y);
      onStrokePoint?.({ x: mousePrev.x, y: mousePrev.y, t: Date.now() });
    };

    const handleMouseMove = (e) => {
      trackPointerForStamp(e);
      if (!isDrawingRef.current) return;
      const ctx = canvas.getContext('2d');
      const { cx, cy } = clientToCanvas(e);
      const current = { x: cx, y: cy };

      if (mousePrev) {
        drawSmooth(ctx, mousePrev2, mousePrev, current);
      }
      mousePrev2 = mousePrev;
      mousePrev = current;
      onStrokePoint?.({ x: current.x, y: current.y, t: Date.now() });
    };

    const handleMouseUp = () => {
      isDrawingRef.current = false;
      mousePrev = null;
      mousePrev2 = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [drawSmooth, drawDot, width, height, onStrokePoint]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, cursor: 'crosshair' }}
    />
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
export default DrawingCanvas;
