# Architecture

## Layer diagram (ASCII art)
```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  React Components (app/, components/)                       │
│  ────────────────────────────────────────────────────────── │
│  No external service imports                                 │
│  Calls API routes via fetch/apiFetch                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (HTTP)
┌─────────────────────────────────────────────────────────────┐
│                    API Routes Layer                         │
│  Next.js Route Handlers (app/api/)                          │
│  ────────────────────────────────────────────────────────── │
│  HTTP concerns only (request/response)                      │
│  Validation with Zod schemas                               │
│  Calls application services                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (function calls)
┌─────────────────────────────────────────────────────────────┐
│                Application Services Layer                   │
│  Business logic (lib/application/)                          │
│  ────────────────────────────────────────────────────────── │
│  Domain errors, business rules, orchestration               │
│  Calls infrastructure repositories                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (repository calls)
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer                          │
│  External service clients (lib/infra/)                     │
│  ────────────────────────────────────────────────────────── │
│  Supabase clients, Resend, Upstash, Storage                 │
│  No business logic                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (network calls)
┌─────────────────────────────────────────────────────────────┐
│                     External Services                        │
│  Supabase (DB/Auth/Storage), Resend, Upstash               │
└─────────────────────────────────────────────────────────────┘
```

## Layer rules

### UI Layer (components/, app/ pages)
**Can import from:**
- Other UI components
- lib/utils/ (shared utilities)
- lib/domain/types.ts (type definitions only)
- lib/config/constants.ts

**Cannot import from:**
- lib/infra/ (infrastructure clients)
- lib/application/ (business logic)
- External service libraries (Supabase, Resend, etc.)

### API Routes Layer (app/api/)
**Can import from:**
- lib/application/ (business logic services)
- lib/utils/validation.ts (Zod schemas)
- lib/utils/errorMapper.ts
- lib/infra/supabase/currentUser.ts (auth helpers)

**Cannot import from:**
- lib/infra/ (direct infrastructure access)
- External service libraries (use services instead)

### Application Services Layer (lib/application/)
**Can import from:**
- lib/domain/ (types, errors)
- lib/config/constants.ts
- lib/utils/ (date formatting, etc.)
- lib/infra/ (repositories only)

**Cannot import from:**
- HTTP-specific code (NextResponse, Request)
- UI components
- External services directly (use repositories)

### Infrastructure Layer (lib/infra/)
**Can import from:**
- External service libraries (Supabase, Resend, Upstash)
- lib/utils/logger.ts
- lib/domain/ (types only, no business logic)

**Cannot import from:**
- lib/application/ (business logic)
- UI components
- HTTP concerns

## Request lifecycle

### Booking confirmation flow example:
```
Browser (BookingWizard step 4)
  │
  ▼ POST /api/booking/confirm
  │   { serviceId, therapistId, timeSlotId, notes }
  │
app/api/booking/confirm/route.ts
  │ 1. requireCustomer() - validates session
  │ 2. Zod validates request body
  │ 3. confirmBooking(input, context)
  │
lib/application/booking.service.ts
  │ 1. Validates slot is still locked
  │ 2. bookingRepo.createBooking()
  │ 3. timeSlotRepo.tryMarkAsBooked()
  │ 4. sendBookingConfirmation()
  │ 5. sendAdminNewBookingNotification()
  │
lib/infra/supabase/booking.repo.ts
  │ 1. getSupabaseUserClient()
  │ 2. Insert booking row
  │ 3. Return created booking
  │
Supabase Database
  │ 1. RLS allows insert (auth.uid() = customer_id)
  │ 2. Unique index prevents double booking
  │ 3. Returns new booking row
  │
lib/infra/supabase/timeSlot.repo.ts
  │ 1. Call try_lock_slot() RPC function
  │ 2. Atomic update: is_available = false
  │ 3. Returns success/failure
  │
lib/utils/emailService.ts
  │ 1. Resend client sends emails
  │ 2. Templates generated from booking data
  │ 3. Errors logged but don't fail request
  │
Response flows back through layers:
  bookingRepo → booking.service → API route → Browser
```

## Auth flow

### Complete authentication sequence:
```
1. User submits login form (email + password)
   ↓
2. POST /api/auth/login
   Body: { email, password }
   ↓
3. lib/infra/supabase/auth.repo.ts
   signInWithPassword(email, password)
   ↓
4. Supabase Auth validates credentials
   Returns session (access_token + refresh_token)
   ↓
5. getSupabaseServerAuthClient() sets session cookies
   @supabase/ssr handles cookie management
   ↓
6. Middleware runs on every protected route
   - Reads session from cookies
   - Checks user exists in profiles table
   - Validates role for admin routes
   ↓
7. API routes call requireAdmin() or requireCustomer()
   - Reads session via getSupabaseUserClient()
   - Throws UnauthorizedError if no session
   - Throws ForbiddenError if wrong role
   ↓
8. Error mapped to HTTP response
   UnauthorizedError → 401
   ForbiddenError → 403
```

### Middleware protected routes:
```typescript
// middleware.ts
const CUSTOMER_PATHS = ["/dashboard", "/profile", "/book"];
const ADMIN_PREFIX = "/admin";

// Customer route protection
if (isCustomerRoute && !session?.user) {
  return NextResponse.redirect("/auth/login?next=...");
}

// Admin route protection  
if (isAdminRoute) {
  if (!session?.user) return NextResponse.redirect("/auth/login");
  const profile = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();
  if (profile.role !== "admin") {
    return NextResponse.redirect("/");
  }
}
```

## Error handling pattern

### Error chain from service to client:
```
1. Service throws domain error
   throw new ValidationError("Invalid date format");
   ↓
2. API route catches and maps
   try {
     await serviceFunction();
   } catch (error) {
     const { status, body } = mapErrorToLegacyHttp(error);
     return NextResponse.json(body, { status });
   }
   ↓
3. Error mapper converts to HTTP response
   lib/utils/errorMapper.ts:
   ValidationError → { status: 400, body: { error: "...", code: "VALIDATION_ERROR" } }
   ConflictError → { status: 409, body: { error: "...", code: "CONFLICT" } }
   ↓
4. Client receives JSON error
   apiFetch() throws on non-2xx responses
   useApi() hook exposes error state
   ↓
5. UI displays error message
   {error && <div className="text-red-600">{error}</div>}
```

### Error response shape:
```typescript
interface ErrorResponse {
  error: string;    // Human readable message
  code: string;      // Machine readable code
}
```

## Rate limiting pattern

### Upstash Redis sliding window:
```typescript
// lib/infra/upstash/ratelimit.ts
export const authRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "15 m"), // 10 requests per 15 minutes
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null;

// Usage in API route
const ip = request.ip || "unknown";
const { blocked } = await checkRateLimit(`login:${ip}`, authRatelimit);
if (blocked) {
  return NextResponse.json(
    { error: "Too many requests", code: "RATE_LIMITED" },
    { status: 429 }
  );
}
```

### Graceful degradation:
- If Redis not configured (development), `checkRateLimit()` returns `blocked: false`
- Rate limiting is production-only feature
- No Redis dependency blocks development workflow

### Protected endpoints:
- POST /api/auth/login
- POST /api/auth/register  
- POST /api/auth/magic-link
- POST /api/auth/reset-password

### Identifier pattern:
`"endpoint:ip_address"` - e.g., `"login:192.168.1.100"`

### Headers returned on rate limit:
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1704067200000
```
