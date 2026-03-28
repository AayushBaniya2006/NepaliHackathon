import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import VoicePlayer from '../components/VoicePlayer';
import SOAPNote from '../components/SOAPNote';
import BrainVisualization from '../components/BrainVisualization';
import StepTracker from '../components/StepTracker';
import DoctorGuide from '../components/DoctorGuide';
import { useElevenLabs } from '../hooks/useElevenLabs';
import { exportClinicalNotePDF } from '../utils/pdfExport';
import './Results.css';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, canvasImage, signedWords } = location.state || {};
  const [clinicalNote, setClinicalNote] = useState(result?.clinical_note || {});

  const {
    speak, replay, stop, isPlaying, loading: voiceLoading,
    voices, selectedVoice, setSelectedVoice,
    volume, updateVolume, isMuted, toggleMute,
  } = useElevenLabs();

  // Redirect if no result
  useEffect(() => {
    if (!result) {
      navigate('/canvas');
    }
  }, [result, navigate]);

  // Auto-play voice on mount (ON HOLD)
  /*
  useEffect(() => {
    if (result?.personal_statement) {
      const timer = setTimeout(() => {
        speak(result.personal_statement);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [result?.personal_statement]); // eslint-disable-line react-hooks/exhaustive-deps
  */

  if (!result) return null;

  const handleDownloadPDF = () => {
    exportClinicalNotePDF(clinicalNote, result.personal_statement);
  };

  // Detect emotion from the personal statement for brain visualization
  const detectedEmotion = useMemo(() => {
    if (!result?.personal_statement) return null;
    const text = result.personal_statement.toLowerCase();
    if (text.includes('anxious') || text.includes('anxiety') || text.includes('worried') || text.includes('nervous')) return 'anxiety';
    if (text.includes('sad') || text.includes('lonely') || text.includes('grief') || text.includes('empty')) return 'sadness';
    if (text.includes('angry') || text.includes('frustrated') || text.includes('rage')) return 'anger';
    if (text.includes('afraid') || text.includes('fear') || text.includes('scared') || text.includes('terror')) return 'fear';
    if (text.includes('calm') || text.includes('peace') || text.includes('serene') || text.includes('hope')) return 'calm';
    if (text.includes('happy') || text.includes('joy') || text.includes('excited') || text.includes('grateful')) return 'joy';
    return 'anxiety'; // default for mental health context
  }, [result?.personal_statement]);

  return (
    <div className="results-page">
      <StepTracker currentStep="results" />
      <div className="results-bg">
        <div className="results-orb orb-teal" />
        <div className="results-orb orb-amber" />
      </div>

      <div className="container results-container">
        {/* Floating Doctor Guide */}
        <div className="results-guide-wrapper">
          <DoctorGuide phase="results" />
        </div>
        
        {/* Header */}
        <motion.div
          className="results-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/canvas')}>
            ← {signedWords ? 'Sign Again' : 'Draw Again'}
          </button>
          <div className="results-brand">
            <span>🎨</span> VoiceCanvas
          </div>
        </motion.div>

        {/* Personal Statement — hero section */}
        <motion.div
          className="personal-statement glass"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {canvasImage && (
            <div className="statement-drawing">
              <img src={canvasImage} alt="Your drawing" className="drawing-preview" />
            </div>
          )}
          {signedWords && (
            <div className="statement-signs">
              <div className="signed-words-display">
                <span className="signed-via">🤟 Signed via ASL:</span>
                <div className="signed-chips">
                  {signedWords.map((w, i) => (
                    <span key={i} className="signed-chip">{w}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="statement-text">
            <h2 className="statement-label">
              {signedWords ? 'Your Signed Message' : 'Your Expression'}
            </h2>
            <p className="statement-content">"{result.personal_statement}"</p>
          </div>
        </motion.div>

        {/* Voice Player (ON HOLD) */}
        {/*
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <VoicePlayer
            isPlaying={isPlaying}
            loading={voiceLoading}
            onReplay={replay}
            onStop={stop}
            voices={voices}
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
            volume={volume}
            onVolumeChange={updateVolume}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        </motion.div>
        */}
        <div className="voice-hold-notice">
          <span>🔇 Voice playback on hold for clinical focus</span>
        </div>

        {/* Clinical Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <SOAPNote
            clinicalNote={clinicalNote}
            onUpdate={setClinicalNote}
          />
        </motion.div>

        {/* Brain Visualization */}
        <motion.div
          className="brain-results-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
        >
          <h3 className="brain-section-title">🧠 Neural Response Visualization</h3>
          <p className="brain-section-desc">
            Based on your expression, here's how your brain areas may be responding:
          </p>
          <div className="brain-inline-container">
            <BrainVisualization
              activity="emotional"
              emotion={detectedEmotion}
              isVisible={true}
              compact={false}
            />
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="results-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <button
            className="btn btn-amber btn-lg action-card"
            onClick={() => navigate('/insurance', { state: { result, clinicalNote } })}
            id="fill-insurance-btn"
          >
            <span className="action-icon">📋</span>
            <span className="action-text">
              <strong>Fill Insurance Form</strong>
              <small>Auto-populated from your note</small>
            </span>
          </button>

          <button
            className="btn btn-primary btn-lg action-card"
            onClick={() => navigate('/resources')}
            id="find-care-btn"
          >
            <span className="action-icon">🏥</span>
            <span className="action-text">
              <strong>Find Free Care</strong>
              <small>Local clinics & resources</small>
            </span>
          </button>
        </motion.div>

        {/* PDF Download */}
        <motion.div
          className="download-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <button className="btn btn-sm btn-secondary" onClick={handleDownloadPDF}>
            📥 Download Clinical Note as PDF
          </button>
        </motion.div>
      </div>
    </div>
  );
}
