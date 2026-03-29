import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import './FindDoctor.css';

const MOCK_DOCTORS = [
  {
    id: 'd1',
    name: 'Dr. Adam Max',
    credentials: 'Psychologist',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    isTall: true,
    languages: ['Hindi', 'English'],
    specialty: ['Autism', 'Pediatric'],
    telehealth: true,
    voiceCanvasCompatible: true,
    bio: 'Specialist in cross-cultural mental health and trauma-informed care.',
  },
  {
    id: 'd2',
    name: 'Dr. Max Brad',
    credentials: 'Cardiologist',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
    rating: 4.5,
    isTall: false,
    languages: ['English'],
    specialty: ['General Practitioner'],
    telehealth: true,
    voiceCanvasCompatible: false,
    bio: 'Experienced cardiologist with extensive background in primary care.',
  },
  {
    id: 'd3',
    name: 'Dr. Darlene Robert',
    credentials: 'Neurologist',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    isTall: false,
    languages: ['Spanish', 'English'],
    specialty: ['Trauma', 'Neurology'],
    telehealth: true,
    voiceCanvasCompatible: true,
    bio: 'Neurologist who focuses on bilingual care and cognitive therapies.',
  },
  {
    id: 'd4',
    name: 'Dr. Johan Hill',
    credentials: 'General Surgeon',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80',
    rating: 4.5,
    isTall: true,
    languages: ['English'],
    specialty: ['Surgery', 'General'],
    telehealth: false,
    voiceCanvasCompatible: false,
    bio: 'Board-certified surgeon specialized in outpatient procedures.',
  },
  {
    id: 'd5',
    name: 'Dr. Priya Nair',
    credentials: 'LPC, Counselor',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    isTall: true,
    languages: ['English', 'Malayalam'],
    specialty: ['Anxiety', 'Trauma'],
    telehealth: true,
    voiceCanvasCompatible: true,
    bio: 'Licensed counselor specializing in South Asian immigrant experiences.',
  },
  {
    id: 'd6',
    name: 'Dr. Kevin Park',
    credentials: 'PhD, Psychology',
    photo: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    isTall: false,
    languages: ['English', 'Korean'],
    specialty: ['Pediatric', 'General'],
    telehealth: true,
    voiceCanvasCompatible: true,
    bio: 'Pediatric and adult psychology specialist.',
  },
  {
    id: 'd7',
    name: 'Dr. Anita Koirala',
    credentials: 'Psychiatrist, MD',
    photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    isTall: false,
    languages: ['Nepali', 'English'],
    specialty: ['Mood disorders', 'Telehealth'],
    telehealth: true,
    voiceCanvasCompatible: true,
    bio: 'Kathmandu-based psychiatrist with focus on mood disorders and culturally informed care.',
  },
  {
    id: 'd8',
    name: 'Dr. Samuel Okonkwo',
    credentials: 'Psychiatrist',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    isTall: true,
    languages: ['English', 'French'],
    specialty: ['PTSD', 'Family therapy'],
    telehealth: true,
    voiceCanvasCompatible: true,
    bio: 'WHO-affiliated volunteer supporting displaced and trauma-affected patients.',
  },
  {
    id: 'd9',
    name: 'Dr. Emily Foster',
    credentials: 'LCSW',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    isTall: false,
    languages: ['English'],
    specialty: ['CBT', 'Anxiety'],
    telehealth: true,
    voiceCanvasCompatible: false,
    bio: 'Licensed clinical social worker specializing in short-term CBT and anxiety.',
  },
  {
    id: 'd10',
    name: 'Dr. Hiro Taneda',
    credentials: 'Neurologist',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    isTall: true,
    languages: ['Japanese', 'English'],
    specialty: ['Neurology', 'Headache'],
    telehealth: true,
    voiceCanvasCompatible: true,
    bio: 'Outpatient neurologist with remote follow-up programs.',
  },
  {
    id: 'd11',
    name: 'Dr. Sofia Méndez',
    credentials: 'Clinical Psychologist',
    photo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    isTall: false,
    languages: ['Spanish', 'English'],
    specialty: ['Depression', 'Immigrant health'],
    telehealth: true,
    voiceCanvasCompatible: true,
    bio: 'Bilingual therapist focused on immigrant and refugee mental health.',
  },
  {
    id: 'd12',
    name: 'Dr. Thomas Weber',
    credentials: 'GP, Mental Health',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
    rating: 4.5,
    isTall: false,
    languages: ['German', 'English'],
    specialty: ['Primary care', 'Burnout'],
    telehealth: false,
    voiceCanvasCompatible: false,
    bio: 'General practitioner with integrated mental health assessments.',
  },
];

export default function FindDoctor() {
  const navigate = useNavigate();
  const [telehealthOnly, setTelehealthOnly] = useState(false);
  const [vcOnly, setVcOnly] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [connectedId, setConnectedId] = useState(() => {
    try { return localStorage.getItem('mc_connected_doctor_id') || null; } catch { return null; }
  });

  const filtered = useMemo(() => {
    return MOCK_DOCTORS.filter(d => {
      if (telehealthOnly && !d.telehealth) return false;
      if (vcOnly && !d.voiceCanvasCompatible) return false;
      return true;
    });
  }, [telehealthOnly, vcOnly]);

  function confirmConnect(doctor) {
    try {
      localStorage.setItem('mc_connected_doctor_id', doctor.id);
      localStorage.setItem('mc_connected_doctor', JSON.stringify(doctor));
    } catch { /* ignore */ }
    setConnectedId(doctor.id);
    setConfirming(null);
  }

  return (
    <div className="fd-page">
      {/* Header */}
      <header className="fd-header">
        <div className="fd-hero">
          <h1>Choose Our Vetted Specialist</h1>
        </div>
        <div className="fd-header-inner">
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
        </div>
      </header>

      <div className="fd-body">
        {/* Filters */}
        <motion.div className="fd-filters" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="fd-toggle-row">
            <label className="fd-toggle">
              <input type="checkbox" checked={telehealthOnly} onChange={e => setTelehealthOnly(e.target.checked)} />
              <span>Telehealth only</span>
            </label>
            <label className="fd-toggle">
              <input type="checkbox" checked={vcOnly} onChange={e => setVcOnly(e.target.checked)} />
              <span>VoiceCanvas supported</span>
            </label>
          </div>
        </motion.div>

        {/* Doctor cards Masonry */}
        <div className="fd-cards">
          {filtered.map((doctor, i) => {
            const isConnected = connectedId === doctor.id;
            return (
              <motion.div
                key={doctor.id}
                className={`fd-card ${doctor.isTall ? 'tall-card' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Image Cover */}
                <div className="fd-card-img-wrap">
                  <div className="fd-rating-badge">
                    <span className="star">★</span> {doctor.rating}
                  </div>
                  {isConnected && (
                    <div className="fd-connected-chip">Connected</div>
                  )}
                  <img src={doctor.photo} alt={doctor.name} />
                </div>

                {/* White Glassmorphic Overlay Bottom */}
                <div className="fd-card-bottom">
                  <h3 className="fd-card-name">{doctor.name}</h3>
                  <div className="fd-card-role">{doctor.credentials}</div>
                  <div className="fd-card-actions">
                    <button
                      className="btn-book"
                      onClick={() => isConnected ? null : setConfirming(doctor)}
                      style={isConnected ? { background: '#10B981', color: 'white' } : {}}
                    >
                      {isConnected ? 'Connected' : 'Book Now'}
                    </button>
                    <button className="btn-share" onClick={() => alert('Share link copied!')}>Share</button>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
              <h3>Connect with {confirming.name}?</h3>
              <p style={{ margin: '15px 0', color: '#4B5563', lineHeight: '1.5' }}>
                This will securely share your VoiceCanvas session history and drawing assessments with Dr. {confirming.name.split(' ')[1]}.
              </p>
              <div className="fd-modal-actions">
                <button className="btn-outline" onClick={() => setConfirming(null)}>Cancel</button>
                <button className="btn-primary" onClick={() => confirmConnect(confirming)}>
                  Yes, Connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
