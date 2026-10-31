/**
 * CivicLens Email Templates Builder
 * Formats template parameters according to strict CivicLens communication guidelines.
 */

import { formatDateTime } from '../../utils/statusHelpers.js';

/**
 * Builds EmailJS parameters for Worker Assignment Email.
 *
 * Subject:
 * CivicLens – New Complaint Assigned: {{complaint_id}}
 *
 * @param {object} data
 * @param {object} data.worker - Field worker object
 * @param {object} data.complaint - Complaint object
 * @param {object} data.officer - Assigning officer object
 * @param {string} [data.notes] - Optional assignment note
 * @returns {object} EmailJS template parameters
 */
export const buildWorkerAssignmentParams = ({ worker, complaint, officer, notes }) => {
  const complaintId = complaint.ticketNumber || complaint.id || 'NAG-TASK';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const workerDashboardUrl = `${origin}/worker`;

  const subject = `CivicLens – New Complaint Assigned: ${complaintId}`;

  return {
    to_email: worker.email,
    email: worker.email,
    recipient_email: worker.email,
    user_email: worker.email,
    to: worker.email,
    reply_to: worker.email,
    to_name: worker.name || 'Field Specialist',
    worker_name: worker.name || 'Field Specialist',
    complaint_id: complaintId,
    department_name: complaint.department || officer?.department || 'Municipal Department',
    category: complaint.category || 'General Civic Grievance',
    description: complaint.description || 'Inspection and maintenance required.',
    location: complaint.location || complaint.address || 'Reported Location',
    priority: complaint.priority || 'MEDIUM',
    assigned_officer: officer?.name || 'Department Officer',
    assignment_date: formatDateTime(new Date().toISOString()),
    assignment_notes: notes || 'Standard site inspection and resolution required.',
    worker_dashboard_url: workerDashboardUrl,
    dashboard_url: workerDashboardUrl,
    subject: subject
  };
};

/**
 * Builds EmailJS parameters for Citizen Live Tracker Email.
 *
 * Subject:
 * CivicLens – Your Complaint {{complaint_id}} Has Been Updated
 *
 * Body matches CivicLens requirement:
 * Hello {{citizen_name}},
 *
 * Your CivicLens complaint has received a new update.
 *
 * Complaint ID: {{complaint_id}}
 * Department: {{department_name}}
 * Current Status: {{status}}
 * Last Updated: {{updated_at}}
 *
 * View your live complaint progress here:
 *
 * {{tracker_url}}
 *
 * Regards,
 * CivicLens Team
 *
 * @param {object} data
 * @param {object} data.complaint - Complaint object
 * @param {string} [data.recipientEmail] - Target email override if not in complaint
 * @param {string} [data.recipientName] - Target name override if not in complaint
 * @returns {object} EmailJS template parameters
 */
export const buildCitizenTrackerParams = ({ complaint, recipientEmail, recipientName }) => {
  const complaintId = complaint.ticketNumber || complaint.id || 'NAG-CASE';
  const citizenName = recipientName || complaint.citizenName || 'Citizen';
  const citizenEmail = recipientEmail || complaint.citizenEmail;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const trackerUrl = `${origin}/citizen/complaints/${complaint.id || complaint.ticketNumber}`;

  const subject = `CivicLens – Your Complaint ${complaintId} Has Been Updated`;
  const updatedAt = formatDateTime(complaint.updatedAt || new Date().toISOString());

  return {
    to_email: citizenEmail,
    email: citizenEmail,
    recipient_email: citizenEmail,
    user_email: citizenEmail,
    to: citizenEmail,
    reply_to: citizenEmail,
    to_name: citizenName,
    citizen_name: citizenName,
    complaint_id: complaintId,
    category: complaint.category || 'Civic Infrastructure',
    department_name: complaint.department || 'Municipal Administration',
    status: complaint.status || 'Updated',
    updated_at: updatedAt,
    tracker_url: trackerUrl,
    subject: subject
  };
};

export default {
  buildWorkerAssignmentParams,
  buildCitizenTrackerParams
};
