import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './GlobalNav.css';

const HIDDEN_PATHS = ['/', '/onboarding', '/draw'];

export default function GlobalNav() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const hidden = HIDDEN_PATHS.includes(location.pathname);

  useEffect(() => {
    if (hidden) return;
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hidden]);

  if (hidden) return null;

  return (
    <nav className={`global-nav${scrolled ? ' global-nav--scrolled' : ''}`}>
      <div className="global-nav__inner">
        <div
          className="global-nav__logo"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
        >
          MindCanvas
        </div>

        <ul className="global-nav__links">
          <li>
            <button onClick={e => {
              e.preventDefault();
              if (location.pathname === '/') {
                const el = document.getElementById('how-it-works-steps');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/#how-it-works-steps');
              }
            }}>How It Works</button>
          </li>
          <li>
            <button onClick={() => navigate('/app')}>Platform</button>
          </li>
          <li>
            <button onClick={() => navigate('/resources')}>Resources</button>
          </li>
        </ul>

        <button
          className="global-nav__cta"
          onClick={() => navigate('/onboarding')}
        >
          Get Started
        </button>
      </div>
    </nav>
  );
}
