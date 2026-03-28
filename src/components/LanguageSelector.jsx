import { useState } from 'react';
import './LanguageSelector.css';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', flag: '🇳🇵' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', name: 'Mandarin', native: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇵🇰', rtl: true },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇱🇰' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
];

export default function LanguageSelector({ currentLang = 'en', onChangeLang }) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];
  const isStub = (code) => !['en', 'ne'].includes(code);

  const handleSelect = (code) => {
    setOpen(false);
    if (onChangeLang) onChangeLang(code);
  };

  return (
    <div className="lang-selector">
      <button className="lang-trigger" onClick={() => setOpen(!open)}>
        <span className="lang-flag">{current.flag}</span>
        <span className="lang-name">{current.native}</span>
        <span className="lang-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="lang-dropdown">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`lang-option ${lang.code === currentLang ? 'lang-option--active' : ''}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-option-name">{lang.native}</span>
              {isStub(lang.code) && <span className="lang-stub">soon</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
