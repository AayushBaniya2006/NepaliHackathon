import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPromptById } from '../utils/drawingPrompts';
import { exportClinicalNotePDF } from '../utils/pdfExport';
import { useStorage } from '../hooks/useStorage';
import { useElevenLabs } from '../hooks/useElevenLabs';
import { isAzureUploadConfigured, uploadSessionReplayToAzure } from '../utils/azureBlob';
import DoctorSelector from '../components/DoctorSelector';
import WearableIntegrationSheet from '../components/WearableIntegrationSheet';
import './SessionResults.css';

const VOICECANVAS_PATIENT_ID = import.meta.env.VITE_VOICECANVAS_PATIENT_ID?.trim() || 'pt-001';

export default function SessionResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, canvasImage, promptId, liveMode } = location.state || {};
  const prompt = getPromptById(promptId);
  const { profile, sessions } = useStorage();
  const { speak: elevenSpeak } = useElevenLabs();

  const [shared, setShared] = useState(false);
  const [voiceLang, setVoiceLang] = useState('patient'); // 'patient' | 'en'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDoctorSelector, setShowDoctorSelector] = useState(false);
  const [showWearableSheet, setShowWearableSheet] = useState(false);
  const [connectedDoctor, setConnectedDoctor] = useState(null); // doctor object after connecting

  useEffect(() => {
    if (!result) navigate('/dashboard');
  }, [result, navigate]);

  // Check if already shared (informational only — does not disable the button)
  useEffect(() => {
    if (!result) return;
    const latest = sessions[sessions.length - 1];
    if (latest?.sharedWithDoctor) setShared(true);
  }, [result, sessions]);

  // Auto-play personal statement via ElevenLabs on load
  useEffect(() => {
    if (!result?.personal_statement) return;
    const text = liveMode
      ? (result.personal_statement_en || result.personal_statement)
      : result.personal_statement;
    const timer = setTimeout(() => elevenSpeak(text), 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerAzureShare = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mc_sessions') || '[]');
      if (stored.length > 0) {
        stored[stored.length - 1].sharedWithDoctor = true;
        localStorage.setItem('mc_sessions', JSON.stringify(stored));
      }
    } catch { /* ignore */ }
    setShared(true);

    // Re-upload drawing to Azure so the doctor always gets the latest version
    if (canvasImage && isAzureUploadConfigured()) {
      const latest = sessions[sessions.length - 1];
      const sessionId = latest?.id ?? Date.now();
      uploadSessionReplayToAzure({
        patientId: VOICECANVAS_PATIENT_ID,
        sessionId,
        videoBlob: null,
        canvasDataUrl: canvasImage,
        meta: {
          promptTitle: prompt?.title ?? '',
          promptId: promptId ?? '',
          sessionDate: latest?.timestamp ?? new Date().toISOString(),
          stressScore: result?.stress_score ?? null,
          patientName: profile?.name ?? null,
        },
      }).catch((err) => console.warn('Azure re-upload on share failed:', err));
    }
  }, [canvasImage, sessions, result, profile, prompt, promptId]);

  const handleConnectDoctor = useCallback((doctor) => {
    // Trigger the actual data share regardless of which doctor was selected
    triggerAzureShare();
    setConnectedDoctor(doctor);
    setShowDoctorSelector(false);
  }, [triggerAzureShare]);

  const handleSpeak = useCallback((lang) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const text = lang === 'en'
      ? (result?.personal_statement_en || result?.personal_statement || '')
      : (result?.personal_statement || '');

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    if (lang === 'en') {
      utterance.lang = 'en-US';
    } else if (profile?.language) {
      const langMap = { ne: 'ne-NP', es: 'es-ES', zh: 'zh-CN', hi: 'hi-IN', ar: 'ar-SA', fr: 'fr-FR', pt: 'pt-BR', tl: 'fil-PH', vi: 'vi-VN', ko: 'ko-KR', so: 'so-SO' };
      utterance.lang = langMap[profile.language] || 'en-US';
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setVoiceLang(lang);
    window.speechSynthesis.speak(utterance);
  }, [result, profile]);

  const handleStopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  if (!result) return null;

  const score = result.stress_score || 0;
  const scoreColor = score >= 7 ? 'var(--error)' : score >= 5 ? 'var(--warning)' : 'var(--success)';
  const scoreLabel = score >= 7 ? 'High Stress' : score >= 5 ? 'Moderate' : 'Low Stress';

  const handleDownloadPDF = () => {
    if (result.clinical_note) {
      exportClinicalNotePDF(
        {
          S: result.clinical_note.subjective,
          O: result.clinical_note.objective,
          A: result.clinical_note.assessment,
          P: result.clinical_note.plan,
        },
        result.personal_statement
      );
    }
  };

  const indicators = result.indicators || {};

  return (
    <div className="session-results">
      <div className="container-narrow">
        {/* Header */}
        <motion.div
          className="sr-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
          <div className="sr-brand">
            <span>🎨</span> MindCanvas
          </div>
        </motion.div>

        {/* Live mode indicator */}
        {liveMode && (
          <motion.div
            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '0.875rem', color: '#1D4ED8' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>🎙️</span>
            <span><strong>Live Session</strong> — English interpretation auto-played for your clinician.</span>
          </motion.div>
        )}

        {/* Connected doctor confirmation banner */}
        <AnimatePresence>
          {connectedDoctor && (
            <motion.div
              className="sr-connected-banner"
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <span className="sr-connected-icon" aria-hidden />
              <div>
                <strong>Session sent to {connectedDoctor.name}</strong>
                <p>
                  {connectedDoctor.country} · {connectedDoctor.org} ·{' '}
                  <span className="sr-connected-langs">{connectedDoctor.languages.join(', ')}</span>
                </p>
                <p className="sr-connected-eta">
                  Expect a secure message within 24 hours. This consultation is {connectedDoctor.freeLabel.toLowerCase()}.
                </p>
              </div>
              <button
                className="sr-connected-resend"
                onClick={() => setShowDoctorSelector(true)}
                title="Send to a different doctor"
              >
                Change
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instant feedback hero */}
        <motion.div
          className="sr-feedback-hero"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="sr-drawing-preview">
            {canvasImage && <img src={canvasImage} alt="Your drawing" />}
          </div>

          <div className="sr-feedback-content">
            <span className="sr-feedback-badge" style={{ '--fb-color': prompt?.color || 'var(--blue-500)' }}>
              {result.feedback_emoji || '🔍'} {prompt?.title || 'Drawing'}
            </span>
            <p className="sr-feedback-text">{result.feedback_short || 'Analysis complete'}</p>
          </div>
        </motion.div>

        {/* Stress Score */}
        <motion.div
          className="sr-score-card card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="sr-score-display">
            <div className="sr-score-circle" style={{ '--sc': scoreColor }}>
              <span className="sr-score-num">{score.toFixed(1)}</span>
              <span className="sr-score-max">/10</span>
            </div>
            <div className="sr-score-meta">
              <h2 style={{ color: scoreColor }}>{scoreLabel}</h2>
              <p className="sr-pattern">{result.pattern}</p>
              {result.threshold_met && (
                <span className="badge badge-red">
                  🚨 Clinical pattern detected — Evidence threshold met
                </span>
              )}
            </div>
          </div>

          {/* Indicators grid */}
          <div className="sr-indicators">
            <div className="sr-indicator">
              <span className="ind-label">Red %</span>
              <div className="ind-bar">
                <div className="ind-fill" style={{ width: `${indicators.red_pct || 0}%`, background: '#EF4444' }} />
              </div>
              <span className="ind-val">{indicators.red_pct || 0}%</span>
            </div>
            <div className="sr-indicator">
              <span className="ind-label">Black %</span>
              <div className="ind-bar">
                <div className="ind-fill" style={{ width: `${indicators.black_pct || 0}%`, background: '#1A1A2E' }} />
              </div>
              <span className="ind-val">{indicators.black_pct || 0}%</span>
            </div>
            <div className="sr-indicator">
              <span className="ind-label">Isolation</span>
              <div className="ind-bar">
                <div className="ind-fill" style={{ width: `${(indicators.isolation || 0) * 20}%`, background: '#8B5CF6' }} />
              </div>
              <span className="ind-val">{indicators.isolation || 0}/5</span>
            </div>
            <div className="sr-indicator">
              <span className="ind-label">Pressure</span>
              <span className={`ind-tag ${indicators.line_pressure === 'heavy' ? 'ind-tag-red' : indicators.line_pressure === 'medium' ? 'ind-tag-yellow' : 'ind-tag-green'}`}>
                {indicators.line_pressure || 'N/A'}
              </span>
            </div>
            <div className="sr-indicator">
              <span className="ind-label">Mood</span>
              <span className="ind-tag">{indicators.dominant_mood || 'N/A'}</span>
            </div>
            <div className="sr-indicator">
              <span className="ind-label">Somatic</span>
              <span className={`ind-tag ${indicators.somatic ? 'ind-tag-red' : 'ind-tag-green'}`}>
                {indicators.somatic ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Personal Statement + Voice */}
        <motion.div
          className="sr-statement card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="sr-section-label">Your Expression — In Words</h3>
          <blockquote className="sr-quote">
            "{voiceLang === 'en' && result.personal_statement_en
              ? result.personal_statement_en
              : result.personal_statement}"
          </blockquote>

          <div className="sr-voice-controls">
            {isSpeaking ? (
              <button className="btn btn-sm btn-secondary" onClick={handleStopSpeaking}>
                Stop
              </button>
            ) : (
              <button className="btn btn-sm btn-primary" onClick={() => handleSpeak(voiceLang)}>
                Listen
              </button>
            )}
            <button
              className={`btn btn-sm ${voiceLang === 'patient' ? 'btn-outline sr-lang-active' : 'btn-ghost'}`}
              onClick={() => { setVoiceLang('patient'); if (isSpeaking) handleSpeak('patient'); }}
            >
              My Language
            </button>
            <button
              className={`btn btn-sm ${voiceLang === 'en' ? 'btn-outline sr-lang-active' : 'btn-ghost'}`}
              onClick={() => { setVoiceLang('en'); if (isSpeaking) handleSpeak('en'); }}
            >
              Hear in English
            </button>
          </div>
        </motion.div>

        {/* Crisis Banner */}
        {(score >= 8 || result.crisis_flag) && (
          <motion.div
            className="sr-crisis-banner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <p className="sr-crisis-text">It sounds like you're going through a lot. You don't have to face this alone.</p>
            <div className="sr-crisis-actions">
              <a href="tel:988" className="btn btn-sm btn-primary">Call 988</a>
              <a href="sms:741741&body=HOME" className="btn btn-sm btn-secondary">Text HOME to 741741</a>
            </div>
          </motion.div>
        )}

        {/* Clinical Note */}
        {result.clinical_note && (
          <motion.div
            className="sr-clinical card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="sr-section-label">Clinical SOAP Note</h3>
            {['subjective', 'objective', 'assessment', 'plan'].map(key => (
              <div key={key} className="soap-entry">
                <span className="soap-key">{key.charAt(0).toUpperCase()} — {key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <p className="soap-value">{result.clinical_note[key]}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="sr-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>

          {/* Doctor connect button — Uber-style trigger */}
          <button
            className="btn btn-secondary sr-send-doctor-btn"
            onClick={() => setShowDoctorSelector(true)}
          >
            {connectedDoctor
              ? `Connected: ${connectedDoctor.name.replace(/,?\s*(MD|DO|PhD|PsyD|RN|NP|LCSW|LPC|LMFT)\.?$/gi, '').trim().split(' ').slice(-1)[0]}`
              : shared
                ? 'Send to Another Doctor'
                : 'Send to a Doctor'}
          </button>

          <button className="btn btn-outline" onClick={() => handleSpeak(voiceLang)}>
            Listen Again
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadPDF}>
            Download Clinical PDF
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowWearableSheet(true)}
          >
            Add to Health & wearables
          </button>
        </motion.div>

        <p className="sr-disclaimer">
          Demo only — Not a medical diagnosis. Results should be reviewed by a licensed clinician.
        </p>
      </div>

      {/* Doctor Selector bottom sheet */}
      <AnimatePresence>
        {showDoctorSelector && (
          <DoctorSelector
            stressScore={score}
            onClose={() => setShowDoctorSelector(false)}
            onConnect={handleConnectDoctor}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWearableSheet && (
          <WearableIntegrationSheet
            onClose={() => setShowWearableSheet(false)}
            result={result}
            canvasImage={canvasImage}
            profile={profile}
            patientId={VOICECANVAS_PATIENT_ID}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
