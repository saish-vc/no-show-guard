import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/auth';
import { syncFromCookies, writeDevStore } from '@/lib/dev-store';
import { sendReminder24hEmail, sendReminder2hEmail } from '@/lib/email';
import { addHours, parseISO } from 'date-fns';
import type { Booking, Business, Service } from '@/types';

// ============================================================================
// POST & GET /api/cron/reminders
// Automated cron job sending 24-hour and 2-hour email reminders.
// ============================================================================

export async function POST(request: NextRequest) {
  return handleReminders(request);
}

export async function GET(request: NextRequest) {
  return handleReminders(request);
}

async function handleReminders(request: NextRequest) {
  try {
    // 1. Authorization check
    const authHeader = request.headers.get('authorization');
    const secretHeader = request.headers.get('x-cron-secret');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && !cronSecret.includes('your-cron-secret') && cronSecret !== '') {
      const bearer = authHeader?.replace('Bearer ', '');
      if (bearer !== cronSecret && secretHeader !== cronSecret) {
        return NextResponse.json(
          { error: 'Unauthorized. Valid CRON_SECRET header is required.' },
          { status: 401 }
        );
      }
    }

    const now = new Date();
    const in24Hours = addHours(now, 24);
    const in2Hours = addHours(now, 2);

    let processed24h = 0;
    let processed2h = 0;
    const errors: string[] = [];

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();

      // Query active bookings in the next 24 hours needing any reminder
      const { data: bookingsData, error: queryError } = await supabase
        .from('bookings')
        .select(`
          *,
          business:businesses(*),
          service:services(*)
        `)
        .in('status', ['pending', 'confirmed'])
        .gt('starts_at_utc', now.toISOString())
        .lte('starts_at_utc', in24Hours.toISOString());

      if (queryError) {
        return NextResponse.json(
          { error: `Database query failed: ${queryError.message}` },
          { status: 500 }
        );
      }

      const candidateBookings = bookingsData || [];

      for (const item of candidateBookings) {
        const booking = item as Booking;
        const business = (item as any).business as Business;
        const service = (item as any).service as Service;
        const start = parseISO(booking.starts_at_utc);

        const emailData = {
          businessName: business?.name || 'Your Provider',
          businessType: business?.business_type,
          businessTimezone: business?.timezone || 'UTC',
          serviceName: service?.name || 'Appointment',
          durationMinutes: service?.duration_minutes || 60,
          price: service?.price || 0,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          startsAtUtc: booking.starts_at_utc,
          endsAtUtc: booking.ends_at_utc,
          cancellationPolicy: business?.cancellation_policy || null,
          confirmationToken: booking.confirmation_token,
        };

        // Check 24-hour reminder
        if (!booking.reminder_24h_sent_at && start <= in24Hours) {
          try {
            await sendReminder24hEmail(emailData);

            await supabase
              .from('bookings')
              .update({ reminder_24h_sent_at: now.toISOString() })
              .eq('id', booking.id);

            await supabase.from('booking_events').insert({
              booking_id: booking.id,
              event_type: 'reminder_24h_sent',
              metadata: { sent_at: now.toISOString() },
            });

            processed24h++;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown email error';
            errors.push(`Booking ${booking.id} 24h reminder error: ${msg}`);
          }
        }

        // Check 2-hour reminder
        if (!booking.reminder_2h_sent_at && start <= in2Hours) {
          try {
            await sendReminder2hEmail(emailData);

            await supabase
              .from('bookings')
              .update({ reminder_2h_sent_at: now.toISOString() })
              .eq('id', booking.id);

            await supabase.from('booking_events').insert({
              booking_id: booking.id,
              event_type: 'reminder_2h_sent',
              metadata: { sent_at: now.toISOString() },
            });

            processed2h++;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown email error';
            errors.push(`Booking ${booking.id} 2h reminder error: ${msg}`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        timestamp: now.toISOString(),
        processed_24h: processed24h,
        processed_2h: processed2h,
        total_candidates: candidateBookings.length,
        errors,
      });
    }

    // Dev mode fallback
    const store = await syncFromCookies();

    for (let i = 0; i < store.bookings.length; i++) {
      const booking = store.bookings[i];
      if (
        booking.status !== 'pending' &&
        booking.status !== 'confirmed'
      ) {
        continue;
      }

      const start = parseISO(booking.starts_at_utc);
      // Must be in the future
      if (start <= now) continue;

      const business =
        store.businesses.find((b) => b.id === booking.business_id) || store.businesses[0];
      const service =
        store.services.find((s) => s.id === booking.service_id) || store.services[0];

      if (!business || !service) continue;

      const emailData = {
        businessName: business.name,
        businessType: business.business_type,
        businessTimezone: business.timezone,
        serviceName: service.name,
        durationMinutes: service.duration_minutes,
        price: service.price,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        startsAtUtc: booking.starts_at_utc,
        endsAtUtc: booking.ends_at_utc,
        cancellationPolicy: business.cancellation_policy,
        confirmationToken: booking.confirmation_token,
      };

      // 24-hour check
      if (!booking.reminder_24h_sent_at && start <= in24Hours) {
        try {
          await sendReminder24hEmail(emailData);
          store.bookings[i].reminder_24h_sent_at = now.toISOString();

          store.booking_events.push({
            id: crypto.randomUUID(),
            booking_id: booking.id,
            event_type: 'reminder_24h_sent',
            metadata: { sent_at: now.toISOString() },
            created_at: now.toISOString(),
          });

          processed24h++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown email error';
          errors.push(`Booking ${booking.id} 24h reminder error: ${msg}`);
        }
      }

      // 2-hour check
      if (!booking.reminder_2h_sent_at && start <= in2Hours) {
        try {
          await sendReminder2hEmail(emailData);
          store.bookings[i].reminder_2h_sent_at = now.toISOString();

          store.booking_events.push({
            id: crypto.randomUUID(),
            booking_id: booking.id,
            event_type: 'reminder_2h_sent',
            metadata: { sent_at: now.toISOString() },
            created_at: now.toISOString(),
          });

          processed2h++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown email error';
          errors.push(`Booking ${booking.id} 2h reminder error: ${msg}`);
        }
      }
    }

    writeDevStore(store);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processed_24h: processed24h,
      processed_2h: processed2h,
      errors,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cron execution failed';
    console.error('Error in /api/cron/reminders:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
