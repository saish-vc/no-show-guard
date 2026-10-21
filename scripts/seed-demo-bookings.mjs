#!/usr/bin/env node
/**
 * Seed script — generates:
 * - 1 Demo Business ("Apex Tutoring Academy")
 * - 3 Services (Calculus, SAT Math, College Application)
 * - Weekly Availability (Monday–Friday 09:00–17:00)
 * - 15 Bookings with mixed statuses (5 completed, 4 confirmed, 2 pending, 2 no-show, 1 cancelled customer, 1 cancelled business)
 * - Audit event history for all bookings
 *
 * Writes to .dev-store.json for local development & manual testing.
 * Usage: node scripts/seed-demo-bookings.mjs
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DEV_STORE_PATH = path.join(process.cwd(), '.dev-store.json');

// ---- Helpers ----
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}
function isoStr(d) {
  return new Date(d).toISOString();
}

// ---- Load existing store or initialize default ----
let store;
try {
  if (fs.existsSync(DEV_STORE_PATH)) {
    store = JSON.parse(fs.readFileSync(DEV_STORE_PATH, 'utf-8'));
  }
} catch {
  // will create below
}

if (!store) {
  store = {
    businesses: [],
    services: [],
    availability_rules: [],
    bookings: [],
    booking_events: [],
  };
}

// 1. Primary Demo Business
const demoBusinessId = store.businesses[0]?.id || '00000000-0000-0000-0000-000000000001';
const demoOwnerId = store.businesses[0]?.owner_user_id || '00000000-0000-0000-0000-000000000001';

const demoBusiness = {
  id: demoBusinessId,
  owner_user_id: demoOwnerId,
  name: 'Apex Tutoring Academy',
  business_type: 'tutoring',
  timezone: 'America/New_York',
  booking_slug: 'apex-tutoring',
  cancellation_policy: 'Free cancellation up to 24 hours before your session. Late cancellations or no-shows are subject to full session fee.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Update or set business in store
if (store.businesses.length === 0) {
  store.businesses.push(demoBusiness);
} else {
  store.businesses[0] = { ...store.businesses[0], ...demoBusiness };
}

// 2. Three Services for the demo business
const demoServices = [
  {
    id: '00000000-0000-0000-0000-000000000011',
    business_id: demoBusinessId,
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
    business_id: demoBusinessId,
    name: 'SAT Math Intensive Workshop',
    description: 'Comprehensive test strategy and targeted practice session covering algebra, geometry, and problem solving.',
    duration_minutes: 90,
    price: 50,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000013',
    business_id: demoBusinessId,
    name: 'College Application & Essay Strategy',
    description: 'One-on-one review and feedback for college admissions essays, personal statements, and application strategy.',
    duration_minutes: 45,
    price: 65,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Replace services for this demo business
store.services = [
  ...store.services.filter((s) => s.business_id !== demoBusinessId),
  ...demoServices,
];

// 3. Weekly Availability (Monday–Friday 09:00–17:00)
const demoAvailability = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  id: `00000000-0000-0000-0000-00000000002${dayOfWeek}`,
  business_id: demoBusinessId,
  day_of_week: dayOfWeek,
  start_time: '09:00:00',
  end_time: '17:00:00',
  is_active: true,
  created_at: new Date().toISOString(),
}));

store.availability_rules = [
  ...store.availability_rules.filter((r) => r.business_id !== demoBusinessId),
  ...demoAvailability,
];

// If there are other businesses (e.g. from browser onboarding test), ensure they also have services and rules
for (let i = 1; i < store.businesses.length; i++) {
  const biz = store.businesses[i];
  const bizServices = store.services.filter((s) => s.business_id === biz.id);
  if (bizServices.length === 0) {
    const s1 = { ...demoServices[0], id: randomUUID(), business_id: biz.id };
    const s2 = { ...demoServices[1], id: randomUUID(), business_id: biz.id };
    const s3 = { ...demoServices[2], id: randomUUID(), business_id: biz.id };
    store.services.push(s1, s2, s3);
  }
}

// 4. 15 Demo Bookings Pool
const customers = [
  { name: 'Alice Chen', email: 'alice.chen@example.com', phone: '555-0101' },
  { name: 'Brandon Smith', email: 'brandon.smith@example.com', phone: '555-0102' },
  { name: 'Carmen Diaz', email: 'carmen.diaz@example.com', phone: '555-0103' },
  { name: 'David Kim', email: 'david.kim@example.com', phone: '555-0104' },
  { name: 'Emily Watson', email: 'emily.watson@example.com', phone: '555-0105' },
  { name: 'Frank Patel', email: 'frank.patel@example.com', phone: '555-0106' },
  { name: 'Grace Lin', email: 'grace.lin@example.com', phone: '555-0107' },
  { name: 'Henry Brooks', email: 'henry.brooks@example.com', phone: null },
  { name: 'Iris Nguyen', email: 'iris.nguyen@example.com', phone: '555-0109' },
  { name: 'Jake Thompson', email: 'jake.thompson@example.com', phone: '555-0110' },
  { name: 'Karen Lee', email: 'karen.lee@example.com', phone: '555-0111' },
  { name: 'Liam Gonzalez', email: 'liam.gonzalez@example.com', phone: null },
  { name: 'Maya Johnson', email: 'maya.johnson@example.com', phone: '555-0113' },
  { name: 'Nathan Park', email: 'nathan.park@example.com', phone: '555-0114' },
  { name: 'Olivia Davis', email: 'olivia.davis@example.com', phone: '555-0115' },
];

const now = new Date();

// Exactly 15 booking definitions:
// - 5 Completed
// - 4 Confirmed
// - 2 Pending
// - 2 No-Show
// - 1 Cancelled by Customer
// - 1 Cancelled by Business
const bookingDefs = [
  // 5 Completed (past)
  { dayOffset: -12, hour: 10, status: 'completed', customerIdx: 0, serviceIdx: 0 },
  { dayOffset: -10, hour: 14, status: 'completed', customerIdx: 1, serviceIdx: 1 },
  { dayOffset: -7, hour: 11, status: 'completed', customerIdx: 2, serviceIdx: 2 },
  { dayOffset: -5, hour: 9, status: 'completed', customerIdx: 3, serviceIdx: 0 },
  { dayOffset: -2, hour: 15, status: 'completed', customerIdx: 4, serviceIdx: 1 },

  // 4 Confirmed (upcoming)
  { dayOffset: 1, hour: 10, status: 'confirmed', customerIdx: 5, serviceIdx: 0 },
  { dayOffset: 2, hour: 14, status: 'confirmed', customerIdx: 6, serviceIdx: 1 },
  { dayOffset: 3, hour: 11, status: 'confirmed', customerIdx: 7, serviceIdx: 2 },
  { dayOffset: 5, hour: 16, status: 'confirmed', customerIdx: 8, serviceIdx: 0 },

  // 2 Pending (upcoming)
  { dayOffset: 2, hour: 9, status: 'pending', customerIdx: 9, serviceIdx: 1 },
  { dayOffset: 4, hour: 13, status: 'pending', customerIdx: 10, serviceIdx: 2 },

  // 2 No-Show (past)
  { dayOffset: -8, hour: 13, status: 'no_show', customerIdx: 11, serviceIdx: 0 },
  { dayOffset: -3, hour: 16, status: 'no_show', customerIdx: 12, serviceIdx: 1 },

  // 1 Cancelled by Customer
  { dayOffset: -4, hour: 10, status: 'cancelled_by_customer', customerIdx: 13, serviceIdx: 2 },

  // 1 Cancelled by Business
  { dayOffset: -6, hour: 15, status: 'cancelled_by_business', customerIdx: 14, serviceIdx: 0 },
];

function generateBookingsForBusiness(targetBusinessId, targetServices) {
  const bookings = [];
  const events = [];

  for (const def of bookingDefs) {
    const customer = customers[def.customerIdx];
    const service = targetServices[def.serviceIdx % targetServices.length];

    const startDate = addDays(now, def.dayOffset);
    startDate.setHours(def.hour, 0, 0, 0);
    const endDate = addMinutes(startDate, service.duration_minutes);

    const bookingId = randomUUID();
    const confirmationToken = randomUUID();
    const createdAt = isoStr(addDays(startDate, -2));

    const booking = {
      id: bookingId,
      business_id: targetBusinessId,
      service_id: service.id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      starts_at_utc: isoStr(startDate),
      ends_at_utc: isoStr(endDate),
      status: def.status,
      confirmation_token: confirmationToken,
      reminder_24h_sent_at: def.status === 'completed' || def.status === 'no_show' ? isoStr(addHours(startDate, -24)) : null,
      reminder_2h_sent_at: def.status === 'completed' || def.status === 'no_show' ? isoStr(addHours(startDate, -2)) : null,
      created_at: createdAt,
      updated_at: def.status === 'pending' ? createdAt : isoStr(addDays(startDate, -1)),
    };

    bookings.push(booking);

    // Created event
    events.push({
      id: randomUUID(),
      booking_id: bookingId,
      event_type: 'created',
      metadata: { customer_email: customer.email, customer_name: customer.name, created_via: 'seed_script' },
      created_at: createdAt,
    });

    if (def.status === 'confirmed') {
      events.push({
        id: randomUUID(),
        booking_id: bookingId,
        event_type: 'confirmed',
        metadata: { confirmed_via: 'token_link' },
        created_at: isoStr(addDays(startDate, -1)),
      });
    } else if (def.status === 'completed') {
      events.push({
        id: randomUUID(),
        booking_id: bookingId,
        event_type: 'confirmed',
        metadata: { confirmed_via: 'token_link' },
        created_at: isoStr(addDays(startDate, -1)),
      });
      events.push({
        id: randomUUID(),
        booking_id: bookingId,
        event_type: 'completed',
        metadata: { marked_by: 'owner' },
        created_at: isoStr(addHours(startDate, 1)),
      });
    } else if (def.status === 'no_show') {
      events.push({
        id: randomUUID(),
        booking_id: bookingId,
        event_type: 'confirmed',
        metadata: { confirmed_via: 'token_link' },
        created_at: isoStr(addDays(startDate, -1)),
      });
      events.push({
        id: randomUUID(),
        booking_id: bookingId,
        event_type: 'marked_no_show',
        metadata: { marked_by: 'owner' },
        created_at: isoStr(addMinutes(startDate, service.duration_minutes + 30)),
      });
    } else if (def.status === 'cancelled_by_customer') {
      events.push({
        id: randomUUID(),
        booking_id: bookingId,
        event_type: 'cancelled_by_customer',
        metadata: { reason: 'Client schedule conflict' },
        created_at: isoStr(addDays(startDate, -1)),
      });
    } else if (def.status === 'cancelled_by_business') {
      events.push({
        id: randomUUID(),
        booking_id: bookingId,
        event_type: 'cancelled_by_business',
        metadata: { reason: 'Tutor emergency' },
        created_at: isoStr(addDays(startDate, -1)),
      });
    }

    if (def.status === 'completed' || def.status === 'no_show') {
      events.push({
        id: randomUUID(),
        booking_id: bookingId,
        event_type: 'reminder_24h_sent',
        metadata: { sent_to: customer.email },
        created_at: isoStr(addHours(startDate, -24)),
      });
      events.push({
        id: randomUUID(),
        booking_id: bookingId,
        event_type: 'reminder_2h_sent',
        metadata: { sent_to: customer.email },
        created_at: isoStr(addHours(startDate, -2)),
      });
    }
  }

  return { bookings, events };
}

// Generate for all businesses in store
let allBookings = [];
let allEvents = [];

for (const biz of store.businesses) {
  const bizServices = store.services.filter((s) => s.business_id === biz.id);
  const result = generateBookingsForBusiness(biz.id, bizServices.length > 0 ? bizServices : demoServices);
  allBookings = [...allBookings, ...result.bookings];
  allEvents = [...allEvents, ...result.events];
}

store.bookings = allBookings;
store.booking_events = allEvents;

fs.writeFileSync(DEV_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');

console.log('\n========================================================');
console.log('✅ Demo Seed Script Completed Successfully');
console.log('========================================================');
console.log(`🏢 Demo Business:      ${demoBusiness.name} (/${demoBusiness.booking_slug})`);
console.log(`🛎️ Services Seeded:    ${demoServices.length} services`);
demoServices.forEach((s) => console.log(`   - ${s.name} (${s.duration_minutes}m, $${s.price})`));
console.log(`⏰ Weekly Hours:       Monday–Friday 09:00 to 17:00 (${demoAvailability.length} rules)`);
console.log(`📅 Bookings Seeded:    ${bookingDefs.length} demo appointments`);
console.log('   - 5 Completed');
console.log('   - 4 Confirmed');
console.log('   - 2 Pending');
console.log('   - 2 No-Show');
console.log('   - 1 Cancelled by Customer');
console.log('   - 1 Cancelled by Business');
console.log(`📝 Audit Events:       ${allEvents.length} events logged`);
console.log('========================================================\n');
