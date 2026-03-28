import * as React from 'react';
import { motion } from 'framer-motion';

/**
 * Type definition for a single integration item.
 */
export interface Integration {
  name: string;
  description: string;
  iconSrc: string;
}

/**
 * Props for the IntegrationShowcase component.
 */
export interface IntegrationShowcaseProps {
  title: string;
  subtitle: string;
  illustrationSrc: string;
  illustrationAlt: string;
  integrations: Integration[];
  className?: string; // Standard className support
}

// Function to parse the title and wrap the highlighted word in a span
const HighlightedTitle = ({ text }: { text: string }) => {
  const parts = text.split(/~/);
  return (
    <h2 className="integration-title">
      {parts.map((part, index) =>
        index === 1 ? (
          <span key={index} className="highlighted-word-container">
            <span className="highlighted-word">{part}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 418 42"
              className="highlight-svg"
              preserveAspectRatio="none"
            >
              <path
                d="M203.371.916c-26.013-2.078-76.686 1.98-114.243 8.919-37.556 6.939-78.622 17.103-122.256 28.703-43.633 11.6-4.984 14.306 43.123 7.021 48.107-7.285 93.638-16.096 146.446-17.742 52.808-1.646 105.706 5.429 158.649 14.13 52.943 8.701 105.886 19.342 158.826 29.483 52.94 10.141 52.94 10.141-11.41-19.043C371.18 14.363 322.753 5.488 281.339 2.143 239.925-1.201 203.371.916 203.371.916z"
                fill="currentColor"
              />
            </svg>
          </span>
        ) : (
          part
        ),
      )}
    </h2>
  );
};

export const IntegrationShowcase = React.forwardRef<
  HTMLElement,
  IntegrationShowcaseProps
>(({ title, subtitle, illustrationSrc, illustrationAlt, integrations, className }, ref) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as any,
      },
    },
  };

  return (
    <section ref={ref} className={`integration-showcase ${className || ''}`}>
      <div className="integration-container">
        {/* Header Section */}
        <div className="integration-header-row">
          <div className="integration-text-box">
            <HighlightedTitle text={title} />
            <p className="integration-subtitle">
              {subtitle}
            </p>
          </div>
          <div className="integration-visual-box">
            <img 
              src={illustrationSrc} 
              alt={illustrationAlt} 
              className="integration-main-img"
            />
          </div>
        </div>

        {/* Integrations Grid */}
        <motion.div
          className="integration-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {integrations.map((item) => (
            <motion.div key={item.name} variants={itemVariants} className="integration-item">
              <div className="integration-item-icon">
                <img 
                  src={item.iconSrc} 
                  alt={`${item.name} logo`} 
                  className="integration-mini-logo" 
                />
              </div>
              <div className="integration-item-content">
                <h3 className="integration-item-name">{item.name}</h3>
                <p className="integration-item-desc">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

IntegrationShowcase.displayName = 'IntegrationShowcase';
