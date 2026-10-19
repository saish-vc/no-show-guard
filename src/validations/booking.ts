import { z } from 'zod';

// ============================================================================
// Booking Validation Schemas
// ============================================================================

export const createBookingSchema = z.object({
  service_id: z
    .string()
    .uuid('Invalid service ID'),
  customer_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  customer_email: z
    .string()
    .email('Please enter a valid email address'),
  customer_phone: z
    .string()
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  starts_at_utc: z
    .string()
    .datetime('Invalid date/time format'),
  business_id: z
    .string()
    .uuid('Invalid business ID'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
