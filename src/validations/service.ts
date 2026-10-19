import { z } from 'zod';

// ============================================================================
// Service Validation Schemas
// ============================================================================

export const serviceSchema = z.object({
  name: z
    .string()
    .min(2, 'Service name must be at least 2 characters')
    .max(100, 'Service name must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  duration_minutes: z
    .number()
    .int('Duration must be a whole number')
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration must be at most 8 hours'),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(99999.99, 'Price is too high'),
  is_active: z.boolean().default(true),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
