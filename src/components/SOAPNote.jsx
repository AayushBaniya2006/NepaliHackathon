import { useState } from 'react';
import { motion } from 'framer-motion';
import './SOAPNote.css';

export default function SOAPNote({ clinicalNote, onUpdate }) {
  const [editField, setEditField] = useState(null);
  const [copied, setCopied] = useState(false);

  const sections = [
    { key: 'S', label: 'Subjective', icon: '💭', color: 'var(--teal)' },
    { key: 'O', label: 'Objective', icon: '👁️', color: 'var(--amber)' },
    { key: 'A', label: 'Assessment', icon: '🧠', color: 'var(--lavender)' },
    { key: 'P', label: 'Plan', icon: '📋', color: 'var(--sage)' },
  ];

  const handleCopy = () => {
    const text = sections
      .map(s => `${s.label}:\n${clinicalNote[s.key]}`)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEdit = (key, value) => {
    onUpdate?.({ ...clinicalNote, [key]: value });
  };

  return (
    <div className="soap-note">
      <div className="soap-header">
        <h3>📄 Clinical Note (SOAP)</h3>
        <div className="soap-actions">
          <button className="btn btn-sm btn-secondary" onClick={handleCopy}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>

      <div className="soap-timestamp">
        {new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>

      <div className="soap-sections">
        {sections.map((section, i) => (
          <motion.div
            key={section.key}
            className="soap-section glass-light"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 + 0.2 }}
          >
            <div className="soap-section-header" style={{ '--accent': section.color }}>
              <span className="soap-icon">{section.icon}</span>
              <span className="soap-label" style={{ color: section.color }}>
                {section.key} — {section.label}
              </span>
              <button
                className="edit-toggle"
                onClick={() => setEditField(editField === section.key ? null : section.key)}
              >
                {editField === section.key ? '✓ Done' : '✎ Edit'}
              </button>
            </div>

            {editField === section.key ? (
              <textarea
                className="soap-editor"
                value={clinicalNote[section.key] || ''}
                onChange={(e) => handleEdit(section.key, e.target.value)}
                autoFocus
                rows={4}
              />
            ) : (
              <p className="soap-content">{clinicalNote[section.key] || 'N/A'}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
