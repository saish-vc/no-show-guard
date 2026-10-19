import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/auth';
import { syncFromCookies, writeDevStore } from '@/lib/dev-store';
import type { Booking, BookingEvent } from '@/types';

// ============================================================================
// POST /api/bookings/[token]/confirm
// Customer confirms attendance via secure token.
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();

      const { data: booking, error: findError } = await supabase
        .from('bookings')
        .select('*')
        .eq('confirmation_token', token)
        .maybeSingle();

      if (findError || !booking) {
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
      }

      if (
        booking.status === 'cancelled_by_customer' ||
        booking.status === 'cancelled_by_business'
      ) {
        return NextResponse.json(
          { error: 'Cannot confirm a cancelled appointment.' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', booking.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      await supabase.from('booking_events').insert({
        booking_id: booking.id,
        event_type: 'confirmed',
        metadata: { confirmed_via: 'token_link' },
      });

      return NextResponse.json({
        success: true,
        status: 'confirmed',
        message: 'Your attendance has been confirmed!',
      });
    }

    // Dev mode fallback
    const store = await syncFromCookies();
    const idx = store.bookings.findIndex((b) => b.confirmation_token === token);

    if (idx === -1) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    const booking = store.bookings[idx];
    if (
      booking.status === 'cancelled_by_customer' ||
      booking.status === 'cancelled_by_business'
    ) {
      return NextResponse.json(
        { error: 'Cannot confirm a cancelled appointment.' },
        { status: 400 }
      );
    }

    store.bookings[idx].status = 'confirmed';
    store.bookings[idx].updated_at = new Date().toISOString();

    store.booking_events.push({
      id: crypto.randomUUID(),
      booking_id: booking.id,
      event_type: 'confirmed',
      metadata: { confirmed_via: 'token_link' },
      created_at: new Date().toISOString(),
    });

    writeDevStore(store);

    return NextResponse.json({
      success: true,
      status: 'confirmed',
      message: 'Your attendance has been confirmed!',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
