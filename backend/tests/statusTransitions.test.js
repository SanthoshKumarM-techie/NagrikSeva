import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  COMPLAINT_STATUSES,
  COMPLAINT_STATUS
} from '../src/utils/statusTransitions.js';

describe('Complaint Status Transitions', () => {
  it('should define all 12 required complaint statuses from database schema', () => {
    expect(COMPLAINT_STATUSES).toEqual([
      'SUBMITTED',
      'DEPARTMENT_REVIEW',
      'TRANSFERRED',
      'ACKNOWLEDGED',
      'WORKER_ASSIGNED',
      'INSPECTION',
      'WORK_IN_PROGRESS',
      'VERIFICATION',
      'RESOLVED',
      'DISPUTED',
      'CLOSED',
      'REJECTED'
    ]);
  });

  it('should allow valid transitions from SUBMITTED', () => {
    expect(isValidTransition(COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.DEPARTMENT_REVIEW)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.TRANSFERRED)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.CLOSED)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.INSPECTION)).toBe(false);
    expect(isValidTransition(COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.RESOLVED)).toBe(false);
  });

  it('should allow valid transitions from WORKER_ASSIGNED', () => {
    expect(isValidTransition(COMPLAINT_STATUS.WORKER_ASSIGNED, COMPLAINT_STATUS.INSPECTION)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.WORKER_ASSIGNED, COMPLAINT_STATUS.WORK_IN_PROGRESS)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.WORKER_ASSIGNED, COMPLAINT_STATUS.TRANSFERRED)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.WORKER_ASSIGNED, COMPLAINT_STATUS.RESOLVED)).toBe(false);
  });

  it('should allow valid transitions from VERIFICATION', () => {
    expect(isValidTransition(COMPLAINT_STATUS.VERIFICATION, COMPLAINT_STATUS.RESOLVED)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.VERIFICATION, COMPLAINT_STATUS.WORK_IN_PROGRESS)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.VERIFICATION, COMPLAINT_STATUS.CLOSED)).toBe(false);
  });

  it('should allow valid transitions from RESOLVED (Confirmation or Dispute)', () => {
    expect(isValidTransition(COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.DISPUTED)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.WORKER_ASSIGNED)).toBe(false);
  });

  it('should allow DISPUTED to transition to INSPECTION, WORK_IN_PROGRESS, or TRANSFERRED', () => {
    expect(isValidTransition(COMPLAINT_STATUS.DISPUTED, COMPLAINT_STATUS.INSPECTION)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.DISPUTED, COMPLAINT_STATUS.WORK_IN_PROGRESS)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.DISPUTED, COMPLAINT_STATUS.TRANSFERRED)).toBe(true);
    expect(isValidTransition(COMPLAINT_STATUS.DISPUTED, COMPLAINT_STATUS.CLOSED)).toBe(false);
  });

  it('should prevent invalid transitions from terminal CLOSED', () => {
    expect(isValidTransition(COMPLAINT_STATUS.CLOSED, COMPLAINT_STATUS.WORK_IN_PROGRESS)).toBe(false);
    expect(isValidTransition(COMPLAINT_STATUS.CLOSED, COMPLAINT_STATUS.WORKER_ASSIGNED)).toBe(false);
    expect(isValidTransition(COMPLAINT_STATUS.CLOSED, COMPLAINT_STATUS.SUBMITTED)).toBe(false);
  });
});
