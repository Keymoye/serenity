# Error Handling

## Domain errors
All errors extend the `DomainError` base class and are defined in `lib/domain/errors.ts`. This provides a consistent error handling pattern across the entire application.

### Error class hierarchy
```typescript
// lib/domain/errors.ts
export class DomainError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
  }
}
```

### Error types and HTTP mappings

| Class | Code | HTTP Status | When to throw | Example message |
|-------|------|-------------|--------------|-----------------|
| `ValidationError` | `VALIDATION_ERROR` | 400 | Bad input data | "Invalid date format" |
| `NotFoundError` | `NOT_FOUND` | 404 | Resource missing | "Service not found" |
| `ConflictError` | `CONFLICT` | 409 | Double booking, duplicate | "Slot already booked" |
| `UnauthorizedError` | `UNAUTHORIZED` | 401 | Not logged in | "Authentication required" |
| `ForbiddenError` | `FORBIDDEN` | 403 | Wrong role | "Admin access required" |
| `InternalError` | `INTERNAL_ERROR` | 500 | Unexpected failures | "Database connection failed" |

### Error class definitions

#### ValidationError
```typescript
export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown, code = "VALIDATION_ERROR") {
    super(code, message, details);
  }
}
```

**Usage examples:**
```typescript
// Invalid input format
throw new ValidationError("Invalid email format");

// With additional details
throw new ValidationError("Invalid booking data", {
  field: "timeSlotId",
  value: "invalid-uuid"
});

// Custom error code
throw new ValidationError("Slot expired", null, "SLOT_EXPIRED");
```

#### NotFoundError
```typescript
export class NotFoundError extends DomainError {
  constructor(message: string, details?: unknown) {
    super("NOT_FOUND", message, details);
  }
}
```

**Usage examples:**
```typescript
// Service not found
throw new NotFoundError("Service not found");

// With context
throw new NotFoundError("Therapist not available", { therapistId });
```

#### ConflictError
```typescript
export class ConflictError extends DomainError {
  constructor(code = "CONFLICT", message = "Conflict", details?: unknown) {
    super(code, message, details);
  }
}
```

**Usage examples:**
```typescript
// Default conflict
throw new ConflictError();

// Custom message
throw new ConflictError("CONFLICT", "Time slot already booked");

// Custom code and details
throw new ConflictError("SLOT_UNAVAILABLE", "Slot was just booked", {
  slotId,
  lockedBy: "another-user"
});
```

#### UnauthorizedError
```typescript
export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized", details?: unknown) {
    super("UNAUTHORIZED", message, details);
  }
}
```

**Usage examples:**
```typescript
// Default message
throw new UnauthorizedError();

// Custom message
throw new UnauthorizedError("Session expired");
```

#### ForbiddenError
```typescript
export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden", details?: unknown) {
    super("FORBIDDEN", message, details);
  }
}
```

**Usage examples:**
```typescript
// Default message
throw new ForbiddenError();

// With context
throw new ForbiddenError("Admin access required", { userRole: "customer" });
```

#### InternalError
```typescript
export class InternalError extends DomainError {
  constructor(code = "INTERNAL_ERROR", message = "Internal server error.", details?: unknown) {
    super(code, message, details);
  }
}
```

**Usage examples:**
```typescript
// Default internal error
throw new InternalError();

// With specific code
throw new InternalError("DB_CONNECTION_FAILED", "Database unavailable");

// With details for debugging
throw new InternalError("EXTERNAL_API_FAILED", "Payment service error", {
  service: "stripe",
  errorCode: "card_declined"
});
```

## Error flow

### Complete error handling chain:
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

   ↓

4. Client receives JSON error
   apiFetch() throws on non-2xx responses
   useApi() hook exposes error state

   ↓

5. UI displays error message
   {error && <div className="text-red-600">{error}</div>}
```

### Error mapper implementation
```typescript
// lib/utils/errorMapper.ts
export function mapErrorToLegacyHttp(error: unknown): { status: number; body: ErrorResponse } {
  if (error instanceof ValidationError) {
    return { status: 400, body: { error: error.message, code: error.code } };
  }
  if (error instanceof NotFoundError) {
    return { status: 404, body: { error: error.message, code: error.code } };
  }
  if (error instanceof ConflictError) {
    return { status: 409, body: { error: error.message, code: error.code } };
  }
  if (error instanceof UnauthorizedError) {
    return { status: 401, body: { error: error.message, code: error.code } };
  }
  if (error instanceof ForbiddenError) {
    return { status: 403, body: { error: error.message, code: error.code } };
  }
  if (error instanceof InternalError) {
    return { status: 500, body: { error: error.message, code: error.code } };
  }
  
  // Fallback for unexpected errors
  return {
    status: 500,
    body: { error: "Internal server error", code: "INTERNAL_ERROR" }
  };
}
```

### Error response shape
```typescript
interface ErrorResponse {
  error: string;    // Human readable message
  code: string;      // Machine readable code
}
```

**Example responses:**
```json
// Validation error (400)
{
  "error": "Invalid date format",
  "code": "VALIDATION_ERROR"
}

// Not found error (404)
{
  "error": "Service not found",
  "code": "NOT_FOUND"
}

// Conflict error (409)
{
  "error": "Time slot already booked",
  "code": "CONFLICT"
}

// Internal error (500)
{
  "error": "Database connection failed",
  "code": "DB_CONNECTION_FAILED"
}
```

## Client error handling

### API client error handling
```typescript
// lib/utils/api.ts
export async function apiFetch(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }
  
  return response.json();
}
```

### React hook error handling
```typescript
// lib/utils/useApi.ts
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const call = async (fn: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fn();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { loading, error, call };
}
```

### Component error display
```typescript
// Usage in React components
const { loading, error, call } = useApi();

const handleSubmit = async () => {
  const result = await call(() => apiFetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData)
  }));
  
  if (result) {
    // Handle success
  }
};

return (
  <div>
    {error && (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )}
    
    <button onClick={handleSubmit} disabled={loading}>
      {loading ? "Submitting..." : "Submit"}
    </button>
  </div>
);
```

## Service layer error handling

### Error handling patterns in services
```typescript
// lib/application/booking.service.ts
export async function confirmBooking(input: BookingConfirmInput, context: BookingContext): Promise<Booking> {
  // 1. Validate inputs
  if (!input.serviceId) {
    throw new ValidationError("Service ID is required");
  }
  
  // 2. Check availability
  const slot = await timeSlotRepo.getById(input.timeSlotId);
  if (!slot) {
    throw new NotFoundError("Time slot not found");
  }
  
  // 3. Check business rules
  if (!slot.is_available) {
    throw new ConflictError("SLOT_UNAVAILABLE", "This slot is no longer available");
  }
  
  // 4. Handle external dependencies
  try {
    const booking = await bookingRepo.createBooking(bookingData);
    return booking;
  } catch (dbError) {
    // Check for constraint violations
    if (dbError.message.includes('unique constraint')) {
      throw new ConflictError("SLOT_ALREADY_BOOKED", "This slot was just booked");
    }
    throw new InternalError("BOOKING_CREATION_FAILED", "Failed to create booking", dbError);
  }
}
```

### Repository error handling
```typescript
// lib/infra/supabase/booking.repo.ts
export async function createBooking(data: CreateBookingData): Promise<Booking> {
  const supabase = await getSupabaseUserClient();
  
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      // Handle specific database errors
      if (error.code === '23505') { // unique_violation
        throw new ConflictError("DUPLICATE_BOOKING", "Booking already exists");
      }
      if (error.code === '23503') { // foreign_key_violation
        throw new ValidationError("INVALID_REFERENCE", "Invalid service or therapist");
      }
      throw new InternalError("DB_ERROR", "Database operation failed", error);
    }
    
    return booking;
  } catch (error) {
    // Re-throw domain errors
    if (error instanceof DomainError) {
      throw error;
    }
    // Wrap unexpected errors
    throw new InternalError("BOOKING_REPO_ERROR", "Repository operation failed", error);
  }
}
```

## API route error handling

### Standard API route pattern
```typescript
// app/api/booking/confirm/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const current = await requireCustomer();
    
    // 2. Validation
    const body = await request.json();
    const parsed = bookingConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    
    // 3. Business logic
    const booking = await confirmBooking(parsed.data, {
      userId: current.user.id,
      customerProfileId: current.profile.id
    });
    
    // 4. Success response
    return NextResponse.json(booking, { status: 201 });
    
  } catch (error) {
    // 5. Error mapping
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
```

### Authentication error handling
```typescript
// lib/infra/supabase/currentUser.ts
export async function requireCustomer(): Promise<AuthContext> {
  const supabase = await getSupabaseUserClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new UnauthorizedError("Authentication required");
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profileError || !profile) {
    throw new InternalError("PROFILE_NOT_FOUND", "User profile not found");
  }
  
  return { user, profile };
}

export async function requireAdmin(): Promise<AuthContext> {
  const context = await requireCustomer();
  
  if (context.profile.role !== 'admin') {
    throw new ForbiddenError("Admin access required");
  }
  
  return context;
}
```

## Adding a new error type

### Step 1: Add error class
```typescript
// lib/domain/errors.ts
export class PaymentError extends DomainError {
  constructor(code = "PAYMENT_ERROR", message = "Payment failed", details?: unknown) {
    super(code, message, details);
  }
}
```

### Step 2: Add to error mapper
```typescript
// lib/utils/errorMapper.ts
export function mapErrorToLegacyHttp(error: unknown): { status: number; body: ErrorResponse } {
  // ... existing mappings
  
  if (error instanceof PaymentError) {
    return { status: 402, body: { error: error.message, code: error.code } };
  }
  
  // ... fallback
}
```

### Step 3: Use in service
```typescript
// lib/application/payment.service.ts
export async function processPayment(paymentData: PaymentData): Promise<PaymentResult> {
  try {
    const result = await paymentProcessor.charge(paymentData);
    return result;
  } catch (processorError) {
    throw new PaymentError("PAYMENT_DECLINED", "Card was declined", {
      processorCode: processorError.code,
      lastFour: paymentData.cardNumber.slice(-4)
    });
  }
}
```

### Step 4: Handle in API route
```typescript
// app/api/payment/process/route.ts
export async function POST(request: NextRequest) {
  try {
    // ... existing pattern
  } catch (error) {
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
```

## Error logging

### Structured error logging
```typescript
// lib/utils/logger.ts
export const logger = {
  error(message: string, error: unknown, context?: Record<string, any>) {
    console.error({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: error instanceof DomainError ? error.details : undefined
      },
      context
    });
  }
};
```

### Service layer logging
```typescript
// lib/application/booking.service.ts
export async function confirmBooking(input: BookingConfirmInput, context: BookingContext): Promise<Booking> {
  try {
    // ... booking logic
    logger.info("Booking confirmed", {
      bookingId: booking.id,
      referenceCode: booking.reference_code,
      customerId: context.customerProfileId
    });
    return booking;
  } catch (error) {
    logger.error("Failed to confirm booking", error, {
      input,
      customerId: context.customerProfileId
    });
    throw error; // Re-throw for API handling
  }
}
```

### API route logging
```typescript
// app/api/booking/confirm/route.ts
export async function POST(request: NextRequest) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "booking.confirm" });
  
  try {
    log.info("Booking confirmation request", { userId: current.user.id });
    
    const booking = await confirmBooking(parsed.data, context);
    
    log.info("Booking confirmed successfully", { bookingId: booking.id });
    return NextResponse.json(booking);
    
  } catch (error) {
    log.error("Booking confirmation failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
```

## Error monitoring

### Error metrics to track:
1. **Error rates by type** - Which errors occur most frequently
2. **Error rates by endpoint** - Which API routes fail most
3. **Error rates by user** - Users experiencing high error rates
4. **Database constraint violations** - Data integrity issues
5. **External service failures** - Payment, email, etc.

### Alert thresholds:
- **High error rate** > 5% of requests
- **Database errors** > 1% of requests
- **Authentication failures** > 10% of requests
- **Payment failures** > 3% of requests

### Debugging information:
```typescript
// Include in error details
{
  userId: string,
  requestId: string,
  endpoint: string,
  method: string,
  userAgent: string,
  timestamp: string,
  stack: string,
  context: object
}
```

## Client-side error handling

### Form validation errors
```typescript
// Client-side validation before API call
const validateBookingForm = (data: BookingFormData): string[] => {
  const errors: string[] = [];
  
  if (!data.serviceId) errors.push("Service is required");
  if (!data.timeSlotId) errors.push("Time slot is required");
  if (data.notes && data.notes.length > 500) errors.push("Notes too long");
  
  return errors;
};
```

### Network error handling
```typescript
// Retry logic for transient failures
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<any> => {
  try {
    return await apiFetch(url, options);
  } catch (error) {
    if (retries > 0 && isTransientError(error)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};
```

### User-friendly error messages
```typescript
// Map error codes to user messages
const getErrorMessage = (code: string, defaultMessage: string): string => {
  const messages: Record<string, string> = {
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'NOT_FOUND': 'The requested resource was not found.',
    'CONFLICT': 'This item is no longer available.',
    'UNAUTHORIZED': 'Please log in to continue.',
    'FORBIDDEN': 'You don\'t have permission to do this.',
    'SLOT_EXPIRED': 'Your reservation expired. Please select a new time.',
    'SLOT_UNAVAILABLE': 'This time slot was just booked. Please choose another.'
  };
  
  return messages[code] || defaultMessage;
};
```

## Testing error scenarios

### Unit testing error handling
```typescript
// tests/booking.service.test.ts
describe('confirmBooking', () => {
  it('throws ValidationError for missing serviceId', async () => {
    const input = { serviceId: '', therapistId: 'abc', timeSlotId: '123' };
    
    await expect(confirmBooking(input, context))
      .rejects
      .toThrow(ValidationError);
  });
  
  it('throws NotFoundError for invalid slot', async () => {
    const input = { serviceId: 'service-1', therapistId: 'abc', timeSlotId: 'invalid' };
    
    await expect(confirmBooking(input, context))
      .rejects
      .toThrow(NotFoundError);
  });
});
```

### Integration testing error responses
```typescript
// tests/api.booking.test.ts
describe('POST /api/booking/confirm', () => {
  it('returns 400 for invalid input', async () => {
    const response = await fetch('/api/booking/confirm', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' })
    });
    
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });
  
  it('returns 409 for double booking', async () => {
    // First booking succeeds
    await createBooking(bookingData);
    
    // Second booking fails
    const response = await fetch('/api/booking/confirm', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
    
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe('CONFLICT');
  });
});
```
