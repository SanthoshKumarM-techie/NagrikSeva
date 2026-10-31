/**
 * Verification test script for CivicLens EmailJS integration
 */

import {
  isValidEmail,
  sanitizeEmail,
  validateWorkerEmail,
  validateCitizenEmail
} from '../src/utils/emailValidation.js';

import {
  buildWorkerAssignmentParams,
  buildCitizenTrackerParams
} from '../src/services/email/emailTemplates.js';

import {
  sendWorkerAssignmentEmail,
  sendCitizenTrackerEmail,
  logEmailNotification,
  getEmailNotificationLogs
} from '../src/services/email/emailService.js';

console.log('🧪 Running CivicLens EmailJS Integration Tests...\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  // 1. Validation tests
  console.log('1. Testing Email Validation:');
  assert(isValidEmail('worker@bbmp.gov.in'), 'Worker email valid format');
  assert(isValidEmail('citizen@example.com'), 'Citizen email valid format');
  assert(!isValidEmail('invalid-email'), 'Invalid string rejected');
  assert(!isValidEmail(''), 'Empty string rejected');
  assert(!isValidEmail(null), 'Null rejected');

  assert(sanitizeEmail('  TEST@Domain.COM  ') === 'test@domain.com', 'Sanitize cleans whitespace & lowercases');

  const workerCheck = validateWorkerEmail({ email: 'ramesh.n@bbmp.gov.in', name: 'Ramesh' });
  assert(workerCheck.valid && workerCheck.email === 'ramesh.n@bbmp.gov.in', 'validateWorkerEmail extracts valid email');

  const citizenCheck = validateCitizenEmail({ citizenEmail: 'aarav.sharma@example.com', citizenName: 'Aarav' });
  assert(citizenCheck.valid && citizenCheck.email === 'aarav.sharma@example.com', 'validateCitizenEmail extracts valid email');

  // 2. Template builder tests
  console.log('\n2. Testing Template Builders:');
  const workerParams = buildWorkerAssignmentParams({
    worker: { name: 'Ramesh Nayak', email: 'ramesh.n@bbmp.gov.in' },
    complaint: {
      id: 'comp-101',
      ticketNumber: 'BLR-2026-0101',
      category: 'Road Infrastructure',
      department: 'Roads & Infrastructure',
      description: 'Pothole on 100ft road',
      location: 'Indiranagar',
      priority: 'HIGH'
    },
    officer: { name: 'Rajesh Kulkarni', department: 'Roads & Infrastructure' },
    notes: 'Urgent repair'
  });

  assert(workerParams.subject === 'CivicLens – New Complaint Assigned: BLR-2026-0101', 'Worker subject matches specification');
  assert(workerParams.complaint_id === 'BLR-2026-0101', 'Worker complaint_id populated');
  assert(workerParams.worker_dashboard_url.includes('/worker'), 'Worker dashboard link points to portal');
  assert(workerParams.assigned_officer === 'Rajesh Kulkarni', 'Assigned officer populated');

  const citizenParams = buildCitizenTrackerParams({
    complaint: {
      id: 'comp-101',
      ticketNumber: 'BLR-2026-0101',
      citizenName: 'Aarav Sharma',
      citizenEmail: 'aarav.sharma@example.com',
      category: 'Road Infrastructure',
      department: 'Roads & Infrastructure',
      status: 'Work in Progress'
    }
  });

  assert(citizenParams.subject === 'CivicLens – Your Complaint BLR-2026-0101 Has Been Updated', 'Citizen subject matches specification');
  assert(citizenParams.tracker_url.includes('/citizen/complaints/comp-101'), 'Citizen tracker URL links to existing tracker route');
  assert(citizenParams.status === 'Work in Progress', 'Public status included');
  assert(!('workerPhone' in citizenParams), 'Worker phone not leaked to citizen');
  assert(!('internalNotes' in citizenParams), 'Internal notes not leaked to citizen');

  // 3. Email dispatch & logging tests
  console.log('\n3. Testing Dispatch & Notification Logging:');
  const workerSendResult = await sendWorkerAssignmentEmail({
    worker: { name: 'Ramesh Nayak', email: 'ramesh.n@bbmp.gov.in' },
    complaint: { id: 'comp-101', ticketNumber: 'BLR-2026-0101' },
    officer: { name: 'Rajesh Kulkarni' },
    notes: 'Dispatched to site'
  });
  assert(workerSendResult.success === true, 'sendWorkerAssignmentEmail succeeds in dev mode');
  assert(workerSendResult.log?.delivery_attempt_status === 'SENT', 'Worker email delivery logged as SENT');
  assert(workerSendResult.log?.complaint_id === 'BLR-2026-0101', 'Worker log contains correct complaint ID');

  const citizenSendResult = await sendCitizenTrackerEmail({
    complaint: {
      id: 'comp-101',
      ticketNumber: 'BLR-2026-0101',
      citizenEmail: 'aarav.sharma@example.com',
      citizenName: 'Aarav Sharma',
      status: 'Work in Progress'
    },
    eventType: 'WORK_STARTED'
  });
  assert(citizenSendResult.success === true, 'sendCitizenTrackerEmail succeeds in dev mode');
  assert(citizenSendResult.log?.recipient_type === 'CITIZEN', 'Citizen log has recipient_type CITIZEN');

  // Test duplicate suppression
  const duplicateSendResult = await sendCitizenTrackerEmail({
    complaint: {
      id: 'comp-101',
      ticketNumber: 'BLR-2026-0101',
      citizenEmail: 'aarav.sharma@example.com',
      citizenName: 'Aarav Sharma',
      status: 'Work in Progress'
    },
    eventType: 'WORK_STARTED'
  });
  assert(duplicateSendResult.duplicateSuppressed === true, 'Duplicate rapid click email suppressed');

  // Test missing email handling (must not throw, logs failure)
  const missingEmailResult = await sendWorkerAssignmentEmail({
    worker: { name: 'Unknown Worker' },
    complaint: { id: 'comp-999' }
  });
  assert(missingEmailResult.success === false, 'Missing worker email handled safely without throwing');
  assert(missingEmailResult.log?.delivery_attempt_status === 'FAILED', 'Missing email logged with status FAILED');

  // 4. Multi-citizen dynamic recipient tests (Req #8)
  console.log('\n4. Testing Multi-Citizen Dynamic Recipient Delivery (Req #8):');
  const citizens = [
    { id: 'cit-001', citizenEmail: 'aarav.sharma@example.com',    citizenName: 'Aarav Sharma',       ticketNumber: 'BLR-2026-0001', status: 'Work in Progress' },
    { id: 'cit-002', citizenEmail: 'meera.k@example.com',         citizenName: 'Meera Krishnan',     ticketNumber: 'BLR-2026-0002', status: 'Complaint Resolved' },
    { id: 'cit-003', citizenEmail: 'vikram.roy@example.com',      citizenName: 'Vikramaditya Roy',   ticketNumber: 'BLR-2026-0003', status: 'Work Submitted for Review' },
  ];

  const emails = new Set();
  for (const citizen of citizens) {
    const params = buildCitizenTrackerParams({ complaint: citizen });
    assert(params.to_email === citizen.citizenEmail, `Citizen "${citizen.citizenName}" gets their own email (${citizen.citizenEmail})`);
    assert(params.citizen_name === citizen.citizenName, `Citizen name correct for ${citizen.citizenName}`);
    assert(params.tracker_url.includes(citizen.id), `Tracker URL specific to complaint ${citizen.ticketNumber}`);
    emails.add(params.to_email);
  }
  assert(emails.size === 3, 'All three citizens receive distinct emails — no cross-contamination');

  // Verify empty-email citizen is rejected safely (never leaks to hardcoded address)
  const noEmailCitizen = { id: 'cit-004', citizenEmail: '', citizenName: 'No Email User', ticketNumber: 'BLR-2026-0004', status: 'Pending' };
  const noEmailResult = await sendCitizenTrackerEmail({ complaint: noEmailCitizen, eventType: 'COMPLAINT_RECEIVED' });
  assert(noEmailResult.success === false, 'Missing citizen email results in safe failure (not sent to hardcoded address)');
  assert(noEmailResult.log?.delivery_attempt_status === 'FAILED', 'Missing citizen email logged as FAILED');
  assert(noEmailResult.log?.recipient_email !== 'citizen@example.com', 'No hardcoded fallback address used');

  // Verify empty worker email is rejected safely
  const noEmailWorker = { id: 'WRK-404', name: 'Ghost Worker' }; // no email field
  const noEmailWorkerResult = await sendWorkerAssignmentEmail({
    worker: noEmailWorker,
    complaint: { id: 'comp-404', ticketNumber: 'BLR-2026-0404' }
  });
  assert(noEmailWorkerResult.success === false, 'Missing worker email results in safe failure');
  assert(noEmailWorkerResult.log?.recipient_email !== 'worker@bbmp.gov.in', 'No hardcoded bbmp.gov.in fallback used');

  // 5. Verify no internal fields leak to citizen template
  console.log('\n5. Testing Citizen Privacy (No Internal Data Leakage):');
  const complaintWithInternals = {
    id: 'comp-200',
    ticketNumber: 'BLR-2026-0200',
    citizenEmail: 'priya.r@example.com',
    citizenName: 'Priya Ramachandran',
    status: 'Work in Progress',
    category: 'Water Supply',
    department: 'Water Supply Department',
    internalNotes: 'Worker had equipment failure — escalate to supervisor',
    workerPhone: '+91-9876543210',
    workerPersonalEmail: 'worker.personal@gmail.com',
    supervisorNotes: 'Sensitive internal remark'
  };
  const privacyParams = buildCitizenTrackerParams({ complaint: complaintWithInternals });
  assert(!('internalNotes' in privacyParams), 'Internal notes NOT included in citizen email');
  assert(!('workerPhone' in privacyParams), 'Worker phone NOT included in citizen email');
  assert(!('workerPersonalEmail' in privacyParams), 'Worker personal email NOT included in citizen email');
  assert(!('supervisorNotes' in privacyParams), 'Supervisor notes NOT included in citizen email');
  assert(privacyParams.to_email === 'priya.r@example.com', 'Only registered citizen email used');
  assert(privacyParams.status === 'Work in Progress', 'Public status IS included');

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

