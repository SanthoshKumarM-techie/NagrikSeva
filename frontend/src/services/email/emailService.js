/**
 * CivicLens EmailJS Notification Service
 * Handles email delivery, EmailJS SDK dispatch, deduplication, and email notification logging.
 */

import emailjs from '@emailjs/browser';
import emailConfig, { isEmailConfigured } from './emailConfig.js';
import { buildWorkerAssignmentParams, buildCitizenTrackerParams } from './emailTemplates.js';
import { validateWorkerEmail, validateCitizenEmail } from '../../utils/emailValidation.js';
import { getStorage, setStorage } from '../../utils/storage.js';
import { STORAGE_KEYS } from '../../utils/constants.js';

const EMAIL_LOG_STORAGE_KEY = STORAGE_KEYS.EMAIL_LOGS || 'nagrik_email_logs';

// In-memory deduplication tracker (prevents rapid double-clicks within 8 seconds)
const recentDispatches = new Map();

/**
 * Checks if a duplicate dispatch is occurring for the given key
 * @param {string} dedupeKey
 * @param {number} cooldownMs
 * @returns {boolean}
 */
const isDuplicateDispatch = (dedupeKey, cooldownMs = 8000) => {
  const now = Date.now();
  const lastTime = recentDispatches.get(dedupeKey);
  if (lastTime && now - lastTime < cooldownMs) {
    return true;
  }
  recentDispatches.set(dedupeKey, now);
  return false;
};

/**
 * Persists an email notification log entry
 * Follows Section 8 format requirements:
 * - complaint_id
 * - recipient_email
 * - recipient_type
 * - notification_type
 * - delivery_attempt_status ('SENT' | 'FAILED' | 'SIMULATED')
 * - error_message
 * - created_at
 * - sent_at
 *
 * @param {object} entry
 * @returns {object} persisted log entry
 */
export const logEmailNotification = (entry) => {
  const logItem = {
    id: entry.id || `EML-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    complaint_id: entry.complaint_id || entry.complaintId || 'N/A',
    recipient_email: entry.recipient_email || entry.recipientEmail || 'N/A',
    recipient_type: entry.recipient_type || entry.recipientType || 'UNKNOWN',
    notification_type: entry.notification_type || entry.notificationType || 'GENERAL',
    delivery_attempt_status: entry.delivery_attempt_status || entry.status || 'PENDING',
    error_message: entry.error_message || entry.errorMessage || null,
    created_at: entry.created_at || entry.createdAt || new Date().toISOString(),
    sent_at: entry.sent_at || entry.sentAt || null,
    subject: entry.subject || 'CivicLens Notification',
    metadata: entry.metadata || {}
  };

  try {
    const existingLogs = getStorage(EMAIL_LOG_STORAGE_KEY, []);
    const updated = [logItem, ...existingLogs.slice(0, 199)]; // Keep latest 200 logs
    setStorage(EMAIL_LOG_STORAGE_KEY, updated);

    // Also dispatch a browser custom event for real-time reactivity in UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('civiclens:email_log_updated', { detail: logItem }));
    }
  } catch (err) {
    console.warn('Could not persist email log:', err.message);
  }

  return logItem;
};

/**
 * Retrieves all stored email notification logs
 * @returns {Array}
 */
export const getEmailNotificationLogs = () => {
  return getStorage(EMAIL_LOG_STORAGE_KEY, []);
};

/**
 * Sends a Worker Assignment Email using EmailJS
 *
 * @param {object} params
 * @param {object} params.worker - Target field worker
 * @param {object} params.complaint - Assigned complaint
 * @param {object} params.officer - Department officer
 * @param {string} [params.notes] - Assignment notes
 * @returns {Promise<{ success: boolean, simulated?: boolean, error?: string, log?: object }>}
 */
export const sendWorkerAssignmentEmail = async ({ worker, complaint, officer, notes }) => {
  const createdAt = new Date().toISOString();
  const complaintId = complaint?.ticketNumber || complaint?.id || 'N/A';

  // 1. Validate worker email
  const validation = validateWorkerEmail(worker);
  if (!validation.valid) {
    const log = logEmailNotification({
      complaint_id: complaintId,
      recipient_email: worker?.email || 'unknown@domain.com',
      recipient_type: 'WORKER',
      notification_type: 'WORKER_ASSIGNMENT',
      delivery_attempt_status: 'FAILED',
      error_message: validation.error,
      created_at: createdAt,
      sent_at: null,
      subject: `CivicLens – New Complaint Assigned: ${complaintId}`
    });
    return { success: false, error: validation.error, log };
  }

  // 2. Prevent duplicate clicks
  const dedupeKey = `worker_assign_${complaintId}_${worker.id || validation.email}`;
  if (isDuplicateDispatch(dedupeKey)) {
    console.warn(`Prevented duplicate worker email dispatch for: ${dedupeKey}`);
    return { success: true, duplicateSuppressed: true };
  }

  // 3. Build template parameters
  const templateParams = buildWorkerAssignmentParams({ worker, complaint, officer, notes });
  const templateId = emailConfig.templates.workerAssigned;

  // 4. Check if EmailJS is live configured
  if (!isEmailConfigured() || !templateId) {
    console.info(`[EmailJS Dev Mode] Simulated Worker Assignment Email to: ${validation.email}`);
    const log = logEmailNotification({
      complaint_id: complaintId,
      recipient_email: validation.email,
      recipient_type: 'WORKER',
      notification_type: 'WORKER_ASSIGNMENT',
      delivery_attempt_status: 'SENT',
      error_message: null,
      created_at: createdAt,
      sent_at: new Date().toISOString(),
      subject: templateParams.subject,
      metadata: { simulated: true, templateParams }
    });
    return { success: true, simulated: true, log };
  }

  // 5. Send using official EmailJS SDK
  try {
    const response = await emailjs.send(
      emailConfig.serviceId,
      templateId,
      templateParams,
      emailConfig.publicKey
    );

    if (response.status === 200 || response.text === 'OK') {
      const log = logEmailNotification({
        complaint_id: complaintId,
        recipient_email: validation.email,
        recipient_type: 'WORKER',
        notification_type: 'WORKER_ASSIGNMENT',
        delivery_attempt_status: 'SENT',
        error_message: null,
        created_at: createdAt,
        sent_at: new Date().toISOString(),
        subject: templateParams.subject,
        metadata: { status: response.status, text: response.text }
      });
      return { success: true, response, log };
    } else {
      throw new Error(`EmailJS responded with non-200 status: ${response.status} (${response.text})`);
    }
  } catch (err) {
    console.error('EmailJS Worker Assignment failed:', err);
    const log = logEmailNotification({
      complaint_id: complaintId,
      recipient_email: validation.email,
      recipient_type: 'WORKER',
      notification_type: 'WORKER_ASSIGNMENT',
      delivery_attempt_status: 'FAILED',
      error_message: err?.text || err?.message || 'EmailJS delivery error',
      created_at: createdAt,
      sent_at: null,
      subject: templateParams.subject
    });
    // Strict requirement: A failed email MUST NOT reverse the successful DB assignment!
    return { success: false, error: err?.message || 'Email delivery failed', log };
  }
};

/**
 * Sends a Citizen Complaint Live Tracker Email using EmailJS
 *
 * @param {object} params
 * @param {object} params.complaint - Target complaint
 * @param {string} [params.recipientEmail] - Target citizen email
 * @param {string} [params.recipientName] - Target citizen name
 * @param {string} [params.eventType] - Event label (e.g. WORK_STARTED, RESOLVED)
 * @returns {Promise<{ success: boolean, simulated?: boolean, error?: string, log?: object }>}
 */
export const sendCitizenTrackerEmail = async ({ complaint, recipientEmail, recipientName, eventType }) => {
  const createdAt = new Date().toISOString();
  const complaintId = complaint?.ticketNumber || complaint?.id || 'N/A';

  // 1. Resolve & Validate citizen email (from registered complaint or auth user)
  const targetEmail = recipientEmail || complaint?.citizenEmail;
  const validation = validateCitizenEmail(targetEmail);

  if (!validation.valid) {
    const log = logEmailNotification({
      complaint_id: complaintId,
      recipient_email: targetEmail || 'unknown_citizen@domain.com',
      recipient_type: 'CITIZEN',
      notification_type: eventType || 'CITIZEN_TRACKER_UPDATE',
      delivery_attempt_status: 'FAILED',
      error_message: validation.error,
      created_at: createdAt,
      sent_at: null,
      subject: `CivicLens – Your Complaint ${complaintId} Has Been Updated`
    });
    return { success: false, error: validation.error, log };
  }

  // 2. Prevent duplicate clicks for same status transition
  const dedupeKey = `citizen_tracker_${complaintId}_${complaint?.status}_${eventType || 'update'}`;
  if (isDuplicateDispatch(dedupeKey)) {
    console.warn(`Prevented duplicate citizen tracker email dispatch for: ${dedupeKey}`);
    return { success: true, duplicateSuppressed: true };
  }

  // 3. Build template parameters
  const templateParams = buildCitizenTrackerParams({
    complaint,
    recipientEmail: validation.email,
    recipientName
  });
  const templateId = emailConfig.templates.citizenTracker;

  // 4. Check if EmailJS is live configured
  if (!isEmailConfigured() || !templateId) {
    console.info(`[EmailJS Dev Mode] Simulated Citizen Tracker Email to: ${validation.email}`);
    const log = logEmailNotification({
      complaint_id: complaintId,
      recipient_email: validation.email,
      recipient_type: 'CITIZEN',
      notification_type: eventType || 'CITIZEN_TRACKER_UPDATE',
      delivery_attempt_status: 'SENT',
      error_message: null,
      created_at: createdAt,
      sent_at: new Date().toISOString(),
      subject: templateParams.subject,
      metadata: { simulated: true, eventType, templateParams }
    });
    return { success: true, simulated: true, log };
  }

  // 5. Send using official EmailJS SDK
  try {
    const response = await emailjs.send(
      emailConfig.serviceId,
      templateId,
      templateParams,
      emailConfig.publicKey
    );

    if (response.status === 200 || response.text === 'OK') {
      const log = logEmailNotification({
        complaint_id: complaintId,
        recipient_email: validation.email,
        recipient_type: 'CITIZEN',
        notification_type: eventType || 'CITIZEN_TRACKER_UPDATE',
        delivery_attempt_status: 'SENT',
        error_message: null,
        created_at: createdAt,
        sent_at: new Date().toISOString(),
        subject: templateParams.subject,
        metadata: { status: response.status, text: response.text, eventType }
      });
      return { success: true, response, log };
    } else {
      throw new Error(`EmailJS responded with non-200 status: ${response.status} (${response.text})`);
    }
  } catch (err) {
    console.error('EmailJS Citizen Tracker failed:', err);
    const log = logEmailNotification({
      complaint_id: complaintId,
      recipient_email: validation.email,
      recipient_type: 'CITIZEN',
      notification_type: eventType || 'CITIZEN_TRACKER_UPDATE',
      delivery_attempt_status: 'FAILED',
      error_message: err?.text || err?.message || 'EmailJS delivery error',
      created_at: createdAt,
      sent_at: null,
      subject: templateParams.subject
    });
    // Strict requirement: A failed email MUST NOT reverse successful status update!
    return { success: false, error: err?.message || 'Email delivery failed', log };
  }
};

/**
 * Sends a Department Officer Credentials Onboarding Email using EmailJS
 */
export const sendDepartmentCredentialsEmail = async ({
  toEmail,
  fullName,
  userCode,
  temporaryPassword,
  departmentName,
  departmentCode,
  loginUrl
}) => {
  const createdAt = new Date().toISOString();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const targetUrl = loginUrl || `${origin}/login?portal=officer`;

  const templateParams = {
    to_email: toEmail,
    to_name: fullName || 'Department Officer',
    officer_name: fullName || 'Department Officer',
    user_code: userCode,
    temporary_password: temporaryPassword,
    department_name: departmentName,
    department_code: departmentCode,
    login_url: targetUrl,
    subject: `🏛️ [NagrikSeva] Official Credentials for ${departmentName} (${userCode})`,
    message: `Your nodal officer account for ${departmentName} (${departmentCode}) has been created.\nOfficial ID: ${userCode}\nEmail: ${toEmail}\nInitial Password: ${temporaryPassword}\nLogin Portal: ${targetUrl}`
  };

  const serviceId = emailConfig.serviceId || 'service_onag5la';
  const templateId = emailConfig.templates.departmentCredentials || emailConfig.templates.citizenTracker;
  const publicKey = emailConfig.publicKey || 'J1aG-MvZT97FKxvjO';

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    const log = logEmailNotification({
      complaint_id: userCode || 'DEPT-CRED',
      recipient_email: toEmail,
      recipient_type: 'OFFICER',
      notification_type: 'DEPARTMENT_CREDENTIALS',
      delivery_attempt_status: 'SENT',
      error_message: null,
      created_at: createdAt,
      sent_at: new Date().toISOString(),
      subject: templateParams.subject,
      metadata: { response }
    });
    console.log(`[EmailJS] ✉️ Department credentials email sent to ${toEmail}`);
    return { success: true, response, log };
  } catch (err) {
    console.warn('[EmailJS] Department credentials email dispatch note:', err?.text || err?.message);
    const log = logEmailNotification({
      complaint_id: userCode || 'DEPT-CRED',
      recipient_email: toEmail,
      recipient_type: 'OFFICER',
      notification_type: 'DEPARTMENT_CREDENTIALS',
      delivery_attempt_status: 'SIMULATED',
      error_message: err?.text || err?.message || 'EmailJS simulated dispatch',
      created_at: createdAt,
      sent_at: new Date().toISOString(),
      subject: templateParams.subject
    });
    return { success: true, simulated: true, log };
  }
};

/**
 * Sends a Password Reset OTP Email using EmailJS
 */
export const sendPasswordResetOtpEmail = async ({
  toEmail,
  fullName,
  otpCode,
  role = 'CITIZEN',
  userCode
}) => {
  const createdAt = new Date().toISOString();
  const serviceId = emailConfig.resetAccount?.serviceId || emailConfig.serviceId;
  const publicKey = emailConfig.resetAccount?.publicKey || emailConfig.publicKey;
  const isWorker = role === 'FIELD_WORKER' || role === 'WORKER';
  const templateId = isWorker
    ? (emailConfig.templates.workerReset || 'template_ju6u0np')
    : (emailConfig.templates.citizenReset || 'template_2lumkdp');

  const templateParams = {
    to_email: toEmail,
    to_name: fullName || 'User',
    recipient_email: toEmail,
    otp_code: otpCode,
    otp: otpCode,
    passcode: otpCode,
    user_code: userCode || '',
    role: role,
    subject: `🔐 [NagrikSeva] Your Password Reset OTP is ${otpCode}`,
    message: `Your One-Time Password for password recovery is: ${otpCode}. It is valid for 10 minutes.`
  };

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    const log = logEmailNotification({
      complaint_id: userCode || 'AUTH-RESET',
      recipient_email: toEmail,
      recipient_type: role || 'USER',
      notification_type: 'PASSWORD_RESET_OTP',
      delivery_attempt_status: 'SENT',
      error_message: null,
      created_at: createdAt,
      sent_at: new Date().toISOString(),
      subject: templateParams.subject,
      metadata: { response }
    });
    console.log(`[EmailJS] ✉️ Password reset OTP email sent to ${toEmail}`);
    return { success: true, response, log };
  } catch (err) {
    console.warn('[EmailJS] Password reset OTP email dispatch note:', err?.text || err?.message);
    const log = logEmailNotification({
      complaint_id: userCode || 'AUTH-RESET',
      recipient_email: toEmail,
      recipient_type: role || 'USER',
      notification_type: 'PASSWORD_RESET_OTP',
      delivery_attempt_status: 'SIMULATED',
      error_message: err?.text || err?.message || 'EmailJS simulated dispatch',
      created_at: createdAt,
      sent_at: new Date().toISOString(),
      subject: templateParams.subject
    });
    return { success: true, simulated: true, log };
  }
};

export default {
  sendWorkerAssignmentEmail,
  sendCitizenTrackerEmail,
  sendDepartmentCredentialsEmail,
  sendPasswordResetOtpEmail,
  logEmailNotification,
  getEmailNotificationLogs
};
