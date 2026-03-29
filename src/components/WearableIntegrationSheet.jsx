import { useState } from 'react';
import { motion } from 'framer-motion';
import { generateFHIRObservation, downloadFHIRJSON } from '../utils/fhirExport';
import './WearableIntegrationSheet.css';

/** Apple logo (Wikimedia Commons — same mark used across many integration UIs). */
const APPLE_LOGO_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg';

const PLATFORMS = [
  {
    id: 'apple',
    logoUrl: APPLE_LOGO_SRC,
    logoAlt: 'Apple',
    name: 'Apple Health & Apple Watch',
    desc:
      'On iPhone, a MindCanvas companion app can sync session metrics to HealthKit. From the web, export the FHIR file below for compatible clinical or research tools.',
  },
  {
    id: 'google',
    icon: '📱',
    name: 'Google Fit & Android wearables',
    desc:
      'Standard wellness exports (JSON) can be ingested by supported apps. Full auto-sync ships with the Android companion.',
  },
  {
    id: 'other-wearables',
    icon: '⌚',
    name: 'Fitbit, Garmin, Oura & others',
    desc:
      'Many devices accept custom wellness data via partner APIs. Use the exports below as a bridge until direct OAuth integrations are enabled.',
  },
];

const INITIAL_LINKED = Object.fromEntries(PLATFORMS.map((p) => [p.id, false]));

function buildAnalysisForFhir(result) {
  return {
    stress_score: result?.stress_score ?? 0,
    indicators: result?.indicators ?? {},
    pattern: result?.pattern ?? '',
    threshold_met: Boolean(result?.threshold_met),
    diagnosis: result?.diagnosis,
    plan: result?.clinical_note?.plan,
  };
}

function downloadWellnessJson(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindcanvas-wellness-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function WearableIntegrationSheet({ onClose, result, canvasImage, profile, patientId }) {
  const [linked, setLinked] = useState(() => ({ ...INITIAL_LINKED }));

  const togglePlatform = (id) => {
    setLinked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFhir = () => {
    const observation = generateFHIRObservation(
      buildAnalysisForFhir(result),
      canvasImage ? [canvasImage] : [],
      { name: profile?.name || 'Patient', id: patientId || 'pt-001' }
    );
    downloadFHIRJSON(observation);
  };

  const handleWellness = () => {
    const cn = result?.clinical_note;
    downloadWellnessJson({
      schema: 'mindcanvas.wellness.v1',
      exportedAt: new Date().toISOString(),
      patientDisplay: profile?.name || null,
      stressScore: result?.stress_score ?? null,
      sessionIndicators: result?.indicators ?? {},
      clinicalSoap: cn
        ? {
            subjective: cn.subjective,
            objective: cn.objective,
            assessment: cn.assessment,
            plan: cn.plan,
          }
        : null,
      personalStatement: result?.personal_statement || null,
      note:
        'For Apple Health, Google Fit, and wearable ecosystems: import via a supported bridge app or your care team’s FHIR tools. Not a medical device output.',
    });
  };

  return (
    <motion.div
      className="wis-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="wis-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wis-handle" />

        <div className="wis-header">
          <div className="wis-header-text">
            <h2 className="wis-title">Health & wearables</h2>
            <p className="wis-subtitle">
              Connect this session to Apple Health, Google Fit, and other wearable platforms. Browsers cannot open HealthKit
              directly—use exports for your care team or a companion app.
            </p>
          </div>
          <button type="button" className="wis-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="wis-scroll">
          <div className="wis-platforms">
            {PLATFORMS.map((p) => (
              <div key={p.id} className="wis-platform">
                <div className="wis-platform-main">
                  <span className="wis-platform-icon-slot" aria-hidden={p.logoUrl ? undefined : true}>
                    {p.logoUrl ? (
                      <img
                        src={p.logoUrl}
                        alt={p.logoAlt || ''}
                        className="wis-platform-logo wis-platform-logo--apple"
                        width={28}
                        height={34}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="wis-platform-emoji">{p.icon}</span>
                    )}
                  </span>
                  <div className="wis-platform-body">
                    <h3>{p.name}</h3>
                    <p>{p.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={`wis-enable-btn${linked[p.id] ? ' wis-enable-btn--on' : ''}`}
                  onClick={() => togglePlatform(p.id)}
                  aria-pressed={linked[p.id]}
                >
                  {linked[p.id] ? 'Connected' : 'Enable'}
                </button>
              </div>
            ))}
          </div>

          <div className="wis-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={handleFhir}>
              Download FHIR observation (EHR / research)
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={handleWellness}>
              Download wellness bundle (JSON)
            </button>
          </div>

          <p className="wis-foot">
            Not a medical diagnosis. Wearable and health-app sharing should follow your clinician’s guidance and device privacy
            settings.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
