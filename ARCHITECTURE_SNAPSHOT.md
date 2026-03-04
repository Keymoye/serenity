# ARCHITECTURE_SNAPSHOT

Generated: 2026-03-04

This snapshot is produced from the live codebase (authoritative). It inventories domain types, application services, API routes, existing UI files, differences vs the provided ARCHITECTURE.md, and a proposed UI refactor plan for Stage 1+.

### 1. Domain Types Inventory

Files inspected (lib/domain):
- `booking.types.ts`
  - Exports: interfaces `Booking`, `BookingSummary`
  - Exports `bookingConfirmSchema` (re-exports `baseBookingConfirmSchema` from `lib/utils/validation`) and `BookingConfirmInput` type
- `therapist.types.ts`
  - Exports: interface `Therapist`
- `service.types.ts`
  - Exports: interface `Service`
- `timeSlot.types.ts`
  - Exports: interface `TimeSlot`
- `admin.types.ts`
  - Exports: Zod-backed schemas re-exported from `lib/utils/validation`: `adminServiceSchema`, `adminTherapistSchema`, `adminTimeSlotCreateSchema`, `adminBookingStatusSchema`; also `adminServiceUpdateSchema`, `adminTherapistUpdateSchema`, and types `AdminServiceInput`, `AdminTherapistInput`, `AdminTimeSlotCreateInput`, `AdminBookingStatusInput`.
- `errors.ts`
  - Exports: `DomainError` base class and specialisations: `ValidationError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `InternalError`.
- `index.ts` re-exports domain modules above.

Notes: Zod schemas are implemented in `lib/utils/validation` and re-exported in some domain modules for convenience. Domain shapes and errors are authoritative and used throughout application services.

### 2. Application Services Inventory

Files inspected (lib/application): functions and key signatures.

- `service.service.ts`
  - `listPublicServices(input: { category?: string }, deps?) => Promise<ServiceSummary[]>`
  - `getPublicServiceDetail(input: { id: string }, deps?) => Promise<{ service, images, therapists }>`
  - `listBookingServices(deps?) => Promise<Service[]>` (used by booking UI)
  - `listFeaturedServices(deps?) => Promise<ServiceSummary[]>`
  - `listTherapistsForService(input: { serviceId: string }, deps?) => Promise<Therapist[]>`
  - `getTherapistDetail(input: { therapistId: string }, deps?) => Promise<{ therapist, services } | null>`

- `therapist.service.ts`
  - `listPublicTherapists(deps?) => Promise<Therapist[]>`

- `booking.service.ts`
  - Types: `BookingContext`, `BookingDependencies`
  - `getAvailability({ serviceId, therapistId, date }, deps?) => Promise<TimeSlot[]>` — validates params, verifies therapist assigned to service, returns bookable slots
  - `lockSlot({ timeSlotId }, context, deps?) => Promise<void>` — sets lock; throws `ConflictError('SLOT_TAKEN')` when lock fails
  - `confirmBooking(payload: BookingConfirmInput, context: BookingContext, deps?) => Promise<{ booking, referenceCode }>` — atomic tryMarkAsBooked then create booking; may throw `ConflictError('SLOT_ALREADY_BOOKED')` or `InternalError`
  - `listCustomerBookings(context: BookingContext, deps?) => Promise<Booking[]>`

- `admin.service.ts`
  - `listServices(context, deps?)`, `createServiceAdmin(input, context)`, `updateServiceAdmin(id, input, context)`, `deleteServiceAdmin(id, context)`
  - `listTherapistsAdmin`, `createTherapistAdmin`, `updateTherapistAdmin`, `deleteTherapistAdmin`
  - `listBookingsAdmin`, `listAdminBookingRows`, `updateBookingStatusAdmin(input, context)`, `deleteBookingAdmin`
  - `listTimeSlotsAdmin`, `createTimeSlotAdmin`
  - `listMessagesAdmin`, `toggleMessageReadAdmin`, `getAdminMetrics`
  - Admin functions assert admin role and throw `UnauthorizedError` when required.

- `profile.service.ts`
  - `updateProfile(input, context, deps?) => Promise<void>`
  - `updatePasswordForCurrentUser(input, context, deps?) => Promise<void>`

- `contact.service.ts`
  - `submitContactMessage(input, context, deps?) => Promise<void>` — includes rate-limit check, throws `ValidationError('RATE_LIMIT')` in case of excessive submissions

- `auth.service.ts`
  - `login(input)`, `register(input) => { requiresEmailConfirmation }`, `requestPasswordReset(input)`, `updatePassword(input)`, `confirmPasswordRecovery(input)`, `logout()` — throws `ValidationError` and `InternalError` as appropriate.

Notes: Services use infra repositories (Supabase repos) via dependency factories. They define the domain/business rules and error types used by API controllers.

### 3. API Routes Inventory (app/api)

I inspected the route handlers to capture endpoints, methods, auth requirements, request/response shapes and prominent error codes.

- `GET /api/services` (`app/api/services/route.ts`)
  - Method: GET
  - Auth: none
  - Returns: array of minimal service summaries { id, name, category, duration_minutes }
  - Errors: maps Domain errors via `mapErrorToLegacyHttp` -> typical codes: `VALIDATION_ERROR`, `INTERNAL_ERROR`.

- `POST /api/booking/availability` (`app/api/booking/availability/route.ts`)
  - Method: POST
  - Auth: requires current user (uses `getCurrentUser()` from infra)
  - Body: { serviceId?: string, therapistId?: string, date?: string }
  - Success: { slots: [{ id, start_time, end_time }] }
  - Errors: 401 UNAUTHENTICATED if no current user; domain errors mapped (e.g., `VALIDATION_ERROR`, `THERAPIST_NOT_ASSIGNED`, `INTERNAL_ERROR`).

- `POST /api/booking/lock` (`app/api/booking/lock/route.ts`)
  - Method: POST
  - Auth: requires current user
  - Body: { timeSlotId?: string }
  - Success: { success: true }
  - Errors: 401 UNAUTHENTICATED; 409 `SLOT_TAKEN` (via ConflictError); other domain errors mapped.

- `POST /api/booking/confirm` (`app/api/booking/confirm/route.ts`)
  - Method: POST
  - Auth: requires current user
  - Body: validated against `bookingConfirmSchema` (Zod)
  - Success: { booking, referenceCode }
  - Errors: 401 UNAUTHENTICATED; 400 VALIDATION_ERROR; 409 `SLOT_ALREADY_BOOKED` or `SLOT_TAKEN`; mapped internal errors.

- `POST /api/contact` (`app/api/contact/route.ts`)
  - Method: POST
  - Auth: none
  - Body: validated against `contactFormSchema`
  - Success: { success: true }
  - Errors: 400 VALIDATION_ERROR; 429 RATE_LIMIT (mapped when `submitContactMessage` returns RATE_LIMIT); other mapped errors.

- `POST /api/auth/login` (`app/api/auth/login/route.ts`)
  - Method: POST
  - Auth: none
  - Body: validated by `loginSchema`
  - Success: { success: true }
  - Errors: 400 VALIDATION_ERROR; error codes from `auth.service.login` mapped (e.g., `LOGIN_FAILED` -> 400/500 as mapper decides).

- `POST /api/auth/register` (`app/api/auth/register/route.ts`)
  - Method: POST
  - Auth: none
  - Body: validated by `registerSchema`
  - Success: { success: true, requiresEmailConfirmation }
  - Errors: 400 VALIDATION_ERROR; mapped REGISTER_FAILED.

- `PATCH /api/profile` (`app/api/profile/route.ts`)
  - Method: PATCH
  - Auth: requires current user (uses `getCurrentUser()` from infra)
  - Body: validated by `profileUpdateSchema`
  - Success: { success: true }
  - Errors: 401 UNAUTHENTICATED; 400 VALIDATION_ERROR; mapped internal errors.

- Admin endpoints under `/api/admin/*` (files exist: `app/api/admin/bookings/route.ts`, `admin/therapists/route.ts`, `admin/services/route.ts`, `admin/time-slots/route.ts`, `admin/messages/route.ts`)
  - Method: GET/POST/PUT/DELETE depending on resource
  - Auth: require admin (controllers typically call admin.service which asserts admin role). If controller obtains current user from infra, 401 may be returned first.
  - Errors: 401 UNAUTHENTICATED, 403 UNAUTHORIZED (via UnauthorizedError), 400 VALIDATION_ERROR, 500 INTERNAL_ERROR, 409 CONFLICTs when appropriate.

Note: `mapErrorToLegacyHttp` is used across controllers to map DomainError subclasses to HTTP status + body including `code` field (e.g., `VALIDATION_ERROR`, `NOT_FOUND`, `SLOT_TAKEN`, `RATE_LIMIT`).

### 4. Existing UI Inventory (pages & components)

Files discovered under `app/` (server pages / layouts) and `components/` (presentational & client islands). I examined representative files and checked for architecture rule compliance.

Pages / Layouts (found):
- `app/page.tsx` — Server component; calls `listFeaturedServices()` from `lib/application/service.service` → compliant.
- `app/layout.tsx` — Root layout (server). IMPORTANT: imports `getCurrentUser` from `lib/infra/supabase/currentUser` and uses it to render auth links. This is an architecture violation: UI layer imports infra. Status: SHALLOW / VIOLATION.
- `app/(customer)/dashboard/page.tsx` — Server component. Imports `getCurrentUser` from infra and calls `listCustomerBookings` incorrectly using an ad-hoc userId; uses application service for bookings but also infra import for auth — Partial violation. Status: SHALLOW.
- `app/(customer)/book/page.tsx` — Server component. Imports `getCurrentUser` from infra and renders `BookingWizard` (client). Violation for infra import. Status: SHALLOW.
- `app/(public)/services/page.tsx` — Server component; calls `listPublicServices` from application service → COMPLIANT.
- `app/(public)/services/[id]/page.tsx` — Server component; calls `getPublicServiceDetail` → COMPLIANT.
- `app/(public)/about/page.tsx` — Server component; calls `listPublicTherapists` → COMPLIANT.
- `app/(public)/contact/page.tsx` — Server component rendering `ContactForm` client island → COMPLIANT.
- `app/(auth)/auth/login/page.tsx`, `register/page.tsx`, `reset-password/...` — exist (client pages expected). I inspected `components/forms/ContactForm.tsx` and `components/booking/BookingWizard.tsx` which follow client->/api patterns.
- `app/(admin)/admin/layout.tsx` and admin pages exist: `app/(admin)/admin/page.tsx`, bookings, therapists, services, schedule, messages. I did not fully inspect each but files exist.

Components (found under `components/`):
- `components/ServiceCard.tsx` — presentational, COMPLIANT.
- `components/MapEmbed.tsx` — presentational, COMPLIANT.
- `components/forms/ContactForm.tsx` — `use client` component; uses `postJson('/api/contact')` and `useApi` utility → COMPLIANT.
- `components/booking/BookingWizard.tsx` — `use client`; implements booking flow calling `/api/*` endpoints (availability, lock, confirm) via `apiFetch/postJson` → COMPLIANT and well-aligned with architecture rules (lock-then-confirm flow implemented in UI, with error handling for SLOT_TAKEN, countdown handled in service side and UI lock lock uses event refresh pattern). Note: BookingWizard sets lock expiry length client-side? The lock TTL is enforced server-side; UI shows timer responsibility minimal — implementation exists.
- `components/booking/CalendarPicker.tsx` — client, COMPLIANT.
- `components/ui/Spinner.tsx` — presentational, COMPLIANT.
- Admin components present: `components/admin/BookingRow.tsx`, `TherapistsList.tsx`, `TherapistForm.tsx`, `TimeSlotForm.tsx`, `ScheduleViewer.tsx` — exist but need audit for `use client` markers when they call APIs.

Gaps vs requirements (high level):
- Many of the design-system components requested in the Master Prompt (e.g., `components/layout/SpaNavbar.tsx`, `SpaFooter.tsx`, `PageHero.tsx`, `SectionWrapper.tsx`, `ErrorBoundary.tsx`, `ConfirmDialog.tsx`, and many `components/ui/*` items) do not exist (or are shallow/unified in fewer components). Present components seem functional but not the full design-system specified. Status: MISSING for many design-system components.
- Several pages exist and are functional but may lack the richer UX (animations, hero variants, StepIndicator component, Toast stack, DatePicker variants). Many requested UI primitives are not present.

### 5. Architecture Delta (what's out of date)

Key differences between the provided `ARCHITECTURE.md` and the live codebase (authoritative):

1. Infra imports in UI: Several server components and layouts import from `lib/infra/supabase/*` (e.g., `getCurrentUser` used in `app/layout.tsx`, `app/(customer)/dashboard/page.tsx`, `app/(customer)/book/page.tsx`, and various `app/api/*` controllers). According to the Master Prompt rules, UI must not import infra—server components should call application services for auth (e.g., `requireCustomer()` in an auth service). This is a live violation and must be fixed in the refactor.

2. Design system: The codebase contains many presentational components and a working UI but does not yet implement the full design system and Tailwind theme tokens described in the Master Prompt (e.g., `brand.*`, `spa.*`, additional spacing tokens, animation keyframes). I could not find `tailwind.config.ts` in the repo root (no Tailwind config at that exact path). This means the design-system extension step is required.

3. Missing UI primitives: Several requested UI primitives (Toast, StepIndicator, DatePicker with min date enforcement, TimeSlotGrid variants, ConfirmDialog component, SpaNavbar, SpaFooter) are absent or incomplete — the current components are functional but minimal.

4. API coverage: The API controller layer aligns with services and contains the endpoints required for booking, admin, auth, contact, and profile. Error mapping uses `mapErrorToLegacyHttp` and the DomainError hierarchy; controllers generally use application services. Many API routes correctly call application services; some API controllers obtain `getCurrentUser()` from infra (acceptable in API controllers), but corresponding server components should instead rely on application-level auth wrappers.

### 6. UI Refactor Plan (prioritised)

Goals: make UI layer fully architecture-compliant (no infra imports), implement the design system, add missing primitives and pages per the Master Prompt, and ensure behavior for booking lock/confirm follows the contract.

Proposed staged work (Stage 0 already in progress):

1. Stage 0 - Completed (audit): produce this `ARCHITECTURE_SNAPSHOT.md` and obtain confirmation.

2. Stage 1 - Design System & Foundations (priority):
   - Add Tailwind theme extension (create `tailwind.config.ts` if missing) with required color palettes, typography, spacing, border radius tokens, shadows and animations.
   - Implement `components/layout/SpaNavbar.tsx` and `SpaFooter.tsx` (server components) and `components/layout/PageHero.tsx`, `SectionWrapper.tsx`.
   - Implement `components/ui/*` primitives: at minimum `Button`, `Input`, `TextArea`, `Select`, `Badge`, `Card`, `Avatar`, `Skeleton`, `EmptyState`, `Toast` (client), `StepIndicator`, `DatePicker` (client), `TimeSlotGrid` (client). Start with accessible, typed APIs.
   - Replace direct layout styling in `app/layout.tsx` with new `SpaNavbar`/`SpaFooter` and remove infra imports.

   Justification: All pages rely on a consistent theme and primitives. This reduces churn when rewriting pages.

3. Stage 2 - Public pages: rewrite `app/page.tsx`, `app/(public)/services/page.tsx`, `app/(public)/services/[id]/page.tsx`, `app/(public)/about/page.tsx`, `app/(public)/contact/page.tsx` to consume design system. Ensure server components call application services only (no infra imports).

4. Stage 3 - Auth pages: implement client auth pages posting to `/api/auth/*` endpoints, handling all API error codes with user messages.

5. Stage 4 - Customer portal: rewrite `app/(customer)/dashboard/page.tsx`, `app/(customer)/book/page.tsx` (BookingWizard client), `app/(customer)/profile/page.tsx`. The key fix: replace `getCurrentUser()` infra calls in server components with application-level `requireCustomer()` or server-side helper that calls application auth service.

6. Stage 5 - Admin portal: create `app/(admin)/layout.tsx` and admin pages, admin components, all as client pages calling `/api/admin/*` endpoints. Ensure role guard is enforced server-side (application service), not via infra imports in UI.

7. Stage 6 - Quality gate: run `npx tsc --noEmit`, `npx next lint`, `pnpm test`, grep checks for Supabase/infra usage in UI, accessibility and performance checks. Fix issues discovered.

Notes & small tactical steps to start Stage 1:
- Add `tailwind.config.ts` / extend theme. (No existing file found at expected location.)
- Replace all `getCurrentUser()` usages in server UI (`app/layout.tsx`, `app/(customer)/*`) with calls to an application-layer auth helper (implement `requireCustomer()` / `requireCurrentUser()` in `lib/application/auth.service.ts` or call existing function if available; do NOT modify application or infra layers—prefer adding a small `lib/services/authService.ts` that wraps existing application APIs per the architecture). However per global rules we must not modify `lib/application` unless needed; best approach: create a thin `lib/services/authService.ts` in application layer (but user instruction forbids modifying non-UI files unless explicitly instructed—so instead, use existing application services: check for `auth.service` exports. `auth.service` contains `login`, `register`, etc. There is no `requireCustomer`. To avoid modifying application layer, we will implement server-side UI wrapper that calls an API controller `/api/session`? But API controllers are in app/api and should already expose endpoints. Current pattern in repo uses `lib/infra/supabase/currentUser` directly in UI; to comply we must replace infra usage with a server-side call to an application service function `requireCustomer()`—that function is not present, so we must create a small server helper in `lib/services` or `lib/application` which is technically outside UI. The Master Prompt allowed modifications outside UI only when explicitly instructed; but architecture rules require server components call application services. To follow the mandate strictly, I will propose adding a small `lib/services/authService.ts` that provides `requireCustomer()` and `requireAdmin()` wrappers (thin adapters around existing infra currentUser) as part of the refactor plan — I will ask you to confirm this approach in the checkpoint.

---

END OF SNAPSHOT
