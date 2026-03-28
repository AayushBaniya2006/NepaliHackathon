import { useState, useEffect } from 'react';
import './ProgressiveTextStream.css';

export default function ProgressiveTextStream({ text = '', speed = 30, isActive = false, onComplete }) {
  const [displayedLength, setDisplayedLength] = useState(0);

  useEffect(() => {
    setDisplayedLength(0);
  }, [text]);

  useEffect(() => {
    if (!text || displayedLength >= text.length) {
      if (displayedLength >= text.length && onComplete) onComplete();
      return;
    }
    const timer = setTimeout(() => {
      setDisplayedLength(prev => prev + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [text, displayedLength, speed, onComplete]);

  return (
    <span className="progressive-text">
      {text.slice(0, displayedLength)}
      {isActive && displayedLength < text.length && (
        <span className="progressive-cursor">|</span>
      )}
    </span>
  );
}
