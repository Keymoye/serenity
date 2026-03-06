# Feature Friction Analysis Report

**Date**: March 5, 2026  
**Status**: Pre-implementation — read only  
**Features**: 5  
**Source**: Derived from live codebase + verified docs

---

## [1]. Auth gate with service memory

**Friction Level**: Low  
**One-line summary**: Entirely a UI concern; leverage existing session storage patterns and middleware's `next` param handling to preserve booking selection across auth redirect.

#### What needs to change

- **Domain Layer** (lib/domain/): No changes required
- **Infrastructure Layer** (lib/infra/supabase/): No changes required
- **Application Services Layer** (lib/application/): No changes required
- **API Controller Layer** (app/api/): No changes required — existing `/api/booking/confirm` already handles authenticated context via `getCurrentUser()`
- **UI Layer** (app/ or components/): [BookingWizard.tsx](components/booking/BookingWizard.tsx) must detect unauthenticated state, store `selectedServiceId` in `sessionStorage`, and restore it after login

#### Friction points

**File**: [components/booking/BookingWizard.tsx](components/booking/BookingWizard.tsx)

**WHERE the friction exists**: The `BookingWizard` component at lines 1–400+ currently accepts `initialServiceId` as a prop, but there is no logic to:
1. Detect when a user clicks "Book Now" while unauthenticated
2. Store the selected service to `sessionStorage` before routing to login
3. Detect login completion and restore the stored selection on remount

**WHY it causes friction**: The component is a client component (`"use client"`), so it can use `sessionStorage` directly. However, the wizard does not yet:
- Detect auth state changes (no auth provider or listener)
- Know when it's being mounted after a login redirect
- Have a pattern for deferring to stored state vs. props

**HOW MUCH it could affect other parts**: Minimal. This is purely a UI enhancement. However, if implemented incorrectly (e.g., creating a new auth context or auth listener), it could interfere with the existing middleware pattern in [middleware.ts](middleware.ts), which already handles the `next` query parameter redirect.

#### What already exists that helps

1. **Middleware's `next` parameter pattern** ([middleware.ts](middleware.ts) line ~25–30): The middleware already encodes the unauthenticated route into a `next` query param when redirecting to `/auth/login`. This pattern can be extended or reused.
2. **`initialServiceId` prop support** in `BookingWizard` (line ~27): The component already accepts and honors an `initialServiceId` prop when mounted.
3. **React lifecycle hooks**: The component uses `useEffect` throughout, so restoring from `sessionStorage` on mount is straightforward.
4. **No external dependencies required**: `sessionStorage` is a standard browser API; no npm packages needed.

#### Risk of architectural violation

**Risk**: LOW  
**Violation temptation**: A developer might attempt to create a global auth context or auth provider to detect login state. This would violate the 4-layer architecture because it would add a UI-layer concern (auth state management) that should remain delegated to the API layer via `getCurrentUser()` and the middleware.

**Where it could happen**: [components/booking/BookingWizard.tsx](components/booking/BookingWizard.tsx) or a new file like `components/auth/useAuthState.ts`.

**Why the temptation exists**: The component needs to know "did I just get logged in?" and `sessionStorage` alone cannot reliably detect this without polling or an external event listener. The intuitive solution is to add an auth context, but the codebase already uses Supabase's session via middleware and `getCurrentUser()`.

**How to prevent it**: Keep all auth state detection outside the React component tree. Instead, use the URL `next` param as the signal: if the user is now authenticated (detected via `getCurrentUser()` on page load) and the URL contains `next=/book?selectedService=...`, restore the selection. This keeps auth logic in the API layer and middleware.

#### Dependencies on other features

**Does this feature become easier or harder if another feature in this list is implemented first?**

No direct dependency. However:
- If **Booking confirmation email** is built first, the cancel/edit flow would be clearer, making it easier to test the "restore after login" flow end-to-end.
- The **Transparent cancellation protocol** does not affect this feature at all.

#### Business logic edge cases

1. **User stores serviceId, closes browser, clears session storage accidentally before logging in**: The `sessionStorage` persists across tab closes but not across full browser shutdown or cache clear. If the user closes their browser immediately after starting the wizard, `sessionStorage` is lost. **Mitigation**: Store the selection in the URL as well (e.g., query param), redundantly.

2. **User clicks "Book Now" for service A, gets redirected to login, but then navigates to service B's detail page before logging in**: The `sessionStorage` still contains service A. Upon login, service A is restored. **Decision needed**: Is this the desired UX? Or should only the most recent service be remembered?

3. **User is on `/book` page, clicks "Book Now" while unauthenticated, gets redirected to login with `?next=%2Fbook`, then logs in and is redirected back to `/book`**: The BookingWizard remounts with no `initialServiceId` prop — the stored value must be read from `sessionStorage`. **Risk**: If the component clears its state on unmount (it shouldn't), the stored value is lost.

#### Estimated layer impact score

| Layer | Score | Reason |
|-------|-------|--------|
| Domain | 0 | No domain types, validation, or business logic changes |
| Infrastructure | 0 | No Supabase queries, repositories, or client config changes |
| Services | 0 | No service orchestration or business logic changes |
| API | 0 | Existing endpoints used as-is; no route changes |
| UI | 1 | Minor addition: sessionStorage store/restore logic in BookingWizard; no new components or pages |
| **Total** | **/15** | **1** — Purely UI layer; minimal risk of regression |

---

## [2]. Booking confirmation email to customer

**Friction Level**: Low–Medium  
**One-line summary**: Requires new email infrastructure, but once built, it integrates cleanly into the existing confirmed-booking flow without architectural violations.

#### What needs to change

- **Domain Layer** (lib/domain/): No new types required; existing `Booking`, `Service`, `Therapist`, and `TimeSlot` types contain all needed data
- **Infrastructure Layer** (lib/infra/supabase/): No database changes; new **email service/utility** file (e.g., `lib/infra/email/` or `lib/infra/supabase/email.service.ts`) must be created to handle sending via SMTP/SES/SendGrid or similar
- **Application Services Layer** (lib/application/): Modify [booking.service.ts](lib/application/booking.service.ts) `confirmBooking()` function to call new email service after booking is confirmed
- **API Controller Layer** (app/api/): No changes to [app/api/booking/confirm/route.ts](app/api/booking/confirm/route.ts); the service call already returns the booking, and the route can pass it to the email function
- **UI Layer** (app/ or components/): No changes required; email is sent server-side

#### Friction points

**File**: [lib/application/booking.service.ts](lib/application/booking.service.ts)

**WHERE the friction exists**: The `confirmBooking()` function (lines ~120–180) currently returns `{ booking, referenceCode }` directly after inserting the booking. There is no hook for side effects like email sending. To add email:
1. Query the related `Service`, `Therapist`, `TimeSlot`, and `CustomerProfile` data to populate the email template
2. Call the email service to send asynchronously
3. Decide: should email failure roll back the booking, or log and continue?

**WHY it causes friction**: The `confirmBooking()` function is tightly coupled to the atomic booking creation and slot marking transaction. Adding an async side effect (email sending) after the transaction creates a risk:
- If email sending fails, the booking is already confirmed. Should this be acceptable, or should the entire confirm fail?
- The function currently does not fetch `Service` or `Therapist` data; it only receives IDs. To send a meaningful email, these entities must be fetched.
- The function uses dependency injection (`deps: BookingDependencies`) but `BookingDependencies` does not include repos for services or therapists, only `serviceRepo`. A new `ServiceRepository` and `TherapistRepository` would need to be injected.

**HOW MUCH it could affect other parts**: Medium impact if email sending is synchronous (blocks the API response until email completes). Low impact if email is queued asynchronously (fire-and-forget). The existing error-handling chain in [app/api/booking/confirm/route.ts](app/api/booking/confirm/route.ts) assumes exceptions in services should map to HTTP responses; if email exceptions are caught and logged silently, the route is unaffected. However, if email exceptions propagate, they will be caught by the route's error handler and the user will see an "internal error," even though their booking succeeded.

#### What already exists that helps

1. **Existing `BookingDependencies` pattern** in [lib/application/booking.service.ts](lib/application/booking.service.ts) (lines ~10–25): The service already uses dependency injection. A new `emailService` dependency can be added trivially.
2. **`serviceRepo` already injected** in `BookingDependencies`: Services are already fetched in `getAvailability()`, so the pattern for repo access is proven.
3. **Therapist service fetch pattern** in [lib/application/service.service.ts](lib/application/service.service.ts): The `listTherapistsForService()` function (lines ~40–50) shows how to fetch therapists; this pattern can be reused.
4. **Logger pattern established** ([lib/utils/logger.ts](lib/utils/logger.ts)): All services can log email failures without breaking the request.
5. **Booking entity contains all needed IDs**: The `Booking` interface in [lib/domain/booking.types.ts](lib/domain/booking.types.ts) includes `service_id`, `therapist_id`, and `time_slot_id`, so a follow-up query to fetch full details is straightforward.

#### Risk of architectural violation

**Risk**: MEDIUM–HIGH  
**Violation temptation**: A developer might choose to send email directly in [app/api/booking/confirm/route.ts](app/api/booking/confirm/route.ts) instead of delegating to a service, because:
1. The email service is "not mission-critical" (i.e., treat it as a "nice to have" side effect)
2. The route handler already has access to the booking, serviceId, and userId
3. It feels faster to call an email library directly rather than create a service

**Where it would happen**: [app/api/booking/confirm/route.ts](app/api/booking/confirm/route.ts) lines ~30–45, adding an email call directly after `confirmBooking()` returns.

**Why this violates the architecture**: The API controller layer should only handle HTTP concerns (parsing input, checking auth, mapping errors to responses). Email sending is a **business logic side effect** that belongs in the application services layer (`lib/application/`). Once email sending is in the controller, other layers (admin reschedule, contact form notifications, etc.) would be tempted to do the same, eroding the service layer.

**How to prevent it**: Establish the email responsibility in [lib/application/](lib/application/) as a new service file (e.g., `email.service.ts` or `notification.service.ts`) and ensure all email calls go through it, regardless of which controller or service initiates them.

#### Dependencies on other features

**Does this feature become easier or harder if another feature in this list is implemented first?**

- Implementing before **Cancellation confirmation email** is beneficial: the email infrastructure built here (template, send utility, service pattern) is reused for cancellations.
- Implementing before **Admin email notification** is beneficial: same infrastructure, same reasoning.
- Implementing before **Transparent cancellation protocol** is beneficial: the cancellation feature will need email sending, and this feature creates the standard pattern.

**Recommended order**: Build this feature **second** (after Auth gate), so the email infrastructure is in place before cancellation and admin features depend on it.

#### Business logic edge cases

1. **Email sending succeeds but response is lost due to network failure**: The customer's booking is confirmed (already committed to DB), but they never receive the confirmation email. Days later, they claim they never got it. **Decision needed**: Should there be an email delivery log in the database? Should admins be able to resend confirmation manually?

2. **Email template uses the customer's profile name, but the profile is updated between booking confirmation and email sending**: Email contains stale name. **Risk**: Low if email is sent atomically (within 100ms) before returning; higher if email is queued to a background job. **Mitigation**: Fetch and pass all template data at confirmation time; don't rely on additional fetches.

3. **Email contains a "cancel booking" link with a token. The token is decoded by a public endpoint to allow the customer to cancel without logging in. But the token expires, or is invalidated if the booking is cancelled by the admin first, leading to confusing UX if the customer tries the link days later.** **Decision needed**: How long should the cancel token be valid? What error message if the customer tries an expired token?

4. **The customer has two bookings confirmed in quick succession. Both send confirmation emails asynchronously. Email sending takes 5 seconds. The user is logged out by the time emails complete, and if an email exception occurs, it has no context to report it to.** **Decision needed**: Is fire-and-forget email acceptable, or must failures be surfaced?

#### Estimated layer impact score

| Layer | Score | Reason |
|-------|-------|--------|
| Domain | 0 | Existing types reused; no new domain logic |
| Infrastructure | 2 | New email service/utility file required; depends on external email provider (SMTP/SES/SendGrid); not a Supabase repo but a sibling infra concern |
| Services | 1 | Minor addition: call to email service in `confirmBooking()` after booking insert; fetch service/therapist data for email template |
| API | 0 | Existing route used as-is; service call already returns booking data |
| UI | 0 | No UI changes; email is server-side |
| **Total** | **/15** | **3** — Mostly infrastructure work; moderate service changes |

---

## [3]. Admin email notification on new bookings

**Friction Level**: Medium  
**One-line summary**: Reuses email infrastructure from Feature 2, but adds complexity: must detect "late cancellations" (within 24hrs of start_time) and send a separate urgent email, requiring timestamp comparisons and decision points in the service layer.

#### What needs to change

- **Domain Layer** (lib/domain/): No new types; existing `Booking`, `TimeSlot`, and `Therapist` types suffice
- **Infrastructure Layer** (lib/infra/supabase/): No new repositories; rely on email service created in Feature 2
- **Application Services Layer** (lib/application/): Modify [booking.service.ts](lib/application/booking.service.ts) `confirmBooking()` to also notify admin after confirmation; add a new function `checkAndNotifyLateBooking()` or integrate late-cancellation check when a booking is cancelled (feature 4)
- **API Controller Layer** (app/api/): No changes to [app/api/booking/confirm/route.ts](app/api/booking/confirm/route.ts); notification happens in the service
- **UI Layer** (app/ or components/): No changes

#### Friction points

**File**: [lib/application/booking.service.ts](lib/application/booking.service.ts)

**WHERE the friction exists**: After `confirmBooking()` inserts the booking, it must send an admin email. The email must include:
- Booking reference code
- Service name
- Therapist name
- Appointment date/time
- Customer name and notes

This requires:
1. Fetching `Service`, `Therapist`, `TimeSlot`, and `Profile` (customer) data post-insertion
2. Constructing the email body
3. Determining the admin's email address (from config? from database?)
4. Calling the email service

The "late cancellation urgency" logic is **separate**: it applies when a booking is **cancelled** (not confirmed), if the cancellation occurs within 24 hours of the appointment. This logic does not belong in `confirmBooking()` but in a future cancellation function (Feature 4/5).

**WHY it causes friction**: 
- **Data fetching overhead**: Unlike Feature 2 (customer email), which only needs service/therapist details, admin email needs the customer profile name and notes. The `confirmBooking()` function is already performing an atomic transaction; adding post-transaction queries adds latency and introduces a window where the booking exists but the admin notification is pending.
- **Admin email address resolution**: Where does the admin's email come from? Configuration (env var)? Database lookup (which admin profile)? If multiple admins, should all be notified? This decision must be made and wired into the email infra.
- **Timing of "late cancellation" detection**: The late-cancellation flag is a property of **cancellation**, not confirmation. A booking confirmed right now might only become "late-cancellable" in 23 hours and 59 minutes. The late-cancellation email must be sent at cancellation time, not confirmation time. Implementing this in `confirmBooking()` is incorrect; it should be in a `cancelBooking()` function which doesn't exist yet (Feature 4/5).

**HOW MUCH it could affect other parts**: If the admin notification is made synchronous or blocking, it delays the `confirmBooking()` response, which is user-facing. If asynchronous (queued), it has lower impact but introduces eventual-consistency concerns (admin sees the booking later).

#### What already exists that helps

1. **Email service pattern** from Feature 2: The infrastructure is reused directly.
2. **Logger with context** ([lib/utils/logger.ts](lib/utils/logger.ts)): Failures can be logged without breaking the response.
3. **Profile data in Booking.ts**: Customer profile ID is available in the booking; it can be fetched if needed.
4. **Booking entity completeness**: By the time `confirmBooking()` returns, the booking row exists with all required IDs.

#### Risk of architectural violation

**Risk**: HIGH  
**Violation temptation**: A developer might bundle both "customer email" (Feature 2) and "admin notification" (Feature 3) into a single `sendBookingEmails()` function called from [app/api/booking/confirm/route.ts](app/api/booking/confirm/route.ts), bypassing the service layer. This feels efficient but violates separation of concerns.

**Where it would happen**: [app/api/booking/confirm/route.ts](app/api/booking/confirm/route.ts) directly calling an email utility with the booking ID and email type.

**Why this violates the architecture**: Email sending is a business logic responsibility, not an HTTP handling responsibility. Different features (confirmation, cancellation, admin reschedule) have different email requirements; if email logic lives in multiple routes, it becomes impossible to maintain consistency.

**How to prevent it**: Establish a dedicated service function, e.g., `notifyAdminOfNewBooking(bookingId, deps)` in [lib/application/booking.service.ts](lib/application/booking.service.ts) or a new `notification.service.ts`. All features that need to notify the admin must call this function.

#### Dependencies on other features

**Does this feature become easier or harder if another feature in this list is implemented first?**

- **Must be implemented after Feature 2** (booking confirmation email): The email infrastructure must exist before admin notifications can be sent.
- **Loosely coupled to Features 4 & 5** (cancellation emails and protocol): The "late cancellation urgent email" logic is distinct from the "new booking notification." However, both use the same email service. The decision of "where does admin email address come from" must be made once and reused.

**Critical dependency**: The "late cancellation" part of this feature cannot be fully tested until **Transparent cancellation protocol** (Feature 5) is implemented, because that feature defines the cancellation flow.

#### Business logic edge cases

1. **Admin email address is hardcoded in env vars. The email bounces (invalid address). No one is notified; bookings appear to confirm successfully but admins are unaware. Days later, business impact is discovered.** **Decision needed**: Should there be a delivery retry mechanism? A fallback notification channel?

2. **A booking is confirmed at 11:59 PM. The appointment is at 12:30 PM tomorrow. Time zone calculation: is "within 24 hours" calculated in the customer's time zone, the therapist's time zone, or the server's time zone? If incorrect, a "late cancellation" might not trigger urgently.** **Decision needed**: Establish a single canonical time zone for all deadline calculations.

3. **Multiple services or therapies might be running in parallel. Admin is notified of booking A, then immediately booking B, then booking C, all within seconds. Email inbox floods with individual messages. Is this the desired UX, or should bookings be batched and sent in a daily digest?** **Decision needed** at infrastructure level, not just here.

4. **Late cancellation occurs at 11:59 PM on the same day as the appointment. The urgent email is sent. But the appointment is at 9:00 AM the next day (depending on the 24-hour boundary). Is 11:59 PM the same day a "late" cancellation?** **Decision needed**: Define "within 24 hours" precisely (e.g., "if `now >= appointment_start_time - 24 hours`").

#### Estimated layer impact score

| Layer | Score | Reason |
|-------|-------|--------|
| Domain | 0 | No new types or business rules in the domain |
| Infrastructure | 0 | Reuses email service from Feature 2; no new infra additions |
| Services | 2 | Add admin notification call in `confirmBooking()`; modify or add helper to detect late cancellations (though the full late-cancellation logic belongs in cancellation features); fetch customer profile for email |
| API | 0 | Existing confirm route used as-is |
| UI | 0 | No UI changes |
| **Total** | **/15** | **2** — Moderate service-layer additions; reuses infrastructure |

---

## [4]. Cancellation confirmation email to customer

**Friction Level**: Medium–High  
**One-line summary**: Requires a brand-new `cancelBooking()` endpoint and service function, which must coordinate slot reopening, email sending, and handle race conditions—introducing significant domain and service logic that doesn't exist yet.

#### What needs to change

- **Domain Layer** (lib/domain/): Possibly add a new `BookingCancellation` type or extend `Booking` with cancellation metadata (cancelled_at, cancel_reason); or keep status field as-is and rely on status transitions
- **Infrastructure Layer** (lib/infra/supabase/): 
  - New repository method in [booking.repo.ts](lib/infra/supabase/booking.repo.ts): `updateBookingStatus(bookingId, "cancelled")` (may already exist via `updateBooking()`)
  - Reuse [timeSlot.repo.ts](lib/infra/supabase/timeSlot.repo.ts) `setAvailable()` method to reopen the slot
  - Reuse email service from Feature 2
- **Application Services Layer** (lib/application/): New function `cancelCustomerBooking(bookingId, context)` in [booking.service.ts](lib/application/booking.service.ts) orchestrating:
  1. Fetch the booking and validate customer ownership
  2. Mark booking as "cancelled"
  3. Atomically reopen the slot
  4. Fetch service, therapist, and time slot details
  5. Send cancellation confirmation email to customer
- **API Controller Layer** (app/api/): New route **DELETE /api/booking/[bookingId]** to handle customer-initiated cancellation (distinct from admin deletion)
- **UI Layer** (components/): Update [components/booking/CancelBookingButton.tsx](components/booking/CancelBookingButton.tsx) response handling to display cancellation confirmation, reference code, and messaging that the slot has been released for rebooking

#### Friction points

**File**: [lib/application/booking.service.ts](lib/application/booking.service.ts)

**WHERE the friction exists**: A new `cancelCustomerBooking()` function must be added. It must:
1. Validate that the customer owns the booking (verify `customer_id` against context)
2. Update the booking status to "cancelled"
3. Reopen the time slot (mark as available)
4. Fetch all necessary data (service name, therapist name, appointment date/time) for the email
5. Send the confirmation email

The critical friction point is **atomicity**: the function must ensure that if the booking status is updated, the slot is immediately reopened. If either part fails, both must roll back. However, the current repo pattern does not support multi-statement transactions explicitly.

**Second friction point**: After the booking and slot updates succeed, the email sending is a side effect. If it fails, the cancellation is already committed. This is the same eventual-consistency concern as Feature 2, but more business-critical because a customer needs confirmation they can rely on.

**WHERE exactly**: [lib/application/booking.service.ts](lib/application/booking.service.ts) needs a new function around line 180+ (after `confirmBooking()`).

**WHY it causes friction**:
- **Race condition risk**: Between the moment the booking is marked as "cancelled" and the slot is reopened, another customer might attempt to book the slot and fail with "not available" even though it's actually available now. The function must reopen the slot in the same transaction.
- **Atomic operations at the infrastructure level**: The current [timeSlot.repo.ts](lib/infra/supabase/timeSlot.repo.ts) `setAvailable()` method (line ~80) is a simple UPDATE without a WHERE condition; if the slot was already rebooked by someone else, `setAvailable()` will still succeed, clobbering their booking. This is a critical bug in the repo.
- **Email contains a "re-booking" link or suggests immediate rebooking**: The cancellation email should make it clear the slot is available for rebooking. However, if the email is sent asynchronously and a second customer already booked the slot before the cancellation email reaches the original customer, the original customer's "re-book this slot" link is invalid. The email cannot contain a direct rebooking link without risking this race.

**HOW MUCH it could affect other parts**: High impact. If the slot reopening is not atomic with the cancellation, other parts of the booking system (availability queries, concurrent booking attempts) will be impacted.

#### What already exists that helps

1. **`updateBooking()` in [booking.repo.ts](lib/infra/supabase/booking.repo.ts)** (lines ~113–125): Already supports updating booking status.
2. **`setAvailable()` in [timeSlot.repo.ts](lib/infra/supabase/timeSlot.repo.ts)** (lines ~75–81): Reopens a slot. However, it lacks safeguards (see friction points above).
3. **`CancelBookingButton` component already exists** in [components/booking/CancelBookingButton.tsx](components/booking/CancelBookingButton.tsx) and is rendered in [app/(customer)/dashboard/page.tsx](app/(customer)/dashboard/page.tsx) (line 109). It calls `DELETE /api/booking/{id}`. The UI trigger for cancellation is already in place; only post-cancellation feedback (success confirmation, booking removal from list) needs enhancement.
4. **Email service infrastructure** from Feature 2 is reused.
5. **Error classes** in [lib/domain/errors.ts](lib/domain/errors.ts) cover conflict scenarios.

#### Risk of architectural violation

**Risk**: HIGH  
**Violation temptation**: A developer, seeing the complexity of fetching booking details and coordinating email, might:
1. Send email directly in [app/api/booking/[bookingId]/cancel/route.ts](app/api/booking/[bookingId]/cancel/route.ts) instead of delegating to the service
2. Skip the race-condition protection and assume "if the query succeeds, the slot is reopened" without atomic verification
3. Hard-code customer ID validation in the controller instead of passing context to the service

**Where it would happen**: New file [app/api/booking/cancel/route.ts](app/api/booking/cancel/route.ts) or [app/api/booking/[bookingId]/cancel/route.ts](app/api/booking/[bookingId]/cancel/route.ts).

**Why this violates the architecture**: 
- Business logic (coordinating cancellation, slot reopening, customer ownership validation) belongs in services, not routes.
- Email triggers belong in services, not routes.
- Pushing all the complexity into the API route is understandable given the new complexity, but it's a slippery slope.

**How to prevent it**: Establish `cancelBooking()` as a service function with clear responsibility boundaries:
- Service is responsible for business logic, validation, and side effects (including email).
- API route only handles HTTP parsing and error mapping.

#### Dependencies on other features

**Does this feature become easier or harder if another feature in this list is implemented first?**

- **Must follow Feature 2** (booking confirmation email): Email infrastructure must exist.
- **Should follow Feature 5** (transparent cancellation protocol) in concept: Feature 5 defines the full cancellation policy (customer can cancel anytime, admin cannot cancel, slot reopening is atomic). This feature (Feature 4) is one part of that policy. However, Feature 4 implements customer cancellation and email separately, while Feature 5 defines admin reschedule and the complete slot lifecycle.
- **Suggested implementation order**: Implement Features 2 & 3 (email infrastructure), then this feature (cancellation email for customers) as a self-contained unit, before tackling Feature 5 (the full protocol with admin reschedule).

#### Business logic edge cases

1. **Customer cancels a booking. The slot is immediately reopened. Another customer books it within milliseconds. Both customers receive confirmation emails. The original customer tries to use their "re-book" link in the cancellation email, but the slot is no longer available.** **Decision needed**: Should the cancellation email avoid suggesting rebooking? Or should rebooking be framed as "the slot you just freed is available for 30 seconds"?

2. **Customer cancels the booking. The email service is down. The cancellation is committed to the database. The customer has no confirmation and assumes the cancellation failed.** **Mitigation**: Email should be sent synchronously (blocking the response) or with a delivery guarantee (queued to a reliable queue), not fire-and-forget.

3. **Customer cancels a booking scheduled for tomorrow. The email arrives instantly. But the same customer receives another email from the admin (rescheduled due to therapist unavailability) sent minutes later, creating confusion about which action took effect.** **Decision needed**: Is there a race between customer cancellation and admin rescheduling? Who wins?

4. **Cancellation email contains the customer's original notes (why they booked). Does this violate data minimization principles? Should cancellation emails be minimal and reference-code-only?** **Business decision needed**.

5. **A customer cancels multiple bookings in rapid succession. Each cancellation triggers an email. Email queue fills up. Does the system handle this gracefully?** **Load testing needed**.

#### Estimated layer impact score

| Layer | Score | Reason |
|-------|-------|--------|
| Domain | 1 | Possibly add cancellation metadata to Booking type; mostly reuses existing types |
| Infrastructure | 1 | Extend `booking.repo.ts` and validate `setAvailable()` safety; reuse email and timeSlot services |
| Services | 2 | New `cancelBooking()` function; orchestrates booking update, slot reopening, data fetching, and email sending; moderate complexity |
| API | 1 | New POST route for cancellation; standard pattern (auth check, schema validation, error mapping) |
| UI | 1 | Wire existing `CancelBookingButton` to new endpoint; minor UI work |
| **Total** | **/15** | **6** — Moderate cross-layer additions; biggest friction is atomicity and race conditions |

---

## [5]. Transparent cancellation protocol

**Friction Level**: High  
**One-line summary**: Complete overhaul of the booking lifecycle to support atomic slot reopening, customer unrestricted cancellation, admin-only reschedule (no cancellation), late-fee alerts, and three different email triggers—requiring domain changes, multi-step transactions, race-condition handling, and careful coordination with Features 2–4.

#### What needs to change

- **Domain Layer** (lib/domain/): Extend `Booking` type with cancellation metadata (cancelled_at, cancelled_by_customer, rescheduled_from_id); possibly add a `BookingCancellationPolicy` type; ensure business rules are explicitly modeled
- **Infrastructure Layer** (lib/infra/supabase/): 
  - Audit [booking.repo.ts](lib/infra/supabase/booking.repo.ts) for transaction support; ensure `updateBooking()` and slot-reopening are atomic
  - Enhance [timeSlot.repo.ts](lib/infra/supabase/timeSlot.repo.ts) `setAvailable()` to be atomic and race-condition-safe (WHERE condition that validates the slot is not already booked)
  - Add new repo method: `findBookingAndLock()` to fetch a booking and prevent concurrent modifications
  - Add new method: `reopenSlotAtomically(slotId)` with proper preconditions
  - Consider adding a `booking_status_history` table to track cancellations and reschedules for audit/reporting
- **Application Services Layer** (lib/application/): 
  - Modify [booking.service.ts](lib/application/booking.service.ts) to add three new functions:
    - `cancelBookingAsCustomer(bookingId, context)`: Customer cancels their booking anytime
    - `rescheduleBookingAsAdmin(bookingId, newSlotId, context)`: Admin reschedules to a new slot (not a cancellation)
    - `getBookingDetails()`: Fetch all details for email/notification purposes
  - Modify [admin.service.ts](lib/admin/booking.service.ts) to prevent cancellation and route cancellation attempts to reschedule UX
- **API Controller Layer** (app/api/): 
  - New route: **POST /api/booking/[bookingId]/cancel** (customer cancellation) or **POST /api/booking/cancel**
  - New route: **POST /api/admin/bookings/[bookingId]/reschedule** (admin reschedule)
  - Remove or disable any existing cancellation endpoint in [app/api/admin/bookings/route.ts](app/api/admin/bookings/route.ts) that allows direct status updates to "cancelled"
- **UI Layer** (app/ or components/): 
  - Modify [components/booking/CancelBookingButton.tsx](components/booking/CancelBookingButton.tsx) to show "Cancel" with no restrictions; clarify that the slot is freed for others
  - Add admin UI for rescheduling (admin booking management page) showing an option to "move to new time" instead of "cancel"
  - Update booking detail pages to clarify customer and admin roles/capabilities

#### Friction points

**File 1**: [lib/infra/supabase/timeSlot.repo.ts](lib/infra/supabase/timeSlot.repo.ts)

**WHERE**: The `setAvailable()` method (lines ~75–81) currently does:
```sql
UPDATE time_slots SET is_available = true WHERE id = ?
```
This is **not safe**. If another booking has claimed the slot, this UPDATE clobbers it. The correct implementation must be:
```sql
UPDATE time_slots SET is_available = true WHERE id = ? AND is_available = false
```
or, preferably, validate in the application logic before reopening.

**WHY it causes friction**: Implementing the transparent cancellation protocol requires absolute confidence that slot reopening is atomic and race-condition-free. The current repo implementation does not provide this guarantee. Fixing it requires either:
1. Adding a WHERE condition to `setAvailable()` (but then it can fail silently if already booked)
2. Changing the domain model (e.g., marking slots as "reserved" vs. "available" vs. "booked" vs. "locked")
3. Implementing optimistic locking (version numbers on slots)

**HOW MUCH it affects other parts**: Critical. Any concurrent-booking scenario (two customers trying to book the same slot) is vulnerable to race conditions if this is not fixed. The entire booking system's correctness depends on this.

---

**File 2**: [lib/application/booking.service.ts](lib/application/booking.service.ts)

**WHERE**: The service must now enforce three new business rules:
1. **Customer can cancel anytime**: No restriction. Must be callable by the customer (verified via context).
2. **Admin cannot cancel**: If an admin tries to update a booking status to "cancelled", the API must block it. Instead, the admin UI must offer "reschedule" only.
3. **Slot reopening is atomic with cancellation**: Both must succeed together or both must fail.

**WHY it causes friction**: 
- Rule 1 is straightforward. Rule 2 requires new authorization logic in the service.
- Rule 3 requires cross-table atomicity. Current `confirmBooking()` uses `tryMarkAsBooked()` to atomically mark a slot as unavailable; the inverse operation (marking as available while updating booking status) must have similar guarantees.
- The service must also detect if a booking is "within 24 hours of start time" to trigger the late-cancellation email flow (part of Feature 3 / Feature 4).
- The service must fetch Service, Therapist, and TimeSlot details for three separate emails (customer cancellation, admin late-cancellation alert, and possibly admin reschedule notification).

**HOW MUCH it affects other parts**: Very high. The booking service becomes significantly more complex. New helper functions are needed for slot-reopening, late-cancellation detection, and email content preparation. Integration with the email services from Features 2–4 is critical.

---

**File 3**: [app/api/admin/bookings/route.ts](app/api/admin/bookings/route.ts)

**WHERE**: The PUT endpoint (lines ~50–80) currently accepts `{ bookingId, status }` and calls `updateBookingStatusAdmin()`. It must be modified to:
1. Reject any attempt to set status to "cancelled"
2. Route rescheduling requests to a new endpoint or function

**WHY it causes friction**: The current API design is too permissive. An admin with a simple PATCH request can cancel a booking, which violates the business rule. The fix requires either:
1. Adding validation in `updateBookingStatusAdmin()` to reject "cancelled" status (and throw `UnauthorizedError`)
2. Removing the PUT endpoint entirely and forcing admin reschedules through a new, dedicated endpoint

**HOW MUCH it affects other parts**: If validation is added to the service, existing tests and admin tools that expect to be able to set status directly will break. This is a breaking change.

---

**File 4**: [app/api/booking/confirm/route.ts](app/api/booking/confirm/route.ts)

**WHERE**: After a booking is confirmed (line ~30), the route calls `confirmBooking()` and returns. The transparent cancellation protocol adds a second responsibility: notifying the admin of the new booking (Feature 3). This email must be sent from this route or via the service.

**WHY it causes friction**: If Feature 3 (admin notification) is not already integrated into `confirmBooking()`, it must be added here. This couples the confirmation route to two email concerns: customer confirmation (Feature 2) and admin notification (Feature 3). To avoid email logic in the route, both must be delegated to the service.

**HOW MUCH it affects other parts**: Moderate. The main concern is ensuring the response is not delayed by asynchronous email sending.

---

**File 5**: [app/api/booking/[id]/route.ts](app/api/booking/[id]/route.ts) — **CRITICAL MISSING ENDPOINT**

**WHERE**: The CancelBookingButton calls `DELETE /api/booking/{id}`, but this route handler **does not exist**. The folder [app/api/booking/[id]/](app/api/booking/[id]/) is empty. There is a DELETE handler in [app/api/admin/bookings/route.ts](app/api/admin/bookings/route.ts), but it is admin-protected (`deleteBookingAdmin()` calls `assertAdmin()` which throws `UnauthorizedError` for non-admin users).

**WHY it causes friction**: The CancelBookingButton component is already rendered in the dashboard and calls `DELETE /api/booking/{id}`, but customers will receive a 404 (not found) when they try to cancel. This is a silent failure—the button exists and appears functional, but the backend endpoint is missing. If a developer tries to route the DELETE to `/api/admin/bookings` instead, the customer will receive a 401 Unauthorized error because `assertAdmin()` will block them.

**Business impact**: Customers believe they have a working "Cancel" button, but it fails silently. No cancellation emails are sent. The therapist is unaware the customer tried to cancel, and the slot is never reopened for rebooking.

---

#### What already exists that helps

1. **Atomic slot locking pattern** in [booking.service.ts](lib/application/booking.service.ts): The `lockSlot()` function uses a WHERE condition to ensure atomicity. The slot-reopening function can follow the same pattern.
2. **Booking status type** in [booking.types.ts](lib/domain/booking.types.ts): The `BookingStatus` enum already includes `"cancelled"`, so the status field supports it.
3. **Error classes** in [lib/domain/errors.ts](lib/domain/errors.ts): `UnauthorizedError` exists for role-based blocking.
4. **CancelBookingButton already handles the customer-facing cancel trigger** and is rendered in the dashboard. The UI layer work is reduced to: updating the button's response handling to show cancellation confirmation and slot-reopened messaging. The button currently calls `DELETE /api/booking/{id}`.
5. **Email infrastructure** from Features 2–4 is expected to be in place before this feature is built.
6. **Repository dependency injection** in [admin.service.ts](lib/application/admin.service.ts) and [booking.service.ts](lib/application/booking.service.ts): New functions can use the same pattern.

#### Risk of architectural violation

**Risk**: VERY HIGH  
**Violation temptation**: Given the complexity of this feature, developers might:
1. Avoid the service layer entirely and implement cancellation logic directly in the API route, embedding database queries and email calls
2. Implement slot-reopening as a simple query without race-condition protection, assuming "it won't happen in practice"
3. Store cancellation metadata (cancelled_by, cancelled_at, reason) directly in the Supabase trigger instead of in the application logic
4. Send emails from multiple places (cancellation route, reschedule route, admin route) without a centralized notification service
5. Hard-code business logic like "24 hours" in the route instead of extracting it to the domain layer

**Where it would happen**:
- New file: [app/api/booking/cancel/route.ts](app/api/booking/cancel/route.ts) — direct email calls, query logic
- Modification: [app/api/admin/bookings/route.ts](app/api/admin/bookings/route.ts) — direct rescheduling logic without service
- Modification: [lib/infra/supabase/timeSlot.repo.ts](lib/infra/supabase/timeSlot.repo.ts) — database triggers instead of explicit code

**Why this temptation exists**: The feature is so complex that centralizing all logic in the service layer feels ambitious. The shortcut of pushing details into the API route or database feels pragmatic. However:
- If cancellation logic is split between the route and the service, updates and bug fixes become inconsistent.
- If triggers replace explicit code, the business logic becomes invisible to developers reading the service layer.
- If emails are sent from multiple routes, the notification patterns diverge.

**How to prevent it**: Establish clear service responsibilities upfront:
- `booking.service.cancelBookingAsCustomer()` encapsulates all customer-initiated cancellation logic
- `booking.service.rescheduleBookingAsAdmin()` encapsulates admin reschedule logic
- A new `notification.service` (or extend `booking.service`) handles all transactional emails
- No email calls in API routes; no database queries in API routes beyond calling services

#### Dependencies on other features

**Does this feature become easier or harder if another feature in this list is implemented first?**

- **Depends on Features 2 & 3 to be implemented first**: Email infrastructure must be in place. Specifically:
  - Feature 2 (booking confirmation email) establishes the email service pattern and template structure
  - Feature 3 (admin notification) establishes how to notify admins and how to fetch booking details
  - Feature 4 (cancellation confirmation email) establishes the customer-cancellation flow
  - This feature (5) ties them all together with the complete protocol

- **Implementation order strongly recommended**: 
  1. Feature 2 (booking confirmation email) — establish email service
  2. Feature 3 (admin notification on new bookings) — reuse email service
  3. Feature 4 (cancellation confirmation email) — customer cancellation flow with email
  4. Feature 5 (transparent cancellation protocol) — admin reschedule and atomic slot reopening

  This order ensures each feature has its dependencies met and tests can be written independently.

#### Business logic edge cases

1. **Customer cancels a booking at 11:58 PM. The appointment is at 12:30 PM the next day (34 minutes away). Is this a "late cancellation" within 24 hours? The 24-hour window is 12:30 PM today to 12:30 PM tomorrow. 11:58 PM today is outside that window. But operationally, 34 minutes before an appointment is very late.** **Decision needed**: Is the 24-hour window calculated from `now` or from `appointment_start_time - 24 hours`? Define precisely.

2. **Admin reschedules a booking from 2:00 PM to 4:00 PM. The original 2:00 PM slot is reopened. But at 1:55 PM, the original customer tries to cancel their booking via the original email link ("click here to cancel"). Does the cancel succeed, even though the customer has already been rescheduled?** **Race condition**: If the customer's cancel processes before the slot is officially reopened in the UI, the customer might think they canceled the original slot when in fact they just updated their own cancellation timestamp. **Decision needed**: Should the cancel endpoint first fetch the booking and check if it's already rescheduled?

3. **Admin reschedules a booking to a new slot. The customer receives an email with the new time. But the email is sent asynchronously and takes 10 seconds. The customer, seeing the old appointment still in their calendar, assumes the reschedule failed and cancels the original booking via their email link. Now the customer has no appointment at all.** **Decision needed**: Should reschedule emails be sent synchronously? Should the original booking be marked as "rescheduled" (not active) immediately, so cancelling it is invalid?

4. **Customer cancels a booking. The slot is reopened. Within 50ms, another customer books it. Both customers receive confirmation emails. Days later, the original customer complains they tried to rebooking but couldn't find the slot.** **Decision needed**: Should the cancellation email include a specific "re-book now" link that reserves the slot for a few seconds? Or should the email just state "the slot is available to others"?

5. **Late-cancellation email is triggered because cancellation occurred within 24 hours of start time. But the admin email provider is down. The email queues for retry. The appointment happens. The therapist shows up to an empty room because the cancellation alert was never delivered.** **Mitigation**: Should there be a fallback notification channel (SMS, in-app notification)? Should the receipt of the late-cancellation email be required before the cancellation is committed?

6. **Two admin users both attempt to reschedule the same booking simultaneously to different slots. The service updates the booking to the first rescheduled slot, but the second admin's HTTP response lags due to network jitter. Both admins believe they successfully rescheduled, but only one succeeded.** **Decision needed**: Should reschedule endpoints be idempotent? Should there be a version field on bookings to detect this?

7. **A customer cancels their booking. Immediately after, they try to rebook the same slot via the "Book Now" button. They submit the confirm request but the slot-reopening process hasn't completed in the database yet. They get a "slot not available" error.** **Mitigation**: The UI should show a brief delay or loading state to hint that the slot might not be immediately available. Or the confirm endpoint should retry a few times before failing.

8. **The business changes its policy: late cancellations now trigger an urgent email, but only if the therapist is the owner of a specific "vip" service. The 24-hour threshold is now 12 hours instead of 24 hours for vip services. This logic is hard-coded in the service. Changing it requires code deployment.** **Decision needed**: Should late-cancellation thresholds and email triggers be configurable per service/therapist via the admin panel rather than hard-coded?

#### Estimated layer impact score

| Layer | Score | Reason |
|-------|-------|--------|
| Domain | 2 | Extend Booking type with cancellation/reschedule metadata; possibly model policies |
| Infrastructure | 3 | Fix `setAvailable()` atomicity; add atomic slot-reopening method; audit transaction safety; possibly add audit table |
| Services | 3 | Three new functions: cancel, reschedule, and late-cancellation detection; coordinate with email services; complex orchestration |
| API | 3 | **Create missing customer DELETE endpoint** at `/api/booking/[id]`; create new reschedule endpoint; modify existing admin booking status route to block cancellation; error mapping |
| UI | 1 | Update CancelBookingButton response handling to show confirmation; add admin reschedule UI; clarify capabilities. (UI trigger already exists.) |
| **Total** | **/15** | **12** — Major cross-layer work; highest friction of all features |

---

## Cross-Feature Analysis

### Recommended implementation order

**Order**: 1 → 2 → 3 → 4 → 5

**Justification**:

1. **Auth gate with service memory** (FIRST — LOW friction)
   - Purely UI work; no dependencies on other features.
   - Builds confidence early with a quick win.
   - Does not unblock anything else, but also does not create debt.

2. **Booking confirmation email to customer** (SECOND — LOW-MEDIUM friction)
   - **Unblocks**: Features 3, 4, 5 (all need email infrastructure)
   - Establishes the email service pattern, template structure, and error handling.
   - Once email service exists, subsequent features reuse it.
   - **Risk**: If built last, Features 3–5 will have to implement email ad-hoc.

3. **Admin email notification on new bookings** (THIRD — MEDIUM friction)
   - Reuses email service from Feature 2.
   - Adds complexity: detects late cancellations (but full logic deferred to Feature 5).
   - Builds precedent for notifying admins.
   - **Dependency**: Must be after Feature 2 (email infrastructure).

4. **Cancellation confirmation email to customer** (FOURTH — MEDIUM-HIGH friction)
   - Reuses email service from Feature 2.
   - Implements customer cancellation as a self-contained flow (not tied to admin reschedule).
   - Introduces `cancelCustomerBooking()` service function and new API route.
   - **Dependency**: Must be after Feature 2 (email infrastructure).
   - **Optional decoupling**: Can be built before Feature 5, or as part of Feature 5. Building before Feature 5 validates the cancellation flow and slot-reopening logic independently.

5. **Transparent cancellation protocol** (LAST — HIGH friction)
   - Depends on Features 2, 3, 4 for email infrastructure and cancellation patterns.
   - Adds admin reschedule capability, atomic slot-reopening, and late-fee logic.
   - Integrates customer cancellation (Feature 4) with admin reschedule.
   - **Why last**: By the time this feature is built, all email triggers are proven, all supporting functions exist, and the service layer is robust. This feature can focus on the novel aspects (atomic slot reopening, reschedule logic) without also building email infrastructure.

### Shared work opportunities

#### 1. Email Infrastructure Service (Use across Features 2, 3, 4, 5)

**File**: `lib/infra/email/email.service.ts` or `lib/infra/supabase/email.service.ts`

**Shared responsibilities**:
- Sending emails via SMTP/SES/SendGrid
- Email template rendering (using strings or template engine like Handlebars)
- Retry logic and error handling
- Admin email address resolution (where to send notifications)

**Reused by**:
- Feature 2: Customer booking confirmation
- Feature 3: Admin new booking notification
- Feature 3: Admin late-cancellation urgent alert
- Feature 4: Customer cancellation confirmation
- Feature 5: Admin reschedule notification

**Benefit of sharing**: All features use the same email provider, templates are consistent, retry logic is centralized, and admin email address is resolved once.

---

#### 2. Booking Details Fetcher (Use across Features 2, 3, 4, 5)

**File**: `lib/application/booking.service.ts` (new helper function `getFullBookingDetails(bookingId)`)

**Shared responsibility**:
- Fetch a single booking with all related entities (Service, Therapist, TimeSlot, CustomerProfile)
- Return a data structure suitable for email templates

**Reused by**:
- Feature 2: Fetch details for booking confirmation email
- Feature 3: Fetch details for admin notification emails
- Feature 4: Fetch details for cancellation confirmation email
- Feature 5: Fetch details for reschedule notification email

**Benefit of sharing**: Booking details are fetched consistently; email templates receive a standardized data structure; reduces code duplication.

---

#### 3. Late-Cancellation Detection & Notification (Use across Features 3, 5)

**File**: `lib/application/notification.service.ts` (new file, or extend `booking.service.ts`)

**Shared responsibility**:
- Detect if a cancellation is within 24 hours of the appointment
- Determine if the late-cancellation email should be urgent

**Reused by**:
- Feature 3: `notifyAdminOfLateBookingCancellation(bookingId)` — called when cancellation occurs
- Feature 5: Same function, reused in `cancelCustomerBooking()` and `rescheduleBookingAsAdmin()`

**Benefit of sharing**: Late-cancellation detection logic is written once, tested once, and reused everywhere it's needed.

---

#### 4. Atomic Slot-Reopening Pattern (Use across Features 4, 5)

**File**: `lib/infra/supabase/timeSlot.repo.ts` (new method `reopenSlotAtomicallyAfterCancellation(slotId, bookingId)`)

**Shared responsibility**:
- Safely mark a slot as available after a booking is cancelled or rescheduled.
- Use a WHERE condition to prevent race conditions (e.g., ensure the slot was not already rebooked).

**Reused by**:
- Feature 4: `cancelCustomerBooking()` calls this after marking booking as cancelled
- Feature 5 (customer path): Same call in `cancelCustomerBooking()`
- Feature 5 (admin path): Called in `rescheduleBookingAsAdmin()` to reopen the old slot

**Benefit of sharing**: Race-condition-safe slot reopening is implemented once and reused everywhere.

---

### The email infrastructure question

#### Does an email utility/service currently exist?

**No.** Grep search for "email|mail|notification|send" in the lib/ folder returned only validation messages and an email field in the Message model (used for storing contact form submissions). There is no email **sending** infrastructure.

#### Where in the 4-layer architecture does email sending belong?

**Infrastructure Layer** (`lib/infra/`), as a peer to Supabase repositories.

**Justification**:
- Email sending is an external dependency (SMTP provider, SES, SendGrid), just like the Supabase database.
- It should be abstracted behind an interface (e.g., `EmailService`) in the infra layer.
- Application services call the email service, just as they call repositories.
- API routes never call email directly; they call services which call email.

**File structure**:
```
lib/infra/
  email/
    email.service.ts       # Interface: send(to, subject, html)
    email.impl.sendgrid.ts # Implementation: uses SendGrid API
    email.impl.smtp.ts     # Implementation: uses Nodemailer
  supabase/
    booking.repo.ts
    ...
```

#### What is the risk of each feature implementing email differently?

**VERY HIGH RISK.** If each feature implements its own email sending:
- Feature 2 might use SendGrid; Feature 4 might use SMTP; Feature 5 might hard-code `console.log`
- Retry logic, rate limiting, and error handling would be inconsistent
- Admin email address resolution would happen in multiple places
- Email templates would vary in quality and styling
- A bug in one feature's email logic wouldn't be fixed everywhere
- Testing email sending behavior would require multiple test doubles

**Mitigation**: Establish the email service **once** (in Feature 2) and enforce its use throughout.

#### Which layer would be most tempted to send emails directly?

**API Controller Layer** (`app/api/**`).

**Why**: 
- The route handler has access to all the data needed for an email (booking, user, service details).
- Creating a service function feels like "extra work" when the route could just call the email provider directly.
- The route is already dealing with HTTP concerns; adding email feels like a minor addition.
- Testing the route in isolation (without services) feels simpler.

**How to prevent it**: Establish a coding standard: **"No email calls in routes. All email is sent via services."** Enforce this in code review. When a developer considers adding email to a route, they should be redirected to create or extend a service function.

---

### The atomic slot-reopening question

#### Does the existing `timeSlot.repo.ts` have a method for this?

**Partially.** The `setAvailable()` method (lines ~75–81) exists:

```ts
async setAvailable(timeSlotId) {
  const supabase = await getSupabaseAdminClient();
  const { error } = await supabase
    .from("time_slots")
    .update({ is_available: true })
    .eq("id", timeSlotId);
  if (error) throw error;
}
```

**Problem**: This is **not atomic**. It does not verify that the slot is not already booked by someone else. If another customer's booking has claimed the slot, this UPDATE will clobber it, setting is_available back to true.

#### How does this relate to the existing `lockSlot` and `tryMarkAsBooked` atomic patterns?

**`lockSlot()` (lines ~65–75)**:
```ts
async lockSlot(timeSlotId, lockUntilIso, nowIso) {
  const { data, error } = await supabase
    .from("time_slots")
    .update({ locked_until: lockUntilIso })
    .eq("id", timeSlotId)
    .eq("is_available", true)
    .or(`locked_until.is.null,locked_until.lt.${nowIso}`)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);  // true if lock succeeded
}
```

**Atomicity**: Uses WHERE conditions (`is_available = true` AND `(locked_until IS NULL OR locked_until < now)`) to ensure the lock only succeeds if the slot is available and not already locked. Returns `Boolean(data)` — if the slot didn't match the conditions, `data` is null and the function returns false.

**`tryMarkAsBooked()` (lines ~77–85)**:
```ts
async tryMarkAsBooked(timeSlotId) {
  const { data, error } = await supabase
    .from("time_slots")
    .update({ is_available: false })
    .eq("id", timeSlotId)
    .eq("is_available", true)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);  // true if mark succeeded
}
```

**Atomicity**: Uses WHERE condition `is_available = true` to ensure the booking only succeeds if the slot is currently available. Returns false if the slot is already booked.

**The pattern is clear**: Both use WHERE conditions and return a boolean to indicate success. `setAvailable()` should follow the same pattern.

#### What is the risk of a race condition if two customers book the same slot the moment it's reopened?

**CRITICAL RISK.** Here's the scenario:

1. Customer A is booked in slot S. The slot has `is_available = false`.
2. Customer A cancels. The service calls `setAvailable(S)`, setting `is_available = true`.
3. **Simultaneously**, Customer B submits a booking confirmation for slot S.
4. Customer B's `tryMarkAsBooked(S)` succeeds because the slot is now available (true).
5. **Simultaneously**, Customer A's cancellation email is being sent, and the slot is about to be "reserved" for them to rebook.

This is technically not a race condition (both customers end up with what they expected), but it reveals the business process:
- If the cancellation email says "your slot is now available for others," Customer A expects it to be available. But Customer B was waiting for that exact moment.
- If Customer A tries to rebook the same slot via a link in their cancellation email, they'll find it already booked by Customer B.

**The real risk**: The service code might **check** if a slot is available after cancellation, then immediately try to **rebook** it on behalf of the customer. If the slot is claimed by another customer in between the check and the rebook, the logic fails.

**Solution**: Either:
1. Accept the race as expected behavior and don't guarantee immediate rebooking.
2. Implement a short hold on reopened slots (e.g., mark as "reserved" for 30 seconds before making it available to others).
3. Use optimistic locking (add a version field to slots) to detect concurrent modifications.

#### Is the existing atomic WHERE pattern sufficient, or does this require a new approach?

**The pattern is sufficient, but `setAvailable()` must be fixed.**

**Correct implementation**:
```ts
async setAvailable(timeSlotId) {
  const { data, error } = await supabase
    .from("time_slots")
    .update({ is_available: true })
    .eq("id", timeSlotId)
    .eq("is_available", false)  // Only mark available if it's currently unavailable
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);  // true if the update succeeded
}
```

By adding `.eq("is_available", false)`, the repo ensures the slot can only be reopened if it's currently booked. If another customer's booking has already claimed it (is_available is already true),  the WHERE condition fails and the function returns false.

**However, this is still not fully safe** if the concern is: "After I reopen the slot, no other booking claims it until I explicitly release it for general rebooking." For that, a "reserved" state is needed, which requires domain model changes.

---

### Highest risk feature

**Feature 5 (Transparent cancellation protocol)** carries the most risk.

**Specific risk scenario**:

**File**: [lib/application/booking.service.ts](lib/application/booking.service.ts), new function `cancelCustomerBooking()`

**Scenario**: 
1. Customer A calls the cancel endpoint at time T1.
2. The service begins the cancellation transaction: update booking to "cancelled", reopen the slot.
3. At time T1 + 5ms, Customer B submits a booking confirmation for the same slot.
4. The slot-reopening transaction is still in progress.
5. Customer B's `tryMarkAsBooked()` is called, but:
   - If it runs **before** the slot is reopened, it fails with "slot not available" (even though it's in the process of being reopened).
   - If it runs **after** the slot is reopened, it succeeds, and Customer A's and Customer B's bookings are both "active" in the database.

**The bug**: Two bookings exist for the same slot.

**Where it surfaces**: 
- Admin dashboard shows two confirmed bookings with the same time.
- Therapist is double-booked.
- Both customers show up to the appointment.

**Why this feature creates this risk**: It's the only feature that combines three async, interdependent operations (cancel booking, reopen slot, send emails) without explicit transaction management in the application code. If the database is not correctly configured for atomicity, or if the application code has a logic error, the bug is silent and only surfaces in production when therapists are double-booked.

**Mitigation**:
1. Use explicit Supabase transactions (if available) or ensure atomicity via the WHERE conditions.
2. Write integration tests that simulate concurrent booking/cancellation.
3. Add a database constraint: each slot can have at most one "confirmed" booking.
4. Implement a reconciliation job that detects and repairs double-bookings.

---

### Red flags to watch

Specific anti-patterns a developer might reach for that would look correct but silently violate the architecture or create bugs:

#### 1. Email calls in API routes

**File**: [app/api/booking/confirm/route.ts](app/api/booking/confirm/route.ts)

**Anti-pattern**:
```ts
export async function POST(request: Request) {
  // ...
  const { booking, referenceCode } = await confirmBooking(payload, context);
  
  // ❌ ANTI-PATTERN: Email sending in the route
  await sendEmail(booking.customer_id, "Booking confirmed", emailTemplateHtml);
  
  return NextResponse.json({ booking, referenceCode });
}
```

**Looks correct**: The email is sent synchronously, and the user waits for both the booking and the email before receiving a response.

**Violates architecture**: Email is application logic (business side effect), not HTTP logic. If another feature (e.g., admin reschedule, webhook from third party) needs to send a booking email, email logic is now in multiple routes.

**Silent bug**: If the email service is down, the entire booking endpoint fails, even though the booking was successfully created. The user sees "error" when they should see "booking created, email pending."

**Correct approach**: Delegate to the service:
```ts
const { booking, referenceCode } = await confirmBooking(payload, context);
// confirmBooking already sends the email internally
return NextResponse.json({ booking, referenceCode });
```

---

#### 2. Slot reopening without WHERE conditions

**File**: [lib/infra/supabase/timeSlot.repo.ts](lib/infra/supabase/timeSlot.repo.ts)

**Anti-pattern**:
```ts
async setAvailable(timeSlotId) {
  const supabase = await getSupabaseAdminClient();
  const { error } = await supabase
    .from("time_slots")
    .update({ is_available: true })
    .eq("id", timeSlotId);  // ❌ No second WHERE condition
  if (error) throw error;
}
```

**Looks correct**: The query runs successfully; is_available is set to true.

**Silent bug**: If another customer's booking has claimed the slot, is_available is clobbered from `false` back to `true`, corrupting the booking.

**Correct approach**:
```ts
async setAvailable(timeSlotId) {
  const { data, error } = await supabase
    .from("time_slots")
    .update({ is_available: true })
    .eq("id", timeSlotId)
    .eq("is_available", false)  // Ensure only unavailable slots are reopened
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);  // Return false if the slot was already available (not reopened)
}
```

---

#### 3. Storing late-cancellation threshold in code

**File**: [lib/application/booking.service.ts](lib/application/booking.service.ts)

**Anti-pattern**:
```ts
async function cancelBookingAsCustomer(bookingId, context) {
  const booking = await bookingRepo.findById(bookingId);
  const now = new Date();
  const timeDiff = booking.time_slots.start_time - now;
  const LATE_THRESHOLD_HOURS = 24;  // ❌ Hard-coded
  if (timeDiff < LATE_THRESHOLD_HOURS * 60 * 60 * 1000) {
    await emailService.sendLateCancellationAlert(booking);
  }
  // ...
}
```

**Looks correct**: The threshold is defined and used.

**Business logic inflexibility**: If the business changes the threshold to 12 hours for VIP services, the code must be changed and redeployed. There's no way to configure it per service without code changes.

**Admin/business misalignment**: Non-technical managers cannot adjust the threshold; they must ask developers.

**Correct approach**:
```ts
async function cancelBookingAsCustomer(bookingId, context, deps) {
  const booking = await bookingRepo.findById(bookingId);
  const threshold = await configRepo.getLateCancellationThreshold(booking.service_id);
  // Use threshold
}
```

Or, store threshold in service metadata:
```ts
async function cancelBookingAsCustomer(bookingId, context, deps) {
  const booking = await bookingRepo.findById(bookingId);
  const service = await serviceRepo.findById(booking.service_id);
  if (isWithinLateCancellationWindow(booking.time_slots.start_time, service.late_cancellation_hours)) {
    // ...
  }
}
```

---

#### 4. Checking availability before rebooking without atomicity

**File**: [components/booking/BookingWizard.tsx](components/booking/BookingWizard.tsx) or [app/api/booking/confirm/route.ts](app/api/booking/confirm/route.ts)

**Anti-pattern**:
```ts
const slots = await getAvailability(serviceId, therapistId, date);
if (slots.find(s => s.id === selectedSlotId)) {
  // ❌ Check: slot is available
  const { booking } = await confirmBooking({ slotId: selectedSlotId, ... });
  // This slot might have been booked between the check and the confirm!
}
```

**Looks correct**: The frontend ensures the slot is available before confirming.

**Race condition**: Between the availability check and the confirm call, another customer's booking might claim the slot.

**Silent bug**: The second customer is rejected with "slot not available," which is frustrating because the UI showed it as available moments ago.

**Correct approach**: Let `confirmBooking()` handle atomicity with no prior availability check (or accept the race as expected behavior and retry with exponential backoff on the UI).

---

#### 5. Admin reschedule implemented as cancel + create

**File**: [lib/application/admin.service.ts](lib/application/admin.service.ts) or new admin booking service

**Anti-pattern**:
```ts
async function rescheduleBooking(bookingId, newSlotId, context) {
  // ❌ Two separate operations
  await cancelBookingAsCustomer(bookingId, context);  // Sends cancellation email
  const { booking } = await confirmBooking({ slotId: newSlotId, ... });  // Sends confirmation email
}
```

**Looks correct**: The booking is cancelled and a new one is created.

**Business logic error**: The customer receives **two** emails—one saying "booking cancelled" and one saying "new booking confirmed." The customer is confused.

**Correct approach**: Treat rescheduling as a single atomic operation that updates the booking in place and sends a rescheduling notification (not separate cancel/confirm emails):
```ts
async function rescheduleBooking(bookingId, newSlotId, context) {
  // Fetch old slot, update booking to point to new slot, reopen old slot—atomically
  const updatedBooking = await bookingRepo.atomicReschedule(bookingId, newSlotId);
  // Send a single "rescheduled" email
  await emailService.sendRescheduleNotification(updatedBooking);
}
```

---

#### 6. Email template data fetched asynchronously after sending

**File**: Any email sending code

**Anti-pattern**:
```ts
async function sendConfirmationEmail(bookingId) {
  // ❌ Send email immediately
  await emailService.send(booking.customer_email, "confirm", { bookingId });
  
  // Then fetch details (too late—email is already sent with minimal info)
  const details = await bookingRepo.getFullDetails(bookingId);
}
```

**Looks correct**: Email is sent, then details are fetched.

**Silent bug**: Email is sent before the details are available. If the template expects service name, therapist name, etc., the email might contain placeholders or be missing data.

**Correct approach**: Fetch all data first, then send:
```ts
async function sendConfirmationEmail(bookingId) {
  const details = await bookingRepo.getFullDetails(bookingId);
  await emailService.send(details.customer_email, "confirm", details);
}
```

---

#### 7. Authorization check in the route instead of the service

**File**: [app/api/booking/[bookingId]/cancel/route.ts](app/api/booking/[bookingId]/cancel/route.ts)

**Anti-pattern**:
```ts
export async function POST(request: Request, { params }) {
  const current = await getCurrentUser();
  const booking = await bookingRepo.findById(params.bookingId);
  
  // ❌ Authorization in the route
  if (booking.customer_id !== current.profile.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  
  // Then call service
  await cancelBooking(booking.id);
}
```

**Looks correct**: The route checks ownership before proceeding.

**Architectural issue**: If another route or service calls `cancelBooking()` directly (e.g., from an admin reschedule function), the authorization check is bypassed. The service layer must enforce its own authorization.

**Correct approach**: Move authorization to the service:
```ts
async function cancelBookingAsCustomer(bookingId, context, deps) {
  const booking = await deps.bookingRepo.findById(bookingId);
  if (booking.customer_id !== context.customerProfileId) {
    throw new UnauthorizedError("You can only cancel your own bookings.");
  }
  // ... proceed with cancellation
}

// Route:
export async function POST(request, { params }) {
  const current = await getCurrentUser();
  await cancelBookingAsCustomer(params.bookingId, {
    customerProfileId: current.profile.id
  });
  return NextResponse.json({ success: true });
}
```

---

## Summary Table: Features by Friction

| # | Feature | Friction | Key Challenge | Dependencies |
|---|---------|----------|---|---|
| 1 | Auth gate with service memory | LOW | None | None |
| 2 | Booking confirmation email | LOW-MED | Email infrastructure | None |
| 3 | Admin notification on bookings | MEDIUM | Late-cancellation detection | #2 |
| 4 | Cancellation confirmation email | MED-HIGH | Atomic slot reopening, race conditions | #2, existing repos |
| 5 | Transparent cancellation protocol | HIGH | Multi-step atomicity, admin reschedule, slot lifecycle | #2, #3, #4 |

---

## Conclusion

This cohort of 5 features spans a range from trivial (Feature 1, pure UI) to architecturally demanding (Feature 5, multi-layer transaction coordination). The recommended implementation order—1 → 2 → 3 → 4 → 5—ensures that each feature's dependencies are met and that shared infrastructure (email service, atomic slot reopening) is established once and reused consistently.

The highest risks are concentrated in Features 4 and 5, where slot-reopening race conditions and concurrent booking scenarios must be handled with precision. Any mis-implementation of slot atomicity will silently corrupt the booking database, manifesting only when therapists are double-booked.

Written with attention to architectural violations, this report aims to equip developers with a clear taxonomy of friction points, dependencies, and anti-patterns—enabling informed planning and careful, intentional implementation.

---

## Verification Audit

**Date**: March 5, 2026  
**Verification Method**: Read-only source code review against 7 specific claims made in the friction report  
**Result**: 6/7 claims confirmed correct. 1 claim required correction.

This section documents the verification process and audit findings.

### Verification Summary

| Claim # | Claim | Status | Evidence | Impact on Report |
|---------|-------|--------|----------|-----------------|
| 1 | `setAvailable()` in [lib/infra/supabase/timeSlot.repo.ts](lib/infra/supabase/timeSlot.repo.ts) (lines 89–96) lacks atomic WHERE condition; uses only `.eq("id", timeSlotId)` without checking `is_available` state first. | ✅ CONFIRMED | Source file: `.update({ is_available: true }).eq("id", timeSlotId)`. No secondary WHERE condition. Compare to `lockSlot()` (lines 63–75) and `tryMarkAsBooked()` (lines 77–85), both of which use secondary WHERE conditions. | Critical friction validated. Race-condition risk is real. Must be fixed before Features 4 & 5. |
| 2 | No email sending capability exists in [lib/application/booking.service.ts](lib/application/booking.service.ts). Function `confirmBooking()` (lines ~120–180) returns booking and reference code with no email calls. | ✅ CONFIRMED | Verified by grep search: no `sendEmail`, `mail`, `notification`, or SMTP calls in `booking.service.ts`. Email service does not exist in `lib/infra/`. | Email infrastructure must be built from scratch in Feature 2. |
| 3 | No shared email utility exists in the codebase that other services can reuse. | ✅ CONFIRMED | Grep search across entire `lib/` folder found no `email.service.ts`, `notification.service.ts`, or similar. No utility functions for template rendering or retry logic. | Email infrastructure is greenfield work; all 5 features depend on it being built first. |
| 4 | [app/api/booking/confirm/route.ts](app/api/booking/confirm/route.ts) calls `confirmBooking()` service function from [lib/application/booking.service.ts](lib/application/booking.service.ts). | ✅ CONFIRMED | Source verified: route.ts line ~30 calls `await confirmBooking(...)`. Service function exists at lines ~120–180 of booking.service.ts. | Architecture integration is correctly documented. |
| 5 | [lib/application/admin.service.ts](lib/application/admin.service.ts) calls `assertAdmin(context)` function at the start of all 18 exported admin functions to enforce RBAC. | ✅ CONFIRMED | Verified all 18 exported functions (e.g., `createService`, `updateService`, `deleteBooking`, `listTherapists`). Each begins with `if (context.role !== "admin") throw new UnauthorizedError(...)` or calls `assertAdmin(context)` at line ~38. No violations found. | RBAC is consistent and correctly enforced. No gaps. |
| 6 | [app/(customer)/dashboard/page.tsx](app/(customer)/dashboard/page.tsx) has no cancel booking UI; customers cannot cancel. | ❌ INCORRECT (CORRECTED) | Dashboard page imports [CancelBookingButton](components/booking/CancelBookingButton.tsx) at line 10 and renders it at line 109: `<CancelBookingButton id={booking.id} />`. The button exists and is functional. However, it calls `DELETE /api/booking/{id}`, and that endpoint **does not exist** (see Claim 7). | **Report corrected**: Feature 4 & 5 sections now document that CancelBookingButton already exists and triggers the customer cancel flow. The missing piece is the backend DELETE endpoint, not the UI button. |
| 7 | No customer-facing `DELETE /api/booking/[id]` endpoint exists. Folder [app/api/booking/[id]/](app/api/booking/[id]/) is empty. | ✅ CONFIRMED | Verified: `list_dir("app/api/booking/[id]/")` returned "Folder is empty". Grep search for "DELETE" in `app/api/booking/**` found no matches. Admin-only DELETE endpoint exists at [app/api/admin/bookings/route.ts](app/api/admin/bookings/route.ts) (lines 95–135) and is protected by `assertAdmin()` function. | **CRITICAL FRICTION POINT**: CancelBookingButton calls this non-existent endpoint, creating silent failure scenario. Customers see a clickable "Cancel" button, but it returns 404. Documented in Feature 5 as "CRITICAL MISSING ENDPOINT". |

### Key Findings

#### Inaccuracy Requiring Correction

**Claim #6**: The friction report originally stated that the dashboard has no cancel booking UI and customers have no way to cancel. **Verification revealed**: The `CancelBookingButton` component exists, is imported into the dashboard, and is rendered. The UI trigger for cancellation is **already in place**.

**Correction made**: Features 4 & 5 sections were updated to reflect that the `CancelBookingButton` already exists. The actual friction point is not "there's no button" but rather "the button calls an endpoint that doesn't exist" (Claim #7, confirmed).

**Business impact**: The inaccuracy shifted the scope of Features 4 & 5 slightly—fewer UI elements need to be built, but the missing endpoint is more critical and urgent to address.

---

#### Critical Discovery

**Claim #7**: The customer-facing `DELETE /api/booking/[id]` endpoint does not exist.

**Impact**: A customer can see and click the "Cancel Booking" button in their dashboard, but when they click it, their browser receives a 404 error. No cancellation email is sent. The therapist is not notified. The slot is never reopened. The customer has no clear feedback that the cancellation failed—it appears as a silent failure from the UX perspective.

**Root cause**: The route file was not created. The folder exists (`app/api/booking/[id]/`) but is empty, missing `route.ts`.

**Workaround risk**: If a developer tries to route the DELETE request to `/api/admin/bookings` instead, the customer would receive a 401 Unauthorized error (from `assertAdmin()` blocking non-admin users), which is incorrect behavior but at least explicit.

**Urgency**: Creating this endpoint is critical to Feature 4 (Cancellation email) and Feature 5 (Transparent protocol) implementation. Without it, the entire cancellation flow fails silently.

---

#### Architecture Validation

All 6 confirmed claims validate the architectural model documented in earlier sections of this report:
- Atomicity patterns in repos (WHERE conditions) are inconsistently applied
- Email infrastructure is absent and must be designed from scratch
- RBAC is consistently enforced across admin services
- Integration points between layers follow the established pattern

---

### Changes Made to Report

Based on verification findings:

1. **Feature 4 (Cancellation email)**: 
   - "What already exists" section updated to document `CancelBookingButton` presence and current behavior
   - "Friction points" section updated to clarify that the button exists but the endpoint doesn't, creating a gap
   - Feature description now correctly frames cancellation as "UI trigger exists; backend route missing"

2. **Feature 5 (Transparent cancellation protocol)**:
   - "What already exists" section updated to document `CancelBookingButton` handling customer trigger
   - Clarified that friction is in server-side protocol design, not client-side UI
   - Added new "CRITICAL MISSING ENDPOINT" friction point documenting the silent failure scenario
   - API layer impact score increased from 2 → 3 due to missing endpoint severity

3. **This section**: Verification Audit appended to end of report with claim-by-claim audit table

---

### Conclusion

The friction analysis report is **substantially accurate**. The one inaccuracy (dashboard cancel UI) was corrected through verification. The audit uncovered a **critical missing endpoint** that creates a silent-failure user experience and must be prioritized in Features 4 & 5. All other claims are grounded in reviewed source code and verified correct.

