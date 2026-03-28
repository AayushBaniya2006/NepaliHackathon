import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import { useMediaPipe } from '../hooks/useMediaPipe';
import './Onboarding.css';

const CONSENT_ITEMS = [
  {
    id: 'nonverbal',
    label: 'I confirm the patient cannot reliably speak or communicate verbally',
    sublabel: 'This triggers Mental Health Parity Act protections for nonverbal individuals',
    required: false,
  },
  {
    id: 'data',
    label: 'Allow anonymized data to improve AI accuracy',
    sublabel: 'No personal info is shared — only drawing patterns help train better screening',
    required: false,
  },
  {
    id: 'disclaimer',
    label: 'I understand this is a screening tool, not a medical diagnosis',
    sublabel: 'Results should be reviewed by a licensed clinician',
    required: true,
  },
];

const CALIBRATION_GESTURES = [
  { id: 'index_up', label: 'Hold up 1 finger', icon: '☝️', hint: 'Raise your index finger' },
  { id: 'fingers_2', label: 'Hold up 2 fingers', icon: '✌️', hint: 'Show a peace sign' },
  { id: 'open_hand', label: 'Show open hand', icon: '🖐️', hint: 'Spread all 5 fingers' },
  { id: 'fist', label: 'Make a fist', icon: '✊', hint: 'Close your hand tightly' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || 'patient';
  const { setProfile, setOnboarded } = useStorage();

  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState({});
  const [name, setName] = useState('');

  // Camera state (step 2)
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const isCaregiver = role === 'caregiver';

  // Camera init for step 2
  useEffect(() => {
    if (step !== 2) return;
    if (streamRef.current) return; // already have a stream
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => setCameraReady(true);
        }
      } catch {
        setCameraError('Camera access denied. You can still use mouse drawing.');
      }
    }
    initCamera();
  }, [step]);

  // Stop camera when leaving step 2
  useEffect(() => {
    if (step !== 2) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setCameraReady(false);
      }
    }
  }, [step]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const canProceed = () => {
    if (step === 1) return consent.disclaimer === true;
    if (step === 2) return cameraReady || cameraError;
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      setProfile({
        role,
        name: name || (isCaregiver ? 'Caregiver' : 'Patient'),
        isNonverbal: consent.nonverbal || false,
        consentData: consent.data || false,
        startDate: new Date().toISOString(),
      });
      setOnboarded(true);
      navigate('/dashboard');
    }
  };

  const toggleConsent = (id) => {
    setConsent(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="onboarding">
      <div className="onboarding-bg">
        <div className="onboarding-orb onboarding-orb-1" />
        <div className="onboarding-orb onboarding-orb-2" />
      </div>

      <div className="onboarding-container">
        {/* Progress */}
        <motion.div className="onboarding-progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
          <span className="progress-label">Step {step} of {TOTAL_STEPS}</span>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Consent */}
          {step === 1 && (
            <motion.div
              key="consent"
              className="onboarding-step"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <div className="step-layout-split">
                <div className="step-header">
                  <div className="step-illustration">
                    <img src="/Untitled design (3)/healthy-brain-boy.svg" alt="Brain character" />
                  </div>
                  <h1>{isCaregiver ? 'Caregiver Setup' : 'Welcome, Let\'s Get Started'}</h1>
                  <p>
                    {isCaregiver
                      ? 'A few quick consents to protect the person you care for.'
                      : 'Just a few things before we begin your first drawing session.'}
                  </p>
                </div>

                <div className="consent-list">
                  {CONSENT_ITEMS.map((item) => {
                    if (item.id === 'nonverbal' && !isCaregiver) return null;
                    return (
                      <button
                        key={item.id}
                        className={`consent-item ${consent[item.id] ? 'consent-checked' : ''}`}
                        onClick={() => toggleConsent(item.id)}
                      >
                        <div className={`consent-checkbox ${consent[item.id] ? 'checked' : ''}`}>
                          {consent[item.id] && '✓'}
                        </div>
                        <div className="consent-text">
                          <span className="consent-label">
                            {item.label}
                            {item.required && <span className="consent-required">*</span>}
                          </span>
                          <span className="consent-sublabel">{item.sublabel}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Camera Permission */}
          {step === 2 && (
            <motion.div
              key="camera"
              className="onboarding-step"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <div className="step-header">
                <div className="step-illustration">
                  <img src="/Untitled design (3)/sporty-brain.svg" alt="Camera access" />
                </div>
                <h1>Camera Access</h1>
                <p>We use your camera so you can draw with hand gestures. Nothing is recorded without your knowledge.</p>
              </div>

              <div className="camera-preview-container">
                {cameraError ? (
                  <div className="camera-error-box">
                    <p>{cameraError}</p>
                    <p className="camera-error-hint">You can still draw with your mouse in the drawing session.</p>
                  </div>
                ) : cameraReady ? (
                  <div className="camera-preview-box">
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxWidth: 480, borderRadius: 12, transform: 'scaleX(-1)' }} />
                    <p className="camera-success">Camera connected successfully!</p>
                  </div>
                ) : (
                  <div className="camera-loading-box">
                    <p>Requesting camera access...</p>
                    <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Profile */}
          {step === 3 && (
            <motion.div
              key="profile"
              className="onboarding-step"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <div className="step-layout-split">
                <div className="profile-main">
                  <div className="step-header">
                    <div className="step-illustration">
                      <img src="/Untitled design (3)/rainbow-mental-health.svg" alt="Profile" />
                    </div>
                    <h1>Almost there!</h1>
                    <p>
                      {isCaregiver
                        ? 'What should we call you? This helps personalize the experience.'
                        : 'Add a name so we can greet you.'}
                    </p>
                  </div>

                  <div className="profile-form">
                    <div className="form-group">
                      <label className="form-label" htmlFor="name">
                        {isCaregiver ? 'Your name (caregiver)' : 'Your name or nickname'}
                      </label>
                      <input
                        id="name"
                        type="text"
                        className="form-input profile-input"
                        placeholder={isCaregiver ? 'Sarah' : 'Alex'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                <div className="onboarding-preview">
                  <div className="preview-card">
                    <span className="preview-emoji">🖼️</span>
                    <h3>Your first week</h3>
                    <p>Point your finger at the webcam to draw. 5 guided prompts, 3x per week.</p>
                    <div className="preview-prompts">
                      <span>⚡ Energy</span>
                      <span>🫂 Body</span>
                      <span>🌤️ Weather</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="onboarding-actions">
          {step > 1 && (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}
          <button className="btn btn-lg btn-primary" onClick={handleNext} disabled={!canProceed()}>
            {step === TOTAL_STEPS ? 'Start Drawing →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
