import React from 'react';
import { motion } from 'framer-motion';
import './StepTracker.css';

const STEPS = [
  { id: 'canvas', label: 'Expression', icon: '🎨' },
  { id: 'results', label: 'Analysis', icon: '🧠' },
  { id: 'insurance', label: 'Insurance', icon: '📋' },
  { id: 'final', label: 'Submit', icon: '✅' },
];

export default function StepTracker({ currentStep = 'canvas' }) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="step-tracker-container">
      <div className="step-tracker">
        {STEPS.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <React.Fragment key={step.id}>
              <div className={`step-item ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="step-count">
                  {isActive && index < currentIndex ? '✓' : step.icon}
                </div>
                <span className="step-label">{step.label}</span>
                {isCurrent && (
                  <motion.div 
                    className="current-glow"
                    layoutId="current-glow"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`step-connector ${index < currentIndex ? 'active' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
