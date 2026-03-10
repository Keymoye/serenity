# Adding Features
> Last updated: Batch 9 (March 2026)

## Architecture rules (must follow)

### 1. Layer separation
- **No Supabase imports outside lib/infra/supabase/**
  - ❌ `import { createClient } from "@supabase/supabase-js"` in components
  - ✅ Use repository functions instead
- **No HTTP concerns outside app/api/**
  - ❌ `NextResponse` in service functions
  - ✅ Handle HTTP only in API routes
- **No business logic in API routes**
  - ❌ Complex validation or calculations in routes
  - ✅ Call service functions for business logic

### 2. Error handling consistency
- **All errors use domain types** from `lib/domain/errors.ts`
  - ❌ `throw new Error("Something went wrong")`
  - ✅ `throw new ValidationError("Invalid input")`
- **All admin routes must call requireAdmin()**
  - ❌ Assuming user is admin
  - ✅ `await requireAdmin()` at route start

### 3. Validation consistency
- **All POST/PUT routes must have Zod validation**
  - ❌ Using request body without validation
  - ✅ `const parsed = schema.safeParse(body)`

### 4. Type safety
- **TypeScript interfaces for all data shapes**
  - ❌ `any` types in service functions
  - ✅ Proper interface definitions with runtime validation

## Adding a new DB table

### Step 1: Write migration SQL
```sql
-- Example: Add reviews table
create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone not null default now()
);

-- Add indexes
create index idx_reviews_booking on reviews(booking_id);
create index idx_reviews_rating on reviews(rating);

-- Enable RLS
alter table reviews enable row level security;

-- Add RLS policies
create policy customers_insert_reviews on reviews
  for insert with check (
    exists (
      select 1 from bookings b
      where b.id = booking_id 
      and b.customer_id = auth.uid()
    )
  );

create policy customers_select_reviews on reviews
  for select using (
    exists (
      select 1 from bookings b
      where b.id = booking_id 
      and b.customer_id = auth.uid()
    )
  );

create policy admin_reviews on reviews
  for all using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
```

### Step 2: Add domain types
**File:** `lib/domain/review.types.ts`
```typescript
export interface Review {
  id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ReviewWithBooking extends Review {
  booking: {
    service_name: string;
    therapist_name: string;
    appointment_date: string;
  };
}

export interface CreateReviewInput {
  booking_id: string;
  rating: number;
  comment?: string;
}
```

### Step 3: Create repository
**File:** `lib/infra/supabase/review.repo.ts`
```typescript
import { getSupabaseUserClient } from "./userClient";
import type { Review, CreateReviewInput } from "@/lib/domain/review.types";

export interface ReviewRepository {
  create(input: CreateReviewInput): Promise<Review>;
  getById(id: string): Promise<Review | null>;
  getByBookingId(bookingId: string): Promise<Review | null>;
  listCustomerReviews(customerId: string): Promise<ReviewWithBooking[]>;
  listAllReviews(): Promise<ReviewWithBooking[]>;
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const supabase = await getSupabaseUserClient();
  
  const { data, error } = await supabase
    .from('reviews')
    .insert(input)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function getById(id: string): Promise<Review | null> {
  const supabase = await getSupabaseUserClient();
  
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) return null;
  return data;
}

// ... other repository methods

export function createReviewRepository(): ReviewRepository {
  return {
    create: createReview,
    getById,
    getByBookingId,
    listCustomerReviews,
    listAllReviews,
  };
}
```

### Step 4: Create service
**File:** `lib/application/review.service.ts`
```typescript
import { ValidationError, NotFoundError, ConflictError } from "@/lib/domain/errors";
import type { Review, CreateReviewInput } from "@/lib/domain/review.types";
import type { ReviewRepository } from "@/lib/infra/supabase/review.repo";
import type { BookingRepository } from "@/lib/infra/supabase/booking.repo";

export interface ReviewServiceDependencies {
  reviewRepo: ReviewRepository;
  bookingRepo: BookingRepository;
}

export async function createReview(
  input: CreateReviewInput,
  customerId: string,
  deps: ReviewServiceDependencies
): Promise<Review> {
  // Validate rating
  if (input.rating < 1 || input.rating > 5) {
    throw new ValidationError("Rating must be between 1 and 5");
  }
  
  // Verify booking exists and belongs to customer
  const booking = await deps.bookingRepo.getById(input.booking_id);
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }
  
  if (booking.customer_id !== customerId) {
    throw new ForbiddenError("You can only review your own bookings");
  }
  
  // Check if review already exists
  const existing = await deps.reviewRepo.getByBookingId(input.booking_id);
  if (existing) {
    throw new ConflictError("REVIEW_EXISTS", "You have already reviewed this booking");
  }
  
  // Verify booking is completed (not cancelled)
  if (booking.status !== 'confirmed') {
    throw new ValidationError("Can only review completed bookings");
  }
  
  return await deps.reviewRepo.create(input);
}

export async function listCustomerReviews(
  customerId: string,
  deps: ReviewServiceDependencies
): Promise<ReviewWithBooking[]> {
  return await deps.reviewRepo.listCustomerReviews(customerId);
}
```

### Step 5: Create API route
**File:** `app/api/reviews/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/infra/supabase/currentUser";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { createReviewSchema } from "@/lib/utils/validation";
import { createReviewService } from "@/lib/application/review.service";
import { createReviewRepository } from "@/lib/infra/supabase/review.repo";
import { createBookingRepository } from "@/lib/infra/supabase/booking.repo";

export async function POST(request: NextRequest) {
  try {
    const current = await requireCustomer();
    
    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    
    const service = createReviewService({
      reviewRepo: createReviewRepository(),
      bookingRepo: createBookingRepository(),
    });
    
    const review = await createReview(
      parsed.data,
      current.customerProfileId,
      service
    );
    
    return NextResponse.json(review, { status: 201 });
    
  } catch (error) {
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    const current = await requireCustomer();
    
    const service = createReviewService({
      reviewRepo: createReviewRepository(),
      bookingRepo: createBookingRepository(),
    });
    
    const reviews = await listCustomerReviews(
      current.customerProfileId,
      service
    );
    
    return NextResponse.json(reviews);
    
  } catch (error) {
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
```

### Step 6: Add validation schema
**File:** `lib/utils/validation.ts`
```typescript
// Add to existing schemas
const createReviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
```

## Adding a new API route

### Route template
```typescript
// app/api/my-feature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/infra/supabase/currentUser";
import { myFeatureSchema } from "@/lib/utils/validation";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { myFeatureService } from "@/lib/application/my-feature.service";

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const current = await requireCustomer();
    
    // Validation
    const body = await request.json();
    const parsed = myFeatureSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    
    // Business logic
    const result = await myFeatureService(
      parsed.data,
      current.customerProfileId
    );
    
    // Success response
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    // Error handling
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

// Add other HTTP methods as needed
export async function GET(request: NextRequest) {
  try {
    const current = await requireCustomer();
    
    // ... GET logic
    
  } catch (error) {
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
```

### Route patterns by authentication level

#### Public route
```typescript
// No authentication required
export async function GET(request: NextRequest) {
  try {
    const result = await myPublicService();
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
```

#### Customer route
```typescript
export async function POST(request: NextRequest) {
  try {
    const current = await requireCustomer();
    // ... customer logic
  } catch (error) {
    // ... error handling
  }
}
```

#### Admin route
```typescript
export async function DELETE(request: NextRequest) {
  try {
    const current = await requireAdmin();
    // ... admin logic
  } catch (error) {
    // ... error handling
  }
}
```

## Adding a new email type

### Step 1: Create template
**File:** `lib/utils/emailTemplates.ts`
```typescript
export function reviewConfirmationTemplate(data: {
  customerName: string;
  serviceName: string;
  therapistName: string;
  rating: number;
  spaName?: string;
  spaAddress?: string;
  spaPhone?: string;
  spaWebsite?: string;
}): string {
  const content = `
    <h2 style="color: #1a1a1a; margin-bottom: 16px;">Thank you for your review!</h2>
    <p style="margin-bottom: 16px;">Hi ${data.customerName},</p>
    <p style="margin-bottom: 16px;">
      Thank you for reviewing your ${data.serviceName} appointment with ${data.therapistName}.
      Your ${data.rating}-star rating helps us improve our services.
    </p>
    <p style="margin-bottom: 16px;">
      We hope to see you again soon!
    </p>
  `;
  
  return baseTemplate(content, "Thank you for your review!", {
    spaName: data.spaName,
    spaAddress: data.spaAddress,
    spaPhone: data.spaPhone,
    spaWebsite: data.spaWebsite,
  });
}
```

### Step 2: Add send function
**File:** `lib/utils/emailService.ts`
```typescript
import { reviewConfirmationTemplate } from "./emailTemplates";

/**
 * Send review confirmation email to customer
 */
export async function sendReviewConfirmation(data: {
  to: string;
  customerName: string;
  serviceName: string;
  therapistName: string;
  rating: number;
}): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const spaConfig = getSpaConfig();

    const html = reviewConfirmationTemplate({
      ...data,
      ...spaConfig,
    });

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: data.to,
      subject: `Thank you for your review!`,
      html,
    });

    if (result.error) {
      logger.error("Resend API error sending review confirmation", result.error, {
        customerName: data.customerName,
        to: data.to,
      });
      return { success: false, error: result.error.message };
    }

    logger.info("Review confirmation email sent", {
      customerName: data.customerName,
      to: data.to,
      messageId: result.data?.id,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to send review confirmation email", error, {
      customerName: data.customerName,
      to: data.to,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### Step 3: Call from service
**File:** `lib/application/review.service.ts`
```typescript
import { sendReviewConfirmation } from "@/lib/utils/emailService";

export async function createReview(
  input: CreateReviewInput,
  customerId: string,
  deps: ReviewServiceDependencies
): Promise<Review> {
  // ... existing validation logic
  
  const review = await deps.reviewRepo.create(input);
  
  // Send confirmation email (fire-and-forget)
  try {
    await sendReviewConfirmation({
      to: customerEmail,
      customerName: customerName,
      serviceName: booking.service.name,
      therapistName: booking.therapist?.name,
      rating: input.rating,
    });
  } catch (error) {
    logger.error("Failed to send review confirmation", error);
    // Continue - email failure doesn't block review creation
  }
  
  return review;
}
```

## Adding a new storage bucket

### Step 1: Create bucket in Supabase
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Enter bucket name: `blog-images`
4. Set as **Public**
5. Click "Save"

### Step 2: Update domain types
**File:** `lib/domain/upload.types.ts`
```typescript
// Add to UploadBucket type
export type UploadBucket = 'therapist-photos' | 'service-images' | 'spa-hero' | 'avatar-uploads' | 'blog-images';

// Add to UPLOAD_BUCKETS constant
export const UPLOAD_BUCKETS: UploadBucket[] = [
  'therapist-photos',
  'service-images',
  'spa-hero',
  'avatar-uploads',
  'blog-images',  // ← New bucket
];
```

### Step 3: Update validation schemas
**File:** `lib/utils/validation.ts`
```typescript
// Add to adminUploadSchema enum
const adminUploadSchema = z.object({
  bucket: z.enum([
    'therapist-photos',
    'service-images',
    'spa-hero',
    'avatar-uploads',
    'blog-images',  // ← New bucket
  ]),
  entityId: z.string().min(1),
});

// Add to adminUploadDeleteSchema enum
const adminUploadDeleteSchema = z.object({
  url: z.string().url(),
  bucket: z.enum([
    'therapist-photos',
    'service-images',
    'spa-hero',
    'avatar-uploads',
    'blog-images',  // ← New bucket
  ]),
});
```

### Step 4: Update filename generation (optional)
**File:** `app/api/admin/upload/route.ts`
```typescript
// Update entity type mapping
const entityType = bucket === "therapist-photos" ? "therapist"
  : bucket === "avatar-uploads" ? "user"
  : bucket === "service-images" ? "service"
  : bucket === "spa-hero" ? "hero"
  : bucket === "blog-images" ? "blog"  // ← New mapping
  : "unknown";
```

### Step 5: Test the new bucket
```typescript
// Test upload in component
const formData = new FormData();
formData.append("file", file);
formData.append("bucket", "blog-images");
formData.append("entityId", "post-123");

const response = await fetch("/api/admin/upload", {
  method: "POST",
  body: formData,
});
```

## Adding a new admin page

### Step 1: Create page component
**File:** `app/(admin)/admin/my-feature/page.tsx`
```typescript
"use client";

import { useState, useEffect } from "react";
import { requireAdmin } from "@/lib/infra/supabase/currentUser";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { PageHero } from "@/components/layout/PageHero";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function MyFeaturePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/my-feature");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="flex-1">
        <PageHero
          title="My Feature"
          subtitle="Manage your feature here"
        />
        
        <SectionWrapper>
          {loading && <Spinner />}
          {error && <div className="text-red-600">{error}</div>}
          
          {!loading && !error && (
            <div className="space-y-4">
              {/* Your feature content here */}
              <Button onClick={loadData}>Refresh</Button>
            </div>
          )}
        </SectionWrapper>
      </main>
    </div>
  );
}
```

### Step 2: Add loading skeleton (optional)
**File:** `app/(admin)/admin/my-feature/loading.tsx`
```typescript
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </main>
    </div>
  );
}
```

### Step 3: Add navigation link
**File:** `components/layout/AdminSidebar.tsx`
```typescript
// Add to navigation menu
const navigation = [
  { name: "Dashboard", href: "/admin", current: pathname === "/admin" },
  { name: "Bookings", href: "/admin/bookings", current: pathname.includes("/admin/bookings") },
  { name: "Services", href: "/admin/services", current: pathname.includes("/admin/services") },
  { name: "Therapists", href: "/admin/therapists", current: pathname.includes("/admin/therapists") },
  { name: "My Feature", href: "/admin/my-feature", current: pathname.includes("/admin/my-feature") }, // ← New link
  // ... other items
];
```

### Step 4: Protect API routes
```typescript
// In all API routes for this feature
export async function GET(request: NextRequest) {
  try {
    const current = await requireAdmin(); // ← Admin-only protection
    // ... your logic
  } catch (error) {
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
```

## Validation schema pattern

### Creating new schemas
**File:** `lib/utils/validation.ts`

#### Basic schema
```typescript
const myFeatureSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type MyFeatureInput = z.infer<typeof myFeatureSchema>;
```

#### Schema with nested objects
```typescript
const complexFeatureSchema = z.object({
  title: z.string().min(1),
  metadata: z.object({
    category: z.string(),
    tags: z.array(z.string()),
  }),
  settings: z.object({
    public: z.boolean(),
    featured: z.boolean().default(false),
  }),
});
```

#### Schema with custom validation
```typescript
const customSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(120),
  website: z.string().url().optional(),
}).refine((data) => {
  // Custom validation logic
  if (data.age < 21 && data.website) {
    return false; // Under 21 can't have website
  }
  return true;
}, {
  message: "Users under 21 cannot have websites",
});
```

#### Schema for file uploads
```typescript
const fileUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => {
    return file.size <= 5 * 1024 * 1024; // 5MB max
  }, "File must be less than 5MB"),
  category: z.enum(["image", "document", "video"]),
});
```

### Using schemas in API routes
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = myFeatureSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: "Invalid input", 
          code: "VALIDATION_ERROR",
          details: parsed.error.format()
        },
        { status: 400 }
      );
    }
    
    // Use parsed.data (typed as MyFeatureInput)
    const result = await myService(parsed.data);
    return NextResponse.json(result);
    
  } catch (error) {
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
```

### Client-side validation
```typescript
// In React components
import { myFeatureSchema } from "@/lib/utils/validation";

function MyForm() {
  const [errors, setErrors] = useState({});
  
  const handleSubmit = (formData) => {
    const validation = myFeatureSchema.safeParse(formData);
    
    if (!validation.success) {
      setErrors(validation.error.format());
      return;
    }
    
    // Submit valid data
    submitForm(validation.data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      {errors.name && <span className="text-red-600">{errors.name._errors[0]}</span>}
      
      <input name="description" />
      {errors.description && <span className="text-red-600">{errors.description._errors[0]}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Running checks before commit

### Linting
```bash
# Check for lint errors
pnpm lint

# Auto-fix lint issues
pnpm lint:fix
```

### Type checking
```bash
# TypeScript compilation check
pnpm typecheck
# or
pnpm tsc --noEmit
```

### Testing
```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Watch mode during development
pnpm test:watch
```

### Build check
```bash
# Production build test
pnpm run build
```

### Pre-commit hooks (recommended)
**File:** `.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint
pnpm typecheck
pnpm test --run
```

## Common patterns and best practices

### Service pattern
```typescript
// Always accept dependencies for testability
export async function myService(input: MyInput, deps: MyServiceDependencies): Promise<MyResult> {
  // 1. Validate input
  if (!input.requiredField) {
    throw new ValidationError("Required field missing");
  }
  
  // 2. Business logic
  const result = await deps.myRepo.create(input);
  
  // 3. Side effects (fire-and-forget)
  try {
    await sendNotification(result);
  } catch (error) {
    logger.error("Notification failed", error);
  }
  
  return result;
}
```

### Repository pattern
```typescript
// Always handle errors consistently
export async function create(input: CreateInput): Promise<Entity> {
  const supabase = await getSupabaseUserClient();
  
  try {
    const { data, error } = await supabase
      .from('entities')
      .insert(input)
      .select()
      .single();
    
    if (error) {
      // Map specific database errors to domain errors
      if (error.code === '23505') {
        throw new ConflictError("DUPLICATE_ENTITY", "Entity already exists");
      }
      throw new InternalError("DB_ERROR", "Database operation failed", error);
    }
    
    return data;
  } catch (error) {
    // Re-throw domain errors
    if (error instanceof DomainError) {
      throw error;
    }
    // Wrap unexpected errors
    throw new InternalError("REPO_ERROR", "Repository operation failed", error);
  }
}
```

### Component pattern
```typescript
// Use proper TypeScript interfaces
interface Props {
  data: MyData;
  onUpdate: (data: MyData) => void;
  loading?: boolean;
}

export function MyComponent({ data, onUpdate, loading = false }: Props) {
  // Use hooks for state management
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle loading states
  if (loading) {
    return <Spinner />;
  }
  
  // Proper event handlers
  const handleSave = async (newData) => {
    try {
      await onUpdate(newData);
      setIsEditing(false);
    } catch (error) {
      // Handle error appropriately
    }
  };
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Error handling pattern
```typescript
// Always include context in error logs
logger.error("Operation failed", error, {
  operation: "createReview",
  userId: current.user.id,
  input: sanitizedInput,
});
```

### Performance pattern
```typescript
// Use React.memo for expensive components
export default React.memo(MyComponent);

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Use useCallback for stable references
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

## Testing new features

### Unit tests
```typescript
// tests/review.service.test.ts
describe('createReview', () => {
  it('should create review for valid input', async () => {
    const mockDeps = {
      reviewRepo: { create: vi.fn().mockResolvedValue(mockReview) },
      bookingRepo: { getById: vi.fn().mockResolvedValue(mockBooking) },
    };
    
    const result = await createReview(validInput, 'customer-123', mockDeps);
    
    expect(result).toEqual(mockReview);
    expect(mockDeps.reviewRepo.create).toHaveBeenCalledWith(validInput);
  });
  
  it('should throw ValidationError for invalid rating', async () => {
    const invalidInput = { ...validInput, rating: 6 };
    
    await expect(createReview(invalidInput, 'customer-123', mockDeps))
      .rejects
      .toThrow(ValidationError);
  });
});
```

### Integration tests
```typescript
// tests/api.reviews.test.ts
describe('POST /api/reviews', () => {
  it('should create review for authenticated customer', async () => {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validReviewInput),
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.rating).toBe(5);
  });
  
  it('should return 401 for unauthenticated request', async () => {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validReviewInput),
    });
    
    expect(response.status).toBe(401);
  });
});
```

### Component tests
```typescript
// tests/components/ReviewForm.test.tsx
describe('ReviewForm', () => {
  it('should render form fields', () => {
    render(<ReviewForm bookingId="booking-123" />);
    
    expect(screen.getByLabelText('Rating')).toBeInTheDocument();
    expect(screen.getByLabelText('Comment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Review' })).toBeInTheDocument();
  });
  
  it('should submit form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<ReviewForm bookingId="booking-123" onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Rating'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ rating: 5, comment: '' });
    });
  });
});
```

## Adding format utility

### When to add format utilities
- **Currency formatting** - Use existing `formatPrice()` from `lib/utils/format.ts`
- **Date formatting** - Use existing `formatAppointmentDate()` from `lib/utils/dateUtils.ts`
- **New formatting needs** - Add to appropriate utility file

### Example: Adding a new format utility
```typescript
// lib/utils/format.ts
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}
```

### Usage in components
```typescript
// components/ServiceCard.tsx
import { formatDuration, formatPrice } from "@/lib/utils/format";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <div>
      <h3>{service.name}</h3>
      <p>{formatDuration(service.duration_minutes)}</p>
      <p>{formatPrice(service.price)}</p>
    </div>
  );
}
```

### Guidelines for format utilities
- **Handle null/undefined** gracefully (return "—" or similar)
- **Use constants** for locale/currency settings
- **Keep pure functions** - no side effects
- **Add unit tests** for edge cases

## Documentation updates

When adding new features, update:

### 1. API documentation
- Add new routes to `docs/api/routes.md`
- Include request/response examples
- Document authentication requirements

### 2. Component documentation
- Add to `docs/components/component-tree.md`
- Include props interface
- Document data fetching patterns

### 3. Domain documentation
- Add new types to `docs/domain/data-models.md`
- Document relationships and constraints
- Include validation schema details

### 4. Architecture documentation
- Update service layer diagrams if needed
- Document new patterns or conventions
- Add troubleshooting guides for new features

### 5. Environment setup
- Add new environment variables to setup guide
- Document any new external services
- Include configuration steps
