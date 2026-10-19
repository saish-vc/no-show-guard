# NoShowGuard

> Reduce appointment no-shows for local service businesses with automated booking management and email reminders.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)

---

## What It Does

NoShowGuard gives local service businesses (tutors, salons, gyms, photographers, consultants) a simple way to:

1. **Create services** with name, duration, and price
2. **Set weekly availability** (e.g., Mon–Fri 9 AM – 5 PM)
3. **Share a public booking link** with customers
4. **Receive bookings** with automatic confirmation emails
5. **Send automated reminders** 24 hours and 2 hours before appointments
6. **Let customers confirm, cancel, or reschedule** from the email
7. **Track booking analytics** — no-show rate, cancellations, revenue

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Email | Resend |
| Validation | Zod |
| Deployment | Vercel |
| Scheduled Jobs | Vercel Cron |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project (free tier works)
- A [Resend](https://resend.com) account (free tier works)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd noshow-guard
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`:

| Variable | Where to Find It |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (⚠️ keep secret) |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |
| `RESEND_FROM_EMAIL` | A verified sender in Resend (e.g., `NoShowGuard <bookings@yourdomain.com>`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |
| `CRON_SECRET` | Generate with `openssl rand -hex 32` |

### 3. Set Up the Database

1. Go to the **Supabase SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Run the entire SQL file

This creates all tables, indexes, RLS policies, and triggers.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Schema

```
businesses          1 ──── * services
    │                           │
    │                           │
    ├──── * availability_rules  │
    │                           │
    └──── * bookings ───────────┘
               │
               └──── * booking_events
```

### Tables

| Table | Purpose |
|-------|---------|
| `businesses` | Business profiles linked to auth users. Each has a unique `booking_slug`. |
| `services` | Services offered: name, duration, price. Can be toggled active/inactive. |
| `availability_rules` | Weekly schedule: day of week, start time, end time. |
| `bookings` | Customer bookings with status tracking and secure `confirmation_token`. |
| `booking_events` | Immutable audit log of all booking state changes. |

### Booking Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Just created, awaiting customer confirmation |
| `confirmed` | Customer confirmed the appointment |
| `cancelled_by_customer` | Customer cancelled |
| `cancelled_by_business` | Business owner cancelled |
| `completed` | Appointment completed successfully |
| `no_show` | Customer didn't show up |

---

## Key Security Features

- **Row Level Security (RLS)** — Each business owner can only access their own data
- **Secure tokens** — Email links use `confirmation_token` (UUID), not guessable booking IDs
- **Service-role isolation** — Admin client only used server-side for public bookings and cron jobs
- **CRON_SECRET** — Protects the reminder endpoint from unauthorized access
- **Double-booking prevention** — PostgreSQL `EXCLUDE` constraint prevents overlapping bookings

---

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/bookings` | Create a new booking (public) |
| `GET` | `/api/availability` | Get available slots for a service (public) |
| `POST` | `/api/bookings/[id]/confirm` | Confirm a booking via token |
| `POST` | `/api/bookings/[id]/cancel` | Cancel a booking via token |
| `POST` | `/api/bookings/[id]/reschedule-request` | Cancel + redirect to rebook |
| `POST` | `/api/cron/reminders` | Send reminder emails (cron) |

---

## Pages

### Business Owner (authenticated)

| Route | Page |
|-------|------|
| `/login` | Sign in |
| `/signup` | Create account |
| `/dashboard` | Overview with analytics |
| `/services` | Manage services |
| `/availability` | Set weekly schedule |
| `/bookings` | View all bookings |
| `/bookings/[id]` | Booking detail |
| `/settings` | Business profile settings |

### Public Customer

| Route | Page |
|-------|------|
| `/book/[slug]` | Book an appointment |
| `/book/[slug]/success` | Booking confirmed |
| `/booking/[token]` | View/manage booking |
| `/booking/[token]/cancel-success` | Cancellation confirmed |

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Set `NEXT_PUBLIC_APP_URL` to your production URL
5. Deploy — Vercel Cron will automatically run `/api/cron/reminders` every 15 minutes

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (auth)/            # Login, signup (unauthenticated layout)
│   ├── (dashboard)/       # Owner dashboard (authenticated layout with sidebar)
│   ├── book/              # Public booking pages
│   ├── booking/           # Public booking management (confirm/cancel)
│   └── api/               # API routes
├── components/
│   ├── ui/                # Reusable UI primitives (Button, Input, Card, etc.)
│   ├── dashboard/         # Dashboard-specific components
│   ├── booking/           # Booking flow components
│   └── emails/            # Email templates
├── lib/
│   ├── supabase/          # Supabase clients (browser, server, admin)
│   ├── constants.ts       # App constants
│   ├── timezone.ts        # Timezone utilities
│   ├── resend.ts          # Resend client
│   └── utils.ts           # General utilities
├── types/                 # TypeScript types
└── validations/           # Zod schemas
```

---

## License

MIT
