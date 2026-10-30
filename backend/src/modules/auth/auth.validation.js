import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required').optional(),
    userId: z.string().min(1).optional(),
    userCode: z.string().min(1).optional(),
    identifier: z.string().min(1).optional(),
    password: z.string().min(1, 'Password is required')
  }).refine((data) => data.email || data.userId || data.userCode || data.identifier, {
    message: 'Valid email or User ID is required',
    path: ['email']
  })
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name is required'),
    phoneNumber: z.string().optional(),
    role: z.enum(['CITIZEN', 'FIELD_WORKER']).default('CITIZEN'),
    departmentId: z.string().uuid().optional().nullable(),
    specialization: z.string().optional().nullable(),
    address: z.string().optional().nullable()
  })
});

export default {
  loginSchema,
  registerSchema
};

