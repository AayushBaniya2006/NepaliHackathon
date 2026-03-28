import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAzureBlobConfig, buildBlobUrl } from '../utils/azureBlob';
import './CareBoard.css';

const STORAGE_KEY = 'mc_care_board';
const PATIENT_ID = import.meta.env.VITE_PATIENT_ID || 'demo-patient';

const SEEDED_NOTES = [
  {
    id: 's1',
    type: 'text',
    text: 'You are braver than you believe, stronger than you seem, and smarter than you think.',
    author: 'Your Care Team',
    color: 'yellow',
    rotation: -2,
    emoji: '💛',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    seeded: true,
  },
  {
    id: 's2',
    type: 'text',
    text: 'Every time you express yourself, you take one step forward. We see you. 🌱',
    author: 'MindCanvas Community',
    color: 'green',
    rotation: 2,
    emoji: '🌿',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    seeded: true,
  },
  {
    id: 's3',
    type: 'text',
    text: 'मन खोल्न सक्नु आफैंमा ठूलो साहस हो। (Opening your mind is itself great courage.)',
    author: 'Nepali Proverb',
    color: 'lavender',
    rotation: -1,
    emoji: '🙏',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    seeded: true,
  },
  {
    id: 's4',
    type: 'text',
    text: 'Doctors Without Borders volunteers are standing by to help — without judgement, without cost.',
    author: 'VoiceCanvas',
    color: 'blue',
    rotation: 3,
    emoji: '🌍',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    seeded: true,
  },
  {
    id: 's5',
    type: 'text',
    text: "Rest if you must, but don't quit. 🤍",
    author: 'Anonymous',
    color: 'pink',
    rotation: -3,
    emoji: '🤍',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    seeded: true,
  },
];

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return SEEDED_NOTES;
}

function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (_) {}
}

/** Merge incoming notes into the board — dedup by id */
function mergeIncoming(existing, incoming) {
  if (!incoming.length) return existing;
  const ids = new Set(existing.map(n => n.id));
  const fresh = incoming.filter(n => !ids.has(n.id));
  if (!fresh.length) return existing;
  return [...fresh, ...existing];
}

/** Pull notes sent via the /care/:patientId page (localStorage, same browser) */
function drainLocalIncoming(patientId) {
  const key = `mc_care_incoming_${patientId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

/** Fetch notes from Azure care-notes.json (cross-device) */
async function fetchAzureNotes(patientId) {
  const cfg = getAzureBlobConfig();
  if (!cfg) return [];
  const url = buildBlobUrl(cfg.account, cfg.container, `${patientId}/care-notes.json`, cfg.sas);
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j.notes) ? j.notes : [];
  } catch (_) {
    return [];
  }
}

export default function CareBoard() {
  const [notes, setNotes] = useState(loadNotes);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/care/${PATIENT_ID}`;

  // On mount: pull incoming notes from localStorage + Azure
  useEffect(() => {
    const local = drainLocalIncoming(PATIENT_ID);
    setNotes(prev => {
      const merged = mergeIncoming(prev, local);
      saveNotes(merged);
      return merged;
    });

    fetchAzureNotes(PATIENT_ID).then(azureNotes => {
      if (!azureNotes.length) return;
      setNotes(prev => {
        const merged = mergeIncoming(prev, azureNotes);
        saveNotes(merged);
        return merged;
      });
    });
  }, []);

  function handleDelete(id) {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      saveNotes(next);
      return next;
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Leave me a kind note on my Care Board 💛 ${shareUrl}`)}`;

  return (
    <div className="cb-section">
      <div className="cb-section-head">
        <div>
          <h2 className="cb-title">Care Board</h2>
          <p className="cb-subtitle">Notes from people who care about you</p>
        </div>
        <button
          className="cb-share-btn"
          onClick={() => setShowShare(v => !v)}
          aria-expanded={showShare}
        >
          Share your board
        </button>
      </div>

      {/* Share panel */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            className="cb-share-panel"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            <p className="cb-share-intro">
              Send this link to family, friends, or anyone who wants to leave you a warm note or photo.
              No account needed — they just open the link and pin a message to your board. 💛
            </p>
            <div className="cb-share-url-row">
              <span className="cb-share-url">{shareUrl}</span>
              <button className="cb-copy-btn" onClick={handleCopy}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <div className="cb-share-actions">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cb-whatsapp-btn"
              >
                Share via WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinboard */}
      <div className="cb-board">
        <AnimatePresence>
          {notes.length === 0 && (
            <p className="cb-empty">No notes yet — share your board link so people can send you one!</p>
          )}
          {notes.map((note, i) => (
            <NoteCard key={note.id} note={note} index={i} onDelete={handleDelete} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NoteCard({ note, index, onDelete }) {
  return (
    <motion.div
      className={`cb-note cb-note-${note.color}`}
      style={{ transform: `rotate(${note.rotation}deg)` }}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: -10 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ rotate: 0, scale: 1.04, zIndex: 10, boxShadow: '0 16px 40px rgba(0,0,0,0.18)' }}
      layout
    >
      <button
        className="cb-note-delete"
        onClick={() => onDelete(note.id)}
        aria-label="Remove note"
        title="Remove note"
      >
        ×
      </button>

      {note.external && (
        <span className="cb-note-external-badge">New 💌</span>
      )}

      {note.type === 'image' && note.imageDataUrl ? (
        <div className="cb-note-polaroid">
          <img src={note.imageDataUrl} alt="care note" className="cb-note-image" />
          <p className="cb-note-author">{note.author}</p>
        </div>
      ) : (
        <>
          {note.emoji && <span className="cb-note-emoji">{note.emoji}</span>}
          <p className="cb-note-text">{note.text}</p>
          <p className="cb-note-author">— {note.author}</p>
        </>
      )}
    </motion.div>
  );
}
