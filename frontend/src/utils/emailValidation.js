/**
 * CivicLens Email Validation Utilities
 * Validates recipient emails, format sanity, and ensures delivery integrity.
 */

// RFC 5322 compliant regex for client-side sanity check
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates whether the given string is a properly formatted email address.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
};

/**
 * Cleans and normalizes email address.
 * @param {string} email
 * @returns {string}
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Validates worker recipient metadata.
 * @param {object} worker
 * @returns {{ valid: boolean, error?: string, email?: string }}
 */
export const validateWorkerEmail = (worker) => {
  if (!worker) {
    return { valid: false, error: 'Worker object is missing or invalid' };
  }
  const email = sanitizeEmail(worker.email || worker.official_email);
  if (!isValidEmail(email)) {
    return { valid: false, error: `Invalid or missing worker email: "${email}"` };
  }
  return { valid: true, email };
};

/**
 * Validates citizen recipient metadata.
 * @param {object|string} citizenOrEmail
 * @returns {{ valid: boolean, error?: string, email?: string }}
 */
export const validateCitizenEmail = (citizenOrEmail) => {
  let email = '';
  if (typeof citizenOrEmail === 'string') {
    email = sanitizeEmail(citizenOrEmail);
  } else if (citizenOrEmail && typeof citizenOrEmail === 'object') {
    email = sanitizeEmail(
      citizenOrEmail.citizenEmail ||
      citizenOrEmail.citizen_email ||
      citizenOrEmail.email ||
      citizenOrEmail.userEmail
    );
  }

  if (!isValidEmail(email)) {
    return { valid: false, error: `Invalid or missing citizen email: "${email}"` };
  }
  return { valid: true, email };
};

export default {
  isValidEmail,
  sanitizeEmail,
  validateWorkerEmail,
  validateCitizenEmail
};
