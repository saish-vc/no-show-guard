import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/auth';
import { syncFromCookies, writeDevStore } from '@/lib/dev-store';
import { sendCancellationEmail } from '@/lib/email';
import type { Booking, Business, Service } from '@/types';

// ============================================================================
// POST /api/bookings/[token]/cancel
// Customer cancels appointment via secure token.
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason || '';
    } catch {}

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
    }

    let booking: Booking | null = null;
    let business: Business | null = null;
    let service: Service | null = null;

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();

      const { data: bData, error: bError } = await supabase
        .from('bookings')
        .select('*')
        .eq('confirmation_token', token)
        .maybeSingle();

      if (bError || !bData) {
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
      }
      booking = bData as Booking;

      const { data: bizData } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', booking.business_id)
        .maybeSingle();
      business = bizData as Business;

      const { data: srvData } = await supabase
        .from('services')
        .select('*')
        .eq('id', booking.service_id)
        .maybeSingle();
      service = srvData as Service;

      // Update booking to cancelled_by_customer
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled_by_customer',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      await supabase.from('booking_events').insert({
        booking_id: booking.id,
        event_type: 'cancelled_by_customer',
        metadata: { reason: reason || 'Customer requested cancellation via token link' },
      });
    } else {
      // Dev mode fallback
      const store = await syncFromCookies();
      const idx = store.bookings.findIndex((b) => b.confirmation_token === token);

      if (idx === -1) {
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
      }

      booking = store.bookings[idx];
      business = store.businesses.find((b) => b.id === booking?.business_id) || null;
      service = store.services.find((s) => s.id === booking?.service_id) || null;

      store.bookings[idx].status = 'cancelled_by_customer';
      store.bookings[idx].updated_at = new Date().toISOString();

      store.booking_events.push({
        id: crypto.randomUUID(),
        booking_id: booking.id,
        event_type: 'cancelled_by_customer',
        metadata: { reason: reason || 'Customer requested cancellation via token link' },
        created_at: new Date().toISOString(),
      });

      writeDevStore(store);
    }

    // Send cancellation confirmation email
    if (booking && business && service) {
      try {
        await sendCancellationEmail({
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
        });
      } catch (err) {
        console.warn('Failed to send cancellation email:', err);
      }
    }

    return NextResponse.json({
      success: true,
      status: 'cancelled_by_customer',
      message: 'Your appointment has been cancelled and the slot has been released.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
