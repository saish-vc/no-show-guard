import { z } from 'zod';

// ============================================================================
// Availability Validation Schemas
// ============================================================================

export const availabilityRuleSchema = z
  .object({
    id: z.string().uuid().optional(),
    day_of_week: z
      .number()
      .int()
      .min(0, 'Day must be between 0 (Sun) and 6 (Sat)')
      .max(6, 'Day must be between 0 (Sun) and 6 (Sat)'),
    start_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid start time format (HH:MM)'),
    end_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid end time format (HH:MM)'),
    is_active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      const start = data.start_time.slice(0, 5);
      const end = data.end_time.slice(0, 5);
      return start < end;
    },
    {
      message: 'End time must be later than start time',
      path: ['end_time'],
    }
  );

export const weeklyAvailabilitySchema = z.array(availabilityRuleSchema);

export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;
export type WeeklyAvailabilityInput = z.infer<typeof weeklyAvailabilitySchema>;
