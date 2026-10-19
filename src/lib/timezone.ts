import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

// ============================================================================
// Timezone Utilities
// ============================================================================

/**
 * Format a UTC date string in a specific timezone.
 * @example formatInTz('2024-01-15T14:00:00Z', 'America/New_York', 'MMM d, yyyy h:mm a')
 *          → "Jan 15, 2024 9:00 AM"
 */
export function formatInTz(
  utcDateString: string,
  timezone: string,
  formatStr: string
): string {
  return formatInTimeZone(new Date(utcDateString), timezone, formatStr);
}

/**
 * Get a Date object adjusted for a specific timezone.
 */
export function toTz(utcDateString: string, timezone: string): Date {
  return toZonedTime(new Date(utcDateString), timezone);
}

/**
 * Format a date for display in emails and UI.
 * Returns something like: "Wednesday, January 15, 2024 at 9:00 AM EST"
 */
export function formatBookingDateTime(
  utcDateString: string,
  timezone: string
): string {
  return formatInTimeZone(
    new Date(utcDateString),
    timezone,
    "EEEE, MMMM d, yyyy 'at' h:mm a zzz"
  );
}

/**
 * Format a short date for tables/lists.
 * Returns something like: "Jan 15, 9:00 AM"
 */
export function formatBookingDateShort(
  utcDateString: string,
  timezone: string
): string {
  return formatInTimeZone(
    new Date(utcDateString),
    timezone,
    'MMM d, h:mm a'
  );
}

/**
 * Format just the time portion.
 * Returns something like: "9:00 AM"
 */
export function formatTime(utcDateString: string, timezone: string): string {
  return formatInTimeZone(new Date(utcDateString), timezone, 'h:mm a');
}

/**
 * Get a list of common timezones for the settings dropdown.
 */
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
] as const;

/**
 * Get the current date formatted for display.
 */
export function getCurrentDateFormatted(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, 'EEEE, MMMM d, yyyy');
}
