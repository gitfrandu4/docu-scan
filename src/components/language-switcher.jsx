import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../style/language-switcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: '🇺🇸 English' },
    { code: 'es', name: '🇪🇸 Español' }
  ];

  const toggleLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className={`language-switcher ${isOpen ? 'open' : ''}`}>
      <button 
        className="language-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
      >
        🌐
      </button>
      <div className="language-options">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`language-option ${i18n.language === lang.code ? 'active' : ''}`}
            onClick={() => toggleLanguage(lang.code)}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher; 
