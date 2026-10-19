// ============================================================================
// App-wide Constants
// ============================================================================

export const APP_NAME = 'NoShowGuard';

export const BUSINESS_TYPES = [
  { value: 'tutor', label: 'Tutor / Education' },
  { value: 'salon', label: 'Salon / Barbershop' },
  { value: 'gym', label: 'Gym / Personal Trainer' },
  { value: 'photographer', label: 'Photographer / Videographer' },
  { value: 'consultant', label: 'Consultant / Coach' },
  { value: 'therapist', label: 'Therapist / Counselor' },
  { value: 'medical', label: 'Medical / Dental' },
  { value: 'auto', label: 'Auto Service' },
  { value: 'pet', label: 'Pet Grooming / Vet' },
  { value: 'general', label: 'Other' },
] as const;

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled_by_customer: 'Cancelled by Customer',
  cancelled_by_business: 'Cancelled by Business',
  completed: 'Completed',
  no_show: 'No Show',
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled_by_customer: 'bg-red-100 text-red-800',
  cancelled_by_business: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  no_show: 'bg-gray-100 text-gray-800',
};

// Slot generation settings
export const SLOT_INTERVAL_MINUTES = 30; // Generate slots every 30 minutes
export const MIN_BOOKING_NOTICE_HOURS = 2; // Minimum hours before an appointment can be booked
export const MAX_BOOKING_DAYS_AHEAD = 30; // Maximum days in advance a booking can be made
