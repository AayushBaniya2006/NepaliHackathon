import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStorage } from '../hooks/useStorage';
import { DRAWING_PROMPTS, WEEKLY_GOAL } from '../utils/drawingPrompts';
import CareBoard from '../components/CareBoard';
import StressChart from '../components/StressChart';
import './Dashboard.css';

const MOOD_EMOJIS = [
  { emoji: '😊', label: 'Happy', color: 'var(--teal-500)' },
  { emoji: '😌', label: 'Calm', color: 'var(--sky-500)' },
  { emoji: '😤', label: 'Angry', color: 'var(--coral-500)' },
  { emoji: '😢', label: 'Sad', color: 'var(--violet-500)' },
  { emoji: '😰', label: 'Anxious', color: 'var(--rose-500)' },
  { emoji: '😶', label: 'Numb', color: 'var(--gray-400)' },
];
const MOOD_STORAGE_KEY = 'mc_last_mood';

// --- Icons ---
const HomeIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);
// Use ListIcon for Sessions
const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);
const CompassIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
);
const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

function ProgressRing({ current, total, size = 120, strokeWidth = 10, color = "#C4F038" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(current / total, 1);
  const offset = circumference * (1 - pct);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16,1,0.3,1] }}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#111827' }}>
          {Math.round(pct * 100)}%
        </span>
      </div>
    </div>
  );
}

function MiniSparkline({ data }) {
  const max = Math.max(...data, 10);
  const min = Math.min(...data, 0);
  const range = max - min;
  const w = 220;
  const h = 50;
  
  const pts = data.map((val, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - ((val - min) / (range || 1)) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#C4F038" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, sessions, getWeekNumber, getWeekSessions, getAverageStress, setProfile } = useStorage();

  const handleCaregiverPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfile({
        ...(profile || {}),
        caregiverPhotos: [...(profile?.caregiverPhotos || []), ev.target.result],
      });
    };
    reader.readAsDataURL(file);
  };
  const [selectedMood, setSelectedMood] = useState(null);

  useEffect(() => {
    try {
      const last = sessionStorage.getItem(MOOD_STORAGE_KEY);
      if (last) setSelectedMood(last);
    } catch {
      /* ignore */
    }
  }, []);
  
  const weekSessions = getWeekSessions();
  const avgStress = getAverageStress();
  const pct = Math.round((weekSessions.length / WEEKLY_GOAL) * 100) || 0;

  return (
    <div className="dash-container">
      {/* --- Sidebar --- */}
      <aside className="dash-sidebar">
        <div className="sidebar-logo">
          <img src="/Untitled design (3)/cute-brain.svg" alt="logo" style={{width: '32px', height: '32px'}} />
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active" onClick={() => navigate('/dashboard')} title="Home"><HomeIcon /></button>
          <button className="nav-item" onClick={() => navigate('/draw')} title="Start Session (Prompts)"><ActivityIcon /></button>
          <button className="nav-item" onClick={() => navigate('/find-doctor')} title="Find Doctor"><CompassIcon /></button>
        </nav>
      </aside>

      {/* --- Main Content --- */}
      <main className="dash-main">
        <header className="dash-top">
          <div className="top-text">
            <h1>Hi, {profile?.name || 'Raj'}!</h1>
            <p>Let's check your health today</p>
          </div>
          
          <div className="top-search">
            <span className="search-icon"><SearchIcon /></span>
            <input type="text" placeholder="Search..." />
            <span className="search-k">⌘K</span>
          </div>

          <div className="top-user">
            <div className="user-profile">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="avatar" className="avatar-img" />
              ) : (
                <div className="avatar">{profile?.name ? profile.name[0].toUpperCase() : 'R'}</div>
              )}
              <div className="user-info">
                <strong>{profile?.name || 'Raj'}</strong>
                <span>member</span>
              </div>
            </div>
          </div>
        </header>

        <div className="hero-mood-section">
          <h3>How are you feeling today?</h3>
          <div className="mood-row">
            {MOOD_EMOJIS.map((m) => (
              <button
                key={m.label}
                type="button"
                className={`mood-btn${selectedMood === m.label ? ' mood-btn-selected' : ''}`}
                title={`${m.label} — start drawing`}
                onClick={() => {
                  setSelectedMood(m.label);
                  try { sessionStorage.setItem(MOOD_STORAGE_KEY, m.label); } catch {}
                  navigate('/draw', { state: { promptId: 'energy', preSessionMood: m.label } });
                }}
              >
                <span className="mood-face">{m.emoji}</span>
                <span className="mood-name">{m.label}</span>
              </button>
            ))}
          </div>
        </div>


        <div className="dash-grid">
          {/* COLUMN LEFT */}
          <div className="grid-col col-left">
            {/* Wellness Score */}
            <div className="card score-card">
              <div className="score-text-row">
                <p>Wellness Score</p>
                <h2>{pct}%</h2>
              </div>
              <div className="score-wave">
                 <MiniSparkline data={sessions.length ? sessions.slice(-10).map(s => s.stressScore||5) : [5,6,4,5,7,5]} />
              </div>
              <div className="score-bottom">
                <span>Source: VoiceCanvas</span>
                <a onClick={() => navigate('/session-results')}>View Details {'>'}</a>
              </div>
            </div>

            {/* Today's Activity */}
            <div className="card activity-card">
              <div className="card-top-header">
                <h3>Today's Activity</h3>
                <button className="add-btn" onClick={() => navigate('/draw')} title="Add Session">+</button>
              </div>
              <p className="subtitle">Daily Completion</p>
              
              <div className="activity-chart-placeholder">
                 <MiniSparkline data={weekSessions.length ? [2,5,3,6,4,7,5] : [1,2,1,3,1,2,1]} />
              </div>

              <div className="days-row">
                {['S','M','T','W','T','F','S'].map((d, i) => {
                  const today = new Date().getDay();
                  let cls = 'day-circle';
                  if (i === today) cls += ' active';
                  if (i < today) cls += ' checked';
                  return <span key={i} className={cls}>{i < today ? '✓' : d}</span>;
                })}
              </div>
            </div>

            {/* Recent Sessions List (replaced Upcoming Workouts) */}
            <div className="card">
              <div className="card-top-header">
                <h3>Recent Sessions</h3>
                <a onClick={() => navigate('/session-results')}>View All {'>'}</a>
              </div>
              <div className="prompts-list">
                {sessions.slice(-3).reverse().map((s, i) => {
                   const p = DRAWING_PROMPTS.find(pr => pr.id === s.promptId) || DRAWING_PROMPTS[0];
                   return (
                     <div key={s.id || i} className="prompt-item" style={{background: p.colorLight}}>
                       <div className="prompt-icon">{s.imageUrl ? <img src={s.imageUrl} style={{width:'100%', height:'100%', borderRadius:'8px', objectFit:'cover'}} alt="draw"/> : p.icon}</div>
                       <div className="prompt-info">
                         <h4>{p.title}</h4>
                         <p>{new Date(s.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                       </div>
                       <span className="prompt-action">···</span>
                     </div>
                   );
                })}
                {sessions.length === 0 && <p className="subtitle" style={{marginTop:'10px'}}>No sessions yet. Draw today!</p>}
              </div>
            </div>

            {/* Steps / Streak */}
            <div className="card streak-card">
               <p>Total Sessions</p>
               <h2>{sessions.length} <span>/drawings</span></h2>
               <div className="gradient-bar-wrap">
                 <span>Current</span>
                 <div className="g-bar"></div>
                 <span>Goal</span>
               </div>
            </div>
          </div>

          {/* COLUMN MIDDLE */}
          <div className="grid-col col-mid">
            <div className="stats-row">
               <div className="card stat-mini">
                 <div className="stat-text">
                   <p>Avg Stress</p>
                   <h2>{avgStress.toFixed(1)} <span>/10</span></h2>
                   <span className="stat-sub">Last 7 days</span>
                 </div>
                 <img src="/Untitled design (3)/cute-brain.svg" alt="brain" className="stat-icon" />
               </div>
               
               <div className="card stat-mini">
                 <div className="stat-text">
                   <p>Overall Mood</p>
                   <h2>{avgStress < 5 ? 'Good' : 'Fair'} <span></span></h2>
                   <span className="stat-sub">Self report</span>
                 </div>
                 <img src="/Untitled design (3)/healthy-brain-boy.svg" alt="mood" className="stat-icon" />
               </div>
            </div>

            {/* CareBoard Wrapper replaces Banner */}
            <div className="careboard-wrapper">
               <CareBoard />
            </div>

            {/* Active Stress Chart (replaces Calories chart) */}
            <div className="card chart-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
               <StressChart sessions={sessions} />
            </div>
          </div>

          {/* COLUMN RIGHT */}
          <div className="grid-col col-right">
             {/* PROMINENT: Today's Drawing Prompts */}
             <div className="card prompts-prominent-card">
               <div className="card-top-header">
                 <h3>Drawing Prompts</h3>
                 <a onClick={() => navigate('/draw')}>View All {'>'}</a>
               </div>
               <p className="subtitle" style={{marginBottom: '15px'}}>Start your session now.</p>
               <div className="videos-list">
                 {DRAWING_PROMPTS.slice(0, 4).map((p, i) => (
                   <div key={p.id} className="video-item prompt-highlight-item" onClick={() => navigate('/draw', { state: {promptId: p.id} })}>
                     <div className="vid-thumb" style={{ background: p.bgGradient }}>
                        <span style={{ fontSize: '24px' }}>{p.icon}</span>
                     </div>
                     <div className="vid-info">
                       <h4>{p.title}</h4>
                       <p>{p.description.substring(0, 26)}...</p>
                     </div>
                     <button className="vid-play">▶</button>
                   </div>
                 ))}
               </div>
             </div>

             {/* Monthly Progress */}
             <div className="card monthly-card">
               <h3>Weekly Progress</h3>
               <div className="gauge-container">
                  <ProgressRing current={weekSessions.length} total={WEEKLY_GOAL} size={140} strokeWidth={12} color="#C4F038" />
               </div>
               <p className="monthly-desc">You have achieved <strong>{pct}%</strong> of your goal this week</p>
             </div>

             {/* Caregiver Photos */}
             <div className="card">
               <div className="card-top-header">
                 <h3>Caregiver Photos</h3>
                 <label style={{ cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, color: 'var(--teal-500)', userSelect: 'none' }} title="Upload photo">
                   +
                   <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCaregiverPhoto} />
                 </label>
               </div>
               {profile?.caregiverPhotos?.length > 0 ? (
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                   {profile.caregiverPhotos.map((url, i) => (
                     <img key={i} src={url} alt={`caregiver-${i}`}
                       style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', border: '2px solid var(--gray-100)' }} />
                   ))}
                 </div>
               ) : (
                 <p className="subtitle" style={{ marginTop: '8px' }}>Upload a photo from your caregiver to see it here as a comforting prompt before sessions.</p>
               )}
             </div>

             {/* Schedule Card / Free Resources */}
             <div className="card">
               <div className="card-top-header">
                 <h3>Clinical Resources</h3>
                 <a onClick={() => navigate('/resources')}>View All {'>'}</a>
               </div>
               <div className="schedule-list">
                  <div className="sch-item" onClick={() => navigate('/find-doctor')} style={{cursor:'pointer'}}>
                    <div className="sch-icon"><img src="/Untitled design (3)/sporty-brain.svg" alt="icon"/></div>
                    <div className="sch-info">
                      <h4>Find a Therapist</h4>
                      <p>Local matches</p>
                    </div>
                    <span className="sch-badge badge-green">Connect</span>
                  </div>

                  <div className="sch-item" onClick={() => window.location.href="tel:988"} style={{cursor:'pointer'}}>
                    <div className="sch-icon"><img src="/Untitled design (3)/rainbow-mental-health.svg" alt="icon"/></div>
                    <div className="sch-info">
                      <h4>Crisis Line</h4>
                      <p>Call 988</p>
                    </div>
                    <span className="sch-badge badge-red" style={{background:'#FEE2E2', color:'#EF4444'}}>24/7 Free</span>
                  </div>

                  <div className="sch-item" onClick={() => navigate('/resources')} style={{cursor:'pointer'}}>
                    <div className="sch-icon"><img src="/Untitled design (3)/love-brain.svg" alt="icon"/></div>
                    <div className="sch-info">
                      <h4>Free Resources</h4>
                      <p>Community</p>
                    </div>
                    <span className="sch-badge badge-green">Explore</span>
                  </div>
               </div>
             </div>

          </div>
        </div>
      </main>
    </div>
  );
}
