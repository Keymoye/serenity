Last updated: March 5, 2026 | Auto-generated from source

# Features & Flows

This document outlines the major user-facing and administrative features of the booking app, describing the end-to-end flow through UI, API, services, repositories, and the database.

## Booking Flow (customer)

1. **UI**: Customer visits `/book` or selects a service. The booking wizard (client/server hybrid) guides through service, therapist, date, and time selection.
2. **API**: When the customer checks availability, the client posts to `POST /api/booking/availability` with `{ serviceId, therapistId, date }`.
3. **Service**: `booking.service.getAvailability()` verifies that the therapist is assigned to the service and fetches time slots via `timeSlotRepo.findForTherapistOnDate()`.
4. **Repo/DB**: `time_slots` table is queried with `therapist_id` and date range; results filtered for `is_available = true` and `locked_until` expired.
5. **UI**: Slots displayed; customer selects one and submits confirmation.
6. **API**: POST to `/api/booking/confirm` with validated booking info.
7. **Service**: `confirmBooking()` generates a reference code, calls `timeSlotRepo.tryMarkAsBooked()` (atomic `UPDATE` where `is_available = true`), and then inserts a row in `bookings` via `bookingRepo.createBooking()`.
   - On conflict (slot already booked) a `ConflictError` is thrown and propagated as HTTP 409.
   - If booking insert fails, service attempts to rollback the slot availability.
8. **Repo/DB**: New row in `bookings` with `status = 'confirmed'` and foreign keys to `profiles` (`customer_id`), `services`, `therapists`, `time_slots`.
9. **UI**: Confirmation page shows booking details and reference code.

Additional subflow: locking a slot (before confirmation) uses `POST /api/booking/lock` which sets `locked_until` for 10 minutes via `timeSlotRepo.lockSlot()`.

## Authentication

- **Login/Register**: UI forms post to `/api/auth/login` or `/api/auth/register` with validated credentials. Services call Supabase auth repo methods.
- **Password reset**: Customer requests a reset (`/api/auth/reset-password`), receives email via Supabase. Reset confirmation is handled by `/api/auth/reset-password/confirm` which uses tokens to set a session and update the password.
- **Logout**: `POST /api/auth/logout` signs out via Supabase.

## Profile Management

- **Edit profile**: `/api/profile` PATCH updates `profiles` table through `profile.service.updateProfile()`.
- **Change password**: `/api/profile/password` POST calls `profile.service.updatePasswordForCurrentUser()` which updates Supabase user password.

## Contact/Form Messages

- **Submission**: Public contact page posts to `/api/contact`. `contact.service.submitContactMessage()` enforces rate limit per IP (5 per hour) and inserts into `messages` table.
- **Admin**: `/api/admin/messages` GET lists messages; PUT toggles `is_read`.

## Public Catalog

- `/api/services` GET returns active services for booking widgets.
- `/api/services/[id]/therapists` returns therapists assigned to a service.
- `/api/therapists/[id]` returns therapist details and their services.
- These endpoints support the public pages (`/services`, service detail, therapist detail).

## Admin Features

All admin flows require a Supabase session and a `profiles.role === 'admin'`. Middleware also protects `/admin` routes.

- **Services management**: CRUD operations via `/api/admin/services`; services stored in `services` table.
- **Therapists management**: CRUD via `/api/admin/therapists`; `therapists` table.
- **Schedule/time slots**: Create and delete via `/api/admin/time-slots`; uses `time_slots` table.
- **Bookings oversight**: List, filter, update status, and delete via `/api/admin/bookings`.
- **Messages inbox**: View and mark messages via `/api/admin/messages`.
- **Dashboard metrics**: `admin.service.getAdminMetrics()` computes counts using repository helper queries over past month, today, last 7 days.

## Service‑specific APIs

- **Service detail pages** use `service.service.getPublicServiceDetail()` and `service.service.listTherapistsForService()` to populate server components.
- **Therapist detail pages** use `service.service.getTherapistDetail()`.

## Validation and Error Handling

All inputs are validated with Zod prior to service calls. Services throw `ValidationError`, `ConflictError`, etc., which are translated to HTTP responses by the API routes.

---

> This inventory is based on the existing application services and API controllers as of March 5 2026. Changes to the code will not automatically update this file until regenerated.
