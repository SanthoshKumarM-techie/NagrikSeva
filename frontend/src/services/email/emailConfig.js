/**
 * CivicLens EmailJS Configuration
 * Loads environment variables, validates client configuration, and initializes EmailJS SDK.
 */

import emailjs from '@emailjs/browser';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

export const emailConfig = {
  serviceId: env.VITE_EMAILJS_SERVICE_ID || '',
  publicKey: env.VITE_EMAILJS_PUBLIC_KEY || '',
  templates: {
    workerAssigned: env.VITE_EMAILJS_TEMPLATE_WORKER_ASSIGNED || '',
    citizenTracker: env.VITE_EMAILJS_TEMPLATE_CITIZEN_TRACKER || ''
  }
};

/**
 * Checks if EmailJS is fully configured with required credentials
 * @returns {boolean}
 */
export const isEmailConfigured = () => {
  return Boolean(
    emailConfig.serviceId &&
    emailConfig.publicKey &&
    (emailConfig.templates.workerAssigned || emailConfig.templates.citizenTracker)
  );
};

/**
 * Initializes the EmailJS browser SDK with public key
 */
let initialized = false;
export const initEmailService = () => {
  if (initialized) return;

  if (emailConfig.publicKey) {
    try {
      emailjs.init({
        publicKey: emailConfig.publicKey,
        blockHeadless: true
      });
      initialized = true;
      console.log('📬 CivicLens EmailJS SDK initialized successfully');
    } catch (err) {
      console.warn('📬 Failed to initialize EmailJS SDK:', err?.message || err);
    }
  } else {
    console.info('📬 EmailJS credentials not provided in environment. Operational in offline/simulation mode.');
  }
};

// Auto-run initialization on module import
initEmailService();

export default emailConfig;
