import { z } from 'zod';

// ============================================================================
// Business Validation Schemas
// ============================================================================

export const businessOnboardingSchema = z.object({
  name: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be at most 100 characters'),
  business_type: z
    .string()
    .min(1, 'Please select a business type'),
  timezone: z
    .string()
    .min(1, 'Please select a timezone'),
  booking_slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      'Slug must start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens'
    ),
  cancellation_policy: z.string().optional(),
});

export const businessSettingsSchema = businessOnboardingSchema.extend({
  cancellation_policy: z
    .string()
    .max(500, 'Cancellation policy must be at most 500 characters')
    .optional(),
});

export type BusinessOnboardingInput = z.infer<typeof businessOnboardingSchema>;
export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
