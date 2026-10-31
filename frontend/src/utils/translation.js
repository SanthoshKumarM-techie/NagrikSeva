/**
 * CivicLens Portal Translation Utility
 * Translates recognized speech from Indian regional languages (Tamil, Kannada, Hindi, Telugu, etc.)
 * to standard English for official civic complaints and work orders.
 *
 * Zero external AI API keys or backend dependencies required.
 */

/**
 * Translates given text to English
 *
 * @param {string} text - Source text
 * @param {string} [sourceLang='auto'] - Source language code (e.g. 'ta', 'kn', 'hi', 'te', or 'auto')
 * @returns {Promise<string>} Translated English text
 */
export const translateToEnglish = async (text, sourceLang = 'auto') => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return '';
  }

  const trimmed = text.trim();

  // If source is already English or ascii only, no translation needed
  const normalizedLang = sourceLang ? sourceLang.toLowerCase().split('-')[0] : 'auto';
  if (normalizedLang === 'en') {
    return trimmed;
  }

  // Quick check: if text is purely ASCII letters, numbers, and common punctuation, return as-is
  const isPureAscii = /^[\x00-\x7F]*$/.test(trimmed);
  if (isPureAscii && normalizedLang === 'auto') {
    return trimmed;
  }

  try {
    const sl = normalizedLang || 'auto';
    const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translatedSegments = data[0]
        .map((segment) => (Array.isArray(segment) ? segment[0] : ''))
        .filter(Boolean)
        .join('');

      return translatedSegments.trim() || trimmed;
    }

    return trimmed;
  } catch (err) {
    console.warn('Portal auto-translation fallback to original text:', err?.message || err);
    return trimmed;
  }
};

export default {
  translateToEnglish
};
