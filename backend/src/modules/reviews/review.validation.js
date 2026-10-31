import { z } from 'zod';

export const officerVerificationSchema = z.object({
  body: z.object({
    decision: z.enum(['APPROVED', 'REJECTED', 'REWORK_REQUIRED']),
    feedback: z.string().optional(),
    reviewNotes: z.string().optional(),
    notes: z.string().optional(),
    reworkInstructions: z.string().optional()
  }).refine((data) => {
    const isReject = data.decision === 'REJECTED' || data.decision === 'REWORK_REQUIRED';
    const instructions = data.reworkInstructions || data.notes || data.reviewNotes || data.feedback;
    if (isReject && (!instructions || instructions.trim().length === 0)) {
      return false;
    }
    return true;
  }, {
    message: 'Rework instructions are required when rejecting work completion',
    path: ['reworkInstructions']
  }).transform(data => ({
    ...data,
    decision: data.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
    reworkInstructions: data.reworkInstructions || data.notes || data.reviewNotes || data.feedback || (data.decision === 'APPROVED' ? undefined : 'Please rectify on-site defects.')
  }))
});

export const citizenFeedbackSchema = z.object({
  body: z.object({
    decision: z.enum(['CONFIRMED', 'DISPUTED']),
    rating: z.number().int().min(1).max(5).optional(),
    feedback: z.string().optional()
  }).refine((data) => {
    if (data.decision === 'DISPUTED' && (!data.feedback || data.feedback.trim().length < 10)) {
      return false;
    }
    return true;
  }, {
    message: 'Dispute reason must be at least 10 characters when disputing resolution',
    path: ['feedback']
  })
});

export default {
  officerVerificationSchema,
  citizenFeedbackSchema
};

