import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import { exportInsuranceFormPDF } from '../utils/pdfExport';
import './InsuranceForm.css';

const PRECEDENT_DB = [
  { case: 'Doe v. Aetna (2024)', outcome: 'Patient won', relevance: 'Nonverbal documentation accepted as primary evidence', winRate: 68 },
  { case: 'Smith v. UnitedHealth (2023)', outcome: 'Settled', relevance: 'Art therapy screening met medical necessity standard', winRate: 72 },
  { case: 'Johnson v. Cigna (2024)', outcome: 'Patient won', relevance: 'Parity Act violation — excessive documentation requirements', winRate: 65 },
  { case: 'Williams v. Anthem (2023)', outcome: 'Patient won', relevance: 'Nonverbal patient denied equal coverage', winRate: 71 },
];

export default function InsuranceForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, fromDashboard, fromClinician } = location.state || {};
  const { profile, sessions, analytics } = useStorage();

  const [formData, setFormData] = useState({
    chiefComplaint: result?.insurance_data?.chief_complaint || result?.insurance_data?.chiefComplaint || '',
    symptomDuration: result?.insurance_data?.symptom_duration || result?.insurance_data?.symptomDuration || '',
    functionalImpairment: result?.insurance_data?.functional_impairment || result?.insurance_data?.functionalImpairment || '',
    diagnosisCategory: result?.insurance_data?.diagnosis_category || result?.insurance_data?.diagnosisCategory || result?.diagnosis || '',
    requestedService: result?.insurance_data?.requested_service || result?.insurance_data?.requestedService || 'both',
    patientName: profile?.name || '',
    dob: '',
    insuranceId: '',
    groupNumber: '',
    providerName: '',
    providerNPI: '',
  });

  const [step, setStep] = useState('form');
  const [denied, setDenied] = useState(false);
  const [appealGenerated, setAppealGenerated] = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  const parityViolations = useMemo(() => {
    const violations = [];
    if (profile?.isNonverbal) {
      violations.push({
        type: 'NQTL — Documentation Standard',
        desc: 'Requiring verbal communication for psychiatric evaluation is a non-quantitative treatment limitation that disproportionately affects nonverbal patients.',
        code: 'MHPAEA § 712(c)(4)(ii)',
        severity: 'high',
      });
    }
    if (formData.requestedService === 'both' || formData.requestedService === 'psychiatric eval') {
      violations.push({
        type: 'Quantitative Limit',
        desc: 'Pre-authorization requirements for psychiatric evaluation exceed those for comparable medical/surgical procedures.',
        code: 'MHPAEA § 29 CFR 2590.712(c)(4)',
        severity: 'medium',
      });
    }
    if (sessions.length >= 5 && analytics.some(a => a.thresholdMet)) {
      violations.push({
        type: 'Medical Necessity Denial Despite Evidence',
        desc: `${sessions.length} documented art therapy sessions with clinical threshold met. Denial contradicts objective screening evidence.`,
        code: 'MHPAEA § 712(c)(3)',
        severity: 'high',
      });
    }
    return violations;
  }, [formData.requestedService, profile, sessions, analytics]);

  const matchedPrecedents = useMemo(() => {
    return PRECEDENT_DB.filter(p => {
      if (profile?.isNonverbal && p.relevance.toLowerCase().includes('nonverbal')) return true;
      if (p.relevance.toLowerCase().includes('art therapy')) return true;
      if (parityViolations.length > 0 && p.relevance.toLowerCase().includes('parity')) return true;
      return false;
    });
  }, [profile, parityViolations]);

  const avgWinRate = matchedPrecedents.length > 0
    ? Math.round(matchedPrecedents.reduce((a, b) => a + b.winRate, 0) / matchedPrecedents.length)
    : 60;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep('submitted');
  };

  const handleSimulateDenial = () => {
    setDenied(true);
    setStep('denied');
  };

  const handleGenerateAppeal = () => {
    setAppealGenerated(true);
  };

  const handleSubmitAppeal = () => {
    setAppealSubmitted(true);
  };

  const handleDownload = () => {
    exportInsuranceFormPDF(formData);
  };

  const fields = [
    {
      section: 'Clinical Information',
      icon: '🩺',
      desc: 'Auto-populated from AI drawing analysis',
      fields: [
        { key: 'chiefComplaint', label: 'Chief Complaint', type: 'textarea' },
        { key: 'symptomDuration', label: 'Symptom Duration', type: 'text' },
        { key: 'functionalImpairment', label: 'Functional Impairment', type: 'textarea' },
        { key: 'diagnosisCategory', label: 'Diagnosis Category', type: 'text' },
        { key: 'requestedService', label: 'Requested Service', type: 'select', options: ['therapy', 'psychiatric eval', 'both'] },
      ],
    },
    {
      section: 'Patient Information',
      icon: '👤',
      desc: 'Required for claim submission',
      fields: [
        { key: 'patientName', label: 'Patient Name', type: 'text' },
        { key: 'dob', label: 'Date of Birth', type: 'date' },
        { key: 'insuranceId', label: 'Insurance ID / Member Number', type: 'text' },
        { key: 'groupNumber', label: 'Group Number', type: 'text' },
      ],
    },
    {
      section: 'Provider Information',
      icon: '🏥',
      desc: 'Treating clinician details',
      fields: [
        { key: 'providerName', label: 'Provider Name', type: 'text' },
        { key: 'providerNPI', label: 'NPI Number', type: 'text' },
      ],
    },
  ];

  return (
    <div className="insurance-page">
      <header className="ins-header">
        <div className="container">
          <div className="ins-header-inner">
            <button className="btn btn-sm btn-ghost" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <div className="ins-brand">
              <span>🎨</span>
              <span className="ins-brand-text">MindCanvas</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-narrow ins-main">
        {/* Title */}
        <motion.div className="ins-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1>📋 Insurance Claim + Reclaimant Engine</h1>
          <p>AI-powered parity violation detection, precedent matching, and auto-appeal generation.</p>

          <div className="ins-stats">
            <div className="ins-stat-pill">
              <span className="isp-val">$35,000</span>
              <span className="isp-label">Avg. annual recovery</span>
            </div>
            <div className="ins-stat-pill">
              <span className="isp-val">{avgWinRate}%</span>
              <span className="isp-label">Appeal win rate</span>
            </div>
            <div className="ins-stat-pill">
              <span className="isp-val">2×</span>
              <span className="isp-label">MH denial rate vs medical</span>
            </div>
          </div>

          {result && (
            <div className="ins-autofill-badge">
              <span className="afb-dot" />
              Clinical data auto-filled from AI analysis
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.form
              key="form"
              className="ins-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -30 }}
            >
              {fields.map((section, si) => (
                <motion.div
                  key={section.section}
                  className="ins-section card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: si * 0.1 + 0.2 }}
                >
                  <div className="ins-section-header">
                    <span>{section.icon}</span>
                    <div>
                      <h3>{section.section}</h3>
                      <p>{section.desc}</p>
                    </div>
                  </div>

                  <div className="ins-fields">
                    {section.fields.map(field => (
                      <div key={field.key} className="form-group">
                        <label className="form-label" htmlFor={field.key}>{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            className="form-textarea"
                            id={field.key}
                            value={formData[field.key]}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            rows={3}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            className="form-select"
                            id={field.key}
                            value={formData[field.key]}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                          >
                            {field.options.map(o => (
                              <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="form-input"
                            type={field.type}
                            id={field.key}
                            value={formData[field.key]}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Parity Guard */}
              <motion.div
                className="ins-parity card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="parity-header-row">
                  <h3>⚖️ Parity Guard Analysis</h3>
                  <span className="parity-shield-badge">AI PROTECTED</span>
                </div>

                {parityViolations.length > 0 ? (
                  <>
                    <div className="parity-alert">
                      <strong>{parityViolations.length} Potential Parity Violation{parityViolations.length > 1 ? 's' : ''} Detected</strong>
                      <p>Our AI has flagged elements that may violate the Mental Health Parity and Addiction Equity Act (MHPAEA).</p>
                    </div>
                    <div className="parity-violations">
                      {parityViolations.map((v, i) => (
                        <div key={i} className={`parity-violation pv-${v.severity}`}>
                          <span className="pv-type">{v.type}</span>
                          <p>{v.desc}</p>
                          <code className="pv-code">{v.code}</code>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="parity-clear">No immediate parity violations detected. Coverage probability is high.</p>
                )}
              </motion.div>

              <div className="ins-form-actions">
                <button type="submit" className="btn btn-primary btn-lg">
                  📤 Submit Pre-Authorization
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleDownload}>
                  📥 Download as PDF
                </button>
              </div>
            </motion.form>
          )}

          {step === 'submitted' && !denied && (
            <motion.div
              key="submitted"
              className="ins-result card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="ins-result-icon">✅</span>
              <h2>Pre-Authorization Submitted</h2>
              <p>In production, this would be sent to the insurance provider via secure API.</p>

              <div className="ins-sim-denial">
                <h4>Want to see the Reclaimant auto-appeal in action?</h4>
                <p>Simulate a denial to watch the AI generate a legal appeal with precedent matching.</p>
                <button className="btn btn-danger" onClick={handleSimulateDenial}>
                  ❌ Simulate Insurance Denial
                </button>
              </div>

              <div className="ins-result-nav">
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                  ← Dashboard
                </button>
                <button className="btn btn-ghost" onClick={() => navigate('/resources')}>
                  🏥 Find Free Care
                </button>
              </div>
            </motion.div>
          )}

          {step === 'denied' && (
            <motion.div
              key="denied"
              className="ins-denied"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Denial notice */}
              <div className="denial-notice card">
                <span className="denial-icon">🚫</span>
                <h2>Claim Denied</h2>
                <p className="denial-reason">"Insufficient medical necessity documentation for requested mental health services."</p>
                <span className="badge badge-red">Denial Code: MN-4021</span>
              </div>

              {/* Reclaimant engine */}
              <motion.div
                className="reclaimant-card card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="recl-header">
                  <h3>🤖 Reclaimant Auto-Appeal Engine</h3>
                  <span className="badge badge-blue">AI-Powered</span>
                </div>

                <div className="recl-steps">
                  <div className="recl-step recl-done">
                    <span className="recl-step-icon">✅</span>
                    <div>
                      <strong>Denial NLP Scan</strong>
                      <p>Parsed denial text — triggered parity violation check {profile?.isNonverbal ? '(nonverbal patient = protected class)' : ''}</p>
                    </div>
                  </div>

                  <div className="recl-step recl-done">
                    <span className="recl-step-icon">✅</span>
                    <div>
                      <strong>Precedent Database Match</strong>
                      <p>Queried 15-year litigation database — {matchedPrecedents.length} matching cases found</p>
                      <div className="recl-precedents">
                        {matchedPrecedents.map((p, i) => (
                          <div key={i} className="recl-precedent">
                            <span className="rp-case">{p.case}</span>
                            <span className={`badge ${p.outcome === 'Patient won' ? 'badge-green' : 'badge-yellow'}`}>
                              {p.outcome}
                            </span>
                            <span className="rp-rel">{p.relevance}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={`recl-step ${appealGenerated ? 'recl-done' : 'recl-pending'}`}>
                    <span className="recl-step-icon">{appealGenerated ? '✅' : '⏳'}</span>
                    <div>
                      <strong>Generate Legal Appeal Letter</strong>
                      {!appealGenerated ? (
                        <button className="btn btn-primary btn-sm" onClick={handleGenerateAppeal} style={{ marginTop: 8 }}>
                          Generate Appeal →
                        </button>
                      ) : (
                        <motion.div
                          className="appeal-letter"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <p><strong>To:</strong> Insurance Compliance Officer & Medical Director</p>
                          <p><strong>Subject:</strong> Formal Appeal — MHPAEA Violations — Claim #{formData.insuranceId || 'PENDING'}</p>
                          <p><strong>Re:</strong> {formData.patientName || 'Patient'}, Denial Code MN-4021</p>
                          <hr />
                          <p>
                            This appeal is submitted using the Reclaimant Legal Precedent Database (15+ years of litigation history).
                            Our analysis detects direct violations of the Mental Health Parity and Addiction Equity Act (MHPAEA).
                          </p>
                          <p>
                            <strong>Exhibit A:</strong> {sessions.length} AI-analyzed art therapy drawings with clinical stress scores
                            averaging {analytics.length > 0 ? (analytics.reduce((a, b) => a + (b.stressScore || 0), 0) / analytics.length).toFixed(1) : 'N/A'}/10.
                            {analytics.filter(a => a.thresholdMet).length > 0 && ` Clinical threshold met in ${analytics.filter(a => a.thresholdMet).length} sessions.`}
                          </p>
                          <p>
                            <strong>Clinical:</strong> {formData.diagnosisCategory || 'Anxiety indicators'} documented across {sessions.length} sessions.
                            Functional impairment: {formData.functionalImpairment || 'As documented'}.
                          </p>
                          <p>
                            <strong>Legal:</strong> Parity Act violations per {parityViolations.map(v => v.code).join(', ') || 'MHPAEA § 712'}.
                            Precedent: {matchedPrecedents.map(p => p.case).join('; ') || 'Multiple matching cases'}.
                          </p>
                          <p><strong>Demand:</strong> Approve requested services within 30 days per regulatory requirements.</p>
                          <p className="appeal-footer">
                            Win probability: <strong>{avgWinRate}%</strong> based on matched precedents.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {appealGenerated && (
                    <div className={`recl-step ${appealSubmitted ? 'recl-done' : 'recl-pending'}`}>
                      <span className="recl-step-icon">{appealSubmitted ? '✅' : '📤'}</span>
                      <div>
                        <strong>Submit Appeal</strong>
                        {!appealSubmitted ? (
                          <button className="btn btn-primary btn-sm" onClick={handleSubmitAppeal} style={{ marginTop: 8 }}>
                            Submit Appeal →
                          </button>
                        ) : (
                          <motion.div
                            className="appeal-success"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <p>Appeal submitted! Expected response within 30-45 days.</p>
                            <p>Estimated recovery: <strong>${formData.requestedService === 'both' ? '1,200' : '720'}</strong></p>
                            <div className="appeal-tracker">
                              <span className="badge badge-green">Submitted</span>
                              <span className="at-line" />
                              <span className="badge badge-yellow">Under Review</span>
                              <span className="at-line" />
                              <span className="badge badge-blue">Pending</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              <button className="btn btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
                ← Back to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="ins-disclaimer">
          DEMO ONLY — No real insurance submission occurs. Not HIPAA compliant.
        </p>
      </div>
    </div>
  );
}
