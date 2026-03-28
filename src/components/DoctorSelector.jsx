import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './DoctorSelector.css';

// ── Mock volunteer doctor roster ──────────────────────────────────────────────
const DOCTORS = [
  {
    id: 'd1',
    name: 'Dr. Priya Sharma',
    title: 'Psychiatrist',
    org: 'WHO Volunteer Network',
    country: 'India',
    flag: '🇮🇳',
    languages: ['Nepali', 'Hindi', 'English'],
    rating: 4.9,
    reviews: 312,
    status: 'online',
    statusLabel: 'Online Now',
    free: true,
    freeLabel: 'Free for uninsured',
    specialty: 'Anxiety · Depression · Cultural trauma',
    avatar: '👩‍⚕️',
    bio: 'Trained in Mumbai, Priya has spent 8 years working with South Asian diaspora communities. Fluent in Nepali and Hindi — no language barrier.',
  },
  {
    id: 'd2',
    name: 'Dr. Rajan Acharya',
    title: 'Clinical Psychologist',
    org: 'Volunteer — Maiti Nepal',
    country: 'Nepal',
    flag: '🇳🇵',
    languages: ['Nepali', 'Hindi', 'English'],
    rating: 5.0,
    reviews: 87,
    status: 'online',
    statusLabel: 'Online Now',
    free: true,
    freeLabel: '100% Free',
    specialty: 'Trauma · PTSD · Adolescent mental health',
    avatar: '👨‍⚕️',
    bio: 'Rajan understands the Nepali social fabric deeply — family pressure, conservative norms, stigma. Your session stays private.',
  },
  {
    id: 'd3',
    name: 'Dr. James Carter',
    title: 'Clinical Psychologist',
    org: 'Pro Bono Network USA',
    country: 'United States',
    flag: '🇺🇸',
    languages: ['English'],
    rating: 4.8,
    reviews: 540,
    status: 'today',
    statusLabel: 'Available Today',
    free: true,
    freeLabel: 'Pro bono slots',
    specialty: 'CBT · Grief · Workplace stress',
    avatar: '👨‍⚕️',
    bio: 'James reserves 10 hours/week for patients who cannot afford care. Board-certified with 15 years of telehealth experience.',
  },
  {
    id: 'd4',
    name: 'Dr. Fatima Al-Zahra',
    title: 'Trauma Therapist',
    org: 'Médecins Sans Frontières',
    country: 'Jordan',
    flag: '🇯🇴',
    languages: ['Arabic', 'English', 'French'],
    rating: 4.9,
    reviews: 228,
    status: 'online',
    statusLabel: 'Online Now',
    free: true,
    freeLabel: 'MSF — Free',
    specialty: 'War trauma · Displacement · Anxiety',
    avatar: '👩‍⚕️',
    bio: 'Field-trained with MSF across 6 countries. Specialises in helping people process trauma when words alone aren\'t enough.',
  },
  {
    id: 'd5',
    name: 'Dr. Maria Elena Santos',
    title: 'Art Therapist',
    org: 'Global Art Therapy Collective',
    country: 'Brazil',
    flag: '🇧🇷',
    languages: ['Portuguese', 'Spanish', 'English'],
    rating: 4.7,
    reviews: 195,
    status: 'today',
    statusLabel: 'Available Today',
    free: true,
    freeLabel: 'Sliding scale / Free',
    specialty: 'Expressive arts · Nonverbal therapy · Autism',
    avatar: '👩‍⚕️',
    bio: 'Maria specialises in exactly what VoiceCanvas does — reading emotional content from drawings. She has worked with nonverbal patients for 12 years.',
  },
  {
    id: 'd6',
    name: 'Dr. Amara Diallo',
    title: 'Child Psychiatrist',
    org: 'Doctors Without Borders',
    country: 'Senegal / France',
    flag: '🇸🇳',
    languages: ['French', 'English', 'Wolof'],
    rating: 4.8,
    reviews: 143,
    status: 'soon',
    statusLabel: 'Available in 2 hrs',
    free: true,
    freeLabel: 'Doctors Without Borders',
    specialty: 'Child & adolescent · Cultural identity · Stigma',
    avatar: '👩‍⚕️',
    bio: 'Amara bridges the gap between Western clinical frameworks and African/Asian cultural contexts where mental health stigma is high.',
  },
  {
    id: 'd7',
    name: 'Dr. Chen Wei',
    title: 'Psychotherapist',
    org: 'Asia Pacific Volunteer Alliance',
    country: 'Singapore',
    flag: '🇸🇬',
    languages: ['Mandarin', 'English', 'Cantonese'],
    rating: 4.9,
    reviews: 267,
    status: 'online',
    statusLabel: 'Online Now',
    free: true,
    freeLabel: 'Free first session',
    specialty: 'OCD · Perfectionism · Family conflict',
    avatar: '👨‍⚕️',
    bio: 'Chen has worked extensively with patients from collectivist cultures where individual mental health needs are often suppressed for family honour.',
  },
  {
    id: 'd8',
    name: 'Dr. Yuki Tanaka',
    title: 'Art & Expressive Therapist',
    org: 'WHO Mental Health Gap',
    country: 'Japan',
    flag: '🇯🇵',
    languages: ['Japanese', 'English'],
    rating: 4.6,
    reviews: 118,
    status: 'today',
    statusLabel: 'Available Today',
    free: true,
    freeLabel: 'Volunteer — WHO',
    specialty: 'Drawing therapy · Nonverbal communication · ADHD',
    avatar: '👩‍⚕️',
    bio: 'Yuki pioneered drawing-based therapy in Japan. Your VoiceCanvas session is exactly the kind of data she works with every day.',
  },
];

const ALL_LANGS = ['All', 'Nepali', 'Hindi', 'English', 'Arabic', 'Spanish', 'Mandarin', 'French', 'Portuguese'];

const STATUS_COLOR = { online: 'var(--success)', today: 'var(--info)', soon: 'var(--warning)' };

const US_STATES = [
  { label: 'All States', value: '' },
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' }, { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' }, { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' }, { label: 'Delaware', value: 'DE' },
  { label: 'District of Columbia', value: 'DC' }, { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' }, { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' }, { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' }, { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' }, { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' }, { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' }, { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' }, { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' }, { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' }, { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' }, { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' }, { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' }, { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' }, { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' }, { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' }, { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' }, { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' }, { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' }, { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' }, { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' }, { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' },
];

function mapNpiToDoctor(r) {
  const b = r.basic || {};
  const tax = (r.taxonomies || []).find(t => t.primary) || r.taxonomies?.[0] || {};
  const addr = (r.addresses || []).find(a => a.address_purpose === 'LOCATION') || r.addresses?.[0] || {};
  const fullName = [b.first_name, b.middle_name, b.last_name].filter(Boolean).join(' ');
  const credential = b.credential ? `, ${b.credential}` : '';
  return {
    id: String(r.number),
    name: `${fullName}${credential}`,
    title: tax.desc || 'Healthcare Provider',
    org: 'NPI Registered US Provider',
    country: `${addr.city || ''}, ${addr.state || 'US'}`.replace(/^, /, ''),
    flag: '🇺🇸',
    languages: ['English'],
    rating: null,
    reviews: null,
    status: 'today',
    statusLabel: 'US Licensed',
    free: false,
    freeLabel: 'Contact for fees',
    specialty: tax.desc || 'General Practice',
    avatar: b.gender === 'F' ? '👩‍⚕️' : '👨‍⚕️',
    bio: `NPI: ${r.number}. Licensed in ${addr.state || 'US'}. ${tax.desc ? `Specialty: ${tax.desc}.` : ''} Contact this provider directly to confirm availability and fees.`,
    npiSource: true,
  };
}

function Stars({ rating }) {
  return (
    <span className="ds-stars">
      {'★'.repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? '½' : ''}
      <span className="ds-rating-num">{rating.toFixed(1)}</span>
    </span>
  );
}

// ── NPI Search Panel ──────────────────────────────────────────────────────────
function NpiSearch({ onConnect, expanded, setExpanded }) {
  const [npiName, setNpiName] = useState('');
  const [npiSpecialty, setNpiSpecialty] = useState('');
  const [npiState, setNpiState] = useState('');
  const [npiResults, setNpiResults] = useState(null); // null = not searched yet
  const [npiLoading, setNpiLoading] = useState(false);
  const [npiError, setNpiError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setNpiLoading(true);
    setNpiError(null);
    setNpiResults(null);

    try {
      const url = `/npi-proxy/api/?version=2.1&limit=10&enumeration_type=NPI-1${npiName ? `&first_name=${encodeURIComponent(npiName)}` : ''}${npiSpecialty ? `&taxonomy_description=${encodeURIComponent(npiSpecialty)}` : ''}${npiState ? `&state=${encodeURIComponent(npiState)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setNpiResults((data.results || []).map(mapNpiToDoctor));
    } catch (_) {
      setNpiError('Could not reach NPI registry. Check your connection.');
    } finally {
      setNpiLoading(false);
    }
  }

  return (
    <div className="ds-npi-panel">
      {/* Search form */}
      <form className="ds-npi-form" onSubmit={handleSearch}>
        <div className="ds-npi-fields">
          <div className="ds-npi-field">
            <label className="ds-npi-label">Doctor name (optional)</label>
            <input
              className="ds-npi-input"
              type="text"
              placeholder="e.g. Sarah"
              value={npiName}
              onChange={e => setNpiName(e.target.value)}
            />
          </div>
          <div className="ds-npi-field">
            <label className="ds-npi-label">Specialty (e.g. Psychiatry)</label>
            <input
              className="ds-npi-input"
              type="text"
              placeholder="e.g. Psychiatry"
              value={npiSpecialty}
              onChange={e => setNpiSpecialty(e.target.value)}
            />
          </div>
          <div className="ds-npi-field">
            <label className="ds-npi-label">State</label>
            <select
              className="ds-npi-select"
              value={npiState}
              onChange={e => setNpiState(e.target.value)}
            >
              {US_STATES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="ds-npi-search-btn"
            disabled={npiLoading}
          >
            {npiLoading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results area */}
      <div className="ds-npi-results">
        {npiLoading && (
          <div className="ds-npi-spinner-wrap">
            <div className="ds-npi-spinner" />
            <p className="ds-npi-status">Searching NPI registry…</p>
          </div>
        )}

        {npiError && !npiLoading && (
          <p className="ds-npi-error">{npiError}</p>
        )}

        {!npiLoading && !npiError && npiResults === null && (
          <div className="ds-npi-placeholder">
            <span className="ds-npi-placeholder-icon">🏥</span>
            <p>Search for a doctor above</p>
            <span className="ds-npi-placeholder-sub">
              Results are pulled live from the US National Provider Identifier registry
            </span>
          </div>
        )}

        {!npiLoading && !npiError && npiResults !== null && npiResults.length === 0 && (
          <p className="ds-npi-empty">No results — try a broader search.</p>
        )}

        {!npiLoading && npiResults && npiResults.length > 0 && (
          <div className="ds-npi-list">
            {npiResults.map(doc => (
              <NpiDoctorCard
                key={doc.id}
                doc={doc}
                onConnect={onConnect}
                expanded={expanded}
                setExpanded={setExpanded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NpiDoctorCard({ doc, onConnect, expanded, setExpanded }) {
  return (
    <motion.div
      className="ds-card ds-card-npi"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="ds-card-main">
        {/* Avatar */}
        <div className="ds-avatar-wrap">
          <div className="ds-avatar">{doc.avatar}</div>
          <div className="ds-status-dot" style={{ background: 'var(--info)' }} />
        </div>

        {/* Info */}
        <div className="ds-card-info">
          <div className="ds-card-top">
            <div>
              <span className="ds-doc-name">{doc.name}</span>
              <span className="ds-flag">{doc.flag}</span>
            </div>
            <span className="ds-npi-verified-badge">NPI Verified ✓</span>
          </div>

          <p className="ds-doc-title">{doc.title} · {doc.country}</p>
          <p className="ds-doc-specialty">{doc.specialty}</p>

          <div className="ds-card-meta">
            <span className="ds-npi-rating-note">★★★★★ Rating unknown</span>
          </div>

          <div className="ds-card-badges">
            <span className="ds-badge ds-badge-npi-fee">{doc.freeLabel}</span>
            <span className="ds-badge ds-badge-org">{doc.org}</span>
          </div>

          <p className="ds-npi-contact-note">Fees and availability not known — contact directly.</p>
        </div>

        {/* Connect button */}
        <button
          className="ds-connect-btn"
          onClick={() => onConnect(doc)}
        >
          Send
        </button>
      </div>

      {/* Expandable bio */}
      <button
        className="ds-expand-btn"
        onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
      >
        {expanded === doc.id ? 'Hide details ▲' : 'About this provider ▼'}
      </button>
      <AnimatePresence>
        {expanded === doc.id && (
          <motion.p
            className="ds-bio"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {doc.bio}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DoctorSelector({ onClose, onConnect, stressScore }) {
  const [tab, setTab] = useState('volunteers');
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    return DOCTORS.filter(d => {
      const matchLang = lang === 'All' || d.languages.includes(lang);
      const q = search.toLowerCase();
      const matchSearch = !q
        || d.name.toLowerCase().includes(q)
        || d.title.toLowerCase().includes(q)
        || d.country.toLowerCase().includes(q)
        || d.specialty.toLowerCase().includes(q)
        || d.languages.some(l => l.toLowerCase().includes(q));
      return matchLang && matchSearch;
    });
  }, [search, lang]);

  return (
    <motion.div
      className="ds-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="ds-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Handle bar */}
        <div className="ds-handle" />

        {/* Header */}
        <div className="ds-header">
          <div className="ds-header-text">
            <h2 className="ds-title">Connect with a Doctor</h2>
            <p className="ds-subtitle">
              Vetted volunteers from <strong>30+ countries</strong> — free for those who can't afford care.
              No judgement. No stigma. Your session is private.
            </p>
          </div>
          <button className="ds-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Breaking-barriers banner */}
        <div className="ds-mission-bar">
          <span className="ds-mission-icon">🌏</span>
          <p>
            A Nepali patient can speak with an Indian or American doctor in their own language — breaking
            the barriers of conservative societies, geography, and cost.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="ds-tabs">
          <button
            className={`ds-tab ${tab === 'volunteers' ? 'ds-tab-active' : ''}`}
            onClick={() => setTab('volunteers')}
          >
            Global Volunteers 🌏
          </button>
          <button
            className={`ds-tab ${tab === 'npi' ? 'ds-tab-active' : ''}`}
            onClick={() => setTab('npi')}
          >
            Search US Doctors 🏥
          </button>
        </div>

        {/* Volunteers tab */}
        {tab === 'volunteers' && (
          <>
            {/* Search + language filter */}
            <div className="ds-filters">
              <div className="ds-search-wrap">
                <svg className="ds-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  className="ds-search"
                  type="text"
                  placeholder="Search by name, country, specialty…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="ds-lang-chips">
                {ALL_LANGS.map(l => (
                  <button
                    key={l}
                    className={`ds-lang-chip ${lang === l ? 'ds-lang-active' : ''}`}
                    onClick={() => setLang(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor list */}
            <div className="ds-list">
              {filtered.length === 0 && (
                <p className="ds-empty">No doctors match your filter. Try "All" languages.</p>
              )}
              {filtered.map(doc => (
                <motion.div
                  key={doc.id}
                  className="ds-card"
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="ds-card-main">
                    {/* Avatar + status */}
                    <div className="ds-avatar-wrap">
                      <div className="ds-avatar">{doc.avatar}</div>
                      <div className="ds-status-dot" style={{ background: STATUS_COLOR[doc.status] }} />
                    </div>

                    {/* Info */}
                    <div className="ds-card-info">
                      <div className="ds-card-top">
                        <div>
                          <span className="ds-doc-name">{doc.name}</span>
                          <span className="ds-flag">{doc.flag}</span>
                        </div>
                        <span
                          className="ds-status-badge"
                          style={{ '--sc': STATUS_COLOR[doc.status] }}
                        >
                          {doc.statusLabel}
                        </span>
                      </div>

                      <p className="ds-doc-title">{doc.title} · {doc.country}</p>
                      <p className="ds-doc-specialty">{doc.specialty}</p>

                      <div className="ds-card-meta">
                        <Stars rating={doc.rating} />
                        <span className="ds-reviews">({doc.reviews} reviews)</span>
                        <span className="ds-separator">·</span>
                        <span className="ds-langs">
                          {doc.languages.join(', ')}
                        </span>
                      </div>

                      <div className="ds-card-badges">
                        <span className="ds-badge ds-badge-free">{doc.freeLabel}</span>
                        <span className="ds-badge ds-badge-org">{doc.org}</span>
                      </div>
                    </div>

                    {/* Connect button */}
                    <button
                      className="ds-connect-btn"
                      onClick={() => onConnect(doc)}
                    >
                      Send
                    </button>
                  </div>

                  {/* Expandable bio */}
                  <button
                    className="ds-expand-btn"
                    onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
                  >
                    {expanded === doc.id ? 'Hide details ▲' : 'About this doctor ▼'}
                  </button>
                  <AnimatePresence>
                    {expanded === doc.id && (
                      <motion.p
                        className="ds-bio"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {doc.bio}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* NPI tab */}
        {tab === 'npi' && (
          <div className="ds-list">
            <NpiSearch
              onConnect={onConnect}
              expanded={expanded}
              setExpanded={setExpanded}
            />
          </div>
        )}

        {/* Footer note */}
        <div className="ds-footer-note">
          <span>🔒 End-to-end encrypted · Session data shared only with the doctor you choose · You can withdraw consent at any time</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
