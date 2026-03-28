import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import { useElevenLabs } from '../hooks/useElevenLabs';
import { DRAWING_PROMPTS } from '../utils/drawingPrompts';
import { generateFHIRObservation, generateEHRNote, downloadFHIRJSON } from '../utils/fhirExport';
import { exportClinicalNotePDF } from '../utils/pdfExport';
import './ClinicianDashboard.css';

export default function ClinicianDashboard() {
  const navigate = useNavigate();
  const { profile, sessions, analytics, getAverageStress } = useStorage();
  const [showFHIR, setShowFHIR] = useState(false);
  const [generatedFHIR, setGeneratedFHIR] = useState(null);

  const avgStress = getAverageStress();
  const totalSessions = sessions.length;
  const { speak: elevenSpeak, isPlaying: elevenPlaying, stop: elevenStop } = useElevenLabs();

  const stressTrend = useMemo(() => {
    return analytics.map((a, i) => ({
      index: i,
      score: a.stressScore || 0,
      date: new Date(a.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      promptId: a.promptId,
    }));
  }, [analytics]);

  const topFlags = useMemo(() => {
    const counts = {};
    analytics.forEach(a => {
      if (a.indicators) {
        if ((a.indicators.isolation || 0) >= 3) counts['Isolation'] = (counts['Isolation'] || 0) + 1;
        if ((a.indicators.red_pct || 0) >= 40) counts['High Red'] = (counts['High Red'] || 0) + 1;
        if (a.indicators.somatic) counts['Somatic'] = (counts['Somatic'] || 0) + 1;
        if (a.indicators.line_pressure === 'heavy') counts['Heavy Pressure'] = (counts['Heavy Pressure'] || 0) + 1;
      }
      if (a.thresholdMet) counts['Threshold Met'] = (counts['Threshold Met'] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [analytics]);

  const caregiverNotes = useMemo(() => {
    return sessions.filter(s => s.caregiverNote && (s.caregiverNote.skippedMeals || s.caregiverNote.sleep || s.caregiverNote.meltdowns > 0));
  }, [sessions]);

  const latestAnalysis = analytics.length > 0 ? analytics[analytics.length - 1] : null;

  const handleGenerateEHR = () => {
    if (!latestAnalysis) return;
    const fhir = generateFHIRObservation(
      latestAnalysis,
      sessions.map(s => s.imageUrl).filter(Boolean),
      { name: profile?.name || 'Patient', id: 'demo-001' }
    );
    setGeneratedFHIR(fhir);
    setShowFHIR(true);
  };

  const handleDownloadFHIR = () => {
    if (generatedFHIR) downloadFHIRJSON(generatedFHIR);
  };

  const maxScore = Math.max(...stressTrend.map(s => s.score), 10);

  return (
    <div className="clinician-dash">
      <header className="cd-header">
        <div className="container">
          <div className="cd-header-inner">
            <div className="cd-brand" onClick={() => navigate('/')}>
              <span>👨‍⚕️</span>
              <span className="cd-brand-text">MindCanvas — Clinician Dashboard</span>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/dashboard')}>
              ← Patient View
            </button>
          </div>
        </div>
      </header>

      <main className="container cd-main">
        {/* Patient Summary */}
        <motion.div
          className="cd-patient-card card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="cd-patient-info">
            <div className="cd-avatar">{(profile?.name || 'P').charAt(0).toUpperCase()}</div>
            <div>
              <h2>{profile?.name || 'Patient'}</h2>
              <p className="cd-role">
                {profile?.role === 'caregiver' ? 'Managed by caregiver' : 'Self-reported'}
                {profile?.isNonverbal && ' · Nonverbal (Parity Protected)'}
              </p>
            </div>
          </div>

          <div className="cd-summary-stats">
            <div className="cd-stat">
              <span className="cd-stat-val">{totalSessions}</span>
              <span className="cd-stat-label">Total Sessions</span>
            </div>
            <div className="cd-stat">
              <span className="cd-stat-val" style={{ color: avgStress >= 7 ? 'var(--error)' : avgStress >= 5 ? 'var(--warning)' : 'var(--success)' }}>
                {avgStress.toFixed(1)}
              </span>
              <span className="cd-stat-label">Avg Stress /10</span>
            </div>
            <div className="cd-stat">
              <span className="cd-stat-val">{analytics.filter(a => a.thresholdMet).length}</span>
              <span className="cd-stat-label">Clinical Alerts</span>
            </div>
            <button
              className={`btn btn-sm ${elevenPlaying ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ alignSelf: 'center' }}
              onClick={() => {
                if (elevenPlaying) { elevenStop(); return; }
                const summary = `Clinical summary for ${profile?.name || 'patient'}. ${totalSessions} sessions recorded. Average stress score ${avgStress.toFixed(1)} out of 10. ${analytics.filter(a => a.thresholdMet).length} clinical threshold alerts. ${topFlags.map(([k, v]) => `${k}: ${v} sessions`).join('. ')}.`;
                elevenSpeak(summary);
              }}
              title="Speak English clinical summary"
            >
              {elevenPlaying ? '⏹ Stop' : '🔊 Speak Summary'}
            </button>
          </div>
        </motion.div>

        {totalSessions === 0 ? (
          <motion.div
            className="cd-empty card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="cd-empty-icon">📊</span>
            <h3>No sessions yet</h3>
            <p>Once the patient completes drawing sessions, their data will appear here for clinical review.</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Patient Dashboard →
            </button>
          </motion.div>
        ) : (
          <>
            {/* Stress Trend */}
            <motion.div
              className="cd-chart-card card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="cd-chart-header">
                <h3>Stress Trend</h3>
                <span className="badge badge-blue">{stressTrend.length} data points</span>
              </div>

              <div className="cd-chart">
                <div className="cd-chart-y-axis">
                  <span>10</span>
                  <span>7</span>
                  <span>5</span>
                  <span>0</span>
                </div>
                <div className="cd-chart-area">
                  <div className="cd-threshold-line" style={{ bottom: `${(7 / maxScore) * 100}%` }}>
                    <span>Clinical threshold</span>
                  </div>
                  <div className="cd-bars">
                    {stressTrend.map((point, i) => {
                      const pct = (point.score / maxScore) * 100;
                      const prompt = DRAWING_PROMPTS.find(p => p.id === point.promptId);
                      return (
                        <div key={i} className="cd-bar-col" title={`${point.date}: ${point.score.toFixed(1)}/10`}>
                          <motion.div
                            className="cd-bar"
                            style={{
                              background: point.score >= 7 ? 'var(--error)' : point.score >= 5 ? 'var(--warning)' : 'var(--success)',
                            }}
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                          />
                          <span className="cd-bar-label">{point.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Flags + Caregiver Notes */}
            <div className="cd-two-col">
              <motion.div
                className="cd-flags card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h3>Top Clinical Flags</h3>
                {topFlags.length > 0 ? (
                  <div className="cd-flag-list">
                    {topFlags.map(([flag, count]) => (
                      <div key={flag} className="cd-flag-item">
                        <span className="cd-flag-name">{flag}</span>
                        <div className="cd-flag-bar-track">
                          <div
                            className="cd-flag-bar-fill"
                            style={{ width: `${(count / totalSessions) * 100}%` }}
                          />
                        </div>
                        <span className="cd-flag-count">{count}/{totalSessions}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="cd-no-data">No flags detected yet.</p>
                )}
              </motion.div>

              <motion.div
                className="cd-notes card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3>Caregiver Notes</h3>
                {caregiverNotes.length > 0 ? (
                  <div className="cd-notes-list">
                    {caregiverNotes.slice(-5).reverse().map((s, i) => (
                      <div key={i} className="cd-note-item">
                        <span className="cd-note-date">
                          {new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <div className="cd-note-tags">
                          {s.caregiverNote.skippedMeals && (
                            <span className="badge badge-yellow">Meals: {s.caregiverNote.skippedMeals}</span>
                          )}
                          {s.caregiverNote.meltdowns > 0 && (
                            <span className="badge badge-red">Meltdowns: {s.caregiverNote.meltdowns}</span>
                          )}
                          {s.caregiverNote.sleep && (
                            <span className={`badge ${s.caregiverNote.sleep === 'Bad' ? 'badge-red' : s.caregiverNote.sleep === 'OK' ? 'badge-yellow' : 'badge-green'}`}>
                              Sleep: {s.caregiverNote.sleep}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="cd-no-data">No caregiver notes recorded yet.</p>
                )}
              </motion.div>
            </div>

            {/* Session Timeline */}
            <motion.div
              className="cd-timeline card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <h3>Session Timeline</h3>
              <div className="cd-timeline-grid">
                {sessions.slice().reverse().map((session, i) => {
                  const prompt = DRAWING_PROMPTS.find(p => p.id === session.promptId);
                  return (
                    <div key={session.id || i} className="cd-timeline-item">
                      <div className="cd-timeline-thumb" style={{ background: prompt?.colorLight || '#F1F5F9' }}>
                        {session.imageUrl ? (
                          <img src={session.imageUrl} alt="Session" />
                        ) : (
                          <span>{prompt?.icon || '🎨'}</span>
                        )}
                      </div>
                      <div className="cd-timeline-meta">
                        <span className="cd-timeline-prompt">{prompt?.title || 'Drawing'}</span>
                        <span className="cd-timeline-date">
                          {new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`score-pill ${(session.stressScore || 0) >= 7 ? 'score-high' : (session.stressScore || 0) >= 5 ? 'score-mid' : 'score-low'}`}>
                        {session.stressScore?.toFixed(1) || '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* EHR Generation */}
            <motion.div
              className="cd-ehr card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3>EHR Export</h3>
              <p className="cd-ehr-desc">
                Generate FHIR-compliant clinical observation for Epic/Cerner integration.
                Includes stress scores, drawing evidence, and clinical recommendations.
              </p>

              <div className="cd-ehr-actions">
                <button className="btn btn-primary" onClick={handleGenerateEHR}>
                  📋 Generate FHIR Observation
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  if (latestAnalysis) {
                    const note = latestAnalysis;
                    exportClinicalNotePDF(
                      { S: note.pattern || '', O: `${sessions.length} sessions analyzed`, A: `Avg stress: ${avgStress.toFixed(1)}/10`, P: 'Continued monitoring recommended' },
                      `Patient ${profile?.name || ''} - ${sessions.length} art therapy sessions analyzed`
                    );
                  }
                }}>
                  📥 Download Clinical PDF
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/insurance', { state: { result: latestAnalysis, fromClinician: true } })}>
                  📤 Submit to Insurance
                </button>
              </div>

              {showFHIR && generatedFHIR && (
                <motion.div
                  className="cd-fhir-preview"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className="cd-fhir-header">
                    <h4>FHIR R4 Observation</h4>
                    <button className="btn btn-sm btn-primary" onClick={handleDownloadFHIR}>
                      ⬇ Download JSON
                    </button>
                  </div>
                  <pre className="cd-fhir-code">
                    {JSON.stringify(generatedFHIR, null, 2)}
                  </pre>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
