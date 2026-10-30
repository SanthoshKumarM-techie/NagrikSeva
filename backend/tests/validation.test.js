import { describe, it, expect } from 'vitest';
import { loginSchema } from '../src/modules/auth/auth.validation.js';
import { createComplaintSchema, matchComplaintsSchema } from '../src/modules/complaints/complaint.validation.js';
import { initiateTransferSchema } from '../src/modules/transfers/transfer.validation.js';
import { officerVerificationSchema, citizenFeedbackSchema } from '../src/modules/reviews/review.validation.js';

describe('Zod Validation Schemas', () => {
  describe('Auth Validation', () => {
    it('should validate correct login payload', () => {
      const valid = { body: { email: 'officer@bbmp.gov.in', password: 'password123' } };
      const parsed = loginSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalid = { body: { email: 'not-an-email', password: 'password123' } };
      const parsed = loginSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Complaint Validation', () => {
    it('should validate correct complaint payload', () => {
      const valid = {
        body: {
          title: 'Deep pothole on 100ft Road',
          description: 'Dangerous pothole near the signal causing heavy traffic and risk.',
          categoryId: '00000000-0000-0000-0000-000000000001',
          departmentId: '00000000-0000-0000-0000-000000000002',
          latitude: 12.9716,
          longitude: 77.5946,
          address: '100ft Road, Indiranagar',
          priority: 'HIGH'
        }
      };
      const parsed = createComplaintSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject short title or invalid coordinates', () => {
      const invalid = {
        body: {
          title: 'Pot',
          description: 'Too short',
          categoryId: 'invalid-uuid',
          departmentId: 'invalid-uuid',
          latitude: 200,
          longitude: 77.5946,
          address: 'Road'
        }
      };
      const parsed = createComplaintSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Transfer Validation', () => {
    it('should enforce minimum 10 characters for transfer reason', () => {
      const invalid = {
        body: {
          complaintId: '00000000-0000-0000-0000-000000000001',
          toDepartmentId: '00000000-0000-0000-0000-000000000002',
          reason: 'Wrong'
        }
      };
      const parsed = initiateTransferSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);

      const valid = {
        body: {
          complaintId: '00000000-0000-0000-0000-000000000001',
          toDepartmentId: '00000000-0000-0000-0000-000000000002',
          reason: 'Pipe leakage under road belongs to BWSSB water authority.'
        }
      };
      expect(initiateTransferSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('Review Validation', () => {
    it('should require rework instructions when officer rejects completion', () => {
      const invalidReject = {
        body: {
          decision: 'REJECTED'
        }
      };
      expect(officerVerificationSchema.safeParse(invalidReject).success).toBe(false);

      const validReject = {
        body: {
          decision: 'REJECTED',
          reworkInstructions: 'Asphalt not levelled properly; repave the top layer.'
        }
      };
      expect(officerVerificationSchema.safeParse(validReject).success).toBe(true);
    });

    it('should require minimum 10 char feedback when citizen disputes resolution', () => {
      const invalidDispute = {
        body: {
          decision: 'DISPUTED',
          feedback: 'Bad'
        }
      };
      expect(citizenFeedbackSchema.safeParse(invalidDispute).success).toBe(false);

      const validDispute = {
        body: {
          decision: 'DISPUTED',
          feedback: 'Pothole was only covered with loose sand; completely opened again.'
        }
      };
      expect(citizenFeedbackSchema.safeParse(validDispute).success).toBe(true);
    });
  });
});

