import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/auth';
import { syncFromCookies } from '@/lib/dev-store';
import type { Business, Service, AvailabilityRule, Booking } from '@/types';

// ============================================================================
// Public Booking Data Helpers
// Fetches public business, services, rules, and booking confirmation data.
// ============================================================================

export interface PublicBusinessData {
  business: Business | null;
  services: Service[];
  availabilityRules: AvailabilityRule[];
}

export async function getPublicBusinessData(slug: string): Promise<PublicBusinessData> {
  if (isSupabaseConfigured()) {
    const supabase = createAdminClient();

    // 1. Fetch business by slug
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('booking_slug', slug)
      .maybeSingle();

    if (bizError || !business) {
      return { business: null, services: [], availabilityRules: [] };
    }

    // 2. Fetch active services
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('price', { ascending: true });

    // 3. Fetch active availability rules
    const { data: rules } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true });

    return {
      business: business as Business,
      services: (services || []) as Service[],
      availabilityRules: (rules || []) as AvailabilityRule[],
    };
  }

  // Dev fallback
  const store = await syncFromCookies();
  let business = store.businesses.find((b) => b.booking_slug === slug) || null;

  // Fallback to first business if slug matches or in local dev
  if (!business && store.businesses.length > 0) {
    business = store.businesses[0];
  }

  if (!business) {
    return { business: null, services: [], availabilityRules: [] };
  }

  const services = store.services.filter(
    (s) => s.business_id === business?.id && s.is_active
  );
  const availabilityRules = store.availability_rules.filter(
    (r) => r.business_id === business?.id && r.is_active
  );

  return { business, services, availabilityRules };
}

export interface PublicBookingConfirmation {
  booking: Booking | null;
  service: Service | null;
  business: Business | null;
}

export async function getPublicBookingConfirmation(token: string): Promise<PublicBookingConfirmation> {
  if (isSupabaseConfigured()) {
    const supabase = createAdminClient();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('confirmation_token', token)
      .maybeSingle();

    if (error || !booking) {
      return { booking: null, service: null, business: null };
    }

    const { data: service } = await supabase
      .from('services')
      .select('*')
      .eq('id', booking.service_id)
      .maybeSingle();

    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', booking.business_id)
      .maybeSingle();

    return {
      booking: booking as Booking,
      service: (service || null) as Service | null,
      business: (business || null) as Business | null,
    };
  }

  // Dev fallback
  const store = await syncFromCookies();
  const booking = store.bookings.find((b) => b.confirmation_token === token) || null;

  if (!booking) {
    return { booking: null, service: null, business: null };
  }

  const service = store.services.find((s) => s.id === booking.service_id) || null;
  const business = store.businesses.find((b) => b.id === booking.business_id) || null;

  return { booking, service, business };
}
