import { useRef, useEffect, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const FINGER_TIPS = [4, 8, 12, 16, 20];
const FINGER_PIPS = [3, 6, 10, 14, 18];

export function useMediaPipe(videoRef, onGestureChange) {
  const handLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const lastGesture = useRef('none');
  const openHandTimer = useRef(null);
  const fistTimer = useRef(null);
  const gestureCallback = useRef(onGestureChange);
  const gestureHoldCount = useRef(0);

  useEffect(() => {
    gestureCallback.current = onGestureChange;
  }, [onGestureChange]);

  const initHandLandmarker = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    const options = (delegate) => ({
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate,
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    try {
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, options('GPU'));
      setIsLoaded(true);
    } catch (gpuErr) {
      console.warn('MediaPipe GPU init failed, trying CPU:', gpuErr);
      try {
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, options('CPU'));
        setIsLoaded(true);
      } catch (err) {
        console.error('MediaPipe init error:', err);
        setError('Could not load hand tracking. Please try refreshing.');
      }
    }
  }, []);

  const countFingersUp = useCallback((hand) => {
    let count = 0;
    for (let i = 0; i < 5; i++) {
      const tip = hand[FINGER_TIPS[i]];
      const pip = hand[FINGER_PIPS[i]];
      if (i === 0) {
        if (Math.abs(tip.x - hand[0].x) > Math.abs(pip.x - hand[0].x)) count++;
      } else {
        if (tip.y < pip.y) count++;
      }
    }
    return count;
  }, []);

  const detectGesture = useCallback((landmarks) => {
    if (!landmarks || landmarks.length === 0) return { gesture: 'none', fingertip: null };

    const hand = landmarks[0];
    const fingersUp = countFingersUp(hand);

    const thumbTip = hand[4];
    const indexTip = hand[8];
    const pinchDist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    );

    // Fist: 0 fingers up
    if (fingersUp === 0) return { gesture: 'fist', fingertip: null };

    // 1 finger up: drawing mode (index finger)
    if (fingersUp === 1 && hand[FINGER_TIPS[1]].y < hand[FINGER_PIPS[1]].y) {
      const tip = hand[8];
      return { gesture: 'index_up', fingertip: { x: tip.x, y: tip.y } };
    }

    // Pinch (thumb + index close together, only when 1-2 fingers otherwise up): eraser
    if (pinchDist < 0.06 && fingersUp <= 2) {
      const midX = (thumbTip.x + indexTip.x) / 2;
      const midY = (thumbTip.y + indexTip.y) / 2;
      return { gesture: 'pinch', fingertip: { x: midX, y: midY } };
    }

    // 2 fingers up (peace/V sign): stamp Person
    if (fingersUp === 2) {
      const midX = (hand[8].x + hand[12].x) / 2;
      const midY = (hand[8].y + hand[12].y) / 2;
      return { gesture: 'fingers_2', fingertip: { x: midX, y: midY } };
    }

    // 3 fingers up: stamp Tree
    if (fingersUp === 3) {
      const midX = (hand[8].x + hand[12].x + hand[16].x) / 3;
      const midY = (hand[8].y + hand[12].y + hand[16].y) / 3;
      return { gesture: 'fingers_3', fingertip: { x: midX, y: midY } };
    }

    // 4 fingers up: stamp Heart
    if (fingersUp === 4) {
      const midX = (hand[8].x + hand[12].x + hand[16].x + hand[20].x) / 4;
      const midY = (hand[8].y + hand[12].y + hand[16].y + hand[20].y) / 4;
      return { gesture: 'fingers_4', fingertip: { x: midX, y: midY } };
    }

    // 5 fingers (open hand): submit hold
    if (fingersUp >= 5) return { gesture: 'open_hand', fingertip: null };

    return { gesture: 'other', fingertip: null };
  }, [countFingersUp]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = handLandmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const result = landmarker.detectForVideo(video, performance.now());
    const { gesture, fingertip } = detectGesture(result.landmarks);

    // Open hand hold (1.5s to submit)
    if (gesture === 'open_hand') {
      if (!openHandTimer.current) {
        gestureCallback.current?.('open_hand', null);
        openHandTimer.current = setTimeout(() => {
          gestureCallback.current?.('speak', null);
          openHandTimer.current = null;
        }, 1500);
      }
    } else {
      if (openHandTimer.current) {
        clearTimeout(openHandTimer.current);
        openHandTimer.current = null;
      }
    }

    // Fist hold (2s to clear)
    if (gesture === 'fist') {
      if (!fistTimer.current) {
        gestureCallback.current?.('fist_hold', null);
        fistTimer.current = setTimeout(() => {
          gestureCallback.current?.('fist', null);
          fistTimer.current = null;
        }, 2000);
      }
    } else {
      if (fistTimer.current) {
        clearTimeout(fistTimer.current);
        fistTimer.current = null;
      }
    }

    // Fire callbacks
    if (gesture !== lastGesture.current) {
      lastGesture.current = gesture;
      gestureHoldCount.current = 0;
      if (gesture !== 'open_hand' && gesture !== 'fist') {
        gestureCallback.current?.(gesture, fingertip);
      }
    } else if (gesture === 'index_up' || gesture === 'pinch') {
      gestureCallback.current?.(gesture, fingertip);
    } else if (['fingers_2', 'fingers_3', 'fingers_4'].includes(gesture)) {
      // Only fire stamp on first detection (cooldown handled in component)
      gestureHoldCount.current++;
      if (gestureHoldCount.current === 1) {
        gestureCallback.current?.(gesture, fingertip);
      }
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [videoRef, detectGesture]);

  const startTracking = useCallback(() => {
    if (handLandmarkerRef.current) processFrame();
  }, [processFrame]);

  const stopTracking = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (openHandTimer.current) { clearTimeout(openHandTimer.current); openHandTimer.current = null; }
    if (fistTimer.current) { clearTimeout(fistTimer.current); fistTimer.current = null; }
  }, []);

  useEffect(() => {
    initHandLandmarker();
    return () => { stopTracking(); handLandmarkerRef.current?.close(); };
  }, [initHandLandmarker, stopTracking]);

  return { isLoaded, error, startTracking, stopTracking };
}
