/**
 * CivicLens Portal Translation Utility
 * Translates recognized speech from Indian regional languages (Tamil, Kannada, Hindi, Telugu, etc.)
 * to standard English for official civic complaints and work orders.
 *
 * Implements resilient multi-provider fallback (Google Translate + MyMemory) with in-memory caching.
 * Zero external AI API keys or backend dependencies required.
 */

// In-memory cache to prevent redundant network calls and avoid rate limits
const translationCache = new Map();

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

  const cacheKey = `${normalizedLang}_${trimmed}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const sl = normalizedLang || 'auto';

  // Strategy 1: Google Translate API
  try {
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(googleUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((segment) => (Array.isArray(segment) ? segment[0] : ''))
          .filter(Boolean)
          .join('');

        if (translated && translated.trim()) {
          const finalResult = translated.trim();
          translationCache.set(cacheKey, finalResult);
          return finalResult;
        }
      }
    }
  } catch (err) {
    // Continue to fallback
  }

  // Strategy 2: MyMemory Translation API fallback (if Google rate-limits or fails)
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${sl === 'auto' ? 'ta' : sl}|en`;
    const mmRes = await fetch(myMemoryUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (mmRes.ok) {
      const mmData = await mmRes.json();
      const mmTranslated = mmData?.responseData?.translatedText;
      if (mmTranslated && typeof mmTranslated === 'string' && mmTranslated.trim() && !mmTranslated.includes('MYMEMORY WARNING')) {
        const finalResult = mmTranslated.trim();
        translationCache.set(cacheKey, finalResult);
        return finalResult;
      }
    }
  } catch (err) {
    // Fall back to original
  }

  // Fallback: return original text safely
  return trimmed;
};

export default {
  translateToEnglish
};
