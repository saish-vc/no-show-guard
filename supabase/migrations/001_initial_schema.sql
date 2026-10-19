-- ============================================================================
-- NoShowGuard — Initial Database Schema
-- ============================================================================
-- Run this in the Supabase SQL Editor (or via supabase db push).
-- Requires the btree_gist extension for the EXCLUDE constraint.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- ENUM: booking_status
-- ============================================================================
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'cancelled_by_customer',
  'cancelled_by_business',
  'completed',
  'no_show'
);

-- ============================================================================
-- ENUM: booking_event_type
-- ============================================================================
CREATE TYPE booking_event_type AS ENUM (
  'created',
  'confirmed',
  'cancelled_by_customer',
  'cancelled_by_business',
  'completed',
  'marked_no_show',
  'reminder_24h_sent',
  'reminder_2h_sent',
  'rescheduled',
  'confirmation_email_sent',
  'cancellation_email_sent'
);

-- ============================================================================
-- TABLE: businesses
-- ============================================================================
CREATE TABLE businesses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  business_type     TEXT NOT NULL DEFAULT 'general',
  timezone          TEXT NOT NULL DEFAULT 'America/New_York',
  booking_slug      TEXT NOT NULL UNIQUE,
  cancellation_policy TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT businesses_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  CONSTRAINT businesses_slug_format CHECK (booking_slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$')
);

-- Each user can own exactly one business (MVP)
CREATE UNIQUE INDEX idx_businesses_owner ON businesses(owner_user_id);
-- Fast lookup by booking slug
CREATE UNIQUE INDEX idx_businesses_slug ON businesses(booking_slug);

-- ============================================================================
-- TABLE: services
-- ============================================================================
CREATE TABLE services (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  duration_minutes  INTEGER NOT NULL DEFAULT 60,
  price             NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT services_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  CONSTRAINT services_duration_positive CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  CONSTRAINT services_price_non_negative CHECK (price >= 0)
);

CREATE INDEX idx_services_business ON services(business_id);

-- ============================================================================
-- TABLE: availability_rules
-- ============================================================================
CREATE TABLE availability_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, ... 6 = Saturday
  start_time    TIME NOT NULL,    -- e.g. '09:00'
  end_time      TIME NOT NULL,    -- e.g. '17:00'
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT availability_day_range CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT availability_time_order CHECK (start_time < end_time)
);

CREATE INDEX idx_availability_business ON availability_rules(business_id);
-- Prevent duplicate rules for the same business and day
CREATE UNIQUE INDEX idx_availability_unique_day ON availability_rules(business_id, day_of_week) WHERE is_active = true;

-- ============================================================================
-- TABLE: bookings
-- ============================================================================
CREATE TABLE bookings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id          UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id           UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  customer_name        TEXT NOT NULL,
  customer_email       TEXT NOT NULL,
  customer_phone       TEXT,
  starts_at_utc        TIMESTAMPTZ NOT NULL,
  ends_at_utc          TIMESTAMPTZ NOT NULL,
  status               booking_status NOT NULL DEFAULT 'pending',
  confirmation_token   UUID NOT NULL DEFAULT gen_random_uuid(),
  reminder_24h_sent_at TIMESTAMPTZ,
  reminder_2h_sent_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT bookings_time_order CHECK (starts_at_utc < ends_at_utc),
  CONSTRAINT bookings_name_length CHECK (char_length(customer_name) >= 2),
  CONSTRAINT bookings_email_format CHECK (customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Unique confirmation token for secure email links
CREATE UNIQUE INDEX idx_bookings_token ON bookings(confirmation_token);
-- Fast lookups
CREATE INDEX idx_bookings_business ON bookings(business_id);
CREATE INDEX idx_bookings_service ON bookings(service_id);
CREATE INDEX idx_bookings_status ON bookings(business_id, status);
CREATE INDEX idx_bookings_starts_at ON bookings(starts_at_utc);
-- Index for the reminder cron job
CREATE INDEX idx_bookings_reminders ON bookings(starts_at_utc, status)
  WHERE status IN ('pending', 'confirmed');

-- ============================================================================
-- UNIQUE CONSTRAINT & EXCLUDE: Prevent double-booking
-- ============================================================================
-- 1. Unique constraint preventing duplicate active bookings for the same business, service, and exact start time:
CREATE UNIQUE INDEX idx_bookings_unique_active_slot ON bookings (business_id, service_id, starts_at_utc)
  WHERE (status NOT IN ('cancelled_by_customer', 'cancelled_by_business'));

-- 2. Range exclusion constraint preventing any overlapping bookings for the same service when status is active:
ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    service_id WITH =,
    tstzrange(starts_at_utc, ends_at_utc) WITH &&
  )
  WHERE (status NOT IN ('cancelled_by_customer', 'cancelled_by_business'));

-- ============================================================================
-- TABLE: booking_events (audit log)
-- ============================================================================
CREATE TABLE booking_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type  booking_event_type NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_events_booking ON booking_events(booking_id);
CREATE INDEX idx_booking_events_type ON booking_events(event_type);

-- ============================================================================
-- FUNCTION: Auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Auto-create booking event on status change
-- ============================================================================
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO booking_events (booking_id, event_type, metadata)
    VALUES (
      NEW.id,
      CASE NEW.status
        WHEN 'confirmed' THEN 'confirmed'::booking_event_type
        WHEN 'cancelled_by_customer' THEN 'cancelled_by_customer'::booking_event_type
        WHEN 'cancelled_by_business' THEN 'cancelled_by_business'::booking_event_type
        WHEN 'completed' THEN 'completed'::booking_event_type
        WHEN 'no_show' THEN 'marked_no_show'::booking_event_type
        ELSE 'created'::booking_event_type
      END,
      jsonb_build_object(
        'previous_status', OLD.status::text,
        'new_status', NEW.status::text
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_status_change
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- ---- businesses ----
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own business"
  ON businesses FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can insert own business"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update own business"
  ON businesses FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Public read by slug (for booking pages — uses service role, not RLS)
-- No delete policy (MVP: businesses cannot be deleted)

-- ---- services ----
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own services"
  ON services FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  );

-- ---- availability_rules ----
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own availability"
  ON availability_rules FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  );

-- ---- bookings ----
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own bookings"
  ON bookings FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update own bookings"
  ON bookings FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_user_id = auth.uid()
    )
  );

-- Public booking creation uses service-role client (bypasses RLS)
-- Customer actions (confirm/cancel) use service-role + token validation

-- ---- booking_events ----
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own booking events"
  ON booking_events FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN businesses biz ON b.business_id = biz.id
      WHERE biz.owner_user_id = auth.uid()
    )
  );

-- Insert via service-role or trigger only
