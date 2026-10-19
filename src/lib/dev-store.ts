import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import type { Business, Service, AvailabilityRule, Booking, BookingEvent } from '@/types';

// ============================================================================
// Local Dev Store — File & Cookie Sync
// Provides a unified local mock database when Supabase is not configured.
// ============================================================================

const DEV_STORE_PATH = path.join(process.cwd(), '.dev-store.json');

export interface DevStoreData {
  businesses: Business[];
  services: Service[];
  availability_rules: AvailabilityRule[];
  bookings: Booking[];
  booking_events: BookingEvent[];
}

const DEFAULT_STORE: DevStoreData = {
  businesses: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      owner_user_id: '00000000-0000-0000-0000-000000000001',
      name: 'Apex Tutoring Academy',
      business_type: 'tutoring',
      timezone: 'America/New_York',
      booking_slug: 'apex-tutoring',
      cancellation_policy: 'Free cancellation up to 24 hours before your session. No-shows or late cancellations within 2 hours are subject to a fee.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  services: [
    {
      id: '00000000-0000-0000-0000-000000000011',
      business_id: '00000000-0000-0000-0000-000000000001',
      name: '1-on-1 Calculus Tutoring',
      description: 'Personalized high school and college calculus tutoring focusing on derivatives, integrals, and exam prep.',
      duration_minutes: 60,
      price: 75,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      business_id: '00000000-0000-0000-0000-000000000001',
      name: 'SAT Math Intensive Workshop',
      description: 'Comprehensive test strategy and targeted practice session covering algebra, geometry, and problem solving.',
      duration_minutes: 90,
      price: 50,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  availability_rules: [
    { id: '00000000-0000-0000-0000-000000000021', business_id: '00000000-0000-0000-0000-000000000001', day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: '00000000-0000-0000-0000-000000000022', business_id: '00000000-0000-0000-0000-000000000001', day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: '00000000-0000-0000-0000-000000000023', business_id: '00000000-0000-0000-0000-000000000001', day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: '00000000-0000-0000-0000-000000000024', business_id: '00000000-0000-0000-0000-000000000001', day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: '00000000-0000-0000-0000-000000000025', business_id: '00000000-0000-0000-0000-000000000001', day_of_week: 5, start_time: '09:00:00', end_time: '17:00:00', is_active: true, created_at: new Date().toISOString() },
  ],
  bookings: [],
  booking_events: [],
};

export function readDevStore(): DevStoreData {
  try {
    if (fs.existsSync(DEV_STORE_PATH)) {
      const content = fs.readFileSync(DEV_STORE_PATH, 'utf-8');
      const data = JSON.parse(content) as DevStoreData;
      return {
        businesses: data.businesses || [],
        services: data.services || [],
        availability_rules: data.availability_rules || [],
        bookings: data.bookings || [],
        booking_events: data.booking_events || [],
      };
    }
  } catch (err) {
    console.warn('Failed to read dev store file:', err);
  }

  // Initialize with default
  writeDevStore(DEFAULT_STORE);
  return DEFAULT_STORE;
}

export function writeDevStore(data: DevStoreData): void {
  try {
    fs.writeFileSync(DEV_STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write dev store file:', err);
  }
}

/**
 * Sync from browser cookies into dev store if available
 */
export async function syncFromCookies(): Promise<DevStoreData> {
  const store = readDevStore();
  try {
    const cookieStore = await cookies();

    // Sync business from cookie
    const bizCookie = cookieStore.get('nsg_dev_business')?.value;
    if (bizCookie) {
      try {
        const biz = JSON.parse(bizCookie) as Business;
        const idx = store.businesses.findIndex((b) => b.id === biz.id || b.booking_slug === biz.booking_slug);
        if (idx >= 0) {
          store.businesses[idx] = { ...store.businesses[idx], ...biz };
        } else {
          store.businesses.push(biz);
        }
      } catch {}
    }

    // Sync services from cookie
    const servicesCookie = cookieStore.get('nsg_dev_services')?.value;
    if (servicesCookie) {
      try {
        const parsed = JSON.parse(servicesCookie) as Service[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const s of parsed) {
            const idx = store.services.findIndex((item) => item.id === s.id);
            if (idx >= 0) {
              store.services[idx] = s;
            } else {
              store.services.push(s);
            }
          }
        }
      } catch {}
    }

    // Sync availability from cookie
    const availCookie = cookieStore.get('nsg_dev_availability')?.value;
    if (availCookie) {
      try {
        const parsed = JSON.parse(availCookie) as AvailabilityRule[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Replace matching business availability
          const bizId = parsed[0].business_id;
          store.availability_rules = [
            ...store.availability_rules.filter((r) => r.business_id !== bizId),
            ...parsed,
          ];
        }
      } catch {}
    }

    writeDevStore(store);
  } catch {
    // cookies() may throw outside Next.js request context
  }

  return store;
}
