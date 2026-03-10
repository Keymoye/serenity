# Architecture
> Last updated: Batch 9 (March 2026)

## Layer diagram (ASCII art)
┌─────────────────────────────────────┐
│             UI Layer                │
│  app/(public) · (customer) · (admin)│
│  components/                        │
└──────────────┬──────────────────────┘
│ fetch / server action
▼
┌─────────────────────────────────────┐
│             API Layer               │
│  app/api/**  route handlers         │
│  Zod validation · auth guards       │
└──────────────┬──────────────────────┘
│ calls service functions
▼
┌─────────────────────────────────────┐
│         Application Layer           │
│  lib/application/  services         │
│  business logic · orchestration     │
└──────────────┬──────────────────────┘
│ calls repos
▼
┌─────────────────────────────────────┐
│        Infrastructure Layer         │
│  lib/infra/supabase/  repos         │
│  lib/infra/resend/                  │
│  lib/infra/upstash/                 │
└──────────────┬──────────────────────┘
│
▼
┌─────────────────────────────────────┐
│         External Services           │
│  Supabase DB · Resend · Upstash     │
│  Supabase Storage                   │
└─────────────────────────────────────┘

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

Browser request
│
▼
middleware.ts — session check
│
┌──┴──┐
yes    no
│      └──▶ redirect /auth/login
▼
app/api/route handler
│
▼
requireAdmin() / requireCustomer()
│
▼
Zod.parse(body) — 400 if invalid
│
▼
service function (lib/application/)
│
▼
repo function (lib/infra/supabase/)
│
▼
Supabase client → DB query
│
▼
domain object returned
│
▼
NextResponse.json() — HTTP response

## Auth flow

Request to /admin/* or /dashboard/*
│
▼
middleware.ts reads Supabase session cookie
│
┌──┴───────────────┐
no session          session exists
│                     │
▼                  check role
redirect             ┌───┴───┐
/auth/login        admin  customer
│        │
/admin/*   /dashboard
/profile   /book
│        │
requireAdmin  requireCustomer
│        │
403 if not  401 if no
admin      session

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

Domain error thrown in service
e.g. NotFoundError, ConflictError
│
▼
bubbles to route handler catch block
│
▼
mapErrorToLegacyHttp(error)
┌─────────────────────────┐
│ NotFoundError   → 404   │
│ ForbiddenError  → 403   │
│ ConflictError   → 409   │
│ ValidationError → 400   │
│ Unknown         → 500   │
└─────────────────────────┘
│
▼
NextResponse.json(body, { status })
{ error: "message", code: "CODE" }

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
