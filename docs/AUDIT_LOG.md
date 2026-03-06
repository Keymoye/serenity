# Documentation Audit Log

## Audit: March 5, 2026

**Performed by**: GitHub Copilot (agent mode)  
**Triggered by**: Manual documentation overhaul  
**Next audit recommended**: June 5, 2026

---

## Files Deleted
| File | Reason |
|------|--------|
| DETAILED_ARCHITECTURE.md | Superseded by new ARCHITECTURE.md |
| ARCHITECTURE_GUIDE.md | Redundant with new docs |

---

## Files Created (Auto-generated from source)
| File | Description |
|------|-------------|
| ARCHITECTURE.md | Layer structure, folder map, dependency rules |
| API.md | All 30 route handlers with auth, schemas, responses |
| SERVICES.md | All application service functions and DI interfaces |
| DATA_MODELS.md | All domain interfaces and Zod schemas + input aliases |
| ERROR_HANDLING.md | Error class hierarchy and HTTP mapping table |
| FEATURES.md | Step-by-step flows for all major features |
| SETUP.md | Env vars, install/run commands, config notes |

---

## Files Retained (Existing, not regenerated)
| File | Status | Notes |
|------|--------|-------|
| SUPABASE.md | Kept as-is | Schema and RLS notes still valid |
| TESTING.md | Kept as-is | Testing strategy still relevant |
| DEPLOYMENT.md | Kept as-is | Deployment checklist still valid |
| CONTRIBUTING.md | Kept as-is | Contribution guidelines still relevant |

---

## Verification Results

### API.md
- Routes checked: 30
- Discrepancies found: 0
- Status: ✅ Verified

### SERVICES.md
- Functions checked: all exported functions across 7 service files
- Discrepancies found: 2 (both fixed)

| # | Item | Issue | Resolution |
|---|------|-------|------------|
| 1 | listPublicServices input param | Documented as optional, is required | Fixed in SERVICES.md |
| 2 | getTherapistDetail deps | therapistRepo not injected via deps | Warning note added |

### DATA_MODELS.md
- Interfaces/schemas checked: all in lib/domain/ and lib/validation.ts
- Discrepancies found: 0
- Missing type aliases added: 11 (z.infer aliases now documented)
- Status: ✅ Verified + Updated

### ERROR_HANDLING.md
- Error classes checked: 6 (DomainError + 5 subclasses)
- HTTP mappings checked: 7
- Discrepancies found: 0
- Status: ✅ Verified

---

## Overall Status

| Doc | Auto-generated | Verified | Last updated |
|-----|---------------|----------|--------------|
| ARCHITECTURE.md | ✅ | — | March 5, 2026 |
| API.md | ✅ | ✅ | March 5, 2026 |
| SERVICES.md | ✅ | ✅ | March 5, 2026 |
| DATA_MODELS.md | ✅ | ✅ | March 5, 2026 |
| ERROR_HANDLING.md | ✅ | ✅ | March 5, 2026 |
| FEATURES.md | ✅ | — | March 5, 2026 |
| SETUP.md | ✅ | — | March 5, 2026 |
| SUPABASE.md | — | — | (pre-existing) |
| TESTING.md | — | — | (pre-existing) |
| DEPLOYMENT.md | — | — | (pre-existing) |
| CONTRIBUTING.md | — | — | (pre-existing) |

---

## Recommended Follow-up Actions

- [ ] Verify FEATURES.md flows against actual service + route logic
- [ ] Verify SETUP.md env vars against all process.env references in codebase
- [ ] Add CI workflow to flag undocumented routes on each PR
- [ ] Consider verifying TESTING.md and DEPLOYMENT.md on next audit cycle
- [ ] Investigate getTherapistDetail() DI escape noted in SERVICES.md

---

## Bug Fix: March 5, 2026

**Issue**: Missing customer-facing DELETE endpoint for booking cancellation  
**Severity**: Critical — Customer Cancel button silently fails (404)  
**Root cause**: `app/api/booking/[id]/route.ts` file did not exist; CancelBookingButton.tsx calls this endpoint but it was never implemented  
**Fallback behavior**: None — customers encounter silent failure with generic error message

### Changes Made

**Infrastructure Layer**:
- Added `BookingRepository.findBookingById(bookingId)` method
- Added `BookingRepository.cancelCustomerBooking(bookingId, customerId)` method with customer_id WHERE guard (prevents privilege escalation)
- Added `TimeSlotRepository.reopenTimeSlot(timeSlotId)` method with atomic `is_available = false` WHERE guard

**Service Layer**:
- Added `booking.service.ts: cancelBooking()` exported function
  - Fetches booking by ID and validates customer ownership
  - Prevents double-cancellation via `ConflictError` if already cancelled
  - Calls repo method to update status to "cancelled"
  - Attempts best-effort slot reopening (silently swallows errors)
  - Returns cancelled booking record

**API Layer**:
- **Created** `app/api/booking/[id]/route.ts` with DELETE handler
  - Follows same pattern as `/api/booking/confirm/route.ts`
  - Auth required: yes (returns 401 if unauthenticated)
  - Validates bookingId; returns 400 if missing
  - Delegates to `cancelBooking()` service
  - Uses `mapErrorToLegacyHttp()` for error mapping
  - Logs with correlationId for debugging

**UI Layer**:
- Updated `CancelBookingButton.tsx`:
  - Added `window.confirm()` dialog before fetch (prevents accidental cancellations)
  - Added `onSuccess` prop callback for parent dashboard to remove booking from list without full page reload
  - Preserved existing fetch call and error handling

**Documentation**:
- Updated `API.md`: Added DELETE /api/booking/[id] endpoint documentation
- Updated `SERVICES.md`: Added `cancelBooking()` function documentation with parameter types and error codes

### Testing Notes
- Route accepts bookings owned by authenticated customer only; returns 404 for wrong owner (security by obscurity)
- Non-existent booking IDs return 404 404; already-cancelled bookings return 409 CONFLICT
- Time slot reopening failures are logged but do not block cancellation (best-effort)
- Customers can cancel bookings at any time (no time restrictions)

### Security Considerations
- Customer ID is validated at both service and repo layers (defense in depth)
- NotFoundError is thrown for both "booking doesn't exist" and "booking belongs to another user" (prevents user enumeration)
- Repo method uses WHERE clause on customer_id (atomic protection at database level)

---

## Diagrams Update: March 5, 2026

### Deleted
| File | Reason |
|------|--------|
| booking-sequence.mmd | Superseded by detailed booking-flow.mmd |
| booking-sequence.svg | Rendered output of obsolete diagram |
| er-diagram-detailed.mmd | Superseded by data-models.mmd |
| er-diagram-detailed.svg | Rendered output of obsolete diagram |
| system-architecture.mmd | Superseded by architecture-layers.mmd |
| system-architecture.svg | Rendered output of obsolete diagram |
| admin-flow.mmd (old) | Replaced with detailed sequence diagram |
| admin-flow.svg | Rendered output of obsolete diagram |
| architecture-layers.svg | Rendered output; source .mmd is sufficient |

### Created
| File | Description |
|------|-------------|
| admin-flow.mmd (new) | Sequence diagram of admin operations with RBAC checks, 4 use-cases (List Bookings, Update Status, Create Therapist, Delete Service), assertAdmin() enforcement |

### Final State
- **Total .mmd files**: 7 (architecture-layers, api-routes, auth-flow, booking-flow, data-models, error-handling, admin-flow)
- **Rendered outputs (.svg)**: 0 (source .mmd files are canonical)
- **Outdated files**: 0
- **Status**: ✅ Diagrams audit complete

### Source Material
All diagrams regenerated from verified docs:
- docs/ARCHITECTURE.md
- docs/API.md
- docs/FEATURES.md
- docs/SERVICES.md
- docs/ERROR_HANDLING.md
- docs/DATA_MODELS.md
- Live service and route implementation

---

## Feature: Auth Gate with Service Memory

**Date**: March 5, 2026  
**Feature Type**: UI-only enhancement  
**Purpose**: Prevent booking context loss when unauthenticated users click "Book Now" and are redirected to login

### Problem Solved
- Unauthenticated users clicking "Book Now" on a service detail page were redirected to login
- After successful login, users landed on `/dashboard` with no context of their service choice


## Feature: Cancellation Protocol Emails (Feature 9)
## Date: March 5, 2026
- Modified: lib/application/booking.service.ts
  cancelBooking() now sends cancellation confirmation 
  to customer on every cancellation
  cancelBooking() sends urgent late cancellation alert 
  to admin if appointment is within 24 hours
  Both emails best-effort — never block cancellation
  Pre-fetch pattern matches confirmBooking() for consistency
- Calls: sendCancellationConfirmation() from emailService
- Calls: sendAdminLateCancellationAlert() from emailService
- Late cancellation threshold: 24 hours
- All 9 planned features now complete

## Project Status: March 5, 2026
All 9 planned features complete:
✅ 1. Documentation overhaul (7 docs)
✅ 2. Diagrams regenerated (7 diagrams)  
✅ 3. Friction report (5 features analyzed)
✅ 4. Bug fix — CancelBookingButton silent failure
✅ 5. Auth gate with service memory
✅ 6. Email infrastructure (Resend + 4 templates)
✅ 7. Booking confirmation email to customer
✅ 8. Admin new booking notification
✅ 9. Cancellation protocol emails
   - Customer confirmation on every cancel
   - Admin urgent alert within 24 hours
Next: UI redesign — design system, landing page, 
auth pages, booking wizard, admin schedule calendar

## Hydration & Boundary Audit Fix
## Date: March 6, 2026
- Audited: all files in app/ and components/
- Issues found: 5
- Issues fixed: 5
- 🔴 Fixed: therapists/[id]/page.tsx — Next.js 15 async params
- 🟡 Fixed: CalendarPicker.tsx — new Date() hydration mismatch
- 🟡 Fixed: ScheduleViewer.tsx — date formatting hydration mismatch  
- 🟢 Fixed: StepIndicator.tsx — removed unnecessary "use client"
- 🟢 Fixed: AdminBreadcrumb.tsx — removed unused useSearchParams import
- Build status: pass after fixes
- This caused booking drop-off and required users to restart the booking flow from scratch

### Solution Implemented
**Priority-ordered redirect after login:**
1. **Primary source**: Extract `serviceId` from the `next` URL param (preserved by middleware)
2. **Fallback source**: Read `pendingServiceId` from sessionStorage
3. **Final fallback**: Redirect to `/dashboard` if no serviceId found

**SessionStorage workflow:**
- When unauthenticated user clicks "Book Now" CTA on service detail page, it stores the `serviceId` in sessionStorage before redirecting to login
- This provides a fallback in case the `next` param is lost or the user navigates directly to `/auth/login`
- SessionStorage is intentionally cleared on browser tab close (correct behavior for temporary booking context)

### Files Modified

| File | Change | Impact |
|------|--------|--------|
| [components/layout/PageHero.tsx](components/layout/PageHero.tsx) | Added "use client" directive; added useRouter; intercepts /book CTAs to store serviceId in sessionStorage before redirect | All "Book Now" buttons in PageHero now persist service selection through login |
| [app/(auth)/auth/login/page.tsx](app/(auth)/auth/login/page.tsx) | Extended post-login redirect logic with priority-ordered fallback chain (next param → sessionStorage → /dashboard) | Users with pending serviceId automatically redirected to /book?serviceId=X after login |

### Files Untouched
- [app/(customer)/book/page.tsx](app/(customer)/book/page.tsx) — Already extracts serviceId from searchParams and passes to BookingWizard
- [components/booking/BookingWizard.tsx](components/booking/BookingWizard.tsx) — Already supports initialServiceId prop
- All files in `lib/` — No business logic changes
- All files in `app/api/` — No API changes
- [middleware.ts](middleware.ts) — Existing redirect behavior leveraged (preserves full path with query params)

### Architecture Layers Affected
- ✅ **UI Layer only** — All changes in React components
- ✅ **No changes to Domain, Infrastructure, Services, or API layers**

### Fallback Behavior
- If sessionStorage throws an error (private browsing mode), the try/catch silently catches and continues with the next fallback
- If both next param and sessionStorage are unavailable, user redirects to /dashboard as default
- No errors exposed to user; fallback is seamless

### Testing Notes
- ServiceId is extracted via URL parsing and stored as a string in sessionStorage
- On login page, primary check looks for "serviceId=" substring in decoded next param (flexible — handles full URLs)
- SessionStorage is cleared immediately after reading (no stale data left behind)
- Non-booking CTAs (e.g., "/about") are unaffected — they render as normal anchor tags

### User Flows Verified

**Flow 1: Service Detail → Login → Book**
1. User on `/services/123` clicks "Book this service"
2. PageHero stores serviceId=123 in sessionStorage
3. User redirected to /auth/login
4. User logs in successfully
5. Login page detects serviceId=123 in next param
6. User redirected to /book?serviceId=123
7. BookingWizard pre-selects service 123 on mount ✅

**Flow 2: Direct /book click with no serviceId**
1. User on homepage clicks "Book now" (href=/book, no serviceId)
2. PageHero has no serviceId to store
3. Middleware redirects to /auth/login?next=%2Fbook
4. After login, next param contains /book (no serviceId)
5. User redirected to /book (no service pre-selected)
6. BookingWizard starts at step 0 (service selection) ✅

**Flow 3: sessionStorage unavailable (private browsing)**
1. User clicks Book Now → sessionStorage.setItem throws
2. Try/catch silently catches → no error shown
3. User redirected to /auth/login anyway
4. After login, user redirected via next param as normal ✅

---

## Feature: Email Infrastructure (Foundation)

**Date**: March 5, 2026  
**Feature Type**: Infrastructure foundation layer (Shared by Features 2, 3, 4, 5)  
**Purpose**: Establish single, consistent email infrastructure that all feature implementations will depend on. Build once, use everywhere, never duplicate.

### Problem Solved
- No email sending infrastructure existed
- Risk of each feature implementing email differently (inconsistent templates, error handling, rate limiting, logging)
- Each feature would import Resend directly (layering violation)
- Email template styling and data handling would vary per feature
- Email failures would propagate differently across features

### Solution Implemented

**Single entry point pattern**: All email is sent via `lib/utils/emailService.ts`, the ONLY file that imports Resend. All other code calls this module.

**Architecture rule**: Email service lives in `lib/utils/` because:
- It's infrastructure (external provider integration), like database repos
- It has no business logic (not lib/application/)
- It's not a database repository pattern (not lib/infra/supabase/)
- It's shared across all features (foundation layer)

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| [lib/utils/emailService.ts](lib/utils/emailService.ts) | 227 | Resend integration — ONLY file importing Resend. 4 async send functions, all return EmailResult (never throw). |
| [lib/utils/emailTemplates.ts](lib/utils/emailTemplates.ts) | 470 | Pure HTML generation — zero dependencies, no Resend imports. 4 templates: booking confirmation, admin new booking, admin late cancellation, customer cancellation. |
| [lib/utils/dateUtils.ts](lib/utils/dateUtils.ts) | 36 | Date formatting helpers: formatAppointmentDate(), formatAppointmentTime(). Used by email templates to format ISO dates as human-readable strings. |
| [.env.example](.env.example) | 13 | Environment template with 7 new vars: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_ADMIN_EMAIL, SPA_NAME, SPA_ADDRESS, SPA_PHONE, SPA_WEBSITE. |
| [tests/smoke-test-templates.ts](tests/smoke-test-templates.ts) | 65 | Smoke test verifying all 4 templates render without errors. Run with: `pnpm dlx tsx tests/smoke-test-templates.ts` |

### Files Modified

| File | Change | Impact |
|------|--------|--------|
| [docs/SERVICES.md](docs/SERVICES.md) | Added new "Email Infrastructure" section documenting all 4 send functions, return types, and related files | Email service API is now documented alongside application services |
| [package.json](package.json) | Added `resend@^6.9.3` to dependencies | Resend is now available for import |

### Files Untouched
- [lib/application/*](lib/application/) — No services modified (Features 2–5 will import emailService)
- [app/api/*](app/api/) — No routes modified yet (Features 2–5 will call emailService)
- [lib/domain/*](lib/domain/) — No domain types added (email is infrastructure, not domain)
- All other files — Intentionally isolated to foundation layer

### Architecture Layers Affected
- ✅ **Infrastructure Layer only** — New email service in lib/utils/
- ✅ **No changes to Domain, Application Services, or API layers**

### Email Service API

**`sendBookingConfirmation(data: { to, customerName, referenceCode, serviceName, therapistName, appointmentDate, appointmentTime, notes, cancellationUrl }): Promise<EmailResult>`**
- Sends booking confirmation to customer
- Template highlights reference code, booking details, and cancellation link
- Returns `{ success: true }` or `{ success: false, error: string }`

**`sendAdminNewBookingNotification(data: { referenceCode, customerName, customerEmail, serviceName, therapistName, appointmentDate, appointmentTime, notes }): Promise<EmailResult>`**
- Sends notification to admin (`RESEND_ADMIN_EMAIL`)
- Template includes customer contact info for quick reference
- Returns `EmailResult`

**`sendAdminLateCancellationAlert(data: { referenceCode, customerName, serviceName, therapistName, appointmentDate, appointmentTime, hoursUntilAppointment }): Promise<EmailResult>`**
- Sends urgent alert to admin when booking cancelled < 24 hours before appointment
- Template uses amber/warning styling and prominently displays hours until appointment
- Includes suggestion to reopen slot immediately
- Returns `EmailResult`

**`sendCancellationConfirmation(data: { to, customerName, referenceCode, serviceName, therapistName, appointmentDate, appointmentTime }): Promise<EmailResult>`**
- Sends cancellation confirmation to customer
- Template confirms slot has been released and invites rebooking
- Returns `EmailResult`

### Error Handling Pattern

All send functions follow the same pattern:
```ts
try {
  const resend = getResendClient();
  // ... call Resend API
  return { success: true };
} catch (error) {
  logger.error("Send email failed", error, context);
  return { success: false, error: error.message };
}
```

**Never throws**. Email failures log but never crash calling code (booking confirmation must succeed even if confirmation email fails).

### HTML Template Design

[...truncated earlier for brevity...]

---

## Features: Booking Confirmation Email + Admin Notification
## Date: March 5, 2026
- Modified: lib/infra/supabase/therapist.repo.ts
  Added findById() method
- Modified: lib/infra/supabase/profile.repo.ts
  Added findById() method
- Modified: lib/application/booking.service.ts
  Extended BookingDependencies with profileRepo, therapistRepo
  confirmBooking() now pre-fetches display data before insert
  confirmBooking() sends customer confirmation email
  confirmBooking() sends admin new booking notification
  All email sends are best-effort — never block booking
- Features completed: 7 + 8 of 9
- Remaining: cancellation protocol emails (Feature 9)

All 4 templates share consistent design:
- **Background**: Sage/cream (#f8faf5)
- **Card**: White with sage green (#7aaa6e) top border
- **Header**: Spa name in serif font (Georgia fallback), sage green
- **Typography**: System fonts for body, monospace for reference codes
- **Colors**: Inline hex values (no CSS variables — email clients don't support them)
- **Late cancellation alert**: Amber/warning variant (#fff8e1 bg, #f59e0b border)
- **Inline CSS only**: Email clients strip `<style>` tags
- **Max-width 600px card**: Responsive across devices

### Date Formatting

**formatAppointmentDate(isoString)**: Returns "Monday, March 10, 2026"  
**formatAppointmentTime(isoString)**: Returns "2:30 PM"  
Both parse ISO strings and format using UTC to ensure consistency.

### Smoke Test Results

All 4 templates rendered successfully without errors:
- **bookingConfirmationTemplate**: 4,799 characters
- **adminNewBookingTemplate**: 4,547 characters
- **adminLateCancellationTemplate**: 4,613 characters
- **cancellationConfirmationTemplate**: 4,444 characters

### Environment Variables

**Added to .env.example**:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=bookings@yourspa.com
RESEND_ADMIN_EMAIL=admin@yourspa.com
SPA_NAME=Serenity Spa
SPA_ADDRESS=123 Wellness Street, Your City
SPA_PHONE=+1 (555) 000-0000
SPA_WEBSITE=https://yourspa.com
```

### Dependency Injection

Email service does **not** use DI (unlike application services) because:
- It's a simple wrapper around Resend API
- Environment config is read directly from process.env
- No testable dependencies (Resend client is instantiated inside each send function)

For unit testing, Resend responses would be mocked at the integration test level.

### Usage in Application Services (Features 2–5)

Services will import and call:
```ts
import { sendBookingConfirmation } from "lib/utils/emailService";

export async function confirmBooking(payload, context, deps) {
  // ... business logic ...
  const emailResult = await sendBookingConfirmation({
    to: customer.email,
    customerName: customer.name,
    // ... other fields
  });
  
  // email failure does NOT throw or affect booking success
  if (!emailResult.success) {
    logger.warn("Booking confirmed but email send failed", { referenceCode });
  }
  
  return { booking, referenceCode };
}
```

### Security Considerations

- RESEND_API_KEY is server-side only (never exposed to client)
- Email addresses in templates are escaped (no injection vectors)
- Cancellation URLs include reference code (no bearer tokens in email)
- Admin email address is config-driven (not hardcoded)
- Template data is passed as objects, not string concatenation (no template injection)

### Testing Strategy

**Unit tests** (future): Mock entire emailService calls in application service tests  
**Integration tests** (future): Call emailService with test Resend API key, verify email queuing  
**Smoke tests** (completed): Verify all templates render without runtime errors

### Next Steps
- Feature 2 (Booking confirmation email): Will import and call `sendBookingConfirmation()` from booking.service.ts
- Feature 3 (Admin notifications): Will import and call `sendAdminNewBookingNotification()` from booking.service.ts
- Feature 4 (Cancellation): Will import and call `sendCancellationConfirmation()` and `sendAdminLateCancellationAlert()`
- Feature 5 (Transparent cancellation protocol): Will reuse Features 2–4's email infrastructure
