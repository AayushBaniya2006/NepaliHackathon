import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DrawingCanvas from '../components/DrawingCanvas';
import GestureIndicator from '../components/GestureIndicator';
import SignLanguagePanel from '../components/SignLanguagePanel';
import BrainActivity from '../components/BrainActivity';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { useClaude } from '../hooks/useClaude';
import { useAnalysis } from '../hooks/useAnalysis';
import { useStorage } from '../hooks/useStorage';
import { getPromptById, DRAWING_PROMPTS } from '../utils/drawingPrompts';
import { STAMPS, getStampByGesture } from '../utils/stamps';
import GestureConfidenceBar from '../components/GestureConfidenceBar';
import LiveSparkline from '../components/LiveSparkline';
import CanvasHeatmap from '../components/CanvasHeatmap';
import WaveformAnimation from '../components/WaveformAnimation';
import ProgressiveTextStream from '../components/ProgressiveTextStream';
import './DrawingSession.css';

const BRUSH_COLORS = [
  { name: 'Red', value: 'rgba(239, 68, 68, 0.85)' },
  { name: 'Orange', value: 'rgba(249, 115, 22, 0.85)' },
  { name: 'Yellow', value: 'rgba(234, 179, 8, 0.85)' },
  { name: 'Green', value: 'rgba(34, 197, 94, 0.85)' },
  { name: 'Blue', value: 'rgba(59, 130, 246, 0.85)' },
  { name: 'Purple', value: 'rgba(139, 92, 246, 0.85)' },
  { name: 'Pink', value: 'rgba(236, 72, 153, 0.85)' },
  { name: 'White', value: 'rgba(255, 255, 255, 0.9)' },
  { name: 'Black', value: 'rgba(26, 26, 46, 0.85)' },
];

const TIMER_SECONDS = 120;

export default function DrawingSession({ promptOverride }) {
  const navigate = useNavigate();
  const location = useLocation();
  const promptId = promptOverride?.id || location.state?.promptId || 'energy';
  const prompt = getPromptById(promptId) || DRAWING_PROMPTS[0];

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [gesture, setGesture] = useState('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(true);
  const [showPrompt, setShowPrompt] = useState(true);
  const [showBrain, setShowBrain] = useState(true);

  const [mode, setMode] = useState('draw');
  const [sessionMode, setSessionMode] = useState('solo'); // 'solo' | 'live'
  const [recognizedWords, setRecognizedWords] = useState([]);
  const [currentSign, setCurrentSign] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const signIntervalRef = useRef(null);
  const isRecognizingRef = useRef(false);

  const [showNotes, setShowNotes] = useState(false);
  const [caregiverNote, setCaregiverNote] = useState({
    skippedMeals: null, meltdowns: 0, sleep: null,
  });

  const [gestureConfidence, setGestureConfidence] = useState(0);
  const [strokeSpeeds, setStrokeSpeeds] = useState([]);
  const [coverageGrid, setCoverageGrid] = useState(new Array(80).fill(0));
  const [analysisResult, setAnalysisResult] = useState(null);
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'loading' | 'playing'
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStage, setAnalyzeStage] = useState('');

  const stampCooldownRef = useRef(false);
  const [stampFeedbackName, setStampFeedbackName] = useState('');

  const { recognizeSign, interpretSignMessage, loading: claudeLoading } = useClaude();
  const { analyzeDrawing, loading: analysisLoading } = useAnalysis();
  const { saveSession, saveAnalytics } = useStorage();

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;

    let hidden = false;
    const handleVisibility = () => {
      hidden = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(() => {
      if (!hidden) {
        setTimeLeft(t => {
          if (t <= 1) { setTimerActive(false); return 0; }
          return t - 1;
        });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [timerActive, timeLeft]);

  useEffect(() => {
    const timer = setTimeout(() => setShowPrompt(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleGesture = useCallback(async (detectedGesture, fingertip, confidence) => {
    setGesture(detectedGesture);
    if (confidence !== undefined) setGestureConfidence(confidence);
    if (mode !== 'draw') return;

    const drawLikeGestures = ['index_up', 'pinch'];

    if (detectedGesture === 'index_up' && fingertip) {
      canvasRef.current?.drawAt(fingertip.x, fingertip.y);
    } else if (detectedGesture === 'pinch' && fingertip) {
      canvasRef.current?.eraseAt(fingertip.x, fingertip.y);
      canvasRef.current?.resetPrevPoint();
    } else if (!drawLikeGestures.includes(detectedGesture)) {
      canvasRef.current?.resetPrevPoint();
    }

    if (detectedGesture === 'fist') canvasRef.current?.clear();
    if (detectedGesture === 'speak') await handleAnalyze();
  }, [mode]);

  const handleAnalyze = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAnalyzeProgress(0);
    setAnalyzeStage('Capturing drawing...');

    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) { setIsProcessing(false); return; }

    // Check canvas data size (max 5MB)
    const sizeKB = (dataUrl.length * 0.75) / 1024;
    if (sizeKB > 5000) {
      setIsProcessing(false);
      alert('Drawing is too large. Please clear some and try again.');
      return;
    }

    // Stage 1: Capture (0-30%)
    setAnalyzeProgress(15);
    await new Promise(r => setTimeout(r, 400));
    setAnalyzeProgress(30);
    setAnalyzeStage('Analyzing patterns...');

    // Stage 2: Analysis (30-70%)
    setAnalyzeProgress(45);
    const result = await analyzeDrawing(dataUrl, promptId, prompt.title);
    setAnalyzeProgress(70);
    setAnalyzeStage('Generating clinical note...');

    // Stage 3: Generate (70-100%)
    if (result) {
      setAnalysisResult(result);
      setAnalyzeProgress(85);
      await new Promise(r => setTimeout(r, 300));
      setAnalyzeProgress(100);
      await new Promise(r => setTimeout(r, 200));

      saveSession({
        promptId, imageUrl: dataUrl, stressScore: result.stress_score,
        feedbackShort: result.feedback_short, caregiverNote,
      });
      saveAnalytics({
        promptId, stressScore: result.stress_score, indicators: result.indicators,
        pattern: result.pattern, thresholdMet: result.threshold_met,
      });
      navigate('/session-results', { state: { result, canvasImage: dataUrl, promptId, liveMode: sessionMode === 'live' } });
    }
    setIsProcessing(false);
  };

  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !isRecognizingRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCanvas.getContext('2d').drawImage(video, 0, 0);
    const result = await recognizeSign(tempCanvas.toDataURL('image/png'));
    if (result?.recognized && result.sign) {
      setCurrentSign(result);
      if (result.confidence !== 'low') setRecognizedWords(prev => [...prev, result.sign]);
    } else {
      setCurrentSign(null);
    }
  }, [recognizeSign]);

  const startSignRecognition = useCallback(() => {
    if (signIntervalRef.current) return;
    setIsRecognizing(true);
    isRecognizingRef.current = true;
    const doCapture = async () => {
      if (!isRecognizingRef.current) return;
      await captureAndRecognize();
      if (isRecognizingRef.current) signIntervalRef.current = setTimeout(doCapture, 3000);
    };
    signIntervalRef.current = setTimeout(doCapture, 1500);
  }, [captureAndRecognize]);

  const stopSignRecognition = useCallback(() => {
    setIsRecognizing(false);
    isRecognizingRef.current = false;
    if (signIntervalRef.current) { clearTimeout(signIntervalRef.current); signIntervalRef.current = null; }
  }, []);

  const handleSignSpeak = async () => {
    if (recognizedWords.length === 0) return;
    setIsProcessing(true);
    stopSignRecognition();
    const result = await interpretSignMessage(recognizedWords);
    if (result) navigate('/session-results', { state: { result, signedWords: [...recognizedWords], promptId } });
    setIsProcessing(false);
  };

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    if (mode === 'sign') stopSignRecognition();
    setMode(newMode);
    setCurrentSign(null);
    if (newMode === 'sign' && cameraReady) startSignRecognition();
  };

  const { isLoaded, error: mpError, startTracking, stopTracking } = useMediaPipe(videoRef, handleGesture);

  useEffect(() => {
    let stream = null;
    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setCameraReady(true);
            setCanvasDimensions({ width: videoRef.current.videoWidth, height: videoRef.current.videoHeight });
          };
        }
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError('Camera access denied. Please allow camera access and refresh.');
      }
    }
    initCamera();
    return () => { stream?.getTracks().forEach(t => t.stop()); stopTracking(); stopSignRecognition(); };
  }, [stopTracking, stopSignRecognition]);

  useEffect(() => {
    if (cameraReady && isLoaded && mode === 'draw') startTracking();
  }, [cameraReady, isLoaded, startTracking, mode]);

  useEffect(() => {
    if (mode === 'sign' && cameraReady) startSignRecognition();
    return () => { if (mode === 'sign') stopSignRecognition(); };
  }, [mode, cameraReady, startSignRecognition, stopSignRecognition]);

  const timerMinutes = Math.floor(timeLeft / 60);
  const timerSeconds = timeLeft % 60;
  const timerPct = (timeLeft / TIMER_SECONDS) * 100;

  return (
    <div className="drawing-session">
      {/* Header */}
      <header className="ds-header">
        <div className="ds-header-left">
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/dashboard')}>
            &larr; Dashboard
          </button>
          <div className="ds-divider" />
          <div className="ds-prompt-badge" style={{ '--pc': prompt.color }}>
            <span className="ds-prompt-dot" style={{ background: prompt.color }} />
            <span className="ds-prompt-name">{prompt.title}</span>
          </div>
        </div>

        <div className="ds-header-center">
          <div className="ds-mode-toggle" style={{ marginRight: '8px' }}>
            <button className={`ds-mode-btn ${sessionMode === 'solo' ? 'ds-mode-active' : ''}`}
              onClick={() => setSessionMode('solo')} title="Solo session — private">Solo</button>
            <button className={`ds-mode-btn ${sessionMode === 'live' ? 'ds-mode-active' : ''}`}
              onClick={() => setSessionMode('live')} title="Live session — doctor receives audio interpretation">Live</button>
          </div>
          <div className="ds-mode-toggle">
            <button className={`ds-mode-btn ${mode === 'draw' ? 'ds-mode-active' : ''}`}
              onClick={() => switchMode('draw')}>Draw</button>
            <button className={`ds-mode-btn ${mode === 'sign' ? 'ds-mode-active' : ''}`}
              onClick={() => switchMode('sign')}>Sign</button>
          </div>

          <div className="ds-timer" data-low={timeLeft <= 30}>
            <svg width="24" height="24" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="none" stroke="var(--gray-200)" strokeWidth="3" />
              <circle cx="16" cy="16" r="14" fill="none"
                stroke={timeLeft <= 30 ? 'var(--error)' : 'var(--teal-500)'}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={88} strokeDashoffset={88 * (1 - timerPct / 100)}
                transform="rotate(-90 16 16)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="ds-timer-text">{timerMinutes}:{String(timerSeconds).padStart(2, '0')}</span>
          </div>
        </div>

        <div className="ds-header-right">
          {mode === 'draw' && (
            <>
              <div className="ds-color-strip">
                {BRUSH_COLORS.map((c, i) => (
                  <button key={c.name}
                    className={`ds-color-dot ${selectedColor === i ? 'ds-color-active' : ''}`}
                    style={{ background: c.value }}
                    onClick={() => setSelectedColor(i)}
                    title={c.name}
                  />
                ))}
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => canvasRef.current?.clear()}>Clear</button>
            </>
          )}
          {mode === 'sign' && (
            <button className="btn btn-sm btn-ghost"
              onClick={() => isRecognizing ? stopSignRecognition() : startSignRecognition()}>
              {isRecognizing ? 'Pause' : 'Resume'}
            </button>
          )}
          <button className={`btn btn-sm ${showBrain ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowBrain(!showBrain)} title="Brain Activity">
            Brain
          </button>
          <button className={`btn btn-sm ${showNotes ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowNotes(!showNotes)} title="Caregiver Notes">
            Notes
          </button>
          {mode === 'draw' && (
            <button className="btn btn-sm btn-primary ds-analyze-btn"
              onClick={handleAnalyze} disabled={isProcessing || analysisLoading}>
              {isProcessing ? 'Analyzing...' : 'Done — Analyze'}
            </button>
          )}
          {mode === 'sign' && (
            <button className="btn btn-sm btn-primary"
              onClick={handleSignSpeak} disabled={isProcessing || claudeLoading || recognizedWords.length === 0}>
              {isProcessing ? 'Processing...' : 'Speak'}
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="ds-body">
        {/* LEFT: Video + Canvas */}
        <div className="ds-main-col">
          <div className={`ds-video-card ${mode === 'sign' ? 'ds-sign-video' : ''}`}>
            <div className="ds-recording-bar">
              <span className="ds-rec-dot" />
              <span className="ds-rec-label">Session in Progress</span>
              {!isLoaded && cameraReady && mode === 'draw' && (
                <span className="ds-loading-pill">
                  <motion.span className="ds-mini-spinner" animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
                  Loading hand tracking...
                </span>
              )}
            </div>

            {cameraError ? (
              <div className="ds-camera-fallback">
                <div className="ds-fallback-cam-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <h3>Camera Not Available</h3>
                <p>{cameraError}</p>
                {mode === 'draw' && (
                  <>
                    <p className="ds-fallback-note">You can still draw with your mouse.</p>
                    <div className="ds-mouse-canvas">
                      <DrawingCanvas ref={canvasRef} width={1280} height={720}
                        currentColor={BRUSH_COLORS[selectedColor].value} />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <video ref={videoRef}
                  className={`ds-camera-feed ${mode === 'sign' ? 'ds-sign-cam' : ''}`}
                  autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }}
                />
                {mode === 'draw' && canvasDimensions.width > 0 && (
                  <DrawingCanvas ref={canvasRef}
                    width={canvasDimensions.width} height={canvasDimensions.height}
                    currentColor={BRUSH_COLORS[selectedColor].value}
                  />
                )}
                {mode === 'sign' && (
                  <div className="ds-sign-guide">
                    <motion.div className="ds-sign-frame"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}>
                      <span>Position your hands here</span>
                    </motion.div>
                  </div>
                )}
              </>
            )}

            {!cameraReady && !cameraError && (
              <div className="ds-cam-loading">
                <motion.div className="ds-spinner" animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
                <p>Starting camera...</p>
              </div>
            )}

            {/* Bottom controls */}
            <div className="ds-video-controls">
              <div className="ds-gesture-pills">
                {mode === 'draw' ? (
                  <>
                    <span className="ds-gpill"><span className="ds-gpill-dot" style={{background:'var(--teal-500)'}} />1 finger = Draw</span>
                    <span className="ds-gpill"><span className="ds-gpill-dot" style={{background:'var(--coral-500)'}} />Pinch = Erase</span>
                    <span className="ds-gpill"><span className="ds-gpill-dot" style={{background:'var(--rose-500)'}} />Fist = Clear</span>
                    <span className="ds-gpill"><span className="ds-gpill-dot" style={{background:'var(--lime-500)'}} />5 = Submit</span>
                    <span className="ds-gpill"><span className="ds-gpill-dot" style={{background:'var(--violet-500)'}} />Stamps = Click panel →</span>
                  </>
                ) : (
                  <>
                    <span className="ds-gpill">Sign at camera</span>
                    <span className="ds-gpill">Auto-captures every 3s</span>
                  </>
                )}
              </div>
              {mode === 'draw' && cameraReady && !isProcessing && (
                <button className="btn btn-primary ds-submit-btn" onClick={handleAnalyze}>
                  Done? Submit to AI Analysis
                </button>
              )}
            </div>

            {/* CC bar */}
            {mode === 'draw' && gesture !== 'none' && (
              <div className="ds-cc-bar">
                <GestureIndicator gesture={gesture} isProcessing={isProcessing} inline stampName={stampFeedbackName} />
                <GestureConfidenceBar confidence={gestureConfidence} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Side panels */}
        <div className="ds-side-col">
          {/* Prompt */}
          <AnimatePresence>
            {showPrompt && !isProcessing && mode === 'draw' && (
              <motion.div className="ds-side-card ds-prompt-card"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ delay: 0.5 }}>
                <div className="ds-sc-header">
                  <span>Prompt</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => setShowPrompt(false)}>x</button>
                </div>
                <h3>{prompt.instruction}</h3>
                <p className="ds-prompt-clinical">{prompt.clinical}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stamps panel */}
          {mode === 'draw' && (
            <div className="ds-side-card ds-stamps-card">
              <div className="ds-sc-header">
                <span>Stamps</span>
                <span className="ds-sc-sub">At last canvas point</span>
              </div>
              <div className="ds-stamp-grid">
                {STAMPS.map((stamp) => {
                  return (
                    <button key={stamp.id}
                      className="ds-stamp-btn"
                      onClick={() => {
                        const norm = canvasRef.current?.getLastStampNorm?.();
                        const x = norm ? norm.x : 0.5;
                        const y = norm ? norm.y : 0.5;
                        canvasRef.current?.placeStamp(x, y, stamp.draw);
                      }}>
                      <StampPreview stamp={stamp} />
                      <span className="ds-stamp-name">{stamp.name}</span>
                      <span className="ds-stamp-gesture">click to use</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Brain Activity */}
          <AnimatePresence>
            {showBrain && (
              <motion.div className="ds-side-card ds-brain-card"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}>
                <BrainActivity gesture={gesture} mode={mode}
                  isDrawing={gesture === 'index_up'} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign Language */}
          <AnimatePresence>
            {mode === 'sign' && (
              <motion.div className="ds-side-card"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}>
                <SignLanguagePanel
                  recognizedWords={recognizedWords} currentSign={currentSign}
                  isRecognizing={isRecognizing}
                  onRemoveWord={(i) => setRecognizedWords(prev => prev.filter((_, idx) => idx !== i))}
                  onClearAll={() => { setRecognizedWords([]); setCurrentSign(null); }}
                  onSendMessage={handleSignSpeak}
                  hasWords={recognizedWords.length > 0}
                  embedded
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Caregiver Notes */}
          <AnimatePresence>
            {showNotes && (
              <motion.div className="ds-side-card ds-notes-card"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}>
                <div className="ds-sc-header">
                  <span>Caregiver Notes</span>
                </div>
                <p className="ds-notes-desc">3-tap context for the clinician</p>
                <div className="ds-note-field">
                  <label>Skipped meals?</label>
                  <div className="ds-note-row">
                    {['Yes', 'No'].map(v => (
                      <button key={v} className={`ds-note-btn ${caregiverNote.skippedMeals === v ? 'ds-note-active' : ''}`}
                        onClick={() => setCaregiverNote(n => ({ ...n, skippedMeals: v }))}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className="ds-note-field">
                  <label>Meltdowns today</label>
                  <div className="ds-note-row">
                    {[0, 1, 2, 3, 4, 5].map(v => (
                      <button key={v} className={`ds-note-btn ${caregiverNote.meltdowns === v ? 'ds-note-active' : ''}`}
                        onClick={() => setCaregiverNote(n => ({ ...n, meltdowns: v }))}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className="ds-note-field">
                  <label>Sleep quality</label>
                  <div className="ds-note-row">
                    {['Bad', 'OK', 'Good'].map(v => (
                      <button key={v} className={`ds-note-btn ${caregiverNote.sleep === v ? 'ds-note-active' : ''}`}
                        onClick={() => setCaregiverNote(n => ({ ...n, sleep: v }))}>{v}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== LIVE ANALYSIS PANELS (new) ===== */}

          {/* Emotion Feed */}
          <div className="ds-side-card ds-emotion-card">
            <div className="ds-sc-header">
              <span>Emotion</span>
              <span className="ds-live-badge">Live</span>
            </div>
            {analysisResult ? (
              <div className="ds-emotion-result">
                <span className="ds-emotion-emoji">{analysisResult.feedback_emoji || '🎭'}</span>
                <span className="ds-emotion-label">{analysisResult.indicators?.dominant_mood || 'Processing'}</span>
                <GestureConfidenceBar confidence={analysisResult.stress_score ? analysisResult.stress_score / 10 : 0} />
              </div>
            ) : (
              <div className="ds-emotion-detecting">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Detecting...
                </motion.span>
              </div>
            )}
          </div>

          {/* Session Patterns */}
          <div className="ds-side-card ds-patterns-card">
            <div className="ds-sc-header">
              <span>Session Patterns</span>
            </div>
            <div className="ds-pattern-row">
              <span className="ds-pattern-label">Drawing Speed</span>
              <LiveSparkline data={strokeSpeeds} />
            </div>
            <div className="ds-pattern-row">
              <span className="ds-pattern-label">Coverage</span>
              <CanvasHeatmap grid={coverageGrid} />
            </div>
          </div>

          {/* Progressive SOAP */}
          {analysisResult?.clinical_note && (
            <motion.div className="ds-side-card ds-soap-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}>
              <div className="ds-sc-header">
                <span>Clinical Note</span>
              </div>
              {['S', 'O', 'A', 'P'].map((key, idx) => (
                <div key={key} className="ds-soap-section">
                  <span className="ds-soap-key">{key}</span>
                  <ProgressiveTextStream
                    text={analysisResult.clinical_note[key] || ''}
                    speed={15}
                    isActive={idx === 0}
                  />
                </div>
              ))}
            </motion.div>
          )}

          {/* Voice Output */}
          <div className="ds-side-card ds-voice-card">
            <div className="ds-sc-header">
              <span>Voice</span>
            </div>
            <WaveformAnimation state={voiceState} />
            <button
              className="btn btn-sm btn-outline ds-voice-btn"
              onClick={() => {
                if (analysisResult?.personal_statement) {
                  setVoiceState('loading');
                  // Voice will be connected to useElevenLabs later
                  setTimeout(() => setVoiceState('playing'), 1500);
                  setTimeout(() => setVoiceState('idle'), 5000);
                }
              }}
              disabled={!analysisResult}
            >
              Hear interpretation
            </button>
          </div>
        </div>
      </div>

      {/* Processing overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div className="ds-analyzing-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="ds-analyzing-content">
              <div className="ds-analyze-progress">
                <div className="ds-analyze-bar-track">
                  <motion.div
                    className="ds-analyze-bar-fill"
                    initial={{ width: '0%' }}
                    animate={{ width: `${analyzeProgress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <span className="ds-analyze-pct">{analyzeProgress}%</span>
              </div>
              <h2>{analyzeStage || 'Analyzing...'}</h2>
              <p>{mode === 'draw'
                ? 'Evaluating color patterns, line pressure, symbols, and emotional markers.'
                : 'Converting sign sequences into clinical communications.'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StampPreview({ stamp }) {
  return (
    <canvas
      className="ds-stamp-preview"
      width={80} height={64}
      ref={el => {
        if (el) {
          const ctx = el.getContext('2d');
          ctx.clearRect(0, 0, 80, 64);
          stamp.draw(ctx, 40, 32, 24, '#4B5563');
        }
      }}
    />
  );
}
