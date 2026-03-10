# Data Models
> Last updated: Batch 9 (March 2026)

## ER diagram
┌──────────────┐ ┌──────────────┐
│ profiles │ │ services │
│──────────────│ │──────────────│
│ id (PK) │ │ id (PK) │
│ name │ │ name │
│ phone │ │ category │
│ role │ │ duration_min │
│ avatar_url │ │ price │
└──────┬───────┘ │ description │
│ │ is_active │
│ 1:many └──────┬───────┘
│ │ 1:many
▼ ▼
┌──────────────┐ ┌──────────────┐
│ bookings │ │serv_images │
│──────────────│ │──────────────│
│ id (PK) │ │ id (PK) │
│ customer_id ─┼──FK────▶│ service_id │
│ time_slot_id │ │ image_url │
│ service_id │ │ display_order│
│ therapist_id │ └──────────────┘
│ status │
│ notes │
│ ref_code │
└──────┬───────┘
│ │ many:1
▼ ▼
┌──────────────┐
│ therapists │
│──────────────│
│ id (PK) │
│ name │
│ title │
│ bio │
│ photo_url │
│ is_active │
└──────┬───────┘
│
▼
┌──────────────┐
│ time_slots │
│──────────────│
│ id (PK) │
│ therapist_id ┼──FK────────────┘
│ start_time │
│ end_time │
│ is_available │
│ locked_until │
└──────────────┘

┌────────────────────┐
│ service_therapists │
│────────────────────│
│ service_id (FK) │
│ therapist_id (FK) │
│ many:many join │
└────────────────────┘

## Service Types

### Service
**File:** `lib/domain/service.types.ts`  
**DB table:** `services`  
**Used by:** Service listing, booking flow, admin forms

```typescript
interface Service {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
  price: number | null;
  description?: string | null;
  first_image_url?: string | null;
  is_active: boolean | null;
  updated_at: string | null;
}
```

**Notable nullable fields:**
- `category` - Services may not have a category (e.g., special treatments)
- `duration_minutes` - Some services might be variable duration
- `price` - Consultation services might be free
- `first_image_url` - New services might not have images yet
- `is_active` - Allows soft deletion/archiving

### ServiceImage
**File:** `lib/domain/service.types.ts`  
**DB table:** `service_images`  
**Used by:** Service gallery, admin image management

```typescript
interface ServiceImage {
  id: string;
  service_id: string;
  image_url: string;
  sort_order: number | null;
}
```

**Notable nullable fields:**
- `sort_order` - `null` means unsorted or default order

### ServiceWithTherapists
**File:** `lib/domain/service.types.ts`  
**DB tables:** `services` + `therapists` + `therapist_service`  
**Used by:** Service detail pages, booking flow

```typescript
interface ServiceWithTherapists extends Service {
  therapists: Array<{
    id: string
    name: string
    title: string | null
    photo_url: string | null
    is_active: boolean
  }>
}
```

**Purpose:** Reduces API calls by embedding therapist data

### ServiceImageAddInput
**File:** `lib/domain/service.types.ts`  
**Used by:** Admin service image upload

```typescript
interface ServiceImageAddInput {
  service_id: string
  image_url: string
  sort_order?: number
}
```

### ServiceImageDeleteInput
**File:** `lib/domain/service.types.ts`  
**Used by:** Admin service image deletion

```typescript
interface ServiceImageDeleteInput {
  id: string
  service_id: string
}
```

### TherapistSummary
**File:** `lib/domain/service.types.ts`  
**DB table:** `therapists`  
**Used by:** Service detail pages, booking flow

```typescript
type TherapistSummary = {
  id: string
  name: string
  title: string | null
  photo_url: string | null
  bio_short: string | null
}
```

**Purpose:** Lightweight therapist data for lists and selections

## Therapist Types

### Therapist
**File:** `lib/domain/therapist.types.ts`  
**DB table:** `therapists`  
**Used by:** Admin therapist management, therapist detail pages

```typescript
interface Therapist {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  bio_short: string | null;
  is_active: boolean | null;
  created_at: string | null;
}
```

**Notable nullable fields:**
- `title` - New therapists might not have professional titles
- `photo_url` - Photos are optional
- `bio_short` - Bios are optional
- `is_active` - Allows soft deletion/archiving

### TherapistWithServices
**File:** `lib/domain/therapist.types.ts`  
**DB tables:** `therapists` + `services` + `therapist_service`  
**Used by:** Therapist detail pages, admin management

```typescript
interface TherapistWithServices extends Therapist {
  services: Array<{
    id: string
    name: string
    category: string | null
    duration_minutes: number | null
    price: number | null
    thumbnail_url: string | null
  }>
}
```

**Purpose:** Complete therapist profile with offered services

## Booking Types

### BookingStatus
**File:** `lib/domain/booking.types.ts`  
**DB constraint:** `status in ('confirmed','cancelled','pending')`  
**Used by:** Booking management, status badges, filtering

```typescript
type BookingStatus = "confirmed" | "cancelled" | "pending";
```

**Status meanings:**
- `"pending"` - Slot locked, awaiting confirmation
- `"confirmed"` - Booking completed and confirmed
- `"cancelled"` - Booking cancelled by customer

### Booking
**File:** `lib/domain/booking.types.ts`  
**DB table:** `bookings`  
**Used by:** Customer dashboard, admin booking management

```typescript
interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  therapist_id: string | null;
  time_slot_id: string;
  status: BookingStatus;
  reference_code: string;
  notes: string | null;
  created_at: string;
}
```

**Notable nullable fields:**
- `therapist_id` - Some bookings might not have assigned therapists
- `notes` - Customer notes are optional

### BookingSummary
**File:** `lib/domain/booking.types.ts`  
**DB table:** `bookings` (subset)  
**Used by:** Booking lists, dashboard overviews

```typescript
interface BookingSummary {
  id: string;
  service_id: string;
  therapist_id: string | null;
  time_slot_id: string;
  status: BookingStatus;
  reference_code: string;
  created_at: string;
}
```

**Purpose:** Lightweight booking data for lists (excludes customer_id for privacy)

### BookingConfirmInput
**File:** `lib/domain/booking.types.ts`  
**Used by:** Booking confirmation API, service validation

```typescript
interface BookingConfirmInput extends BaseBookingConfirmInput {
  // Schema from validation.ts
}
```

**Runtime validation:** Uses Zod schema from `lib/utils/validation.ts`

## Upload Types

### UploadBucket
**File:** `lib/domain/upload.types.ts`  
**Used by:** File upload validation, storage repository

```typescript
type UploadBucket = 'therapist-photos' | 'service-images' | 'spa-hero' | 'avatar-uploads';
```

**Bucket purposes:**
- `'therapist-photos'` - Therapist profile images
- `'service-images'` - Service gallery images  
- `'spa-hero'` - Hero/branding images
- `'avatar-uploads'` - Customer avatar images

### UploadEntityType
**File:** `lib/domain/upload.types.ts`  
**Used by:** Filename generation logic

```typescript
type UploadEntityType = 'therapist' | 'service';
```

### FileUploadResponse
**File:** `lib/domain/upload.types.ts`  
**Used by:** Upload API response, client components

```typescript
interface FileUploadResponse {
  url: string;
  bucket: UploadBucket;
  filename: string;
}
```

### UploadErrorCode
**File:** `lib/domain/upload.types.ts`  
**Used by:** Upload error handling, client error display

```typescript
type UploadErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_TYPE' 
  | 'UPLOAD_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_BUCKET'
  | 'MISSING_FILE'
  | 'MISSING_ENTITY_ID';
```

## Relationships diagram (ASCII)

```
profiles ←→ bookings ←→ time_slots
    ↓           ↓           ↑
  (user)    services    therapists
               ↓           ↑
          service_images  therapist_service
               ↓
          service_categories (implied)
```

**Relationship explanations:**
- `profiles` ← `bookings` - One customer has many bookings
- `bookings` → `time_slots` - Each booking has one time slot
- `bookings` → `services` - Each booking has one service
- `bookings` → `therapists` - Each booking may have one therapist
- `services` ← `service_images` - One service has many images
- `services` ↔ `therapists` - Many-to-many via `therapist_service`
- `therapists` → `time_slots` - One therapist has many time slots

**Key constraints:**
- `bookings.time_slot_id` is unique (prevents double booking)
- `therapist_service` has unique composite key (prevents duplicates)
- `profiles.id` references `auth.users.id` (links to Supabase Auth)

## Validation schemas

### Schema location
**File:** `lib/utils/validation.ts`  
**Purpose:** Runtime validation layer on top of TypeScript types

### Schema list:

#### Authentication schemas
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1)
});

const magicLinkSchema = z.object({
  email: z.string().email()
});
```

#### Booking schemas
```typescript
const availabilitySchema = z.object({
  serviceId: z.string().uuid(),
  therapistId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

const lockSchema = z.object({
  timeSlotId: z.string().uuid()
});

const bookingConfirmSchema = z.object({
  serviceId: z.string().uuid(),
  therapistId: z.string().uuid().optional(),
  timeSlotId: z.string().uuid(),
  notes: z.string().optional()
});
```

#### Admin schemas
```typescript
const adminServiceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  category: z.string().optional(),
  duration_minutes: z.number().positive().optional(),
  price: z.number().positive().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false)
});

const adminTherapistSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  title: z.string().optional(),
  bio_short: z.string().optional(),
  is_active: z.boolean().default(true)
});

const adminUploadSchema = z.object({
  bucket: z.enum(['therapist-photos', 'service-images', 'spa-hero', 'avatar-uploads']),
  entityId: z.string().min(1)
});
```

#### Profile schemas
```typescript
const profileUpdateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  avatar_url: z.string().nullable().optional()
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});
```

#### Contact schema
```typescript
const contactFormSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(1)
});
```

### Schema usage pattern

#### API route validation:
```typescript
// app/api/booking/confirm/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bookingConfirmSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    
    const result = await confirmBooking(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    // Error handling
  }
}
```

#### Type inference:
```typescript
// TypeScript types inferred from schemas
type LoginInput = z.infer<typeof loginSchema>;
type BookingConfirmInput = z.infer<typeof bookingConfirmSchema>;
type AdminServiceInput = z.infer<typeof adminServiceSchema>;
```

#### Client validation:
```typescript
// Client-side validation using same schemas
const validation = bookingConfirmSchema.safeParse(formData);
if (!validation.success) {
  setFieldErrors(validation.error.format());
  return;
}
```

## Type safety patterns

### Runtime validation
- **All API inputs** validated with Zod schemas
- **Database responses** typed via repository interfaces
- **External API calls** typed with response interfaces

### Compile-time validation
- **TypeScript interfaces** define expected shapes
- **Strict null checks** prevent undefined errors
- **Discriminated unions** for status types

### Error handling
- **Domain errors** typed with specific error classes
- **API responses** standardized error format
- **Client errors** mapped to user-friendly messages

## Data transformation patterns

### Database to domain mapping
```typescript
// Repository pattern: DB row → Domain type
interface ServiceRow {
  id: string;
  name: string;
  category: string | null;
  // ... other fields
}

function mapRowToService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    // ... direct mapping
  };
}
```

### Domain to API mapping
```typescript
// API response: Domain type → Response shape
function serviceToResponse(service: Service) {
  return {
    id: service.id,
    name: service.name,
    category: service.category,
    // ... selected fields
  };
}
```

### Form to domain mapping
```typescript
// Form submission: FormData → Domain input
function formToBookingConfirm(formData: FormData): BookingConfirmInput {
  return {
    serviceId: formData.get('serviceId') as string,
    therapistId: formData.get('therapistId') as string,
    timeSlotId: formData.get('timeSlotId') as string,
    notes: formData.get('notes') as string
  };
}
```

## Extending data models

### Adding a new entity type:

#### 1. Define domain interface
```typescript
// lib/domain/newEntity.types.ts
export interface NewEntity {
  id: string;
  name: string;
  created_at: string;
}
```

#### 2. Create validation schema
```typescript
// lib/utils/validation.ts
const newEntitySchema = z.object({
  name: z.string().min(1)
});

export type NewEntityInput = z.infer<typeof newEntitySchema>;
```

#### 3. Add repository interface
```typescript
// lib/infra/supabase/newEntity.repo.ts
export interface NewEntityRepository {
  create(input: NewEntityInput): Promise<NewEntity>;
  getById(id: string): Promise<NewEntity | null>;
  list(): Promise<NewEntity[]>;
}
```

#### 4. Update service layer
```typescript
// lib/application/newEntity.service.ts
export async function createNewEntity(input: NewEntityInput): Promise<NewEntity> {
  return await newEntityRepo.create(input);
}
```

### Modifying existing types:

#### Backward compatibility
```typescript
// Add optional field to existing interface
interface Service {
  // ... existing fields
  new_field?: string; // Optional for backward compatibility
}
```

#### Database migration
```sql
-- Add new column with default value
ALTER TABLE services ADD COLUMN new_field text DEFAULT NULL;
```

#### Validation update
```typescript
// Update schema to include new field
const adminServiceSchema = z.object({
  // ... existing fields
  new_field: z.string().optional()
});
```

## Type safety guarantees

### Compile-time guarantees:
- **Interface contracts** enforced by TypeScript
- **Required fields** cannot be undefined
- **Type mismatches** caught at build time

### Runtime guarantees:
- **Zod validation** prevents invalid data
- **Database constraints** enforce data integrity
- **API contracts** validated on every request

### End-to-end guarantees:
- **Client forms** validated before submission
- **API routes** validate all inputs
- **Database operations** use typed repositories
- **Responses** conform to defined interfaces
