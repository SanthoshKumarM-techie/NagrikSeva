/**
 * CivicLens EmailJS Configuration
 * Loads environment variables, validates client configuration, and initializes EmailJS SDK.
 */

import emailjs from '@emailjs/browser';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

export const emailConfig = {
  serviceId: env.VITE_EMAILJS_SERVICE_ID || 'service_onag5la',
  publicKey: env.VITE_EMAILJS_PUBLIC_KEY || 'J1aG-MvZT97FKxvjO',
  templates: {
    workerAssigned: env.VITE_EMAILJS_TEMPLATE_WORKER_ASSIGNED || 'template_19zfo63',
    citizenTracker: env.VITE_EMAILJS_TEMPLATE_CITIZEN_TRACKER || 'template_4tlaw7d',
    departmentCredentials: env.VITE_EMAILJS_TEMPLATE_CITIZEN_TRACKER || 'template_4tlaw7d',
    citizenReset: env.VITE_EMAILJS_TEMPLATE_CITIZEN_RESET || env.EMAILJS_TEMPLATE_CITIZEN_RESET || 'template_2lumkdp',
    workerReset: env.VITE_EMAILJS_TEMPLATE_WORKER_RESET || env.EMAILJS_TEMPLATE_WORKER_RESET || 'template_ju6u0np'
  },
  resetAccount: {
    serviceId: env.VITE_EMAILJS_RESET_SERVICE_ID || env.EMAILJS_RESET_SERVICE_ID || 'service_odlqxec',
    publicKey: env.VITE_EMAILJS_RESET_PUBLIC_KEY || env.EMAILJS_RESET_PUBLIC_KEY || '5k--3XhXI9Pjz_Sod'
  }
};

/**
 * Checks if EmailJS is fully configured with required credentials
 * @returns {boolean}
 */
export const isEmailConfigured = () => {
  return Boolean(
    emailConfig.serviceId &&
    emailConfig.publicKey
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
