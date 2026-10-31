/**
 * CivicLens Speech-to-Text Hook
 * Uses standard browser Web Speech API (window.SpeechRecognition || window.webkitSpeechRecognition).
 * Supports English (en-IN), Tamil (ta-IN), and Kannada (kn-IN).
 * Strictly browser-based — zero external AI API or backend audio calls.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export const SPEECH_LANGUAGES = [
  { code: 'en-IN', name: 'English (India)', native: 'English', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' }
];

export const DEFAULT_LANGUAGE = 'en-IN';

export const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export const getSpeechRecognitionClass = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

/**
 * useSpeechToText hook
 *
 * @param {object} options
 * @param {string} [options.initialLanguage='en-IN']
 * @param {function} [options.onTranscriptUpdate] - Callback when recognized text changes: (updatedFullText, interimSnippet) => void
 * @param {function} [options.onError] - Error callback
 */
export const useSpeechToText = (options = {}) => {
  const {
    initialLanguage = DEFAULT_LANGUAGE,
    onTranscriptUpdate,
    onError
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState(initialLanguage);
  const [error, setError] = useState(null);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');
  const accumulatedSpeechRef = useRef('');
  const isStoppingRef = useRef(false);

  // Check support on mount
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  // Format recognition error messages
  const mapErrorMessage = (errCode) => {
    switch (errCode) {
      case 'not-allowed':
      case 'permission-denied':
        return 'Microphone access denied. Please allow microphone permissions in your browser.';
      case 'no-speech':
        return 'No speech detected. Please speak clearly into your microphone.';
      case 'network':
        return 'Speech service network error. Please check your internet connection.';
      case 'audio-capture':
        return 'No microphone was found or audio capture is unavailable.';
      case 'language-not-supported':
        return `Selected language (${language}) is not supported on this browser.`;
      case 'service-not-allowed':
        return 'Speech recognition service is currently unavailable.';
      case 'aborted':
        return null; // Normal cancellation, no error display needed
      default:
        return `Speech recognition error: ${errCode || 'Unknown'}`;
    }
  };

  /**
   * Stop speech recognition
   */
  const stopListening = useCallback(() => {
    isStoppingRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Recognition might already be stopped
      }
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  /**
   * Start speech recognition
   * @param {string} currentText - Existing text in the input to preserve
   */
  const startListening = useCallback((currentText = '') => {
    setError(null);
    setInterimText('');
    isStoppingRef.current = false;

    const SpeechRecognition = getSpeechRecognitionClass();

    if (!SpeechRecognition) {
      const unsupportedMsg = 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.';
      setError(unsupportedMsg);
      if (onError) onError(unsupportedMsg);
      return false;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Preserve existing typed text
      baseTextRef.current = (typeof currentText === 'string') ? currentText : '';
      accumulatedSpeechRef.current = '';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            currentFinal += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        if (currentFinal) {
          accumulatedSpeechRef.current = (accumulatedSpeechRef.current + ' ' + currentFinal).trim();
        }

        setInterimText(currentInterim);

        // Compute updated full text: baseText + accumulatedSpeech + interim
        const base = baseTextRef.current ? baseTextRef.current.trim() : '';
        const speech = accumulatedSpeechRef.current ? accumulatedSpeechRef.current.trim() : '';
        const interim = currentInterim.trim();

        const combinedText = [base, speech, interim].filter(Boolean).join(' ');

        if (onTranscriptUpdate) {
          onTranscriptUpdate(combinedText, currentInterim);
        }
      };

      recognition.onerror = (event) => {
        const errorMsg = mapErrorMessage(event.error);
        if (errorMsg) {
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
        if (event.error === 'not-allowed' || event.error === 'audio-capture' || event.error === 'network') {
          setIsListening(false);
          setInterimText('');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (err) {
      const msg = `Unable to start speech recognition: ${err.message || 'Permission or hardware issue'}`;
      setError(msg);
      setIsListening(false);
      if (onError) onError(msg);
      return false;
    }
  }, [language, onTranscriptUpdate, onError]);

  /**
   * Toggle speech recognition
   * @param {string} currentText
   */
  const toggleListening = useCallback((currentText = '') => {
    if (isListening) {
      stopListening();
    } else {
      startListening(currentText);
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    language,
    setLanguage,
    error,
    clearError: () => setError(null),
    interimText,
    startListening,
    stopListening,
    toggleListening,
    availableLanguages: SPEECH_LANGUAGES
  };
};

export default useSpeechToText;
