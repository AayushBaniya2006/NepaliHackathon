/**
 * CareNote — public shareable page at /care/:patientId
 * Anyone with the link can leave a note/photo that appears on
 * the patient's Care Board. No login required.
 *
 * Storage: writes to localStorage key `mc_care_incoming_{patientId}`,
 * which CareBoard reads on mount. Works cross-device when Azure is
 * configured (writes to Azure care-notes.json); works same-browser
 * for demo purposes without Azure.
 */
import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAzureBlobConfig, buildBlobUrl } from '../utils/azureBlob';
import './CareNote.css';

const COLOR_OPTIONS = [
  { key: 'yellow',   bg: '#FFF9C4', label: 'Sunny' },
  { key: 'pink',     bg: '#FCE4EC', label: 'Rosy' },
  { key: 'green',    bg: '#E8F5E9', label: 'Calm' },
  { key: 'blue',     bg: '#E3F2FD', label: 'Sky' },
  { key: 'lavender', bg: '#EDE7F6', label: 'Soft' },
  { key: 'peach',    bg: '#FBE9E7', label: 'Warm' },
];

const QUICK_EMOJIS = ['💛', '🌸', '🙏', '💪', '🌿', '🤍', '✨', '🌈', '🫂', '❤️'];

async function persistNote(patientId, note) {
  // ── 1. Always write to localStorage (same-browser demo) ──────────────────
  const lsKey = `mc_care_incoming_${patientId}`;
  try {
    const existing = JSON.parse(localStorage.getItem(lsKey) || '[]');
    localStorage.setItem(lsKey, JSON.stringify([note, ...existing]));
  } catch (_) {}

  // ── 2. If Azure is configured, also write to the blob ────────────────────
  const cfg = getAzureBlobConfig();
  if (!cfg) return;

  const path = `${patientId}/care-notes.json`;
  const url = buildBlobUrl(cfg.account, cfg.container, path, cfg.sas);

  let prev = [];
  try {
    const res = await fetch(url);
    if (res.ok) {
      const j = await res.json();
      prev = Array.isArray(j.notes) ? j.notes : [];
    }
  } catch (_) {}

  const doc = { patientId, notes: [note, ...prev], updatedAt: new Date().toISOString() };
  await fetch(url, {
    method: 'PUT',
    headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
}

export default function CareNote() {
  const { patientId } = useParams();

  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('yellow');
  const [emoji, setEmoji] = useState('💛');
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImageDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() && !imageDataUrl) return;
    setSubmitting(true);
    setError(null);

    const note = {
      id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: imageDataUrl ? 'image' : 'text',
      text: text.trim(),
      imageDataUrl: imageDataUrl || null,
      author: author.trim() || 'A friend',
      color,
      emoji: imageDataUrl ? '' : emoji,
      rotation: Math.round((Math.random() * 8 - 4) * 10) / 10,
      createdAt: new Date().toISOString(),
      seeded: false,
      external: true,
    };

    try {
      await persistNote(patientId, note);
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = (text.trim().length > 0 || imageDataUrl) && !submitting;
  const chosenColor = COLOR_OPTIONS.find(c => c.key === color) || COLOR_OPTIONS[0];

  return (
    <div className="cn-page">
      {/* Floating hearts background decoration */}
      <div className="cn-bg-deco" aria-hidden>
        {['💛','🌸','✨','🌿','💙','🤍'].map((e, i) => (
          <span key={i} className="cn-bg-float" style={{ '--i': i }}>{e}</span>
        ))}
      </div>

      <div className="cn-card">
        <AnimatePresence mode="wait">
          {sent ? (
            /* ── Success state ─────────────────────────────────────────── */
            <motion.div
              key="success"
              className="cn-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
              <div className="cn-success-icon">🌸</div>
              <h2 className="cn-success-title">Your note is on their board!</h2>
              <p className="cn-success-body">
                They'll see it the next time they open their Care Board.
                Small acts of kindness like this make a real difference on a
                mental health journey.
              </p>
              <button
                className="cn-btn-primary"
                onClick={() => { setText(''); setAuthor(''); setImageDataUrl(null); setSent(false); }}
              >
                Send another note 💛
              </button>
            </motion.div>
          ) : (
            /* ── Form ──────────────────────────────────────────────────── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header */}
              <div className="cn-header">
                <div className="cn-header-icon">💝</div>
                <h1 className="cn-title">Leave a care note</h1>
                <p className="cn-subtitle">
                  Someone you care about is on a wellness journey.<br />
                  Your words will appear on their personal Care Board.
                </p>
              </div>

              <div className="cn-body-row">
                <div className="cn-preview-column">
                  {/* Live preview sticky */}
                  <div
                    className="cn-preview"
                    style={{ background: chosenColor.bg, transform: `rotate(${-1.5}deg)` }}
                  >
                    {imageDataUrl ? (
                      <div className="cn-preview-polaroid">
                        <img src={imageDataUrl} alt="preview" className="cn-preview-img" />
                        <p className="cn-preview-author">— {author || 'A friend'}</p>
                      </div>
                    ) : (
                      <>
                        {emoji && <span className="cn-preview-emoji">{emoji}</span>}
                        <p className="cn-preview-text">{text || 'Your message will appear here…'}</p>
                        <p className="cn-preview-author">— {author || 'A friend'}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="cn-form-column">
                  <form className="cn-form" onSubmit={handleSubmit}>
                {/* Emoji quick-pick */}
                {!imageDataUrl && (
                  <div className="cn-field">
                    <label className="cn-label">Pick an emoji</label>
                    <div className="cn-emoji-row">
                      {QUICK_EMOJIS.map(em => (
                        <button
                          key={em}
                          type="button"
                          className={`cn-emoji-btn ${emoji === em ? 'cn-emoji-active' : ''}`}
                          onClick={() => setEmoji(em)}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                {!imageDataUrl && (
                  <div className="cn-field">
                    <label className="cn-label">Your message <span className="cn-required">*</span></label>
                    <textarea
                      className="cn-textarea"
                      placeholder="Write something kind, encouraging, or just 'I love you' — it all counts 💛"
                      value={text}
                      onChange={e => setText(e.target.value.slice(0, 280))}
                      rows={4}
                    />
                    <span className="cn-char-count">{text.length}/280</span>
                  </div>
                )}

                {/* Photo option */}
                <div className="cn-field">
                  <label className="cn-label">
                    {imageDataUrl ? 'Your photo' : 'Or send a photo instead'}
                  </label>
                  {imageDataUrl ? (
                    <div className="cn-photo-preview">
                      <img src={imageDataUrl} alt="preview" />
                      <button
                        type="button"
                        className="cn-photo-remove"
                        onClick={() => setImageDataUrl(null)}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="cn-photo-btn"
                      onClick={() => fileRef.current?.click()}
                    >
                      📷 Upload a family photo or selfie
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImage}
                  />
                </div>

                {/* From + color row */}
                <div className="cn-row">
                  <div className="cn-field cn-field-grow">
                    <label className="cn-label">From</label>
                    <input
                      className="cn-input"
                      type="text"
                      placeholder="e.g. Mum, Your brother, A friend…"
                      value={author}
                      onChange={e => setAuthor(e.target.value)}
                    />
                  </div>
                  <div className="cn-field">
                    <label className="cn-label">Note colour</label>
                    <div className="cn-color-row">
                      {COLOR_OPTIONS.map(c => (
                        <button
                          key={c.key}
                          type="button"
                          className={`cn-color-dot ${color === c.key ? 'cn-color-active' : ''}`}
                          style={{ background: c.bg, outline: color === c.key ? `3px solid #555` : 'none' }}
                          title={c.label}
                          onClick={() => setColor(c.key)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {error && <p className="cn-error">{error}</p>}

                <button
                  type="submit"
                  className="cn-btn-primary"
                  disabled={!canSubmit}
                >
                  {submitting ? 'Pinning…' : 'Pin to their board 📌'}
                </button>
              </form>

                  <p className="cn-privacy">
                    🔒 Your note is private to this person's board. No account required.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
