import { useRef, useEffect, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const FINGER_TIPS = [4, 8, 12, 16, 20];
const FINGER_PIPS = [3, 6, 10, 14, 18];

export function useMediaPipe(videoRef, onGestureChange, options) {
  const rawGestures = options && options.rawGestures === true;
  const handLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const lastGesture = useRef('none');
  const openHandTimer = useRef(null);
  const fistTimer = useRef(null);
  const gestureCallback = useRef(onGestureChange);
  const gestureHoldCount = useRef(0);
  const processFrameRef = useRef(() => {});

  useEffect(() => {
    gestureCallback.current = onGestureChange;
  }, [onGestureChange]);

  const initHandLandmarker = useCallback(async () => {
    const createWithDelegate = async (delegate) => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      return HandLandmarker.createFromOptions(vision, {
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
    };
    try {
      handLandmarkerRef.current = await createWithDelegate('GPU');
      setIsLoaded(true);
    } catch (errGpu) {
      try {
        handLandmarkerRef.current = await createWithDelegate('CPU');
        setIsLoaded(true);
      } catch (errCpu) {
        console.error('MediaPipe init error:', errGpu, errCpu);
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

    const indexExtended = hand[8].y < hand[6].y;
    const middleDown = hand[12].y > hand[10].y;
    const ringDown = hand[16].y > hand[14].y;
    const pinkyDown = hand[20].y > hand[18].y;

    // Fist: 0 fingers up
    if (fingersUp === 0) return { gesture: 'fist', fingertip: null };

    // Pinch before index: avoids mis-reading a near-touch as one finger
    if (pinchDist < 0.06 && fingersUp <= 2) {
      const midX = (thumbTip.x + indexTip.x) / 2;
      const midY = (thumbTip.y + indexTip.y) / 2;
      return { gesture: 'pinch', fingertip: { x: midX, y: midY } };
    }

    // Index only: index extended, other fingers down (thumb may read as "up" — ignore thumb count)
    if (indexExtended && middleDown && ringDown && pinkyDown) {
      const tip = hand[8];
      return { gesture: 'index_up', fingertip: { x: tip.x, y: tip.y } };
    }

    // 1 finger up by count: drawing mode (index finger)
    if (fingersUp === 1 && hand[FINGER_TIPS[1]].y < hand[FINGER_PIPS[1]].y) {
      const tip = hand[8];
      return { gesture: 'index_up', fingertip: { x: tip.x, y: tip.y } };
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
      animFrameRef.current = requestAnimationFrame(() => processFrameRef.current());
      return;
    }

    const result = landmarker.detectForVideo(video, performance.now());
    const { gesture, fingertip } = detectGesture(result.landmarks);

    if (!rawGestures) {
      // Open hand hold (1.5s to submit)
      if (gesture === 'open_hand') {
        if (!openHandTimer.current) {
          gestureCallback.current?.('open_hand', null);
          openHandTimer.current = setTimeout(() => {
            gestureCallback.current?.('speak', null);
            openHandTimer.current = null;
          }, 1500);
        }
      } else if (openHandTimer.current) {
        clearTimeout(openHandTimer.current);
        openHandTimer.current = null;
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
      } else if (fistTimer.current) {
        clearTimeout(fistTimer.current);
        fistTimer.current = null;
      }
    }

    // Fire callbacks
    const deferOpenFist = !rawGestures && (gesture === 'open_hand' || gesture === 'fist');
    if (gesture !== lastGesture.current) {
      lastGesture.current = gesture;
      gestureHoldCount.current = 0;
      if (!deferOpenFist) {
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

    animFrameRef.current = requestAnimationFrame(() => processFrameRef.current());
  }, [videoRef, detectGesture, rawGestures]);

  useEffect(() => {
    processFrameRef.current = processFrame;
  }, [processFrame]);

  const startTracking = useCallback(() => {
    if (handLandmarkerRef.current) processFrameRef.current();
  }, []);

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
