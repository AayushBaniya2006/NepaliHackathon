import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLlm } from '../hooks/useLlm';
import './ResourceFinder.css';

const TYPE_ICONS = {
  crisis_line: '🆘',
  clinic: '🏥',
  telehealth: '💻',
  grant: '💰',
  support_group: '🤝',
};

export default function ResourceFinder() {
  const navigate = useNavigate();
  const { findResources, loading } = useLlm();
  const [zipCode, setZipCode] = useState('');
  const [resources, setResources] = useState(null);
  const [locationMethod, setLocationMethod] = useState(null);

  const handleSearch = useCallback(async (location) => {
    const results = await findResources(location);
    setResources(results);
  }, [findResources]);

  const handleZipSubmit = (e) => {
    e.preventDefault();
    if (zipCode.trim()) {
      setLocationMethod('zip');
      handleSearch(zipCode);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported');
      return;
    }
    setLocationMethod('geo');
    navigator.geolocation.getCurrentPosition(
      async (pos) => handleSearch(`latitude ${pos.coords.latitude}, longitude ${pos.coords.longitude}`),
      () => {
        alert('Could not get location. Please enter a zip code.');
        setLocationMethod(null);
      }
    );
  };

  return (
    <div className="resource-page">
      <header className="res-header">
        <div className="container">
          <div className="res-header-inner">
            <button className="btn btn-sm btn-ghost" onClick={() => navigate(-1)}>← Back</button>
            <div className="res-brand">
              <span>🎨</span>
              <span className="res-brand-text">MindCanvas</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-narrow res-main">
        <motion.div className="res-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1>🏥 Find Free & Low-Cost Care</h1>
          <p>Mental health support near you — no insurance required.</p>
        </motion.div>

        {/* Crisis banner */}
        <motion.div
          className="crisis-banner card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="crisis-icon-lg">🆘</span>
          <div>
            <strong>In crisis? Get immediate help:</strong>
            <div className="crisis-links">
              <a href="tel:988" className="btn btn-sm btn-danger">📞 Call 988</a>
              <a href="sms:741741?body=HOME" className="btn btn-sm btn-warning">💬 Text HOME to 741741</a>
            </div>
          </div>
        </motion.div>

        {!resources && (
          <motion.div
            className="res-search card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <form onSubmit={handleZipSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="zip">Enter your zip code</label>
                <div className="zip-row">
                  <input
                    className="form-input"
                    type="text"
                    id="zip"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="e.g. 10001"
                    maxLength={10}
                  />
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading && locationMethod === 'zip' ? '⏳ Searching...' : '🔍 Search'}
                  </button>
                </div>
              </div>
              <div className="res-or"><span>or</span></div>
              <button type="button" className="btn btn-secondary btn-lg res-geo-btn" onClick={handleGeolocation} disabled={loading}>
                {loading && locationMethod === 'geo' ? '⏳ Locating...' : '📍 Use My Location'}
              </button>
            </form>
          </motion.div>
        )}

        {loading && (
          <div className="res-loading">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="res-spinner" />
            <p>Finding resources near you...</p>
          </div>
        )}

        {resources && !loading && (
          <motion.div className="res-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="res-results-header">
              <span>{resources.length} resources found</span>
              <button className="btn btn-sm btn-secondary" onClick={() => { setResources(null); setZipCode(''); setLocationMethod(null); }}>
                🔄 New Search
              </button>
            </div>
            <div className="res-list">
              {resources.map((r, i) => (
                <motion.div
                  key={i}
                  className="res-card card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="res-card-header">
                    <span className="res-type-icon">{TYPE_ICONS[r.type] || '🏥'}</span>
                    <div>
                      <h3>{r.name}</h3>
                      <span className="badge badge-blue">{(r.type || '').replace('_', ' ')}</span>
                    </div>
                  </div>
                  <p className="res-desc">{r.description}</p>
                  <div className="res-details">
                    {r.phone && r.phone !== 'N/A' && <span>📞 {r.phone}</span>}
                    {r.cost && <span>💰 {r.cost}</span>}
                    {r.hours && <span>🕐 {r.hours}</span>}
                  </div>
                  {r.website && r.website !== 'N/A' && (
                    <a href={r.website} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline res-visit-btn">
                      Visit Website →
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <p className="res-disclaimer">Resources provided for information only. Verify before visiting.</p>
      </div>
    </div>
  );
}
