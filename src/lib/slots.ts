import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { parseISO, addMinutes } from 'date-fns';
import type { AvailabilityRule, Booking, Service } from '@/types';

// ============================================================================
// Slot Generation & Timezone Utilities
// ============================================================================

export interface GeneratedSlot {
  starts_at_utc: string; // ISO 8601 UTC string
  ends_at_utc: string;   // ISO 8601 UTC string
  local_start_time: string; // e.g. "09:00"
  local_end_time: string;   // e.g. "10:00"
  display_time: string;     // e.g. "9:00 AM – 10:00 AM"
  available: boolean;
}

/**
 * Check if two time intervals [startA, endA) and [startB, endB) overlap.
 * Intervals overlap if and only if max(startA, startB) < min(endA, endB).
 */
export function doIntervalsOverlap(
  startA: Date | string,
  endA: Date | string,
  startB: Date | string,
  endB: Date | string
): boolean {
  const sA = typeof startA === 'string' ? parseISO(startA).getTime() : startA.getTime();
  const eA = typeof endA === 'string' ? parseISO(endA).getTime() : endA.getTime();
  const sB = typeof startB === 'string' ? parseISO(startB).getTime() : startB.getTime();
  const eB = typeof endB === 'string' ? parseISO(endB).getTime() : endB.getTime();

  return Math.max(sA, sB) < Math.min(eA, eB);
}

/**
 * Given a date string (YYYY-MM-DD) and a business timezone,
 * return the day of week (0 = Sunday, 1 = Monday, ... 6 = Saturday) in that timezone.
 */
export function getDayOfWeekInTimezone(dateStr: string, timeZone: string): number {
  // Parse noon in target timezone to avoid any DST edge effects
  const zonedDate = fromZonedTime(`${dateStr} 12:00:00`, timeZone);
  const dayStr = formatInTimeZone(zonedDate, timeZone, 'i'); // 1 = Monday, 7 = Sunday
  const isoDay = parseInt(dayStr, 10);
  return isoDay === 7 ? 0 : isoDay;
}

/**
 * Generate available booking slots for a specific date, service, and business rules.
 */
export function generateAvailableSlots({
  dateStr, // YYYY-MM-DD
  service,
  availabilityRules,
  existingBookings,
  timeZone,
  stepMinutes = 30,
  referenceNow = new Date(),
}: {
  dateStr: string;
  service: Pick<Service, 'id' | 'duration_minutes'>;
  availabilityRules: AvailabilityRule[];
  existingBookings: Pick<Booking, 'starts_at_utc' | 'ends_at_utc' | 'status' | 'service_id'>[];
  timeZone: string;
  stepMinutes?: number;
  referenceNow?: Date;
}): GeneratedSlot[] {
  const duration = service.duration_minutes;
  const dayOfWeek = getDayOfWeekInTimezone(dateStr, timeZone);

  // Find the active rule for this day of week
  const rule = availabilityRules.find(
    (r) => r.is_active && r.day_of_week === dayOfWeek
  );

  // If no active rule or closed on this day, no slots available
  if (!rule) {
    return [];
  }

  // Parse start and end time (format "HH:mm" or "HH:mm:ss")
  const startParts = rule.start_time.split(':');
  const endParts = rule.end_time.split(':');
  const startHour = parseInt(startParts[0], 10);
  const startMin = parseInt(startParts[1], 10);
  const endHour = parseInt(endParts[0], 10);
  const endMin = parseInt(endParts[1], 10);

  const windowStartTotalMinutes = startHour * 60 + startMin;
  const windowEndTotalMinutes = endHour * 60 + endMin;

  // Active bookings filter (exclude cancelled bookings)
  const activeBookings = existingBookings.filter(
    (b) =>
      b.status !== 'cancelled_by_customer' &&
      b.status !== 'cancelled_by_business'
  );

  const slots: GeneratedSlot[] = [];
  const actualStep = Math.min(stepMinutes, duration);
  const nowUtcTime = referenceNow.getTime();

  for (
    let currentMin = windowStartTotalMinutes;
    currentMin + duration <= windowEndTotalMinutes;
    currentMin += actualStep
  ) {
    const slotStartHour = Math.floor(currentMin / 60);
    const slotStartMinute = currentMin % 60;
    const slotEndTotal = currentMin + duration;
    const slotEndHour = Math.floor(slotEndTotal / 60);
    const slotEndMinute = slotEndTotal % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const startStr = `${pad(slotStartHour)}:${pad(slotStartMinute)}:00`;
    const endStr = `${pad(slotEndHour)}:${pad(slotEndMinute)}:00`;

    // Convert local time in business timezone to UTC Date
    const startUtcDate = fromZonedTime(`${dateStr} ${startStr}`, timeZone);
    const endUtcDate = fromZonedTime(`${dateStr} ${endStr}`, timeZone);

    const startsAtUtc = startUtcDate.toISOString();
    const endsAtUtc = endUtcDate.toISOString();

    // 1. Must be in the future (at least 5 minutes from now)
    if (startUtcDate.getTime() <= nowUtcTime + 5 * 60 * 1000) {
      continue;
    }

    // 2. Must not overlap any existing active booking for this service
    const overlaps = activeBookings.some((b) =>
      doIntervalsOverlap(startsAtUtc, endsAtUtc, b.starts_at_utc, b.ends_at_utc)
    );

    if (overlaps) {
      continue; // Exclude overlapping slot
    }

    // Format human-friendly display time in business timezone
    const formattedStart = formatInTimeZone(startUtcDate, timeZone, 'h:mm a');
    const formattedEnd = formatInTimeZone(endUtcDate, timeZone, 'h:mm a');

    slots.push({
      starts_at_utc: startsAtUtc,
      ends_at_utc: endsAtUtc,
      local_start_time: `${pad(slotStartHour)}:${pad(slotStartMinute)}`,
      local_end_time: `${pad(slotEndHour)}:${pad(slotEndMinute)}`,
      display_time: `${formattedStart} – ${formattedEnd}`,
      available: true,
    });
  }

  return slots;
}
