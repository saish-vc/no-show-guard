# NoShowGuard

> Automated appointment booking, reminder delivery, and no-show prevention system built for service businesses.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)
![Resend](https://img.shields.io/badge/Resend-Email-black?logo=resend)

---

## 1. Product Overview

Client no-shows cost service businesses—tutors, therapists, fitness instructors, consultants, and beauty professionals—thousands of dollars in lost billable hours every month. 

**NoShowGuard** solves this by combining:
1. **Frictionless Public Booking**: Clients book appointments in seconds without needing an account.
2. **Automated Reminders**: Timely transactional emails sent at 24 hours and 2 hours prior to appointment time.
3. **One-Click Tokenized Confirmations**: Clients can confirm attendance, cancel according to business policy, or request a reschedule directly from secure email links without passwords.
4. **Owner Analytics & Booking Management**: A business control center showing upcoming sessions, historical audit logs, no-show rates, cancellation rates, and estimated revenue.

---

## 2. Key Features

- **Business Onboarding & Auth**: Multi-tenant business profiles with unique booking slugs, timezones, and customizable cancellation policies.
- **Service Catalog**: Customizable services with active/inactive toggles, durations, and pricing.
- **Weekly Availability Engine**: Time window scheduling for each day of the week with overlapping slot validation.
- **Dynamic Slot Generation**: Generates 30-day future availability slots converted to client local timezone, strictly excluding already booked intervals.
- **Double-Booking Prevention**: Database-level check with PostgreSQL exclusion constraints preventing concurrent race-condition bookings.
- **Tokenized Customer Portal**: Secure UUID tokens (`/booking/[token]`) enabling clients to manage their appointments securely without exposing internal booking IDs.
- **Automated Reminder Cron**: Protected cron endpoint (`/api/cron/reminders`) executing every 15 minutes to evaluate upcoming bookings and dispatch 24-hour and 2-hour reminders.
- **Owner Dashboard & Management**:
  - Live KPIs: Total Bookings This Month, Upcoming Bookings, Confirmed Bookings, Completed Sessions, No-Shows, Cancellation Rate, and Estimated Revenue.
  - Multi-tab status filtering (`All`, `Today`, `Upcoming`, `Past`, `Confirmed`, `Pending`, `Completed`, `No-Show`, `Cancelled`).
  - Search by client name and email.
  - Complete vertical audit timeline logging every status transition.
- **Resilient Dev Store Mode**: Seamless local offline development mode without external database dependencies when Supabase credentials are not configured.
- **Abuse Protection**: Client IP rate limiting protecting public booking endpoints against automated spam.

---

## 3. Architecture Diagram

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT BROWSERS                                    |
|                                                                                       |
|   [ Public Client Booking ]      [ Email Token Portal ]      [ Owner Dashboard UI ]   |
|      /book/[bookingSlug]           /booking/[token]             /dashboard, /bookings |
+------------------+--------------------------+---------------------------+-------------+
                   |                          |                           |
                   v                          v                           v
+---------------------------------------------------------------------------------------+
|                                NEXT.JS APPLICATION LAYER                              |
|                                                                                       |
|  - Middleware (Route Protection & Session Check)                                      |
|  - Rate Limiter (IP sliding-window abuse protection)                                  |
|  - Public APIs: /api/availability, /api/bookings, /api/bookings/[token]/*             |
|  - Owner APIs: /api/owner/stats, /api/owner/bookings, /api/owner/bookings/[id]        |
|  - Automated Cron Handler: /api/cron/reminders (Protected by CRON_SECRET)             |
+---------------------+---------------------------------------------------+-------------+
                      |                                                   |
                      v                                                   v
+------------------------------------+             +------------------------------------+
|          DATABASE LAYER            |             |           EMAIL DELIVERY           |
|                                    |             |                                    |
|   Supabase PostgreSQL              |             |   Resend API                       |
|   - Row Level Security (RLS)       |             |   - Booking Confirmation           |
|   - Exclusion / Overlap Constraint |             |   - 24-Hour Reminder               |
|   - Audit Event Timeline           |             |   - 2-Hour Urgent Reminder         |
|   - Offline Dev Store Fallback     |             |   - Cancellation Notice            |
+------------------------------------+             +------------------------------------+
                      ^
                      | Every 15 minutes
+---------------------+----------------------+
|            VERCEL CRON RUNNER              |
|   Schedule: */15 * * * *                   |
|   Header: Authorization: Bearer <SECRET>   |
+--------------------------------------------+
```

---

## 4. Database Schema

### Entity Relationship Model

```
businesses (1) ───────< services (N)
    │                       │
    ├───< availability_rules (N)
    │                       │
    └───< bookings (N) ─────┘
              │
              └───< booking_events (N)
```

### Table Definitions

| Table | Purpose | Key Columns |
|---|---|---|
| `businesses` | Business account details | `id`, `owner_user_id`, `name`, `business_type`, `timezone`, `booking_slug`, `cancellation_policy` |
| `services` | Offerings and prices | `id`, `business_id`, `name`, `description`, `duration_minutes`, `price`, `is_active` |
| `availability_rules` | Weekly business hours | `id`, `business_id`, `day_of_week` (0-6), `start_time`, `end_time`, `is_active` |
| `bookings` | Customer appointments | `id`, `business_id`, `service_id`, `customer_name`, `customer_email`, `customer_phone`, `starts_at_utc`, `ends_at_utc`, `status`, `confirmation_token`, `reminder_24h_sent_at`, `reminder_2h_sent_at` |
| `booking_events` | Append-only audit log | `id`, `booking_id`, `event_type`, `metadata` (JSONB), `created_at` |

### Booking Lifecycle Statuses

- `pending`: Appointment booked; awaiting client confirmation or reminder cycle.
- `confirmed`: Client confirmed attendance via token link or email action.
- `completed`: Owner marked appointment as successfully fulfilled.
- `no_show`: Client failed to attend the scheduled appointment.
- `cancelled_by_customer`: Client cancelled appointment through their portal link.
- `cancelled_by_business`: Business owner cancelled the appointment.

---

## 5. Environment Variables

Create `.env.local` for local development. For production, enter these into your Vercel Project Settings:

| Environment Variable | Description | Example / Required Format |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project API URL | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client anon key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service role key (bypasses RLS for cron/public inserts) | `eyJhbGciOi...` |
| `RESEND_API_KEY` | API key from Resend dashboard | `re_123456789...` |
| `RESEND_FROM_EMAIL` | Sender email address (verified domain or onboarding address) | `NoShowGuard <onboarding@resend.dev>` or `noreply@yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | Application root URL for link generation | Local: `http://localhost:3000`<br>Production: `https://your-domain.vercel.app` |
| `CRON_SECRET` | Secret bearer token protecting the reminder cron endpoint | Generate via `openssl rand -hex 32` |

---

## 6. Local Setup Instructions

### 1. Prerequisites
- **Node.js**: Version 18.18 or higher (Node 20+ recommended).
- **npm** or **pnpm**.

### 2. Installation
```bash
git clone <repository-url>
cd noshow-guard
npm install
```

### 3. Initialize Demo Seed Data
The application features a built-in dev store allowing local testing without needing a live Supabase instance:
```bash
npm run seed
```
This populates:
- **1 Demo Business**: `Apex Tutoring Academy` (`/apex-tutoring`)
- **3 Services**: 1-on-1 Calculus ($75), SAT Math Workshop ($50), College Application Strategy ($65)
- **Weekly Availability**: Monday to Friday, 9:00 AM - 5:00 PM
- **15 Realistic Bookings**: Distributed across Completed, Confirmed, Pending, No-Show, and Cancelled statuses with full audit logs.

### 4. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Supabase Setup Instructions

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and create a new project.
2. **Execute Database Migrations**:
   - In your Supabase Dashboard, navigate to the **SQL Editor**.
   - Copy the contents of `supabase/migrations/001_initial_schema.sql` and run it.
   - This creates all tables, Row Level Security policies, foreign keys, and indexes.
3. **Retrieve Credentials**:
   - Go to **Project Settings** → **API**.
   - Copy **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy **anon / public key** into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Copy **service_role key** (secret) into `SUPABASE_SERVICE_ROLE_KEY`.

---

## 8. Resend Email Setup Instructions

1. **Sign Up for Resend**:
   - Create an account at [resend.com](https://resend.com).
2. **Generate API Key**:
   - Navigate to **API Keys** → **Create API Key**.
   - Copy the key into `RESEND_API_KEY`.
3. **Configure Sender**:
   - For initial testing, set `RESEND_FROM_EMAIL="NoShowGuard <onboarding@resend.dev>"`. Note that Resend's onboarding address will deliver exclusively to your account registration email.
   - For production, add and verify your custom domain in the Resend Domains tab, then set `RESEND_FROM_EMAIL="NoShowGuard <appointments@yourdomain.com>"`.

---

## 9. Vercel Deployment Instructions

1. **Push to GitHub / GitLab**:
   Ensure your latest code is pushed to your remote repository.
2. **Import Project to Vercel**:
   - Log into [vercel.com](https://vercel.com) and select **Add New Project**.
   - Select your repository and configure Next.js default build settings (`npm run build`).
3. **Configure Environment Variables**:
   In Vercel project configuration, add all environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel deployment URL, e.g. `https://noshow-guard.vercel.app`)
   - `CRON_SECRET`
4. **Deploy**:
   Click **Deploy**. Vercel will build and launch your application.

---

## 10. Cron Job Setup & Recommendation

### Vercel Cron Configuration (`vercel.json`)
The repository includes a pre-configured `vercel.json` file:
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Recommendation
- **Schedule**: Run every **15 minutes** (`*/15 * * * *`).
- **Rationale**: Appointments are typically scheduled on the hour or half-hour. A 15-minute polling window ensures that:
  - 24-hour reminders are triggered within a 15-minute margin of the 24-hour cutoff.
  - 2-hour final reminders arrive before the client departs for their appointment.
  - Rate limits and database load remain minimal.
- **Manual Trigger for Testing**:
  ```bash
  curl -X POST http://localhost:3000/api/cron/reminders \
    -H "Authorization: Bearer <YOUR_CRON_SECRET>"
  ```

---

## 11. Manual Testing Checklist

Follow this checklist to verify all system components:

- [ ] **1. Authentication & Onboarding**
  - Sign up a new business owner at `/signup`.
  - Complete the onboarding form: Business Name, Category, Timezone, Booking Slug, Cancellation Policy.
  - Verify redirection to `/dashboard`.
  - Log out and log back in at `/login`.
- [ ] **2. Services & Availability**
  - Create a new service under `/services`.
  - Toggle a service active/inactive; verify UI badge updates.
  - Go to `/availability`; configure hours (e.g. 09:00–17:00).
  - Verify client validation prevents end time before start time.
- [ ] **3. Public Customer Booking**
  - Navigate to `/book/[bookingSlug]`.
  - Select service, date, and available time slot.
  - Submit client details (Name, Email, Phone).
  - Verify confirmation screen displays formatted date, business name, and cancellation policy.
- [ ] **4. Double-Booking Prevention**
  - Open a second browser tab and attempt to book the exact same slot.
  - Verify the application returns a `409 Conflict` error and prevents duplicate booking.
- [ ] **5. Client Token Management**
  - Visit `/booking/[confirmationToken]`.
  - Click **Confirm Appointment**; verify status changes to `confirmed`.
  - Test **Request Reschedule**; verify notes prompt and status submission.
  - Test **Cancel Appointment**; verify cancellation policy warning and status update.
- [ ] **6. Reminder Cron Endpoint**
  - Call `POST /api/cron/reminders` with `Authorization: Bearer <CRON_SECRET>`.
  - Verify JSON summary reports evaluated bookings and emails sent.
- [ ] **7. Owner Dashboard & Bookings Management**
  - View `/dashboard`; verify KPI cards (Total, Upcoming, Confirmed, Completed, No-Shows, Rates).
  - View `/bookings`; test filtering tabs (`Completed`, `Upcoming`, `No-Show`, `Cancelled`).
  - Search by customer name; verify debounced query results.
  - Open `/bookings/[id]`; verify customer details, service information, and event history timeline.
  - Test status actions (**Mark Completed**, **Mark No-Show**, **Cancel by Business**).

---

## 12. Pre-Deployment Quality Checklist

- [x] All pages verified for mobile responsiveness.
- [x] Reusable `<Skeleton>` loading states on dashboard and bookings.
- [x] Accessible error states and empty states across all screens.
- [x] Accessible toast notifications with screen-reader support.
- [x] ARIA accessibility labels, roles, and focus outlines on all form inputs.
- [x] Client and server-side validation via Zod schemas.
- [x] Rate limiting on public booking creation endpoint.
- [x] Demo seed script (`npm run seed`) with 1 business, 3 services, weekly hours, and 15 bookings.
- [x] TypeScript validation passing cleanly with 0 errors (`npx tsc --noEmit`).
- [x] Production build passing cleanly (`npm run build`).

---

## License

MIT License. Designed and engineered for high-reliability service business operations.
