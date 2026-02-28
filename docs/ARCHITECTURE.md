# Serenity Spa — Architecture

**Overview:**
- Tech stack: Next.js (App Router), TypeScript, React, Tailwind CSS, Supabase (Postgres + Auth + Realtime).
- Purpose: SPA-style marketing site with booking flows, an admin area for CRUD over services/therapists/schedules/bookings/messages, and API routes for booking availability/locking/confirming.

**High-level components**
- `app/` — Next.js routes and layouts. Server components host data fetching; client components live under `components/`.
- `components/` — Reusable UI pieces (booking wizard, service cards, admin forms).
- `app/api/` — Route handlers for customer-facing and admin APIs (booking, contact, profile, admin CRUD).
- `lib/` — Shared helpers: `supabase` (server/browser clients), `services` (authService), `db` (small data access helpers), `utils` (validation, logger).

**Core flows**
- Auth: Supabase session + `lib/services/authService.ts` plus `middleware.ts` that protects customer/admin routes.
- Booking: `components/booking/BookingWizard.tsx` → availability `/api/booking/availability` → lock `/api/booking/lock` → confirm `/api/booking/confirm`.
- Admin: Server pages under `app/(admin)/...` call `lib/db/*` helpers (which use the server Supabase client) and client components call admin API routes under `app/api/admin/*`.

**Data model (core tables — representative)**
- `services` — id, name, category, duration_minutes, price, thumbnail_url, is_active, is_featured
- `therapists` — id, name, title, photo_url, bio_short, bio
- `therapist_service` — service_id, therapist_id (many-to-many)
- `time_slots` — id, therapist_id, start_time, end_time, capacity, locked_until, is_booked
- `bookings` — id, service_id, therapist_id, time_slot_id, customer_name, customer_contact, status, notes, created_at
- `profiles` — user_id, role (admin/customer), name, phone
- `messages` (contact/admin messaging) — id, name, email, subject, body, is_read, created_at

Note: This project expects these tables to exist in Supabase; see SUPABASE.md for schema details and sample seeds.

**Design decisions & rationale**
- Server-side Supabase client (`lib/supabase/server.ts`) uses the Service Role key for secure server operations (admin CRUD and writes). Browser client uses anon/public key.
- Minimal server-side DB helpers (`lib/db/*`) are thin wrappers that centralize error handling and response shaping.
- App Router + Server Components: data-fetching for admin pages runs on the server where possible (reduces client bundle and leverages service role client safely).
- Simplicity over abstraction: the code uses small, explicit helpers (no heavy ORMs) to keep the learning curve low and make the SQL/Postgres behavior visible.

**Trade-offs & future considerations**
- Current approach uses service-role key for server helpers; ensure that production processes rotate and protect keys (use secrets manager).
- Optionally add row-level security (RLS) policies on Supabase to further restrict operations rather than relying only on server code.
- Move DB helpers to a small repository-level data access layer if complexity grows (DRY queries, pagination, advanced filtering).

**Where to look**
- Booking flow: `components/booking/BookingWizard.tsx`, `app/api/booking/*`
- Auth + middleware: `lib/services/authService.ts`, `middleware.ts`
- Admin pages: `app/(admin)/*`, `app/api/admin/*`
- Supabase helpers: `lib/supabase/*`

