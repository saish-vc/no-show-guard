import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/auth';
import { syncFromCookies, writeDevStore } from '@/lib/dev-store';
import type { Booking } from '@/types';

// ============================================================================
// POST /api/bookings/[token]/reschedule-request
// Customer submits a reschedule request for an appointment.
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    let notes = '';
    let preferredTimes = '';
    try {
      const body = await request.json();
      notes = body.notes || '';
      preferredTimes = body.preferred_times || '';
    } catch {}

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();

      const { data: booking, error: bError } = await supabase
        .from('bookings')
        .select('*')
        .eq('confirmation_token', token)
        .maybeSingle();

      if (bError || !booking) {
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
      }

      await supabase.from('booking_events').insert({
        booking_id: booking.id,
        event_type: 'rescheduled',
        metadata: {
          request_type: 'reschedule_inquiry',
          notes,
          preferred_times: preferredTimes,
          requested_at: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Reschedule request submitted! The business has been notified.',
      });
    }

    // Dev mode fallback
    const store = await syncFromCookies();
    const booking = store.bookings.find((b) => b.confirmation_token === token);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    store.booking_events.push({
      id: crypto.randomUUID(),
      booking_id: booking.id,
      event_type: 'rescheduled',
      metadata: {
        request_type: 'reschedule_inquiry',
        notes,
        preferred_times: preferredTimes,
        requested_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    writeDevStore(store);

    return NextResponse.json({
      success: true,
      message: 'Reschedule request submitted! The business has been notified.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
