/**
 * CivicLens Voice-Enabled Textarea Component
 * Google-style speech-to-text integration using browser Web Speech API.
 * Supports English (en-IN), Tamil (ta-IN), Kannada (kn-IN), Hindi (hi-IN), and Telugu (te-IN).
 * When speaking in any language, automatically defaults and converts text to English!
 * Zero external AI APIs or audio uploads — standard browser speech recognition and translation.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Globe, AlertCircle, Square, Languages, Check } from 'lucide-react';
import { useSpeechToText, SPEECH_LANGUAGES, DEFAULT_LANGUAGE } from '../../hooks/useSpeechToText.js';

export const VoiceTextarea = ({
  id,
  label,
  value = '',
  onChange,
  onVoiceChange,
  placeholder = 'Type or speak your report...',
  rows = 3,
  disabled = false,
  required = false,
  error = null,
  helperText = null,
  className = '',
  defaultLanguage = DEFAULT_LANGUAGE,
  defaultTranslateToEnglish = true,
  ...props
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTranscriptUpdate = (newCombinedText) => {
    if (onVoiceChange) {
      onVoiceChange(newCombinedText);
    }
    if (onChange) {
      onChange({ target: { value: newCombinedText, id, name: props.name || id } });
    }
  };

  const {
    isListening,
    isSupported,
    language,
    setLanguage,
    autoTranslateToEnglish,
    setAutoTranslateToEnglish,
    isTranslating,
    error: speechError,
    clearError,
    interimText,
    startListening,
    stopListening,
    toggleListening
  } = useSpeechToText({
    initialLanguage: defaultLanguage,
    defaultTranslateToEnglish,
    onTranscriptUpdate: handleTranscriptUpdate
  });

  const handleMicClick = () => {
    if (disabled) return;
    if (isListening) {
      stopListening();
    } else {
      toggleListening(value);
    }
  };

  const currentLanguageObj = SPEECH_LANGUAGES.find((l) => l.code === language) || SPEECH_LANGUAGES[0];

  return (
    <div className={`w-full ${className}`}>
      {/* Header with Label and Google Voice Controls */}
      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        {/* Voice typing controls toolbar */}
        <div className="flex items-center gap-1.5 ml-auto text-xs flex-wrap">
          {/* Auto-translate to English indicator / toggle button */}
          <button
            type="button"
            onClick={() => setAutoTranslateToEnglish((prev) => !prev)}
            disabled={disabled}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors border cursor-pointer ${
              autoTranslateToEnglish
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
            title={
              autoTranslateToEnglish
                ? 'Auto-Translate to English is ON: Spoken speech in Tamil, Kannada, Hindi, etc. is automatically translated and saved in English.'
                : 'Auto-Translate is OFF: Text will be saved in the spoken native language.'
            }
          >
            <Languages className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>To English</span>
            {autoTranslateToEnglish && <Check className="w-2.5 h-2.5" />}
          </button>

          {/* Language selector dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => !disabled && setLangMenuOpen((prev) => !prev)}
              disabled={disabled || isListening}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors border ${
                isListening
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs cursor-pointer'
              }`}
              title="Select your speaking language"
              aria-label="Speech language"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>{currentLanguageObj.native}</span>
              <span className="text-[10px] text-slate-400 font-mono">({currentLanguageObj.code})</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30">
                <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Speaking Language
                </div>
                {SPEECH_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      language === l.code
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className="text-xs font-medium text-slate-400">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fallback indicator if browser lacks Web Speech API */}
          {!isSupported && (
            <span
              className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/50"
              title="Voice typing requires a Web Speech API compatible browser like Google Chrome or Microsoft Edge."
            >
              Voice unsupported
            </span>
          )}
        </div>
      </div>

      {/* Textarea container with embedded Google-style Microphone Button */}
      <div className="relative rounded-lg shadow-2xs">
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`block w-full rounded-lg border text-sm transition-colors duration-150 p-2.5 pr-14 ${
            isListening
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10'
              : error
              ? 'border-rose-400 bg-rose-50/20 text-rose-900 dark:text-rose-300 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1'
          } disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed`}
          {...props}
        />

        {/* Google-Style Microphone Button on the right side */}
        <div className="absolute right-2 top-2 flex flex-col items-center gap-1 z-10">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled || !isSupported}
            className={`relative p-2 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md ring-4 ring-rose-400/30 animate-pulse'
                : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-blue-400'
            }`}
            title={
              !isSupported
                ? 'Speech recognition not supported in this browser (use Chrome/Edge)'
                : isListening
                ? 'Click to stop listening'
                : `Click to speak in ${currentLanguageObj.native}${autoTranslateToEnglish && language !== 'en-IN' ? ' (auto-translates to English)' : ''}`
            }
            aria-label={isListening ? 'Stop listening' : 'Start voice typing'}
          >
            {isListening ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Mic className="w-4 h-4" />
            )}

            {/* Ripple rings when listening */}
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-rose-400 opacity-75 animate-ping pointer-events-none" />
            )}
          </button>
        </div>
      </div>

      {/* Live Listening Indicator (Google-style) */}
      {isListening && (
        <div className="mt-2 flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg px-3 py-2 text-xs text-blue-900 dark:text-blue-200 animate-fadeIn">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span className="font-semibold">
              Listening ({currentLanguageObj.native})...
            </span>
            {autoTranslateToEnglish && language !== 'en-IN' && (
              <span className="text-[11px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                Auto-translating to English
              </span>
            )}
            {isTranslating && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 animate-pulse font-medium">
                Converting to English...
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400 italic">
              {interimText ? `"${interimText}"` : 'Speak into your microphone...'}
            </span>
          </div>

          <button
            type="button"
            onClick={stopListening}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer ml-2"
          >
            Stop
          </button>
        </div>
      )}

      {/* Speech Recognition Error Notice */}
      {speechError && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-md p-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">{speechError}</div>
          <button
            type="button"
            onClick={clearError}
            className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Field Validation Error or Helper Text */}
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : (
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 flex-wrap">
          <Mic className="w-3 h-3 text-blue-500 shrink-0" />
          <span>
            Speak in English, தமிழ், ಕನ್ನಡ, हिन्दी, or తెలుగు. By default, speech is converted into English text for official records.
          </span>
        </p>
      )}
    </div>
  );
};

export default VoiceTextarea;
