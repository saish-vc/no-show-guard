// ============================================================================
// Database Types — mirrors the Supabase schema
// ============================================================================

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled_by_customer'
  | 'cancelled_by_business'
  | 'completed'
  | 'no_show';

export type BookingEventType =
  | 'created'
  | 'confirmed'
  | 'cancelled_by_customer'
  | 'cancelled_by_business'
  | 'completed'
  | 'marked_no_show'
  | 'reminder_24h_sent'
  | 'reminder_2h_sent'
  | 'rescheduled'
  | 'confirmation_email_sent'
  | 'cancellation_email_sent';

// ---- Row types ----

export interface Business {
  id: string;
  owner_user_id: string;
  name: string;
  business_type: string;
  timezone: string;
  booking_slug: string;
  cancellation_policy: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRule {
  id: string;
  business_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;  // "HH:mm:ss"
  end_time: string;    // "HH:mm:ss"
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  business_id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  starts_at_utc: string;
  ends_at_utc: string;
  status: BookingStatus;
  confirmation_token: string;
  reminder_24h_sent_at: string | null;
  reminder_2h_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingEvent {
  id: string;
  booking_id: string;
  event_type: BookingEventType;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---- Joined / computed types ----

export interface BookingWithService extends Booking {
  service: Service;
}

export interface BookingWithDetails extends Booking {
  service: Service;
  business: Business;
}

// ---- Time slot type ----

export interface TimeSlot {
  start: string; // ISO string
  end: string;   // ISO string
  available: boolean;
}

// ---- Analytics types ----

export interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  noShows: number;
  cancellationRate: number;
  estimatedRevenue: number;
}
