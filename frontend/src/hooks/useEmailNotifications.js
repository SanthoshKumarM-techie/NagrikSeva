/**
 * CivicLens useEmailNotifications Hook
 * React hook interface for EmailJS dispatches and live notification log tracking.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  sendWorkerAssignmentEmail,
  sendCitizenTrackerEmail,
  getEmailNotificationLogs
} from '../services/email/emailService.js';
import { isEmailConfigured } from '../services/email/emailConfig.js';

export const useEmailNotifications = () => {
  const [logs, setLogs] = useState(() => getEmailNotificationLogs());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [lastLog, setLastLog] = useState(null);

  // Sync logs when email dispatches trigger
  useEffect(() => {
    const handleLogUpdate = (e) => {
      const entry = e.detail;
      setLogs((prev) => [entry, ...prev.filter((l) => l.id !== entry.id)]);
      setLastLog(entry);
    };

    window.addEventListener('civiclens:email_log_updated', handleLogUpdate);
    return () => window.removeEventListener('civiclens:email_log_updated', handleLogUpdate);
  }, []);

  const notifyWorkerAssigned = useCallback(async ({ worker, complaint, officer, notes }) => {
    setSending(true);
    setError(null);
    try {
      const result = await sendWorkerAssignmentEmail({ worker, complaint, officer, notes });
      if (!result.success && result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      setError(err?.message || 'Worker assignment email error');
      return { success: false, error: err?.message };
    } finally {
      setSending(false);
    }
  }, []);

  const notifyCitizenProgress = useCallback(async ({ complaint, recipientEmail, recipientName, eventType }) => {
    setSending(true);
    setError(null);
    try {
      const result = await sendCitizenTrackerEmail({
        complaint,
        recipientEmail,
        recipientName,
        eventType
      });
      if (!result.success && result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      setError(err?.message || 'Citizen tracker email error');
      return { success: false, error: err?.message };
    } finally {
      setSending(false);
    }
  }, []);

  const refreshLogs = useCallback(() => {
    setLogs(getEmailNotificationLogs());
  }, []);

  return {
    isConfigured: isEmailConfigured(),
    sending,
    error,
    logs,
    lastLog,
    notifyWorkerAssigned,
    notifyCitizenProgress,
    refreshLogs
  };
};

export default useEmailNotifications;
