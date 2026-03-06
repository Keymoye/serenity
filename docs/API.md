Last updated: March 5, 2026 | Auto-generated from source

# API Routes Reference

This document lists every server route implemented under `app/api/` along with its HTTP method, input and output schemas, authentication requirements, and known error responses. All information is extracted directly from the current source code.

---

## /api/auth/login
- **Method**: POST
- **Auth required**: no
- **Request body** (validated by `loginSchema`):
  ```ts
  { email: string; password: string; }
  ```
- **Success**: `200 { success: true }`
- **Errors**:
  - `400 VALIDATION_ERROR` when input fails schema
  - Domain/internal errors mapped via `mapErrorToLegacyHttp` (e.g. `LOGIN_FAILED` ⇒ 500)

## /api/auth/logout
- **Method**: POST
- **Auth required**: yes (implicitly by Supabase session)
- **Request body**: none
- **Success**: `200 { success: true }`
- **Errors**: any thrown error mapped via `mapErrorToLegacyHttp`

## /api/auth/register
- **Method**: POST
- **Auth required**: no
- **Request body** (`registerSchema`):
  ```ts
  { email: string; password: string; confirmPassword: string; name: string; phone?: string; }
  ```
- **Success**: `200 { success: true; requiresEmailConfirmation: boolean }`
- **Errors**:
  - `400 VALIDATION_ERROR` for bad input
  - Other domain/internal errors from `register()`

## /api/auth/reset-password
- **Method**: POST
- **Auth required**: no
- **Request body** (`resetPasswordRequestSchema`):
  ```ts
  { email: string; redirectTo?: string }
  ```
- **Success**: `200 { success: true }`
- **Errors**:
  - `400 VALIDATION_ERROR`
  - Internal errors from `requestPasswordReset()`

## /api/auth/reset-password/confirm
- **Method**: POST
- **Auth required**: no
- **Request body** (ad‑hoc Zod schema):
  ```ts
  { access_token: string; refresh_token: string; password: string }
  ```
- **Success**: `200 { success: true }`
- **Errors**:
  - `400 VALIDATION_ERROR` when tokens or password missing/invalid
  - Internal errors from `confirmPasswordRecovery()`

## /api/profile (PATCH)
- **Method**: PATCH
- **Auth required**: yes (must have current user)
- **Request body** (`profileUpdateSchema`):
  ```ts
  { name: string; phone?: string }
  ```
- **Success**: `200 { success: true }`
- **Errors**:
  - `401 UNAUTHENTICATED` if session absent
  - `400 VALIDATION_ERROR` on bad payload
  - Domain/internal errors via `updateProfile()`

## /api/profile/password (POST)
- **Method**: POST
- **Auth required**: yes
- **Request body**: `{ password?: string }` (no schema)
- **Success**: `200 { success: true }`
- **Errors**:
  - `401 UNAUTHENTICATED`
  - Errors from `updatePasswordForCurrentUser()` (validation or internal)

## /api/booking/availability (POST)
- **Method**: POST
- **Auth required**: yes
- **Request body**:
  ```ts
  { serviceId?: string; therapistId?: string; date?: string; }
  ```
- **Success**: `200 { slots: Array<{ id: string; start_time: string; end_time: string }> }`
- **Errors**:
  - `401 UNAUTHENTICATED`
  - Validation/logic errors from `getAvailability()`

## /api/booking/lock (POST)
- **Method**: POST
- **Auth required**: yes
- **Request body**: `{ timeSlotId?: string }`
- **Success**: `200 { success: true }`
- **Errors**:
  - `401 UNAUTHENTICATED`
  - `ValidationError` if missing
  - `ConflictError` (`SLOT_TAKEN`)
  - Other internal errors

## /api/booking/confirm (POST)
- **Method**: POST
- **Auth required**: yes
- **Request body** (`bookingConfirmSchema`):
  ```ts
  { serviceId: string; therapistId: string; timeSlotId: string; notes?: string }
  ```
- **Success**: `200 { booking: Booking; referenceCode: string }`
- **Errors**:
  - `401 UNAUTHENTICATED`
  - `400 VALIDATION_ERROR` when schema fails
  - `ConflictError` (`SLOT_ALREADY_BOOKED`)
  - Other internal errors

## /api/booking/[id] (DELETE)
- **Method**: DELETE
- **Auth required**: yes (must provide route param `id` as booking UUID)
- **Parameters**: route param `id` (booking ID)
- **Success**: `200 { success: true; data: Booking }`
- **Errors**:
  - `401 UNAUTHENTICATED` when not authenticated
  - `400 VALIDATION_ERROR` when booking ID is missing or invalid
  - `404 NOT_FOUND` when booking not found or doesn't belong to authenticated customer
  - `409 CONFLICT` when booking is already cancelled

## /api/contact (POST)
- **Method**: POST
- **Auth required**: no
- **Request body** (`contactFormSchema`):
  ```ts
  { fullName: string; email: string; phone?: string; subject: string; message: string }
  ```
- **Success**: `200 { success: true }`
- **Errors**:
  - `400 VALIDATION_ERROR`
  - `400`/`429` for rate limit (`RATE_LIMIT` code)
  - Internal errors from `submitContactMessage()`

## /api/services (GET)
- **Method**: GET
- **Auth required**: no
- **Request body**: none
- **Success**: `200` array of service summaries (`id`, `name`, `category`, `duration_minutes`)
- **Errors**: internal errors from `listBookingServices()`

## /api/services/[id]/therapists (GET)
- **Method**: GET
- **Auth required**: no
- **Parameters**: route param `id` (service ID)
- **Success**: `200` array of therapists (`id`, `name`, `title`)
- **Errors**: internal errors mapped via errorMapper

## /api/therapists/[id] (GET)
- **Method**: GET
- **Auth required**: no
- **Parameters**: route param `id` (therapist ID)
- **Success**: `200 { therapist: Therapist; services: Service[] }` or `404 Not found`
- **Errors**: internal errors

## Admin routes
All admin endpoints require a logged‑in user and are validated using `getCurrentUser()`; 401 is returned for missing session.

### /api/admin/bookings
- **GET**: returns list of booking rows with optional query filters (`startDate`, `endDate`, `limit`, `offset`)
- **PUT**: body `{ bookingId, status }` validated by `adminBookingStatusSchema`; returns updated row
- **DELETE**: body containing `bookingId`; returns `{ success: true }`

### /api/admin/therapists
- **GET**: list all therapists
- **POST**: create therapist (validated with `adminTherapistSchema`)
- **PUT**: update therapist (validated with `adminTherapistUpdateSchema`)
- **DELETE**: body with `therapistId`

### /api/admin/services
- **GET**: list all services
- **POST**: create service (`adminServiceSchema`)
- **PUT**: update service (`adminServiceUpdateSchema`)
- **DELETE**: query param `id` as service ID

### /api/admin/time-slots
- **GET**: list all time slots
- **POST**: create slot (`adminTimeSlotCreateSchema`)
- **DELETE**: body with `timeSlotId`

### /api/admin/messages
- **GET**: list all messages
- **PUT**: toggle read/unread (`{ id, is_read }`)

---

> ⚠️ All errors are mapped using `lib/utils/errorMapper.mapErrorToLegacyHttp` unless otherwise noted. Clients should interpret `code` fields for user‑facing messages.
