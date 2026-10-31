import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext';

export const LanguageSelector = ({ className = '' }) => {
  const { currentLang, activeLanguage, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left notranslate ${className}`} ref={dropdownRef}>
      {/* Trigger Button - Matching Civic UI Style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm"
        title="Select Portal Language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="font-medium">{activeLanguage?.name || 'English'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-[9999] animate-fade-in text-slate-800 dark:text-slate-100">
          {/* Header */}
          <div className="px-4 py-2 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
            SELECT LANGUAGE
          </div>

          {/* Languages List in Requested Order: English, Kannada, Hindi, Tamil, Malayalam, Telugu */}
          <div className="py-1">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Country Badge */}
                    <span className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-black tracking-wider flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                      {lang.country}
                    </span>

                    {/* Language Names */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold leading-snug">
                        {lang.nativeName}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                        {lang.name}
                      </span>
                    </div>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

