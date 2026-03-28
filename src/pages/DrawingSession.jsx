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
import { isAzureUploadConfigured, uploadSessionReplayToAzure } from '../utils/azureBlob';
import './DrawingSession.css';

const VOICECANVAS_PATIENT_ID = import.meta.env.VITE_VOICECANVAS_PATIENT_ID?.trim() || 'pt-001';

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

export default function DrawingSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const promptId = location.state?.promptId || 'energy';
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
  const [recognizedWords, setRecognizedWords] = useState([]);
  const [currentSign, setCurrentSign] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const signIntervalRef = useRef(null);
  const isRecognizingRef = useRef(false);

  const [showNotes, setShowNotes] = useState(false);
  const [caregiverNote, setCaregiverNote] = useState({
    skippedMeals: null, meltdowns: 0, sleep: null,
  });

  const stampCooldownRef = useRef(false);
  const webcamFramesRef = useRef([]);
  const webcamIntervalRef = useRef(null);
  const strokeDataRef = useRef([]);
  const sessionStartTime = useRef(Date.now());

  const handleStrokePoint = useCallback((point) => {
    strokeDataRef.current.push(point);
  }, []);

  const { recognizeSign, interpretSignMessage, loading: claudeLoading } = useClaude();
  const { analyzeDrawing, loading: analysisLoading } = useAnalysis();
  const { profile, saveSession, saveAnalytics } = useStorage();
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setTimerActive(false); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    const timer = setTimeout(() => setShowPrompt(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleGesture = useCallback(async (detectedGesture, fingertip) => {
    setGesture(detectedGesture);
    if (mode !== 'draw') return;

    if (detectedGesture === 'index_up' && fingertip) {
      canvasRef.current?.drawAt(fingertip.x, fingertip.y);
    } else if (detectedGesture === 'pinch' && fingertip) {
      canvasRef.current?.eraseAt(fingertip.x, fingertip.y);
      canvasRef.current?.resetPrevPoint();
    } else if (['fingers_2', 'fingers_3', 'fingers_4'].includes(detectedGesture) && fingertip) {
      if (!stampCooldownRef.current) {
        const stamp = getStampByGesture(detectedGesture);
        if (stamp) {
          canvasRef.current?.placeStamp(fingertip.x, fingertip.y, stamp.draw);
          stampCooldownRef.current = true;
          setTimeout(() => { stampCooldownRef.current = false; }, 800);
        }
      }
      canvasRef.current?.resetPrevPoint();
    } else if (!['index_up', 'pinch', 'fingers_2', 'fingers_3', 'fingers_4'].includes(detectedGesture)) {
      canvasRef.current?.resetPrevPoint();
    }

    if (detectedGesture === 'fist') canvasRef.current?.clear();
    if (detectedGesture === 'speak') await handleAnalyze();
  }, [mode]);

  const stopRecorderAndGetBlob = useCallback(() => {
    return new Promise((resolve) => {
      const state = mediaRecorderRef.current;
      if (!state?.recorder || state.recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      const { recorder, chunks, mimeType } = state;
      recorder.onstop = () => {
        const blob = chunks.length ? new Blob(chunks, { type: mimeType || 'video/webm' }) : null;
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  const handleAnalyze = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) { setIsProcessing(false); return; }

    const videoBlob = await stopRecorderAndGetBlob();
    const sessionId = Date.now();

    const result = await analyzeDrawing(dataUrl, promptId, prompt.title);
    if (result) {
      saveSession({
        id: sessionId,
        promptId,
        imageUrl: dataUrl,
        stressScore: result.stress_score,
        feedbackShort: result.feedback_short,
        caregiverNote,
        webcamFrames: webcamFramesRef.current,
        strokeData: strokeDataRef.current,
      });
      saveAnalytics({
        promptId,
        stressScore: result.stress_score,
        indicators: result.indicators,
        pattern: result.pattern,
        thresholdMet: result.threshold_met,
      });

      if (isAzureUploadConfigured() && videoBlob?.size) {
        uploadSessionReplayToAzure({
          patientId: VOICECANVAS_PATIENT_ID,
          sessionId,
          videoBlob,
          meta: {
            promptTitle: prompt.title,
            promptId,
            sessionDate: new Date().toISOString(),
            stressScore: result.stress_score,
            patientName: profile?.name ?? null,
          },
        }).catch((err) => console.warn('Azure replay upload failed:', err));
      }

      navigate('/session-results', { state: { result, canvasImage: dataUrl, promptId } });
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

  // Webcam frame capture every 3 seconds for facial analysis
  useEffect(() => {
    if (!cameraReady || !videoRef.current) return;
    webcamIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      tempCanvas.getContext('2d').drawImage(video, 0, 0);
      webcamFramesRef.current.push({
        image: tempCanvas.toDataURL('image/jpeg', 0.5),
        timestamp: Date.now() - sessionStartTime.current,
      });
    }, 3000);
    return () => {
      if (webcamIntervalRef.current) clearInterval(webcamIntervalRef.current);
    };
  }, [cameraReady]);

  useEffect(() => {
    if (!cameraReady || !videoRef.current?.srcObject || typeof MediaRecorder === 'undefined') return;
    const stream = videoRef.current.srcObject;
    let mimeType = '';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) mimeType = 'video/webm;codecs=vp9';
    else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) mimeType = 'video/webm;codecs=vp8';
    else if (MediaRecorder.isTypeSupported('video/webm')) mimeType = 'video/webm';
    else return;

    const chunks = [];
    const mr = new MediaRecorder(stream, { mimeType });
    mr.ondataavailable = (e) => {
      if (e.data?.size > 0) chunks.push(e.data);
    };
    try {
      mr.start(1000);
    } catch (e) {
      console.warn('MediaRecorder could not start', e);
      return;
    }
    mediaRecorderRef.current = { recorder: mr, chunks, mimeType };

    return () => {
      if (mr.state === 'recording') mr.stop();
      mediaRecorderRef.current = null;
    };
  }, [cameraReady]);

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

  const activeStampName = (() => {
    const stamp = getStampByGesture(gesture);
    return stamp ? stamp.name : '';
  })();

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
                        currentColor={BRUSH_COLORS[selectedColor].value}
                        onStrokePoint={handleStrokePoint} />
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
                    onStrokePoint={handleStrokePoint}
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
                    <span className="ds-gpill"><span className="ds-gpill-dot" style={{background:'var(--violet-500)'}} />2 = Person</span>
                    <span className="ds-gpill"><span className="ds-gpill-dot" style={{background:'var(--violet-400)'}} />3 = Tree</span>
                    <span className="ds-gpill"><span className="ds-gpill-dot" style={{background:'var(--sky-500)'}} />4 = Heart</span>
                    <span className="ds-gpill"><span className="ds-gpill-dot" style={{background:'var(--rose-500)'}} />Fist = Clear</span>
                    <span className="ds-gpill"><span className="ds-gpill-dot" style={{background:'var(--lime-500)'}} />5 = Submit</span>
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
                <GestureIndicator gesture={gesture} isProcessing={isProcessing} inline stampName={activeStampName} />
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
                <span className="ds-sc-sub">Show fingers to place</span>
              </div>
              <div className="ds-stamp-grid">
                {STAMPS.map((stamp) => {
                  const gestureLabel = stamp.fingerCount ? `${stamp.fingerCount} fingers` : 'tap to use';
                  const isGestureStamp = stamp.gesture !== 'manual';
                  return (
                    <button key={stamp.id}
                      className={`ds-stamp-btn ${isGestureStamp ? 'ds-stamp-gesture-bound' : ''}`}
                      onClick={() => {
                        if (stamp.gesture === 'manual') {
                          const centerX = 0.5;
                          const centerY = 0.5;
                          canvasRef.current?.placeStamp(centerX, centerY, stamp.draw);
                        }
                      }}>
                      <StampPreview stamp={stamp} />
                      <span className="ds-stamp-name">{stamp.name}</span>
                      <span className="ds-stamp-gesture">{gestureLabel}</span>
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
        </div>
      </div>

      {/* Processing overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div className="ds-analyzing-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="ds-analyzing-content">
              <motion.div className="ds-analyzing-spinner" animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
              <h2>{mode === 'draw' ? 'AI is analyzing your drawing...' : 'Interpreting your signs...'}</h2>
              <p>{mode === 'draw' ? 'Evaluating color patterns, line pressure, symbols, and emotional markers.' : 'Converting sign sequences into clinical communications.'}</p>
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
