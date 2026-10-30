import { z } from 'zod';

export const initiateTransferSchema = z.object({
  body: z.object({
    complaintId: z.string().uuid('Valid Complaint ID is required'),
    toDepartmentId: z.string().uuid('Valid Target Department ID').optional().nullable(),
    reason: z.string().min(10, 'Transfer reason must be at least 10 characters')
  })
});

export const reviewTransferSchema = z.object({
  body: z.object({
    action: z.enum(['ACCEPT', 'REJECT', 'APPROVE']),
    toDepartmentId: z.string().uuid('Valid Target Department ID').optional(),
    reviewNotes: z.string().optional()
  })
});

export default {
  initiateTransferSchema,
  reviewTransferSchema
};


