# API Routes
> Last updated: Batch 9 (March 2026)

## Conventions
- All routes return JSON responses
- Success responses: 200 (GET/PUT/DELETE), 201 (POST creates resource)
- Error responses: { error: string, code: string } with appropriate HTTP status
- Authentication: Supabase session cookies (set by @supabase/ssr)
- Rate limited endpoints return 429 with Retry-After header
- Validation: All POST/PUT routes use Zod schema validation
- Error handling: Domain errors mapped to HTTP responses via `mapErrorToLegacyHttp()`

## Authentication levels
- **Public** - No authentication required
- **Customer** - Must be logged in (any role)
- **Admin** - Must have `role = "admin"` in profiles table

### Authentication pattern:
```typescript
// Customer routes
const current = await requireCustomer(); // Throws 401 if not logged in

// Admin routes  
const current = await requireAdmin(); // Throws 401 if not logged in, 403 if not admin
```

## Auth Routes

### POST /api/auth/login
**Auth:** Public  
**Rate limited:** YES (10/15min)  
**Schema:** `loginSchema`  
**Response:** Session data

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response (200):**
```typescript
{
  user: {
    id: string;
    email: string;
  },
  session: {
    access_token: string;
    refresh_token: string;
  }
}
```

**Errors:**
- 400: Invalid credentials
- 429: Too many requests

### POST /api/auth/register
**Auth:** Public  
**Rate limited:** YES (10/15min)  
**Schema:** `registerSchema`  
**Response:** User + session data

**Request:**
```typescript
{
  email: string;
  password: string;
  name: string;
}
```

**Response (201):**
```typescript
{
  user: {
    id: string;
    email: string;
  },
  session: {
    access_token: string;
    refresh_token: string;
  },
  requiresEmailConfirmation: boolean
}
```

### POST /api/auth/logout
**Auth:** Customer  
**Rate limited:** NO  
**Schema:** None  
**Response:** Success message

**Response (200):**
```typescript
{
  success: true
}
```

### POST /api/auth/magic-link
**Auth:** Public  
**Rate limited:** YES (10/15min)  
**Schema:** `magicLinkSchema`  
**Response:** Success message

**Request:**
```typescript
{
  email: string;
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Magic link sent"
}
```

### POST /api/auth/reset-password
**Auth:** Public  
**Rate limited:** YES (10/15min)  
**Schema:** `resetPasswordSchema`  
**Response:** Success message

**Request:**
```typescript
{
  email: string;
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Password reset email sent"
}
```

### POST /api/auth/reset-password/confirm
**Auth:** Public  
**Rate limited:** NO  
**Schema:** `resetPasswordConfirmSchema`  
**Response:** Success message

**Request:**
```typescript
{
  token: string;
  password: string;
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Password updated"
}
```

## Public Booking Routes

### POST /api/booking/availability
**Auth:** Public  
**Rate limited:** NO  
**Schema:** `availabilitySchema`  
**Response:** Available time slots

**Request:**
```typescript
{
  serviceId: string;
  therapistId: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
}
```

**Response (200):**
```typescript
[
  {
    id: string;
    therapist_id: string;
    start_time: string; // ISO datetime
    end_time: string;   // ISO datetime
    is_available: boolean;
  }
]
```

**Notes:** Returns slots for date range, filtered by service/therapist availability

### POST /api/booking/lock
**Auth:** Customer  
**Rate limited:** NO  
**Schema:** `lockSchema`  
**Response:** Lock success/failure  
**Description:** Lock a slot for 30 seconds

**Request:**
```typescript
{
  timeSlotId: string;
}
```

**Response (200):**
```typescript
{
  success: boolean;
  message?: string;
}
```

**Notes:** Locks slot for 30 seconds to prevent double booking during checkout

### POST /api/booking/confirm
**Auth:** Customer  
**Rate limited:** NO  
**Schema:** `bookingConfirmSchema`  
**Response:** Created booking

**Request:**
```typescript
{
  serviceId: string;
  therapistId: string;
  timeSlotId: string;
  notes?: string;
}
```

**Response (201):**
```typescript
{
  id: string;
  customer_id: string;
  service_id: string;
  therapist_id: string;
  time_slot_id: string;
  status: "confirmed" | "cancelled" | "pending";
  reference_code: string;
  notes: string | null;
  created_at: string;
}
```

**Notes:** Creates booking, sends confirmation emails, marks slot as unavailable

### DELETE /api/booking/[id]
**Auth:** Customer  
**Rate limited:** NO  
**Schema:** None  
**Response:** Success message

**Response (200):**
```typescript
{
  success: true,
  message: "Booking cancelled"
}
```

**Notes:** Cancels booking, reopens time slot, sends cancellation emails

## Public Service Routes

### GET /api/services
**Auth:** Public  
**Rate limited:** NO  
**Schema:** None  
**Response:** List of services

**Response (200):**
```typescript
[
  {
    id: string;
    name: string;
    category: string | null;
    duration_minutes: number | null;
    price: number | null;
    description: string | null;
    first_image_url: string | null;
    is_active: boolean | null;
    updated_at: string | null;
  }
]
```

**Notes:** Returns only active services, ordered by featured status

### GET /api/services/[id]/therapists
**Auth:** Public  
**Rate limited:** NO  
**Schema:** None  
**Response:** Therapists for service

**Response (200):**
```typescript
[
  {
    id: string;
    name: string;
    title: string | null;
    photo_url: string | null;
    bio_short: string | null;
  }
]
```

**Notes:** Returns only active therapists who offer the specified service

## Profile Routes

### GET /api/profile
**Auth:** Customer  
**Rate limited:** NO  
**Schema:** None  
**Response:** User profile

**Response (200):**
```typescript
{
  id: string;
  name: string;
  phone: string | null;
  role: string;
}
```

### PATCH /api/profile
**Auth:** Customer  
**Rate limited:** NO  
**Schema:** `profileUpdateSchema`  
**Response:** Updated profile

**Request:**
```typescript
{
  name?: string;
  phone?: string;
  avatar_url?: string | null;
}
```

**Description:** name (optional), phone (optional), avatar_url (optional nullable string)

**Response (200):**
```typescript
{
  id: string;
  name: string;
  phone: string | null;
  role: string;
}
```

### PATCH /api/profile/password
**Auth:** Customer  
**Rate limited:** NO  
**Schema:** `passwordUpdateSchema`  
**Response:** Success message

**Request:**
```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Password updated"
}
```

### POST /api/profile/upload
**Auth:** Customer  
**Rate limited:** NO  
**Schema:** multipart/form-data  
**Response:** 201 { url }  
**Description:** Upload avatar to avatar-uploads bucket

**Request:**
```
file: File (JPEG/PNG/WebP, max 2MB)
```

**Response (201):**
```typescript
{
  url: string;
  filename: string;
  bucket: "avatar-uploads";
}
```

**Constraints:** Max 2 MB · JPEG/PNG/WebP only · bucket restricted to avatar-uploads

## Contact + Settings Routes

### POST /api/contact
**Auth:** Public  
**Rate limited:** NO  
**Schema:** `contactFormSchema`  
**Response:** Success message

**Request:**
```typescript
{
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Message sent successfully"
}
```

**Notes:** Creates message in database for admin to review

### GET /api/settings
**Auth:** Public  
**Rate limited:** NO  
**Schema:** None  
**Response:** Site settings

**Response (200):**
```typescript
{
  spaName: string;
  spaAddress: string;
  spaPhone: string;
  spaWebsite: string;
  spaEmail: string;
}
```

**Notes:** Returns public site configuration for display

## Admin Service Routes

### GET /api/admin/services
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** None  
**Response:** Admin service list

**Response (200):**
```typescript
[
  {
    id: string;
    name: string;
    category: string | null;
    duration_minutes: number | null;
    price: number | null;
    description: string | null;
    thumbnail_url: string | null;
    is_active: boolean;
    is_featured: boolean;
    updated_at: string;
  }
]
```

**Notes:** Includes all services (active/inactive) for admin management

### POST /api/admin/services
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `adminServiceSchema`  
**Response:** Created service

**Request:**
```typescript
{
  name: string;
  category?: string;
  duration_minutes?: number;
  price?: number;
  description?: string;
  is_active?: boolean;
  is_featured?: boolean;
}
```

**Response (201):**
```typescript
{
  id: string;
  name: string;
  category: string | null;
  // ... other fields
}
```

### PUT /api/admin/services
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `adminServiceSchema` (with id)  
**Response:** Updated service

**Request:**
```typescript
{
  id: string;
  name: string;
  category?: string;
  duration_minutes?: number;
  price?: number;
  description?: string;
  is_active?: boolean;
  is_featured?: boolean;
}
```

**Response (200):**
```typescript
{
  id: string;
  name: string;
  // ... updated fields
}
```

### DELETE /api/admin/services
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `adminServiceDeleteSchema`  
**Response:** Success message

**Request:**
```typescript
{
  id: string;
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Service deleted"
}
```

**Notes:** Soft deletes by setting is_active = false

### GET /api/admin/services/[id]/images
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** None  
**Response:** Service images

**Response (200):**
```typescript
[
  {
    id: string;
    service_id: string;
    image_url: string;
    sort_order: number | null;
  }
]
```

### POST /api/admin/services/[id]/images
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `serviceImageAddSchema`  
**Response:** Created image

**Request:**
```typescript
{
  service_id: string;
  image_url: string;
  sort_order?: number;
}
```

**Response (201):**
```typescript
{
  id: string;
  service_id: string;
  image_url: string;
  sort_order: number | null;
}
```

### DELETE /api/admin/services/[id]/images
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `serviceImageDeleteSchema`  
**Response:** Success message

**Request:**
```typescript
{
  id: string;
  service_id: string;
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Image deleted"
}
```

## Admin Therapist Routes

### GET /api/admin/therapists
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** None  
**Response:** Admin therapist list

**Response (200):**
```typescript
[
  {
    id: string;
    name: string;
    title: string | null;
    photo_url: string | null;
    bio_short: string | null;
    is_active: boolean;
    created_at: string;
  }
]
```

### POST /api/admin/therapists
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `adminTherapistSchema`  
**Response:** Created therapist

**Request:**
```typescript
{
  name: string;
  title?: string;
  bio_short?: string;
  is_active?: boolean;
}
```

**Response (201):**
```typescript
{
  id: string;
  name: string;
  // ... other fields
}
```

### PUT /api/admin/therapists
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `adminTherapistSchema` (with id)  
**Response:** Updated therapist

**Request:**
```typescript
{
  id: string;
  name: string;
  title?: string;
  bio_short?: string;
  is_active?: boolean;
}
```

**Response (200):**
```typescript
{
  id: string;
  name: string;
  // ... updated fields
}
```

### DELETE /api/admin/therapists
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `adminTherapistDeleteSchema`  
**Response:** Success message

**Request:**
```typescript
{
  id: string;
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Therapist deleted"
}
```

## Admin Booking Routes

### GET /api/admin/bookings
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** None  
**Response:** Admin booking rows

**Response (200):**
```typescript
[
  {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_email: string;
    service_id: string;
    service_name: string;
    therapist_id: string;
    therapist_name: string;
    time_slot_id: string;
    slot_start: string;
    slot_end: string;
    status: string;
    reference_code: string;
    notes: string | null;
    created_at: string;
  }
]
```

**Notes:** Includes customer and service details for admin display

### PUT /api/admin/bookings/[id]/status
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `adminBookingStatusSchema`  
**Response:** Updated booking

**Request:**
```typescript
{
  status: "confirmed" | "cancelled" | "pending";
}
```

**Response (200):**
```typescript
{
  id: string;
  status: string;
  // ... other booking fields
}
```

**Notes:** Admin can override booking status (e.g., manual confirmation)

### DELETE /api/admin/bookings/[id]
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** None  
**Response:** Success message

**Response (200):**
```typescript
{
  success: true,
  message: "Booking deleted"
}
```

## Admin Upload Routes

### POST /api/admin/upload
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `adminUploadSchema` (multipart form)  
**Response:** Upload result

**Request (FormData):**
```
file: File (image)
bucket: "therapist-photos" | "service-images" | "spa-hero" | "avatar-uploads"
entityId: string
```

**Response (201):**
```typescript
{
  url: string;
  filename: string;
  bucket: string;
}
```

**Validation:**
- File size ≤ 2MB
- MIME type: image/jpeg, image/png, image/webp, image/gif
- Bucket must be valid
- EntityId required

### DELETE /api/admin/upload
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `adminUploadDeleteSchema`  
**Response:** Success message

**Request:**
```typescript
{
  url: string;
  bucket: string;
}
```

**Response (200):**
```typescript
{
  success: true
}
```

**Notes:** Parses filename from URL to delete from storage

## Admin Settings + Time Slots + Messages

### GET /api/admin/settings
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** None  
**Response:** Admin settings

**Response (200):**
```typescript
{
  spaName: string;
  spaAddress: string;
  spaPhone: string;
  spaWebsite: string;
  spaEmail: string;
}
```

### PUT /api/admin/settings
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `adminSettingsSchema`  
**Response:** Updated settings

**Request:**
```typescript
{
  spaName?: string;
  spaAddress?: string;
  spaPhone?: string;
  spaWebsite?: string;
  spaEmail?: string;
}
```

**Response (200):**
```typescript
{
  spaName: string;
  // ... updated fields
}
```

### POST /api/admin/time-slots
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `timeSlotSchema`  
**Response:** Created time slot

**Request:**
```typescript
{
  therapistId: string;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
}
```

**Response (201):**
```typescript
{
  id: string;
  therapist_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}
```

### GET /api/admin/messages
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** None  
**Response:** Contact messages

**Response (200):**
```typescript
[
  {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    ip_address: string;
    is_read: boolean;
    created_at: string;
  }
]
```

### PUT /api/admin/messages/[id]
**Auth:** Admin  
**Rate limited:** NO  
**Schema:** `adminMessageUpdateSchema`  
**Response:** Updated message

**Request:**
```typescript
{
  is_read: boolean;
}
```

**Response (200):**
```typescript
{
  id: string;
  is_read: boolean;
  // ... other message fields
}
```

## Error Response Format

All error responses follow this format:
```typescript
{
  error: string,    // Human readable message
  code: string      // Machine readable code
}
```

### Common error codes:
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (double booking, duplicate)
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Insufficient permissions
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

### HTTP status codes:
- 200 - Success (GET, PUT, DELETE)
- 201 - Created (POST)
- 400 - Bad Request (validation errors)
- 401 - Unauthorized (not logged in)
- 403 - Forbidden (wrong role)
- 404 - Not Found
- 409 - Conflict (double booking, duplicates)
- 429 - Too Many Requests (rate limited)
- 500 - Internal Server Error

## Rate Limiting Details

### Rate limited endpoints:
- POST /api/auth/login (10/15min)
- POST /api/auth/register (10/15min)
- POST /api/auth/magic-link (10/15min)
- POST /api/auth/reset-password (10/15min)

### Rate limit response headers:
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1704067200000
```

### Rate limit error response:
```typescript
{
  error: "Too many requests",
  code: "RATE_LIMITED"
}
```

## Request/Response Examples

### Successful booking flow:
```bash
# 1. Get availability
POST /api/booking/availability
{
  "serviceId": "service-123",
  "therapistId": "therapist-456", 
  "startDate": "2026-03-15T00:00:00.000Z",
  "endDate": "2026-03-15T23:59:59.999Z"
}

# 2. Lock slot
POST /api/booking/lock
{
  "timeSlotId": "slot-789"
}

# 3. Confirm booking
POST /api/booking/confirm
{
  "serviceId": "service-123",
  "therapistId": "therapist-456",
  "timeSlotId": "slot-789",
  "notes": "Please focus on neck and shoulders"
}
```

### Admin service management:
```bash
# Create service
POST /api/admin/services
{
  "name": "Deep Tissue Massage",
  "category": "massage",
  "duration_minutes": 90,
  "price": 150.00,
  "description": "Intense muscle work",
  "is_active": true,
  "is_featured": false
}

# Update service
PUT /api/admin/services
{
  "id": "service-123",
  "price": 160.00
}

# Upload service image
POST /api/admin/upload
FormData:
- file: [image file]
- bucket: "service-images"
- entityId: "service-123"
```

### Error handling:
```bash
# Invalid input
POST /api/booking/confirm
{
  "serviceId": "",  // Invalid
  "therapistId": "therapist-456",
  "timeSlotId": "slot-789"
}

# Response (400):
{
  "error": "Invalid input",
  "code": "VALIDATION_ERROR"
}

# Double booking attempt
POST /api/booking/confirm
{
  "serviceId": "service-123",
  "therapistId": "therapist-456", 
  "timeSlotId": "already-booked-slot"
}

# Response (409):
{
  "error": "This slot is no longer available",
  "code": "CONFLICT"
}
```
