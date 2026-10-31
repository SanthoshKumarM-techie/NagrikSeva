import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTranslation } from '../utils/translations';

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', country: 'GB' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', country: 'IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', country: 'IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', country: 'IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', country: 'IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', country: 'IN' },
];

const LanguageContext = createContext(null);

const STORAGE_KEY = 'nagrik_language';

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  });

  const setGoogleTranslateCookie = useCallback((langCode) => {
    const host = window.location.hostname;
    const targetVal = langCode === 'en' ? '' : `/en/${langCode}`;
    
    if (langCode === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
      if (host.includes('.')) {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host};`;
      }
    } else {
      document.cookie = `googtrans=${targetVal}; path=/;`;
      document.cookie = `googtrans=${targetVal}; path=/; domain=${host};`;
      if (host.includes('.')) {
        document.cookie = `googtrans=${targetVal}; path=/; domain=.${host};`;
      }
    }
  }, []);

  const triggerGoogleTranslateCombo = useCallback((langCode) => {
    let attempts = 0;
    const maxAttempts = 15;

    const interval = setInterval(() => {
      attempts++;
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = langCode;
        combo.dispatchEvent(new Event('change', { bubbles: true }));
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 200);
  }, []);

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem(STORAGE_KEY, langCode);
    setGoogleTranslateCookie(langCode);

    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = langCode === 'en' ? '' : langCode;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // Reload guarantees the full page DOM renders directly in the chosen language via the cookie
    window.location.reload();
  };

  // Re-apply on initial mount if a language was previously chosen
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== 'en') {
      setGoogleTranslateCookie(saved);
      triggerGoogleTranslateCombo(saved);
    }
  }, [setGoogleTranslateCookie, triggerGoogleTranslateCombo]);

  const activeLanguageObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  // Translation helper function
  const t = useCallback((key) => {
    return getTranslation(key, currentLang);
  }, [currentLang]);

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        activeLanguage: activeLanguageObj,
        languages: LANGUAGES,
        changeLanguage,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
