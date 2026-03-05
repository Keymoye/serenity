Last updated: March 5, 2026 | Auto-generated from source

# Application Services

This document inventories every service file under `lib/application/`. For each exported function we list parameters, return type, and notable domain errors.

---

## auth.service.ts

```ts
export async function login(input: { email: string; password: string }, deps?: AuthDependencies): Promise<void>
```
- Throws `ValidationError` if credentials missing
- Wraps repo call; on failure throws `InternalError("LOGIN_FAILED")`

```ts
export async function register(input: { email: string; password: string; name: string; phone?: string | null }, deps?: AuthDependencies): Promise<{ requiresEmailConfirmation: boolean }>
```
- Validates required fields; `ValidationError` on missing
- On repo error throws `InternalError("REGISTER_FAILED")`

```ts
export async function requestPasswordReset(input: { email: string; redirectTo?: string }, deps?: AuthDependencies): Promise<void>
```
- `ValidationError` if email missing
- Wraps repo; throws `InternalError("RESET_FAILED")`

```ts
export async function updatePassword(input: { password: string }, deps?: AuthDependencies): Promise<void>
```
- `ValidationError` if password not ≥8 chars
- `InternalError("UPDATE_FAILED")` on repo error

```ts
export async function confirmPasswordRecovery(input: { accessToken: string; refreshToken: string; password: string }, deps?: AuthDependencies): Promise<void>
```
- Validates tokens and password; throws `ValidationError` on issue
- Attempts to set session then update password; errors produce `InternalError("UPDATE_FAILED")`

```ts
export async function logout(deps?: AuthDependencies): Promise<void>
```
- Wraps repo sign‑out; throws `InternalError("SIGN_OUT_FAILED")`
```

The file uses dependency injection via `AuthDependencies` containing `authRepo`.

---

## profile.service.ts

```ts
export async function updateProfile(input: { name: string; phone?: string | null }, context: ProfileContext, deps?: ProfileDependencies): Promise<void>
```
- Requires valid `userId` and `profileId` in context; otherwise `UnauthorizedError`
- `ValidationError` if name missing
- `InternalError("UPDATE_FAILED")` on repo failure

```ts
export async function updatePasswordForCurrentUser(input: { password: string }, context: ProfileContext, deps?: ProfileDependencies): Promise<void>
```
- `UnauthorizedError` if context.userId missing
- `ValidationError` if password length <8
- `InternalError("UPDATE_FAILED")` on repo failure

Dependencies: `profileRepo` and `authRepo`.

---

## booking.service.ts

```ts
export async function getAvailability({ serviceId, therapistId, date }: { serviceId: string; therapistId: string; date: string }, deps?: BookingDependencies): Promise<Pick<TimeSlot, "id" | "start_time" | "end_time">[]>
```
- Throws `ValidationError` for missing params
- Checks therapist assignment; may throw `ValidationError("THERAPIST_NOT_ASSIGNED")`
- Queries slots and filters out unavailable/locked ones

```ts
export async function lockSlot({ timeSlotId }: { timeSlotId: string }, _context: BookingContext, deps?: BookingDependencies): Promise<void>
```
- `ValidationError` if no id
- Attempts to lock; if unsuccessful throws `ConflictError("SLOT_TAKEN")`

```ts
export async function confirmBooking(payload: BookingConfirmInput, context: BookingContext, deps?: BookingDependencies): Promise<{ booking: Booking; referenceCode: string }>
```
- `ValidationError` if payload.timeSlotId missing
- Generates reference code; attempts atomic slot mark
- Throws `ConflictError("SLOT_ALREADY_BOOKED")` if slot update fails
- On booking insert failure, tries rollback and throws `InternalError("INSERT_FAILED")`

```ts
export async function listCustomerBookings(context: BookingContext, deps?: BookingDependencies)
```
- `ValidationError` if missing context.customerProfileId
- Returns rows or throws `InternalError("BOOKINGS_FAILED")`

Dependencies include repositories for time slots, bookings, and services.

---

## contact.service.ts

```ts
export async function submitContactMessage(input: { fullName: string; email: string; phone?: string | null; subject: string; message: string }, context: { ipAddress: string }, deps?: ContactDependencies): Promise<void>
```
- Validates required fields; `ValidationError("Invalid form data.")`
- Rate‑limits per IP (max 5/hour); throws `ValidationError("RATE_LIMIT")`
- On insert failure throws `InternalError("INSERT_FAILED")`

Dependencies: `messageRepo`.

---

## service.service.ts

```ts
export async function listPublicServices(input: { category?: string }, deps?: ServiceDependencies)
```
- Returns active services or throws `InternalError("SERVICES_FAILED")`

```ts
export async function getPublicServiceDetail(input: { id: string }, deps?: ServiceDependencies)
```
- Returns `{ service, images, therapists }` or null; wraps errors in `InternalError("SERVICE_DETAIL_FAILED")`

```ts
export async function listBookingServices(deps?: ServiceDependencies)
```
- Returns active services; errors map to `InternalError("SERVICES_FAILED")`

```ts
export async function listFeaturedServices(deps?: ServiceDependencies)
```
- Returns featured services; throws `InternalError("SERVICES_FAILED")`

```ts
export async function listTherapistsForService(input: { serviceId: string }, deps?: ServiceDependencies)
```
- Filters out inactive therapists; errors produce `InternalError("THERAPISTS_FAILED")`

```ts
export async function getTherapistDetail(input: { therapistId: string }, deps?: ServiceDependencies)
```
- Looks up therapist via therapist repo and service repo; errors produce `InternalError("THERAPIST_DETAIL_FAILED")`

> ⚠️ Partial DI escape — therapistRepo is not injected via deps in this function

---

## therapist.service.ts

```ts
export async function listPublicTherapists(deps?: TherapistDependencies)
```
- Returns active therapists or throws `InternalError("THERAPISTS_FAILED")`

---

## admin.service.ts

This file contains all admin‑only logic. Each function begins by asserting the context role is `admin` (otherwise `UnauthorizedError`). The exports include:

- `listServices`, `createServiceAdmin`, `updateServiceAdmin`, `deleteServiceAdmin`
- `listTherapistsAdmin`, `createTherapistAdmin`, `updateTherapistAdmin`, `deleteTherapistAdmin`
- `listBookingsAdmin`, `listAdminBookingRows`, `updateBookingStatusAdmin`, `deleteBookingAdmin`
- `listTimeSlotsAdmin`, `createTimeSlotAdmin`, `deleteTimeSlotAdmin`
- `listMessagesAdmin`, `toggleMessageReadAdmin`
- `getAdminMetrics` (returns dashboard counts)

Validation errors thrown for missing required fields (e.g. service name), and repository errors propagate as thrown by repo.


---

> All services use dependency‑injection patterns with a `createDefaultDeps()` function providing real repositories. This makes unit testing easy.
