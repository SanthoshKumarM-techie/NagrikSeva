import { z } from 'zod';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const createComplaintSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(255),
    description: z.string().min(3, 'Description must be at least 3 characters'),
    categoryId: z.string().min(1, 'Valid Category ID is required'),
    departmentId: z.string().min(1, 'Valid Department ID is required'),
    wardId: z.string().optional().nullable().transform((val) => {
      if (!val) return null;
      return UUID_REGEX.test(val) ? val : null;
    }),
    latitude: z.coerce.number().min(-90).max(90).default(12.9716),
    longitude: z.coerce.number().min(-180).max(180).default(77.5946),
    address: z.string().min(3, 'Address is required'),
    landmark: z.string().optional().nullable(),
    priority: z.string().optional().transform((val) => {
      const upper = (val || 'MEDIUM').toUpperCase();
      if (upper === 'EMERGENCY') return 'CRITICAL';
      if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(upper)) return upper;
      return 'MEDIUM';
    }).default('MEDIUM'),
    isDuplicateOf: z.string().optional().nullable().transform((val) => {
      if (!val) return null;
      return UUID_REGEX.test(val) ? val : null;
    }),
    evidenceUrls: z.array(z.any()).optional().default([]).transform((arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((item) => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') {
            return item.fileUrl || item.storage_url || item.file_url || item.url || '';
          }
          return '';
        })
        .filter(Boolean);
    })
  })
});

export const matchComplaintsSchema = z.object({
  body: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    categoryId: z.string().optional().nullable(),
    radiusMeters: z.coerce.number().min(50).max(5000).optional().default(500),
    title: z.string().optional(),
    description: z.string().optional()
  })
});

export const cancelComplaintSchema = z.object({
  body: z.object({
    remarks: z.string().min(3, 'Cancellation reason is required')
  })
});

export default {
  createComplaintSchema,
  matchComplaintsSchema,
  cancelComplaintSchema
};
