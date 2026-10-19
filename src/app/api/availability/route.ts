import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/auth';
import { syncFromCookies } from '@/lib/dev-store';
import { generateAvailableSlots } from '@/lib/slots';
import type { Business, Service, AvailabilityRule, Booking } from '@/types';

// ============================================================================
// GET /api/availability
// Computes and returns available booking slots for a service on a given date.
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const businessIdParam = searchParams.get('business_id');
    const serviceId = searchParams.get('service_id');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { error: 'Valid date parameter (YYYY-MM-DD) is required.' },
        { status: 400 }
      );
    }

    if (!serviceId) {
      return NextResponse.json(
        { error: 'service_id parameter is required.' },
        { status: 400 }
      );
    }

    if (!slug && !businessIdParam) {
      return NextResponse.json(
        { error: 'Either slug or business_id parameter is required.' },
        { status: 400 }
      );
    }

    let business: Business | null = null;
    let service: Service | null = null;
    let rules: AvailabilityRule[] = [];
    let bookings: Booking[] = [];

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();

      // 1. Fetch business
      const bizQuery = supabase.from('businesses').select('*');
      if (slug) {
        bizQuery.eq('booking_slug', slug);
      } else {
        bizQuery.eq('id', businessIdParam);
      }
      const { data: bizData, error: bizError } = await bizQuery.maybeSingle();
      if (bizError || !bizData) {
        return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
      }
      business = bizData as Business;

      // 2. Fetch service
      const { data: srvData, error: srvError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('business_id', business.id)
        .eq('is_active', true)
        .maybeSingle();

      if (srvError || !srvData) {
        return NextResponse.json(
          { error: 'Service not found or is currently inactive.' },
          { status: 404 }
        );
      }
      service = srvData as Service;

      // 3. Fetch availability rules
      const { data: rulesData } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('business_id', business.id)
        .eq('is_active', true);
      rules = (rulesData || []) as AvailabilityRule[];

      // 4. Fetch existing active bookings for this service around this date
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('service_id', service.id)
        .not('status', 'in', '("cancelled_by_customer","cancelled_by_business")');
      bookings = (bookingsData || []) as Booking[];
    } else {
      // Dev mode fallback
      const store = await syncFromCookies();

      if (slug) {
        business = store.businesses.find((b) => b.booking_slug === slug) || null;
      } else {
        business = store.businesses.find((b) => b.id === businessIdParam) || null;
      }

      if (!business) {
        // Fall back to first business in store if slug matches default
        business = store.businesses[0] || null;
      }

      if (!business) {
        return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
      }

      service =
        store.services.find(
          (s) => s.id === serviceId && s.business_id === business?.id && s.is_active
        ) || null;

      if (!service) {
        return NextResponse.json(
          { error: 'Service not found or is currently inactive.' },
          { status: 404 }
        );
      }

      rules = store.availability_rules.filter(
        (r) => r.business_id === business?.id && r.is_active
      );

      bookings = store.bookings.filter(
        (b) =>
          b.service_id === service?.id &&
          b.status !== 'cancelled_by_customer' &&
          b.status !== 'cancelled_by_business'
      );
    }

    const slots = generateAvailableSlots({
      dateStr,
      service,
      availabilityRules: rules,
      existingBookings: bookings,
      timeZone: business.timezone,
    });

    return NextResponse.json({
      success: true,
      date: dateStr,
      timezone: business.timezone,
      slots,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in GET /api/availability:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
