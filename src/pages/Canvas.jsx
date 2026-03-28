import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DrawingCanvas from '../components/DrawingCanvas';
import GestureIndicator from '../components/GestureIndicator';
import SignLanguagePanel from '../components/SignLanguagePanel';
import BrainVisualization from '../components/BrainVisualization';
import StepTracker from '../components/StepTracker';
import DoctorGuide from '../components/DoctorGuide';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { useClaude } from '../hooks/useClaude';
import './Canvas.css';

const BRUSH_COLORS = [
  'rgba(78, 205, 196, 0.8)',
  'rgba(184, 169, 201, 0.8)',
  'rgba(245, 166, 35, 0.7)',
  'rgba(232, 141, 151, 0.8)',
  'rgba(168, 197, 160, 0.8)',
];

const CLINICAL_ASSESSMENTS = [
  { 
    id: 'free', 
    label: '🎨 Free Expression', 
    prompt: 'Express how you feel right now through a drawing.',
    clinical: 'General expression / Emotional discharge'
  },
  { 
    id: 'htp', 
    label: '🏠 House-Tree-Person (HTP)', 
    prompt: 'Please draw a house, a tree, and a person on this canvas.',
    clinical: 'Used to assess personality, family dynamics, and self-image.'
  },
  { 
    id: 'kfd', 
    label: '👨‍👩‍👧 Family Dynamics (KFD)', 
    prompt: 'Draw everyone in your family doing something together.',
    clinical: 'Understanding interpersonal relations and family roles.'
  },
  { 
    id: 'dap', 
    label: '👤 Draw-A-Person (DAP)', 
    prompt: 'Draw a complete person as best as you can.',
    clinical: 'Projective test for cognitive development and emotional state.'
  }
];

export default function Canvas() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [gesture, setGesture] = useState('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // === Mode toggle: 'draw' or 'sign' ===
  const [mode, setMode] = useState('draw');

  // === Sign Language state ===
  const [recognizedWords, setRecognizedWords] = useState([]);
  const [currentSign, setCurrentSign] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const signIntervalRef = useRef(null);
  const isRecognizingRef = useRef(false); // avoid stale closure

  // === Brain Visualization ===
  const [brainVisible, setBrainVisible] = useState(true);

  // === Clinical Assessment ===
  const [selectedAssessment, setSelectedAssessment] = useState(CLINICAL_ASSESSMENTS[0]);

  const { interpretDrawing, recognizeSign, interpretSignMessage, loading: claudeLoading } = useClaude();

  // Compute brain activity from current state
  const brainActivity = useMemo(() => {
    if (isProcessing) return 'processing';
    if (mode === 'sign' && isRecognizing) return 'signing';
    if (gesture === 'index_up') return 'drawing';
    if (gesture === 'open_hand') return 'speaking';
    return 'idle';
  }, [gesture, mode, isProcessing, isRecognizing]);

  // --- Gesture handler for DRAW mode ---
  const handleGesture = useCallback(async (detectedGesture, fingertip) => {
    setGesture(detectedGesture);

    // Only handle drawing gestures in draw mode
    if (mode !== 'draw') return;

    if (detectedGesture === 'index_up' && fingertip) {
      canvasRef.current?.drawAt(fingertip.x, fingertip.y);
    } else if (detectedGesture === 'pinch' && fingertip) {
      // Pinch = eraser
      canvasRef.current?.eraseAt(fingertip.x, fingertip.y);
      canvasRef.current?.resetPrevPoint();
    } else if (detectedGesture !== 'index_up' && detectedGesture !== 'pinch') {
      canvasRef.current?.resetPrevPoint();
    }

    if (detectedGesture === 'fist') {
      canvasRef.current?.clear();
    }

    if (detectedGesture === 'speak') {
      await handleDrawSpeak();
    }
  }, [mode]);

  // --- Handle DRAW mode speak (interpret the drawing) ---
  const handleDrawSpeak = async () => {
    setIsProcessing(true);
    const dataUrl = canvasRef.current?.toDataURL();

    if (!dataUrl) {
      setIsProcessing(false);
      return;
    }

    const result = await interpretDrawing(dataUrl, selectedAssessment.label);

    if (result) {
      navigate('/results', { 
        state: { 
          result, 
          canvasImage: dataUrl,
          assessmentType: selectedAssessment.label
        } 
      });
    }
    setIsProcessing(false);
  };

  // --- Handle SIGN mode: capture frame and recognize ---
  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !isRecognizingRef.current) return;

    // Capture current video frame to a temporary canvas
    const video = videoRef.current;
    if (video.readyState < 2) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const frameDataUrl = tempCanvas.toDataURL('image/png');

    const result = await recognizeSign(frameDataUrl);

    if (result && result.recognized && result.sign) {
      setCurrentSign(result);

      // Add word if confidence is medium or high
      if (result.confidence !== 'low') {
        setRecognizedWords(prev => [...prev, result.sign]);
      }
    } else {
      setCurrentSign(null);
    }
  }, [recognizeSign]);

  // --- Start/stop sign recognition loop ---
  const startSignRecognition = useCallback(() => {
    if (signIntervalRef.current) return;
    setIsRecognizing(true);
    isRecognizingRef.current = true;

    // Capture every 3 seconds (to avoid API flooding)
    const doCapture = async () => {
      if (!isRecognizingRef.current) return;
      await captureAndRecognize();
      if (isRecognizingRef.current) {
        signIntervalRef.current = setTimeout(doCapture, 3000);
      }
    };

    // Start after a brief delay so user can position
    signIntervalRef.current = setTimeout(doCapture, 1500);
  }, [captureAndRecognize]);

  const stopSignRecognition = useCallback(() => {
    setIsRecognizing(false);
    isRecognizingRef.current = false;
    if (signIntervalRef.current) {
      clearTimeout(signIntervalRef.current);
      signIntervalRef.current = null;
    }
  }, []);

  // --- Handle SIGN mode: send accumulated message ---
  const handleSignSpeak = async () => {
    if (recognizedWords.length === 0) return;
    setIsProcessing(true);
    stopSignRecognition();

    const result = await interpretSignMessage(recognizedWords);

    if (result) {
      navigate('/results', { state: { result, signedWords: [...recognizedWords] } });
    }
    setIsProcessing(false);
  };

  const handleRemoveWord = (index) => {
    setRecognizedWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllWords = () => {
    setRecognizedWords([]);
    setCurrentSign(null);
  };

  // --- Mode switching ---
  const switchMode = (newMode) => {
    if (newMode === mode) return;

    if (mode === 'sign') {
      stopSignRecognition();
    }

    setMode(newMode);
    setCurrentSign(null);

    if (newMode === 'sign' && cameraReady) {
      startSignRecognition();
    }
  };

  // --- MediaPipe hand tracking ---
  const { isLoaded, error: mpError, startTracking, stopTracking } = useMediaPipe(videoRef, handleGesture);

  // Initialize camera
  useEffect(() => {
    let stream = null;

    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setCameraReady(true);
            setCanvasDimensions({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
          };
        }
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError('Camera access denied. Please allow camera access and refresh.');
      }
    }

    initCamera();

    return () => {
      stream?.getTracks().forEach(t => t.stop());
      stopTracking();
      stopSignRecognition();
    };
  }, [stopTracking, stopSignRecognition]);

  // Start hand tracking when ready (for draw mode)
  useEffect(() => {
    if (cameraReady && isLoaded && mode === 'draw') {
      startTracking();
    }
  }, [cameraReady, isLoaded, startTracking, mode]);

  // Auto-start sign recognition when switching to sign mode
  useEffect(() => {
    if (mode === 'sign' && cameraReady) {
      startSignRecognition();
    }
    return () => {
      if (mode === 'sign') {
        stopSignRecognition();
      }
    };
  }, [mode, cameraReady, startSignRecognition, stopSignRecognition]);

  return (
    <div className="canvas-page">
      {/* Global Progress */}
      <StepTracker currentStep="canvas" />

      {/* Top toolbar */}
      <motion.div
        className="canvas-toolbar glass"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button className="btn btn-sm btn-secondary" onClick={() => navigate('/')}>
          ← Back
        </button>

        {/* Mode toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'draw' ? 'active' : ''}`}
            onClick={() => switchMode('draw')}
          >
            ✏️ Draw
          </button>
          <button
            className={`mode-btn ${mode === 'sign' ? 'active' : ''}`}
            onClick={() => switchMode('sign')}
          >
            🤟 Sign Language
          </button>
          <button
            className={`mode-btn brain-toggle ${brainVisible ? 'active' : ''}`}
            onClick={() => setBrainVisible(v => !v)}
            title="Toggle brain visualization"
          >
            🧠 Brain
          </button>
        </div>

        <div className="toolbar-actions">
          {mode === 'draw' && (
            <div className="assessment-picker">
              {CLINICAL_ASSESSMENTS.map((asst) => (
                <button
                  key={asst.id}
                  className={`assessment-tool ${selectedAssessment.id === asst.id ? 'active' : ''}`}
                  onClick={() => setSelectedAssessment(asst)}
                  title={asst.clinical}
                >
                  {asst.label.split(' ')[0]}
                </button>
              ))}
              <div className="picker-divider" />
            </div>
          )}
          {mode === 'draw' && (
            <>
              <div className="color-picker">
                {BRUSH_COLORS.map((color, i) => (
                  <button
                    key={i}
                    className={`color-dot ${selectedColor === i ? 'active' : ''}`}
                    style={{ background: color }}
                    onClick={() => setSelectedColor(i)}
                  />
                ))}
              </div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => canvasRef.current?.clear()}
              >
                🗑️ Clear
              </button>
              <button
                className={`btn btn-sm ${isProcessing ? 'btn-secondary' : 'btn-primary'} next-step-btn`}
                onClick={handleDrawSpeak}
                disabled={isProcessing || claudeLoading}
              >
                {isProcessing ? '⏳ Analyzing...' : '✨ Analyze & Proceed'}
              </button>
            </>
          )}

          {mode === 'sign' && (
            <>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => isRecognizing ? stopSignRecognition() : startSignRecognition()}
              >
                {isRecognizing ? '⏸ Pause' : '▶ Resume'}
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSignSpeak}
                disabled={isProcessing || claudeLoading || recognizedWords.length === 0}
              >
                {isProcessing ? '⏳ Processing...' : '🗣️ Speak Message'}
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Camera + Canvas area */}
      <div className={`canvas-viewport ${mode === 'sign' ? 'sign-mode' : ''}`}>
        {/* Floating Doctor Guide */}
        <div className="side-guide-container">
          <DoctorGuide phase="canvas" />
        </div>
        
        {cameraError ? (
          <div className="camera-fallback">
            <motion.div
              className="fallback-content glass"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="fallback-icon">📷</span>
              <h3>Camera Not Available</h3>
              <p>{cameraError}</p>
              {mode === 'draw' && (
                <p className="fallback-note">
                  You can still draw with your mouse! Click and drag on the canvas below.
                </p>
              )}
              {mode === 'sign' && (
                <p className="fallback-note">
                  Camera is required for sign language mode. Please enable camera access and refresh.
                </p>
              )}
            </motion.div>
            {mode === 'draw' && (
              <div className="canvas-container mouse-mode">
                <DrawingCanvas
                  ref={canvasRef}
                  width={1280}
                  height={720}
                  currentColor={BRUSH_COLORS[selectedColor]}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className={`camera-feed ${mode === 'sign' ? 'sign-camera' : ''}`}
              autoPlay
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }}
            />
            {mode === 'draw' && canvasDimensions.width > 0 && (
              <DrawingCanvas
                ref={canvasRef}
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                currentColor={BRUSH_COLORS[selectedColor]}
              />
            )}
            {mode === 'sign' && (
              <div className="sign-overlay-guide">
                <motion.div
                  className="sign-frame-guide"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span>Position your hands here</span>
                </motion.div>
              </div>
            )}
          </>
        )}

        {/* Loading states */}
        {!cameraReady && !cameraError && (
          <div className="camera-loading">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="loading-spinner"
            >
              ◐
            </motion.div>
            <p>Starting camera...</p>
          </div>
        )}

        {cameraReady && !isLoaded && mode === 'draw' && (
          <motion.div
            className="mp-loading glass"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>🤖 Loading hand tracking...</p>
          </motion.div>
        )}

        {/* Assessment Prompt Overlay */}
        <AnimatePresence>
          {!isProcessing && mode === 'draw' && cameraReady && (
            <motion.div
              className="assessment-prompt-overlay"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 1.5 }}
            >
              <div className="prompt-card glass-light">
                <div className="prompt-header">
                  <span className="prompt-tag">Active Therapy Task</span>
                  <span className="prompt-badge">{selectedAssessment.label}</span>
                </div>
                <h3>{selectedAssessment.prompt}</h3>
                <p>{selectedAssessment.clinical}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              className="processing-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="processing-content">
                <motion.div
                  className="processing-orb"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <h3>
                  {mode === 'draw'
                    ? 'Dr. Bloom is analyzing your expression...'
                    : 'Dr. Mercer is interpreting your signs...'}
                </h3>
                <p>
                  {mode === 'draw'
                    ? "Evaluating emotional depth and visual metaphors..."
                    : "Converting sign sequences into clinical communications..."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hints */}
        {cameraReady && !isProcessing && (
          <motion.div
            className="canvas-hints"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {mode === 'draw' ? (
              <>
                <span>☝️ Draw</span>
                <span>🤏 Pinch = erase</span>
                <span>🖐️ Hold = speak</span>
                <span>✊ Hold = clear</span>
                <span>🖱️ Mouse works too</span>
              </>
            ) : (
              <>
                <span>🤟 Sign at the camera</span>
                <span>📸 Auto-captures every 3s</span>
                <span>🗣️ Press "Speak Message" when done</span>
              </>
            )}
          </motion.div>
        )}
        {/* Floating "Proceed" button for better UX flow */}
        {mode === 'draw' && cameraReady && !isProcessing && (
          <motion.div
            className="floating-proceed-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2 }}
          >
            <button className="btn btn-lg btn-amber proceed-glow" onClick={handleDrawSpeak}>
              Done? Submitting to Analysis ➔
            </button>
            <p className="proceed-tip">🖐️ Or hold open hand to submit</p>
          </motion.div>
        )}
      </div>

      {/* Sign Language Panel (right sidebar) */}
      <AnimatePresence>
        {mode === 'sign' && (
          <SignLanguagePanel
            recognizedWords={recognizedWords}
            currentSign={currentSign}
            isRecognizing={isRecognizing}
            onRemoveWord={handleRemoveWord}
            onClearAll={handleClearAllWords}
            onSendMessage={handleSignSpeak}
            hasWords={recognizedWords.length > 0}
          />
        )}
      </AnimatePresence>

      {/* Gesture indicator (draw mode only) */}
      {mode === 'draw' && (
        <GestureIndicator gesture={gesture} isProcessing={isProcessing} />
      )}

      {/* Brain Visualization */}
      <AnimatePresence>
        {brainVisible && (
          <BrainVisualization
            activity={brainActivity}
            isVisible={brainVisible}
            compact={mode === 'sign'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
