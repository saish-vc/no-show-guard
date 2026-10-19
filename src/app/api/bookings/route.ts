import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/auth';
import { syncFromCookies, readDevStore, writeDevStore } from '@/lib/dev-store';
import { createBookingSchema } from '@/validations/booking';
import { doIntervalsOverlap } from '@/lib/slots';
import { addMinutes, parseISO } from 'date-fns';
import type { Booking, BookingEvent, Service, Business } from '@/types';

// ============================================================================
// POST /api/bookings
// Creates a new appointment with double-booking prevention.
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Zod input validation
    const validation = createBookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid booking details.' },
        { status: 400 }
      );
    }

    const input = validation.data;
    const startDate = parseISO(input.starts_at_utc);
    const now = new Date();

    // 2. Validate starts_at_utc is in the future
    if (isNaN(startDate.getTime()) || startDate.getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: 'The requested appointment time must be in the future.' },
        { status: 400 }
      );
    }

    const confirmationToken = crypto.randomUUID();

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();

      // 3. Verify business and service exist and are active
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', input.service_id)
        .eq('business_id', input.business_id)
        .eq('is_active', true)
        .maybeSingle();

      if (serviceError || !serviceData) {
        return NextResponse.json(
          { error: 'Selected service is invalid or no longer active.' },
          { status: 400 }
        );
      }

      const service = serviceData as Service;
      const endDate = addMinutes(startDate, service.duration_minutes);
      const endsAtUtc = endDate.toISOString();

      // 4. Check for overlapping bookings (application-level check before DB insert)
      const { data: overlapping } = await supabase
        .from('bookings')
        .select('id, starts_at_utc, ends_at_utc')
        .eq('service_id', input.service_id)
        .not('status', 'in', '("cancelled_by_customer","cancelled_by_business")')
        .lt('starts_at_utc', endsAtUtc)
        .gt('ends_at_utc', input.starts_at_utc);

      if (overlapping && overlapping.length > 0) {
        return NextResponse.json(
          { error: 'This time slot has already been booked. Please select another available time.' },
          { status: 409 }
        );
      }

      // 5. Insert booking with DB-level constraint protection
      const { data: newBooking, error: insertError } = await supabase
        .from('bookings')
        .insert({
          business_id: input.business_id,
          service_id: input.service_id,
          customer_name: input.customer_name,
          customer_email: input.customer_email.toLowerCase(),
          customer_phone: input.customer_phone || null,
          starts_at_utc: input.starts_at_utc,
          ends_at_utc: endsAtUtc,
          status: 'pending',
          confirmation_token: confirmationToken,
        })
        .select()
        .single();

      if (insertError) {
        // Postgres exclusion or unique violation: error 23P01 or 23505
        if (insertError.code === '23P01' || insertError.code === '23505') {
          return NextResponse.json(
            { error: 'This time slot was just booked by another customer. Please choose a different time.' },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // 6. Record audit event
      await supabase.from('booking_events').insert({
        booking_id: newBooking.id,
        event_type: 'created',
        metadata: {
          customer_email: input.customer_email,
          customer_name: input.customer_name,
          created_via: 'public_api',
        },
      });

      return NextResponse.json(
        {
          success: true,
          booking_id: newBooking.id,
          confirmation_token: confirmationToken,
          starts_at_utc: input.starts_at_utc,
          ends_at_utc: endsAtUtc,
        },
        { status: 201 }
      );
    }

    // Dev mode fallback
    const store = await syncFromCookies();

    // Verify service
    const service = store.services.find(
      (s) => s.id === input.service_id && s.business_id === input.business_id && s.is_active
    );

    if (!service) {
      return NextResponse.json(
        { error: 'Selected service is invalid or no longer active.' },
        { status: 400 }
      );
    }

    const endDate = addMinutes(startDate, service.duration_minutes);
    const endsAtUtc = endDate.toISOString();

    // Double-booking check
    const hasOverlap = store.bookings.some(
      (b) =>
        b.service_id === input.service_id &&
        b.status !== 'cancelled_by_customer' &&
        b.status !== 'cancelled_by_business' &&
        doIntervalsOverlap(input.starts_at_utc, endsAtUtc, b.starts_at_utc, b.ends_at_utc)
    );

    if (hasOverlap) {
      return NextResponse.json(
        { error: 'This time slot has already been booked. Please select another available time.' },
        { status: 409 }
      );
    }

    const bookingId = crypto.randomUUID();
    const newBooking: Booking = {
      id: bookingId,
      business_id: input.business_id,
      service_id: input.service_id,
      customer_name: input.customer_name,
      customer_email: input.customer_email.toLowerCase(),
      customer_phone: input.customer_phone || null,
      starts_at_utc: input.starts_at_utc,
      ends_at_utc: endsAtUtc,
      status: 'pending',
      confirmation_token: confirmationToken,
      reminder_24h_sent_at: null,
      reminder_2h_sent_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newEvent: BookingEvent = {
      id: crypto.randomUUID(),
      booking_id: bookingId,
      event_type: 'created',
      metadata: {
        customer_email: input.customer_email,
        customer_name: input.customer_name,
      },
      created_at: new Date().toISOString(),
    };

    store.bookings.push(newBooking);
    store.booking_events.push(newEvent);
    writeDevStore(store);

    return NextResponse.json(
      {
        success: true,
        booking_id: bookingId,
        confirmation_token: confirmationToken,
        starts_at_utc: input.starts_at_utc,
        ends_at_utc: endsAtUtc,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
