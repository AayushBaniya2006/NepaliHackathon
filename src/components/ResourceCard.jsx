import { motion } from 'framer-motion';
import './ResourceCard.css';

const TYPE_ICONS = {
  crisis_line: '🆘',
  clinic: '🏥',
  telehealth: '💻',
  grant: '💰',
  support_group: '🤝',
};

const TYPE_COLORS = {
  crisis_line: 'var(--rose)',
  clinic: 'var(--teal)',
  telehealth: 'var(--lavender)',
  grant: 'var(--amber)',
  support_group: 'var(--sage)',
};

export default function ResourceCard({ resource, index }) {
  const icon = TYPE_ICONS[resource.type] || '📍';
  const color = TYPE_COLORS[resource.type] || 'var(--teal)';

  return (
    <motion.div
      className={`resource-card glass-light ${resource.type === 'crisis_line' ? 'crisis' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="resource-card-header">
        <span className="resource-icon">{icon}</span>
        <div>
          <h4 className="resource-name">{resource.name}</h4>
          <span className="resource-type" style={{ color }}>{resource.type.replace('_', ' ')}</span>
        </div>
        <span className="resource-cost" data-cost={resource.cost?.toLowerCase().includes('free') ? 'free' : 'paid'}>
          {resource.cost}
        </span>
      </div>

      <p className="resource-desc">{resource.description}</p>

      <div className="resource-details">
        {resource.phone && resource.phone !== 'N/A' && (
          <a href={`tel:${resource.phone.replace(/[^\d+]/g, '')}`} className="resource-detail">
            📞 {resource.phone}
          </a>
        )}
        {resource.address && resource.address !== 'N/A' && (
          <span className="resource-detail">📍 {resource.address}</span>
        )}
        {resource.hours && (
          <span className="resource-detail">🕐 {resource.hours}</span>
        )}
      </div>

      {resource.website && resource.website !== 'N/A' && (
        <a
          href={resource.website}
          target="_blank"
          rel="noopener noreferrer"
          className="resource-link"
        >
          Visit Website →
        </a>
      )}
    </motion.div>
  );
}
