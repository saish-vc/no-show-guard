import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, isSupabaseConfigured } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncFromCookies, writeDevStore } from '@/lib/dev-store';
import { sendCancellationEmail } from '@/lib/email';
import type { BookingStatus, BookingEventType, Booking, Service, Business } from '@/types';

// ============================================================================
// GET /api/owner/bookings/[id]
// Returns a single booking with service, business, and event history.
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, business } = await getAuthSession();

    if (!user || !business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();

      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*, services(*)')
        .eq('id', id)
        .eq('business_id', business.id)
        .maybeSingle();

      if (error || !booking) {
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
      }

      const { data: events } = await supabase
        .from('booking_events')
        .select('*')
        .eq('booking_id', id)
        .order('created_at', { ascending: true });

      return NextResponse.json({
        booking: { ...booking, service: booking.services, services: undefined },
        events: events || [],
        business,
      });
    }

    // Dev mode fallback
    const store = await syncFromCookies();
    const booking = store.bookings.find(
      (b) => b.id === id && b.business_id === business.id
    );

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    const service = store.services.find((s) => s.id === booking.service_id);
    const events = store.booking_events
      .filter((e) => e.booking_id === id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return NextResponse.json({
      booking: { ...booking, service: service || null },
      events,
      business,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ============================================================================
// POST /api/owner/bookings/[id]
// Owner actions: mark completed, mark no-show, cancel by business.
// ============================================================================

const VALID_ACTIONS: Record<string, { status: BookingStatus; eventType: BookingEventType; allowedFrom: BookingStatus[] }> = {
  complete: {
    status: 'completed',
    eventType: 'completed',
    allowedFrom: ['confirmed'],
  },
  no_show: {
    status: 'no_show',
    eventType: 'marked_no_show',
    allowedFrom: ['confirmed', 'pending'],
  },
  cancel: {
    status: 'cancelled_by_business',
    eventType: 'cancelled_by_business',
    allowedFrom: ['pending', 'confirmed'],
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, business } = await getAuthSession();

    if (!user || !business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { action: string; reason?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const actionConfig = VALID_ACTIONS[body.action];
    if (!actionConfig) {
      return NextResponse.json(
        { error: `Invalid action. Use: ${Object.keys(VALID_ACTIONS).join(', ')}` },
        { status: 400 }
      );
    }

    let booking: Booking | null = null;
    let service: Service | null = null;

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();

      const { data: bData, error: bError } = await supabase
        .from('bookings')
        .select('*, services(*)')
        .eq('id', id)
        .eq('business_id', business.id)
        .maybeSingle();

      if (bError || !bData) {
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
      }

      booking = bData as Booking;
      service = bData.services as Service;

      if (!actionConfig.allowedFrom.includes(booking.status)) {
        return NextResponse.json(
          { error: `Cannot ${body.action} a booking with status "${booking.status}".` },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: actionConfig.status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      await supabase.from('booking_events').insert({
        booking_id: id,
        event_type: actionConfig.eventType,
        metadata: {
          marked_by: 'owner',
          owner_email: user.email,
          reason: body.reason || null,
        },
      });
    } else {
      // Dev mode fallback
      const store = await syncFromCookies();
      const idx = store.bookings.findIndex(
        (b) => b.id === id && b.business_id === business.id
      );

      if (idx === -1) {
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
      }

      booking = store.bookings[idx];
      service = store.services.find((s) => s.id === booking?.service_id) || null;

      if (!actionConfig.allowedFrom.includes(booking.status)) {
        return NextResponse.json(
          { error: `Cannot ${body.action} a booking with status "${booking.status}".` },
          { status: 400 }
        );
      }

      store.bookings[idx].status = actionConfig.status;
      store.bookings[idx].updated_at = new Date().toISOString();

      store.booking_events.push({
        id: crypto.randomUUID(),
        booking_id: id,
        event_type: actionConfig.eventType,
        metadata: {
          marked_by: 'owner',
          owner_email: user.email,
          reason: body.reason || null,
        },
        created_at: new Date().toISOString(),
      });

      writeDevStore(store);
    }

    // Send cancellation email if the action is cancel
    if (body.action === 'cancel' && booking && service) {
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
      status: actionConfig.status,
      message: `Booking marked as ${actionConfig.status.replace(/_/g, ' ')}.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
