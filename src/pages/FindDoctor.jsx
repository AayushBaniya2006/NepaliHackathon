import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import './FindDoctor.css';

const MOCK_DOCTORS = [
  {
    id: 'd1',
    name: 'Dr. Anjali Sharma',
    credentials: 'MD, Psychiatry',
    photo: null,
    flag: '🇳🇵',
    country: 'Nepal / Telehealth',
    languages: ['Nepali', 'Hindi', 'English'],
    specialty: ['Anxiety', 'Trauma', 'Immigrant MH'],
    insurance: ['Medicaid', 'Sliding Scale', 'Self-Pay'],
    telehealth: true,
    inPerson: false,
    voiceCanvasCompatible: true,
    nextAvailable: 'Tomorrow, 2pm',
    bio: 'Specialist in cross-cultural mental health, trauma-informed care, and working with immigrant communities. Fluent in Nepali and Hindi — no interpreter needed.',
    avatar: '👩‍⚕️',
    color: '#E8F5E9',
  },
  {
    id: 'd2',
    name: 'Dr. Rohan Mehta',
    credentials: 'PhD, Clinical Psychology',
    photo: null,
    flag: '🇮🇳',
    country: 'India / Telehealth',
    languages: ['Hindi', 'English', 'Gujarati'],
    specialty: ['Autism', 'Pediatric', 'Anxiety'],
    insurance: ['Self-Pay', 'Sliding Scale'],
    telehealth: true,
    inPerson: false,
    voiceCanvasCompatible: true,
    nextAvailable: 'Today, 5pm',
    bio: 'Specializes in non-verbal and autistic patients. Has extensive experience helping children and adults who struggle with verbal communication express themselves.',
    avatar: '👨‍⚕️',
    color: '#E3F2FD',
  },
  {
    id: 'd3',
    name: 'Dr. Maria Santos',
    credentials: 'LCSW, Therapist',
    photo: null,
    flag: '🇺🇸',
    country: 'USA (Texas)',
    languages: ['Spanish', 'English', 'Portuguese'],
    specialty: ['Trauma', 'Immigrant MH', 'General'],
    insurance: ['Aetna', 'Cigna', 'Medicaid', 'Sliding Scale'],
    telehealth: true,
    inPerson: true,
    voiceCanvasCompatible: true,
    nextAvailable: 'Wed, 10am',
    bio: 'Bilingual therapist working with Latino immigrant communities in Texas. Deep experience with cultural trauma, family separation, and acculturation stress.',
    avatar: '👩‍⚕️',
    color: '#FCE4EC',
  },
  {
    id: 'd4',
    name: 'Dr. James Okafor',
    credentials: 'MD, Psychiatry',
    photo: null,
    flag: '🇺🇸',
    country: 'USA (New York)',
    languages: ['English', 'Yoruba'],
    specialty: ['General', 'Anxiety', 'Trauma'],
    insurance: ['Aetna', 'UHC', 'BCBS', 'Cigna'],
    telehealth: true,
    inPerson: true,
    voiceCanvasCompatible: true,
    nextAvailable: 'Thu, 9am',
    bio: 'Board-certified psychiatrist with 12 years of experience. NPI verified. Accepts most major insurance and sees patients in-person and via telehealth.',
    avatar: '👨‍⚕️',
    color: '#EDE7F6',
  },
  {
    id: 'd5',
    name: 'Dr. Priya Nair',
    credentials: 'LPC, Counselor',
    photo: null,
    flag: '🇺🇸',
    country: 'USA (California)',
    languages: ['English', 'Malayalam', 'Tamil'],
    specialty: ['Anxiety', 'Trauma', 'Immigrant MH'],
    insurance: ['Cigna', 'BCBS', 'Sliding Scale', 'Self-Pay'],
    telehealth: true,
    inPerson: false,
    voiceCanvasCompatible: false,
    nextAvailable: 'Fri, 3pm',
    bio: 'Licensed counselor specializing in South Asian immigrant experiences, identity issues, and family pressure. Telehealth only.',
    avatar: '👩‍⚕️',
    color: '#FBE9E7',
  },
  {
    id: 'd6',
    name: 'Dr. Kevin Park',
    credentials: 'PhD, Psychology',
    photo: null,
    flag: '🇺🇸',
    country: 'USA (Washington)',
    languages: ['English', 'Korean'],
    specialty: ['Autism', 'Pediatric', 'General'],
    insurance: ['Aetna', 'UHC', 'Medicaid'],
    telehealth: true,
    inPerson: true,
    voiceCanvasCompatible: true,
    nextAvailable: 'Mon, 11am',
    bio: 'Pediatric and adult psychology specialist. Works with non-verbal patients using art and gesture-based therapy — highly compatible with VoiceCanvas sessions.',
    avatar: '👨‍⚕️',
    color: '#E3F2FD',
  },
  {
    id: 'd7',
    name: 'Dr. Fatima Al-Hassan',
    credentials: 'MD, Psychiatry',
    photo: null,
    flag: '🇯🇴',
    country: 'Jordan / Telehealth',
    languages: ['Arabic', 'English', 'French'],
    specialty: ['Trauma', 'Anxiety', 'Immigrant MH'],
    insurance: ['Sliding Scale', 'Self-Pay'],
    telehealth: true,
    inPerson: false,
    voiceCanvasCompatible: true,
    nextAvailable: 'Tomorrow, 8am',
    bio: 'Volunteer psychiatrist serving Arabic-speaking diaspora. Trained in Jordan and London. Provides culturally sensitive care without judgment for patients from conservative societies.',
    avatar: '👩‍⚕️',
    color: '#FFF9C4',
  },
  {
    id: 'd8',
    name: 'Dr. Kenji Tanaka',
    credentials: 'PhD, Clinical Psychology',
    photo: null,
    flag: '🇯🇵',
    country: 'Japan / Telehealth',
    languages: ['Japanese', 'English'],
    specialty: ['General', 'Anxiety', 'Trauma'],
    insurance: ['Self-Pay', 'Sliding Scale'],
    telehealth: true,
    inPerson: false,
    voiceCanvasCompatible: true,
    nextAvailable: 'Sat, 7am (JST)',
    bio: 'Specializes in helping Japanese patients abroad access mental health care without cultural stigma. Sessions are confidential and culturally attuned.',
    avatar: '👨‍⚕️',
    color: '#E8F5E9',
  },
];

const ALL_LANGUAGES = [...new Set(MOCK_DOCTORS.flatMap(d => d.languages))].sort();
const ALL_SPECIALTIES = [...new Set(MOCK_DOCTORS.flatMap(d => d.specialty))].sort();
const ALL_INSURANCE = [...new Set(MOCK_DOCTORS.flatMap(d => d.insurance))].sort();

export default function FindDoctor() {
  const navigate = useNavigate();
  const { profile, saveSession } = useStorage();

  const [langFilter, setLangFilter] = useState('All');
  const [specFilter, setSpecFilter] = useState('All');
  const [insFilter, setInsFilter] = useState('All');
  const [telehealthOnly, setTelehealthOnly] = useState(false);
  const [vcOnly, setVcOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [connectedId, setConnectedId] = useState(() => {
    try { return localStorage.getItem('mc_connected_doctor_id') || null; } catch { return null; }
  });
  const [confirming, setConfirming] = useState(null); // doctor object being confirmed

  const filtered = useMemo(() => {
    return MOCK_DOCTORS.filter(d => {
      if (langFilter !== 'All' && !d.languages.includes(langFilter)) return false;
      if (specFilter !== 'All' && !d.specialty.includes(specFilter)) return false;
      if (insFilter !== 'All' && !d.insurance.includes(insFilter)) return false;
      if (telehealthOnly && !d.telehealth) return false;
      if (vcOnly && !d.voiceCanvasCompatible) return false;
      return true;
    });
  }, [langFilter, specFilter, insFilter, telehealthOnly, vcOnly]);

  function handleConnect(doctor) {
    setConfirming(doctor);
  }

  function confirmConnect(doctor) {
    try {
      localStorage.setItem('mc_connected_doctor_id', doctor.id);
      localStorage.setItem('mc_connected_doctor', JSON.stringify(doctor));
    } catch { /* ignore */ }
    setConnectedId(doctor.id);
    setConfirming(null);
  }

  const connectedDoctor = connectedId ? MOCK_DOCTORS.find(d => d.id === connectedId) : null;

  return (
    <div className="fd-page">
      {/* Header */}
      <header className="fd-header">
        <div className="fd-header-inner">
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
          <div className="fd-brand">🧠 MindCanvas</div>
        </div>
      </header>

      <div className="fd-body">
        {/* Hero */}
        <motion.div className="fd-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1>Find a Doctor</h1>
          <p>
            Connect with a mental health professional who speaks your language and understands your background.
            <br />All VoiceCanvas-compatible doctors can view your session drawings directly.
          </p>
        </motion.div>

        {/* Connected banner */}
        <AnimatePresence>
          {connectedDoctor && (
            <motion.div
              className="fd-connected-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <span>✅</span>
              <div>
                <strong>You're connected with {connectedDoctor.name}</strong>
                <p>{connectedDoctor.languages.join(', ')} · {connectedDoctor.nextAvailable}</p>
              </div>
              <button
                className="fd-disconnect-btn"
                onClick={() => {
                  setConnectedId(null);
                  try { localStorage.removeItem('mc_connected_doctor_id'); } catch { /* ignore */ }
                }}
              >
                Change
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div className="fd-filters" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="fd-filter-row">
            <select className="fd-select" value={langFilter} onChange={e => setLangFilter(e.target.value)}>
              <option value="All">All Languages</option>
              {ALL_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <select className="fd-select" value={specFilter} onChange={e => setSpecFilter(e.target.value)}>
              <option value="All">All Specialties</option>
              {ALL_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="fd-select" value={insFilter} onChange={e => setInsFilter(e.target.value)}>
              <option value="All">All Insurance</option>
              {ALL_INSURANCE.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div className="fd-toggle-row">
            <label className="fd-toggle">
              <input type="checkbox" checked={telehealthOnly} onChange={e => setTelehealthOnly(e.target.checked)} />
              <span>Telehealth only</span>
            </label>
            <label className="fd-toggle">
              <input type="checkbox" checked={vcOnly} onChange={e => setVcOnly(e.target.checked)} />
              <span>VoiceCanvas compatible only</span>
            </label>
          </div>
        </motion.div>

        {/* Results count */}
        <p className="fd-count">{filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found</p>

        {/* Doctor cards */}
        <div className="fd-cards">
          {filtered.map((doctor, i) => {
            const isConnected = connectedId === doctor.id;
            const isExpanded = expandedId === doctor.id;
            return (
              <motion.div
                key={doctor.id}
                className={`fd-card ${isConnected ? 'fd-card-connected' : ''}`}
                style={{ '--dc-color': doctor.color }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Card top */}
                <div className="fd-card-top">
                  <div className="fd-avatar" style={{ background: doctor.color }}>
                    <span>{doctor.avatar}</span>
                    <span className="fd-avatar-flag">{doctor.flag}</span>
                  </div>

                  <div className="fd-card-info">
                    <div className="fd-card-name-row">
                      <h3 className="fd-card-name">{doctor.name}</h3>
                      {doctor.voiceCanvasCompatible && (
                        <span className="fd-vc-badge">✓ VoiceCanvas</span>
                      )}
                      {isConnected && (
                        <span className="fd-connected-chip">Connected ✓</span>
                      )}
                    </div>
                    <p className="fd-card-creds">{doctor.credentials} · {doctor.country}</p>

                    <div className="fd-lang-flags">
                      {doctor.languages.map(l => (
                        <span key={l} className="fd-lang-chip">{l}</span>
                      ))}
                    </div>

                    <div className="fd-specialty-row">
                      {doctor.specialty.map(s => (
                        <span key={s} className="fd-spec-chip">{s}</span>
                      ))}
                    </div>

                    <div className="fd-meta-row">
                      <span className="fd-meta-item">
                        {doctor.telehealth && '💻 Telehealth'}
                        {doctor.telehealth && doctor.inPerson && ' · '}
                        {doctor.inPerson && '🏥 In-person'}
                      </span>
                      <span className="fd-meta-next">Next: {doctor.nextAvailable}</span>
                    </div>

                    <div className="fd-insurance-row">
                      {doctor.insurance.slice(0, 3).map(ins => (
                        <span key={ins} className="fd-ins-chip">{ins}</span>
                      ))}
                      {doctor.insurance.length > 3 && (
                        <span className="fd-ins-chip fd-ins-more">+{doctor.insurance.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio expand */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.p
                      className="fd-card-bio"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {doctor.bio}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Card actions */}
                <div className="fd-card-actions">
                  <button
                    className="fd-bio-btn"
                    onClick={() => setExpandedId(isExpanded ? null : doctor.id)}
                  >
                    {isExpanded ? 'Hide bio ↑' : 'Read bio ↓'}
                  </button>

                  {isConnected ? (
                    <button className="fd-connect-btn fd-connect-btn-done" disabled>
                      ✓ Connected
                    </button>
                  ) : (
                    <button
                      className="fd-connect-btn"
                      onClick={() => handleConnect(doctor)}
                    >
                      Connect 🤝
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="fd-empty">
              <span>🔍</span>
              <p>No doctors match your filters. Try removing some filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            className="fd-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirming(null)}
          >
            <motion.div
              className="fd-modal"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="fd-modal-avatar" style={{ background: confirming.color }}>
                <span>{confirming.avatar}</span>
              </div>
              <h3>Connect with {confirming.name}?</h3>
              <p>
                This will share your session history with {confirming.name}.
                They will be able to view your drawings and clinical notes.
              </p>
              <div className="fd-modal-actions">
                <button className="btn btn-outline" onClick={() => setConfirming(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => confirmConnect(confirming)}>
                  Yes, connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
