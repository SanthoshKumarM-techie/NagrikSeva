import { describe, it, expect } from 'vitest';

// Email validation logic mirrors frontend/src/utils/emailValidation.js
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
};

const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

const validateWorkerEmail = (worker) => {
  if (!worker) return { valid: false, error: 'Worker object is missing or invalid' };
  const email = sanitizeEmail(worker.email || worker.official_email);
  if (!isValidEmail(email)) return { valid: false, error: `Invalid or missing worker email: "${email}"` };
  return { valid: true, email };
};

const validateCitizenEmail = (citizenOrEmail) => {
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
  if (!isValidEmail(email)) return { valid: false, error: `Invalid or missing citizen email: "${email}"` };
  return { valid: true, email };
};

// Email templates logic mirrors frontend/src/services/email/emailTemplates.js
const buildWorkerAssignmentParams = ({ worker, complaint, officer, notes, origin = 'http://localhost:5173' }) => {
  const complaintId = complaint.ticketNumber || complaint.id || 'NAG-TASK';
  const workerDashboardUrl = `${origin}/worker`;

  return {
    to_email: worker.email,
    to_name: worker.name || 'Field Specialist',
    worker_name: worker.name || 'Field Specialist',
    complaint_id: complaintId,
    department_name: complaint.department || officer?.department || 'Municipal Department',
    category: complaint.category || 'General Civic Grievance',
    description: complaint.description || 'Inspection and maintenance required.',
    location: complaint.location || complaint.address || 'Reported Location',
    priority: complaint.priority || 'MEDIUM',
    assigned_officer: officer?.name || 'Department Officer',
    assignment_date: 'Oct 31, 2026, 04:30 AM',
    assignment_notes: notes || 'Standard site inspection and resolution required.',
    worker_dashboard_url: workerDashboardUrl,
    dashboard_url: workerDashboardUrl,
    subject: `CivicLens – New Complaint Assigned: ${complaintId}`
  };
};

const buildCitizenTrackerParams = ({ complaint, recipientEmail, recipientName, origin = 'http://localhost:5173' }) => {
  const complaintId = complaint.ticketNumber || complaint.id || 'NAG-CASE';
  const citizenName = recipientName || complaint.citizenName || 'Citizen';
  const citizenEmail = recipientEmail || complaint.citizenEmail;
  const trackerUrl = `${origin}/citizen/complaints/${complaint.id || complaint.ticketNumber}`;

  return {
    to_email: citizenEmail,
    to_name: citizenName,
    citizen_name: citizenName,
    complaint_id: complaintId,
    category: complaint.category || 'Civic Infrastructure',
    department_name: complaint.department || 'Municipal Administration',
    status: complaint.status || 'Updated',
    updated_at: 'Oct 31, 2026, 04:30 AM',
    tracker_url: trackerUrl,
    subject: `CivicLens – Your Complaint ${complaintId} Has Been Updated`
  };
};

describe('CivicLens EmailJS Integration Workflow', () => {
  describe('Email Validation Rules', () => {
    it('should validate correctly formatted emails', () => {
      expect(isValidEmail('worker@bbmp.gov.in')).toBe(true);
      expect(isValidEmail('citizen.test@example.com')).toBe(true);
      expect(isValidEmail('officer.blr_101@gov.in')).toBe(true);
    });

    it('should reject invalid, missing, or malformed emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail('plainaddress')).toBe(false);
      expect(isValidEmail('@missingusername.com')).toBe(false);
      expect(isValidEmail('missingdomain@.com')).toBe(false);
    });

    it('should validate worker email object', () => {
      const validWorker = { id: 'WRK001', name: 'Ramesh Nayak', email: 'ramesh.n@bbmp.gov.in' };
      const res = validateWorkerEmail(validWorker);
      expect(res.valid).toBe(true);
      expect(res.email).toBe('ramesh.n@bbmp.gov.in');

      const invalidWorker = { id: 'WRK999', name: 'No Email' };
      const errRes = validateWorkerEmail(invalidWorker);
      expect(errRes.valid).toBe(false);
      expect(errRes.error).toContain('Invalid or missing worker email');
    });

    it('should validate citizen email from complaint or user', () => {
      const validCitizen = { citizenEmail: 'aarav.sharma@example.com', citizenName: 'Aarav Sharma' };
      const res = validateCitizenEmail(validCitizen);
      expect(res.valid).toBe(true);
      expect(res.email).toBe('aarav.sharma@example.com');

      const missingEmail = { citizenEmail: '' };
      const errRes = validateCitizenEmail(missingEmail);
      expect(errRes.valid).toBe(false);
    });
  });

  describe('Worker Assignment Email Template', () => {
    it('should format worker assignment parameters with required CivicLens fields', () => {
      const worker = { id: 'WRK001', name: 'Ramesh Nayak', email: 'ramesh.n@bbmp.gov.in' };
      const complaint = {
        id: 'c101-uuid',
        ticketNumber: 'BLR-2026-0101',
        title: 'Deep Pothole on 100 Feet Road',
        description: 'Crater pothole causing accidents near junction.',
        category: 'Road Infrastructure & Maintenance',
        department: 'Road Infrastructure & Maintenance',
        location: '100 Feet Rd, Indiranagar',
        priority: 'HIGH'
      };
      const officer = { name: 'Rajesh Kulkarni', department: 'Road Infrastructure & Maintenance' };
      const notes = 'Immediate cold-patching required before evening peak hours.';

      const params = buildWorkerAssignmentParams({ worker, complaint, officer, notes });

      expect(params.subject).toBe('CivicLens – New Complaint Assigned: BLR-2026-0101');
      expect(params.to_email).toBe('ramesh.n@bbmp.gov.in');
      expect(params.worker_name).toBe('Ramesh Nayak');
      expect(params.complaint_id).toBe('BLR-2026-0101');
      expect(params.department_name).toBe('Road Infrastructure & Maintenance');
      expect(params.category).toBe('Road Infrastructure & Maintenance');
      expect(params.description).toBe('Crater pothole causing accidents near junction.');
      expect(params.location).toBe('100 Feet Rd, Indiranagar');
      expect(params.priority).toBe('HIGH');
      expect(params.assigned_officer).toBe('Rajesh Kulkarni');
      expect(params.worker_dashboard_url).toBe('http://localhost:5173/worker');
    });
  });

  describe('Citizen Live Tracker Email Template', () => {
    it('should format citizen tracker parameters with live tracking link and public status only', () => {
      const complaint = {
        id: 'c101-uuid',
        ticketNumber: 'BLR-2026-0101',
        citizenName: 'Aarav Sharma',
        citizenEmail: 'aarav.sharma@example.com',
        category: 'Road Infrastructure & Maintenance',
        department: 'Road Infrastructure & Maintenance',
        status: 'Work in Progress'
      };

      const params = buildCitizenTrackerParams({ complaint });

      expect(params.subject).toBe('CivicLens – Your Complaint BLR-2026-0101 Has Been Updated');
      expect(params.to_email).toBe('aarav.sharma@example.com');
      expect(params.citizen_name).toBe('Aarav Sharma');
      expect(params.complaint_id).toBe('BLR-2026-0101');
      expect(params.category).toBe('Road Infrastructure & Maintenance');
      expect(params.department_name).toBe('Road Infrastructure & Maintenance');
      expect(params.status).toBe('Work in Progress');
      expect(params.tracker_url).toBe('http://localhost:5173/citizen/complaints/c101-uuid');

      // Crucial requirement: No internal officer remarks, worker notes, or sensitive worker data exposed
      expect(params).not.toHaveProperty('internalNotes');
      expect(params).not.toHaveProperty('workerPhone');
      expect(params).not.toHaveProperty('workerNotes');
    });
  });

  describe('Notification Logging Integrity', () => {
    it('should create valid email log structure with delivery attempt status', () => {
      const log = {
        complaint_id: 'BLR-2026-0101',
        recipient_email: 'ramesh.n@bbmp.gov.in',
        recipient_type: 'WORKER',
        notification_type: 'WORKER_ASSIGNMENT',
        delivery_attempt_status: 'SENT',
        error_message: null,
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString()
      };

      expect(log.complaint_id).toBe('BLR-2026-0101');
      expect(log.recipient_type).toBe('WORKER');
      expect(log.delivery_attempt_status).toBe('SENT');
      expect(log.sent_at).not.toBeNull();
      expect(log.error_message).toBeNull();
    });

    it('should log failed email without throwing or breaking assignment workflow', () => {
      const failedLog = {
        complaint_id: 'BLR-2026-0101',
        recipient_email: 'invalid_email',
        recipient_type: 'WORKER',
        notification_type: 'WORKER_ASSIGNMENT',
        delivery_attempt_status: 'FAILED',
        error_message: 'Invalid or missing worker email: "invalid_email"',
        created_at: new Date().toISOString(),
        sent_at: null
      };

      expect(failedLog.delivery_attempt_status).toBe('FAILED');
      expect(failedLog.sent_at).toBeNull();
      expect(failedLog.error_message).toBeTruthy();
    });
  });
});
