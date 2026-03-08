# Image Implementation Plan
# Serenity Spa Booking App
# Date: March 8, 2026
# Status: Planning only — no code written
# Author: Codebase analysis complete

---

## EXECUTIVE SUMMARY

**Current state:** The app is structured with the correct architecture layers but currently lacks Supabase Storage integration. Therapist profiles already have a `photo_url` field defined (nullable string), and services have a `thumbnail_url` field. However, there is **NO image upload mechanism**—forms only have text input fields, and no API routes exist to handle file uploads.

**What needs to be built:** Complete image upload and management infrastructure across all 5 layers: Supabase Storage buckets + RLS policies, domain validation types, a dedicated storage repository, service-layer image handling, a new upload API endpoint, and UI components for image selection and display.

**Affected layers:** All 5 layers—Domain, Infrastructure, Services, API, and UI. This is a bottom-up implementation starting with Supabase setup and ending with admin form updates and public display.

---

## CURRENT STATE ANALYSIS

### What exists today

| Component | Status | Notes |
|-----------|--------|-------|
| **Therapist domain type** | ✅ Partial | `Therapist.photo_url: string \| null` exists |
| **Service domain type** | ✅ Partial | `Service.thumbnail_url?: string \| null` exists |
| **Therapist repo** | ✅ Full | `updateTherapist()` accepts `photo_url` in payload |
| **Service repo** | ✅ Full | `updateService()` accepts `thumbnail_url` in payload |
| **Avatar UI component** | ✅ Full | `Avatar.tsx` handles src + initials fallback, uses `next/image` |
| **ServiceCard component** | ✅ Full | Displays `thumbnail_url` with `<Image>` + "No image" placeholder |
| **Admin therapist form** | ✅ Partial | Has text input for `photo_url`, no upload widget |
| **Admin service form** | ✅ Partial | NO image/thumbnail field in form at all |
| **Public therapist display** | ✅ Partial | Shows initials avatar, doesn't use `photo_url` field |
| **Supabase Storage** | ❌ None | No storage client, no buckets, no RLS policies |
| **Upload API route** | ❌ None | No `/api/admin/upload` endpoint exists |
| **ImageUpload component** | ❌ None | No reusable file upload widget |
| **next.config.ts** | ❌ None | No `remotePatterns` configured for external images |

### What is missing

1. **Supabase Storage buckets** (therapist-photos, service-images mandatory)
2. **RLS policies** for storage buckets (read public, upload admin-only, delete admin-only)
3. **storage.repo.ts** — new infrastructure layer for all Storage API calls
4. **Upload API endpoint** — `/api/admin/upload` with multipart/form-data handling
5. **ImageUpload.tsx component** — reusable widget for file selection + upload
6. **ServiceForm.tsx** — add ImageUpload widget for service thumbnail
7. **TherapistForm.tsx** — replace text input with ImageUpload widget
8. **next.config.ts** — add remotePatterns for Supabase CDN domain
9. **Public display updates** — use actual `photo_url` in therapist cards (not just initials)
10. **BookingWizard.tsx** — show therapist photo in step 2

### Gaps in the domain types

| Type | Fields | Gap | Impact |
|------|--------|-----|--------|
| `Service` | `thumbnail_url?: string \| null` | No validation for URL format | Service creation/update will accept any string |
| `Therapist` | `photo_url: string \| null` | No validation for URL format | Therapist creation/update will accept any string |
| Global | No `FileUploadInput` or `ImageUploadResponse` type | Upload API must invent own types | API route has no clear request/response shape |

---

## SUPABASE STORAGE SETUP REQUIRED

### Buckets to create

| Bucket Name | Public | Purpose | Max file size |
|-------------|--------|---------|--------------|
| `therapist-photos` | Yes | Profile photos for therapists shown on /about, booking wizard | 2 MB |
| `service-images` | Yes | Service card images shown on /services, home featured section | 2 MB |

**Location:** All buckets in same Supabase project + region (no multi-region setup needed for this MVP).

### RLS Policies needed

#### For `therapist-photos` bucket:

| Policy Name | Effect | Who | Actions | Condition |
|-------------|--------|-----|---------|-----------|
| `Allow public SELECT` | ALLOW | `public (anon)` | SELECT | `bucket_id = 'therapist-photos'` |
| `Allow admin INSERT/DELETE` | ALLOW | Authenticated + `auth.role()='service_role'` | INSERT, DELETE | `bucket_id = 'therapist-photos'` |

**English:** Anyone can read therapist photos (they're public). Only the service role (admin API routes) can upload or delete.

#### For `service-images` bucket:

| Policy Name | Effect | Who | Actions | Condition |
|-------------|--------|-----|---------|-----------|
| `Allow public SELECT` | ALLOW | `public (anon)` | SELECT | `bucket_id = 'service-images'` |
| `Allow admin INSERT/DELETE` | ALLOW | Authenticated + `auth.role()='service_role'` | INSERT, DELETE | `bucket_id = 'service-images'` |

**English:** Anyone can read service images (they're public). Only the service role can upload or delete.

### Exact SQL for RLS policies

These are examples—exact SQL depends on your Supabase PostgreSQL version, but follow this pattern:

```sql
-- Therapist photos — allow public read
CREATE POLICY "public_read_therapist_photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'therapist-photos');

-- Therapist photos — allow service role write/delete
CREATE POLICY "service_therapist_photos_upload"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'therapist-photos' AND auth.role() = 'service_role');

CREATE POLICY "service_therapist_photos_delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'therapist-photos' AND auth.role() = 'service_role');

-- Service images — allow public read
CREATE POLICY "public_read_service_images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'service-images');

-- Service images — allow service role write/delete
CREATE POLICY "service_images_upload"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'service-images' AND auth.role() = 'service_role');

CREATE POLICY "service_images_delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'service-images' AND auth.role() = 'service_role');
```

**Note:** Console button approach is recommended for simplicity:
1. Go to Supabase Dashboard → Storage section
2. Create bucket `therapist-photos` (set Public = ON)
3. Create bucket `service-images` (set Public = ON)
4. For each bucket: Click "Policies" → "New Policy" → Add `SELECT` for public, `INSERT/DELETE` for service role
5. Supabase console generates the SQL automatically

### Environment variables required

All already exist in your `.env.local`:

| Variable | Example | Source | Used where |
|----------|---------|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxx.supabase.co` | Supabase Dashboard → Settings → API | `storage.repo.ts`, `next.config.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | (secret) | Supabase Dashboard → Settings → API | `adminClient.ts` (already used) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (public) | Supabase Dashboard → Settings → API | Already used |

**No new env vars needed.** Existing infra already configured.

---

## IMPLEMENTATION PLAN — LAYER BY LAYER

### LAYER 0 — Supabase Dashboard Setup
(Must be done before any code changes)

**Estimated time:** 15 minutes

#### Steps:

1. **Create `therapist-photos` bucket**
   - Navigate to Supabase Dashboard → Storage → Create new bucket
   - Name: `therapist-photos`
   - Set visibility: **Public** (turn ON)
   - Click Create

2. **Create `service-images` bucket**
   - Navigate to Supabase Dashboard → Storage → Create new bucket
   - Name: `service-images`
   - Set visibility: **Public** (turn ON)
   - Click Create

3. **Add RLS policy to `therapist-photos`**
   - Click bucket `therapist-photos` → Policies tab
   - Click "New Policy" → "Enable read access to public"
   - Accept defaults
   - Click "Create policy"
   - Click "New Policy" → Custom → Write your own
   - Template: "For INSERT/UPDATE/DELETE" with "SELECT" operation → "Service role" principal
   - In the text editor:
     ```sql
     (bucket_id = 'therapist-photos'::text) AND (auth.role() = 'service_role'::text)
     ```
   - Click "Create policy" (repeat for INSERT and DELETE)

4. **Add RLS policy to `service-images`**
   - Repeat step 3 for `service-images` bucket

5. **Verify buckets are accessible**
   - Each bucket should show: "Public selected" and 2-3 policies (SELECT, INSERT, DELETE)

---

### LAYER 1 — Domain (lib/domain/)

**Estimated time:** 15 minutes

#### Files to change:

| File | Change | Reason |
|------|--------|--------|
| `lib/domain/index.ts` | Add export for new types | Other layers need to import upload types |

#### New types to add:

**Create or extend validation in domain:**
- `FileUploadRequest` — what the upload API receives
- `FileUploadResponse` — what the upload API returns

**Current state:**
- `Service.thumbnail_url?: string | null` — Already nullable, no changes needed to Service type itself
- `Therapist.photo_url: string | null` — Already nullable, no changes needed to Therapist type itself

**Why these are OK as-is:**
- Both fields already accept `null` (perfect for "no image yet")
- Both already text strings (URLs)
- No validation needed in domain—validation happens in upload API

**New types to export from domain/index.ts:**

```typescript
// In lib/domain/upload.types.ts (NEW FILE)
export interface FileUploadRequest {
  bucket: 'therapist-photos' | 'service-images';
  filename: string;      // e.g., "therapist-abc123-1709812345.jpg"
  mimeType: string;      // e.g., "image/jpeg"
  entityId: string;      // therapistId or serviceId
  entityType: 'therapist' | 'service';
}

export interface FileUploadResponse {
  url: string;           // public HTTPS URL from Supabase CDN
  bucket: string;
  filename: string;
}

export type UploadError = {
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED' | 'UNAUTHORIZED';
  message: string;
};
```

Then in `lib/domain/index.ts`:
```typescript
export * from './upload.types';
```

---

### LAYER 2 — Infrastructure (lib/infra/supabase/)

**Estimated time:** 30 minutes

#### 2a — New file: `lib/infra/supabase/storage.repo.ts`

**Purpose:** ONLY file that imports Supabase Storage API. All upload/delete/getUrl operations go through here. Uses service role client (bypasses RLS for server uploads).

**Key design:**
- Takes `getSupabaseAdminClient()` as dependency (service role, RLS-bypassing)
- Never used from browser—only called from API routes
- All file operations are transactional with URL return

**Functions to implement:**

```typescript
export interface StorageRepository {
  uploadFile(
    bucket: 'therapist-photos' | 'service-images',
    filename: string,
    buffer: Buffer | Uint8Array,
    contentType: string,
  ): Promise<string>;  // returns public URL

  deleteFile(
    bucket: 'therapist-photos' | 'service-images',
    filename: string,
  ): Promise<void>;

  getPublicUrl(
    bucket: 'therapist-photos' | 'service-images',
    filename: string,
  ): string;  // returns CDN URL without API call
}

export async function uploadFile(
  bucket: string,
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  // Validate bucket whitelist
  // Call supabase.storage.from(bucket).upload(filename, buffer, { contentType })
  // Handle errors (file exists → overwrite, quota exceeded, auth failed)
  // Extract download URL from response
  // Return: https://xxx.supabase.co/storage/v1/object/public/bucket/filename
}

export async function deleteFile(
  bucket: string,
  filename: string,
): Promise<void> {
  // Call supabase.storage.from(bucket).remove([filename])
  // Handle "file not found" (silent success)
}

export function getPublicUrl(
  bucket: string,
  filename: string,
): string {
  // NO API call—just construct:
  // `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`
  // Used to generate URLs without uploading (for existing images)
}
```

**Security notes:**
- Uses `adminClient` (service role key) — bypasses RLS
- Only called from API routes (never exposed to client)
- Filename validation: Reject paths with `../`, null bytes
- Bucket whitelist: Only `therapist-photos`, `service-images` allowed

#### 2b — Updates to existing repos

**file: `lib/infra/supabase/therapist.repo.ts`**
- No changes needed
- `updateTherapist()` already accepts `photo_url` in payload
- Business logic (deciding when to update photo_url) belongs in service/API layer

**file: `lib/infra/supabase/service.repo.ts`**
- No changes needed
- `updateService()` already accepts `thumbnail_url` in payload
- Business logic belongs in service/API layer

---

### LAYER 3 — Services (lib/application/)

**Estimated time:** 20 minutes

#### Files to change:

| File | Function | Change |
|------|----------|--------|
| `lib/application/admin.service.ts` | `updateTherapistAdmin()` | No code change needed—already handles `photo_url` |
| `lib/application/admin.service.ts` | `updateServiceAdmin()` | No code change needed—already handles `thumbnail_url` |

**Why no changes needed:**
- Admin service layer functions already accept `photo_url` and `thumbnail_url` from input
- Repos already persist these fields correctly
- Image upload validation happens in API route (multipart parsing, size checks)
- Service layer is dumb about where URL came from (DB, upload API result, etc.)

**Key design decision documented:**
- **Image upload happens in API layer**, not service layer
  - API parses multipart/form-data (requires Node.js APIs)
  - API calls `storage.repo.ts` to upload
  - API gets back public URL
  - API calls `updateTherapistAdmin()` or `updateServiceAdmin()` with URL
  - Service layer updates DB with URL (via repo)
- **StorageRepository NOT injected into admin service**
  - Admin service is DB-centric, not file-centric
  - Upload sequence is: API → storage.repo → DB repo
  - No need for admin service to know about storage

---

### LAYER 4 — API (app/api/)

**Estimated time:** 30 minutes

#### New route: `app/api/admin/upload/route.ts`

**Purpose:** Handles multipart file upload from admin forms (TherapistForm, ServiceForm). Auth: Admin only.

**HTTP Method:** POST only

**Request:** multipart/form-data with:
- `file: File` — File object from form
- `bucket: string` — "therapist-photos" or "service-images"
- `entityId: string` — therapist ID or service ID (used in filename)

**Response:** `{ url: string }`
- Example: `{ "url": "https://xxx.supabase.co/storage/v1/object/public/therapist-photos/therapist-abc123-1709812345.jpg" }`

**Error responses:**

| Status | Code | Example |
|--------|------|---------|
| 401 | UNAUTHENTICATED | User not logged in |
| 403 | FORBIDDEN | User is not admin |
| 400 | INVALID_BUCKET | Bucket not in whitelist |
| 400 | FILE_TOO_LARGE | File > 2 MB |
| 400 | INVALID_TYPE | MIME type not image/* |
| 500 | UPLOAD_FAILED | Supabase Storage error |

**Validation checks (in order):**

1. **Auth:** `const current = await getCurrentUser()` → throw 401 if null
2. **Admin role:** `if (current.profile.role !== 'admin')` → throw 403
3. **Bucket:** `const bucket = body.bucket; if (!['therapist-photos', 'service-images'].includes(bucket))` → throw 400
4. **File exists:** `const file = body.file; if (!file)` → throw 400
5. **File size:** `if (file.size > 2 * 1024 * 1024)` → throw 400
6. **MIME type:** `if (!file.type.startsWith('image/'))` → throw 400
7. **Entity ID:** `const entityId = body.entityId; if (!entityId || typeof entityId !== 'string')` → throw 400

**Implementation pseudocode:**

```typescript
export async function POST(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: 'admin.upload.POST' });

  try {
    // 1. Auth
    const current = await getCurrentUser();
    if (!current) return 401 UNAUTHENTICATED;

    // 2. Admin check
    if (current.profile.role !== 'admin') return 403 FORBIDDEN;

    // 3. Parse multipart
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as string | null;
    const entityId = formData.get('entityId') as string | null;

    // 4. Validate bucket
    if (!bucket || !['therapist-photos', 'service-images'].includes(bucket)) {
      return 400 { code: 'INVALID_BUCKET' };
    }

    // 5. Validate file
    if (!file) return 400 { code: 'MISSING_FILE' };
    if (file.size > 2 * 1024 * 1024) return 400 { code: 'FILE_TOO_LARGE' };
    if (!file.type.startsWith('image/')) return 400 { code: 'INVALID_TYPE' };

    // 6. Validate entityId
    if (!entityId || typeof entityId !== 'string') {
      return 400 { code: 'MISSING_ENTITY_ID' };
    }

    // 7. Generate filename
    const ext = file.type.split('/')[1]; // 'jpeg' from 'image/jpeg'
    const timestamp = Date.now();
    const filename = `${bucket === 'therapist-photos' ? 'therapist' : 'service'}-${entityId}-${timestamp}.${ext}`;

    // 8. Read file buffer
    const buffer = await file.arrayBuffer();

    // 9. Upload via storage repo
    const storageRepo = createStorageRepository();
    const url = await storageRepo.uploadFile(bucket, filename, buffer, file.type);

    // 10. Return URL
    return NextResponse.json({ url }, { status: 200 });

  } catch (error) {
    log.error('POST /api/admin/upload failed', error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
```

**Dependencies:**
- Import `getCurrentUser` from auth service
- Import `createStorageRepository` from infra layer
- Use existing `logger` and `mapErrorToLegacyHttp` utilities

#### Updates to existing routes

| Route | Method | Change | Reason |
|-------|--------|--------|--------|
| `/api/admin/therapists` | POST/PUT | No code change | Forms will send `photo_url` (pre-populated from ImageUpload) in JSON body |
| `/api/admin/services` | POST/PUT | No code change | Forms will send `thumbnail_url` (pre-populated from ImageUpload) in JSON body |

**Flow:**
1. User selects image in admin form
2. ImageUpload component POSTs to `/api/admin/upload`
3. API returns `{ url }`
4. ImageUpload component calls `onUpload(url)` callback
5. Admin form stores URL in state (e.g., `photoUrl`)
6. Admin form POSTs to `/api/admin/therapists` with `photo_url: photoUrl` in body
7. Existing route handler works as-is

---

### LAYER 5 — UI (app/, components/)

**Estimated time:** 60 minutes

#### New component: `components/ui/ImageUpload.tsx`

**Purpose:** Reusable widget for file selection + upload, used in TherapistForm and ServiceForm.

**Type:** Client component (`"use client"`)

**Props:**

```typescript
interface ImageUploadProps {
  currentUrl?: string | null;        // Existing image URL to preview
  bucket: 'therapist-photos' | 'service-images';
  onUpload: (url: string) => void;   // Called with new URL after upload succeeds
  label?: string;                    // Form field label (default: "Image")
  aspectRatio?: 'square' | 'landscape';  // Recommended aspect ratio (for UI hint only)
  maxSizeMb?: number;                // Max file size in MB (default: 2)
  allowedMimeTypes?: string[];       // Allowed MIME types (default: ['image/jpeg', 'image/png', 'image/webp'])
}
```

**Behavior:**

1. **Render phase:**
   - Show current image if `currentUrl` exists (using `<Image>`)
   - Show placeholder if null (e.g., "No image" + icon)
   - File input button ("Choose file")
   - Hidden file `<input type="file" accept="image/*" />`

2. **On file select:**
   - Validate size client-side: `if (file.size > maxSizeMb * 1024 * 1024)` → show error toast
   - Validate MIME type: `if (!allowedMimeTypes.includes(file.type))` → show error toast
   - Show loading spinner
   - POSTs to `/api/admin/upload` with FormData:
     ```javascript
     const formData = new FormData();
     formData.append('file', file);
     formData.append('bucket', bucket);
     formData.append('entityId', entityId); // Need to pass this as prop
     ```

3. **On success:**
   - Call `onUpload(url)` with returned URL
   - Update preview image
   - Hide loading spinner
   - Optional: show success toast

4. **On error:**
   - Show error toast with message
   - Hide loading spinner
   - Allow retry

**States to manage:**
- `isLoading: boolean` — show spinner during upload
- `error: string | null` — show error message
- `preview: string | null` — show image preview

**Optional enhancements (NOT in MVP):**
- Client-side image cropping
- Drag-and-drop
- Image optimization before upload

---

#### Components to update

| Component | Change | Details |
|-----------|--------|---------|
| `components/admin/TherapistForm.tsx` | Replace text input with ImageUpload | Remove `<input value={photoUrl} ...>` text field, add `<ImageUpload bucket="therapist-photos" onUpload={(url) => setPhotoUrl(url)} ... />` |
| `components/admin/ServiceForm.tsx` | Add ImageUpload for thumbnail | Add new `<ImageUpload bucket="service-images" onUpload={(url) => setThumbnailUrl(url)} ... />` field (currently missing entirely) |

**For TherapistForm:**
- Remove text input for photo_url
- Add state: `const [thumbnailUrl, setThumbnailUrl] = useState(initial?.photo_url ?? "")`
- Add component: `<ImageUpload currentUrl={photoUrl} bucket="therapist-photos" onUpload={setPhotoUrl} label="Profile photo" aspectRatio="square" />`

**For ServiceForm:**
- Add state: `const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url ?? "")`
- Add component: `<ImageUpload currentUrl={thumbnailUrl} bucket="service-images" onUpload={setThumbnailUrl} label="Service image" aspectRatio="landscape" />`
- Include in POST/PUT payload: `thumbnail_url: thumbnailUrl`

---

#### Display components to update

| Component | Change | Impact |
|-----------|--------|--------|
| `app/(public)/about/page.tsx` | Use therapist.photo_url in avatar | Replace hard-coded initials with actual avatar when URL exists |
| `app/(public)/services/page.tsx` | No change needed | ServiceCard already shows thumbnail_url correctly |
| `app/page.tsx` | No change needed | ServiceCard already shows thumbnail_url correctly |
| `components/booking/BookingWizard.tsx` | Show therapist photo in step 2 | Add Avatar component displaying therapist.photo_url (or initials fallback) |

**For about/page.tsx:**

Replace:
```typescript
<div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
  {therapist.name.split(" ").map((n) => n[0]).join("").slice(0, 3)}
</div>
```

With:
```typescript
<Avatar src={therapist.photo_url} name={therapist.name} size="md" />
```

**For BookingWizard.tsx:**

In step 2 rendering (therapist selection), add therapist avatar:
```typescript
{currentTherapist && (
  <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-2">
    <Avatar src={currentTherapist.photo_url} name={currentTherapist.name} size="sm" />
    <div>
      <p className="text-sm font-semibold">{currentTherapist.name}</p>
      {currentTherapist.title && <p className="text-xs text-gray-600">{currentTherapist.title}</p>}
    </div>
  </div>
)}
```

**But wait:** BookingWizard fetches `Therapist` type which only has `id, name, title`. Need to update the API endpoint to also return `photo_url`.

Check `app/api/booking/therapists/route.ts` (or similar) — it should fetch from `therapist.repo.ts`. The repo's `listTherapistsForService()` currently selects:
```typescript
.select("therapists(id, name, title, is_active)")
```

This needs to become:
```typescript
.select("therapists(id, name, title, photo_url, is_active)")
```

Same for any other therapist list endpoints used by BookingWizard.

---

## NEXT.JS IMAGE OPTIMIZATION

### Configuration in next.config.ts

Add `remotePatterns` to allow Supabase CDN images:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("https://")[1]}.supabase.co`,
      },
    ],
  },
};

export default nextConfig;
```

**Reason:** Next.js Image component requires explicit allowlist of external image domains for security. Supabase CDN domain is in format `https://xxx.supabase.co/storage/v1/object/...`.

### Image component usage

**All existing image displays already use `next/image`:**
- `Avatar.tsx` — uses `<Image>`
- `ServiceCard.tsx` — uses `<Image>`

**No changes needed** once remotePatterns is configured.

---

## FILE CONVENTIONS

### Uploaded file naming

**Format:** `[entityType]-[entityId]-[timestamp].[ext]`

**Examples:**
- `therapist-f47ac10b-58cc-4372-a567-0e02b2c3d479-1709812345678.jpg`
- `service-12345678-1111-2222-3333-444444444444-1709812345678.png`

**Why this convention:**
- ✅ **Unique:** timestamp + ID ensures collisions are impossible
- ✅ **Traceable:** entity type and ID visible in filename (for debugging)
- ✅ **Sortable:** timestamp allows chronological order (tools, logs)
- ✅ **Safe:** no spaces, slashes, or special chars
- ✅ **No collisions:** even if user re-uploads, new timestamp = new file

**Implementation in upload API:**
```typescript
const [mimeType, ext] = file.type.split('/');  // 'image/jpeg' → ext = 'jpeg'
const timestamp = Date.now();  // ms since epoch
const filename = `${entityType}-${entityId}-${timestamp}.${ext}`;
```

---

## ROLLOUT ORDER

Exact sequence (do not skip or reorder):

1. **Supabase bucket setup** (Dashboard, 15 min)
   - Create therapist-photos bucket
   - Create service-images bucket
   - Add RLS policies to both
   - Verify in Storage section

2. **Domain types updated** (lib/domain/, 15 min)
   - Create `lib/domain/upload.types.ts` with FileUploadRequest/Response
   - Export from `lib/domain/index.ts`

3. **storage.repo.ts created** (lib/infra/supabase/, 20 min)
   - Implement uploadFile(), deleteFile(), getPublicUrl()
   - Export StorageRepository interface
   - Test: ensure it compiles

4. **Upload API route created** (app/api/admin/upload/, 20 min)
   - Implement POST handler with multipart parsing
   - Add auth + admin checks
   - Add validation (size, type, bucket)
   - Call storage.repo.uploadFile()
   - Return { url }

5. **ImageUpload component created** (components/ui/, 25 min)
   - Implement client component with file input
   - Add upload state + error handling
   - Call /api/admin/upload
   - Call onUpload callback with URL

6. **Admin forms updated** (components/admin/, 20 min)
   - TherapistForm: replace photo_url text input with ImageUpload
   - ServiceForm: add thumbnail_url ImageUpload

7. **Therapist list endpoints update** (app/api/..., 10 min)
   - Add photo_url to SELECT in therapist queries
   - Affects: booking endpoints, about page, booking wizard

8. **Display components updated** (app/, components/, 15 min)
   - about/page.tsx: use Avatar with photo_url
   - BookingWizard.tsx: show therapist photo in step 2

9. **next.config.ts updated** (root, 5 min)
   - Add remotePatterns for Supabase CDN

10. **Build + Test** (15 min)
    - Run `pnpm run build` — must exit 0
    - Run `pnpm run lint` — must exit 0
    - Manual test: admin upload form, public display

11. **docs/AUDIT_LOG.md updated** (5 min)
    - Document: image feature added, buckets created, routes added

---

## ESTIMATED EFFORT

| Layer | Files touched | Time estimate |
|-------|----------------|--------------|
| Supabase setup | Dashboard only | 15 min |
| Domain (lib/domain/) | 2 files (1 new) | 15 min |
| Infrastructure (lib/infra/supabase/) | 1 new file | 20 min |
| Services (lib/application/) | 0 files (no changes needed) | 0 min |
| API (app/api/) | 1 new + 1 update (therapist endpoints) | 20 min |
| UI components | 2 new/updated forms + 1 new widget + 2 display | 50 min |
| Config (next.config.ts, etc.) | 1 file | 5 min |
| Testing + build + docs | - | 20 min |
| **TOTAL** | **~10 files** | **~145 min ≈ 2.5 hours** |

**Real-world time:** Expect 3-4 hours with debugging, because:
- First-time multipart form parsing can have edge cases
- Supabase RLS policy testing takes iteration
- Image domain configuration issues are common

---

## RISKS AND MITIGATIONS

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Supabase RLS blocks upload from API | Medium | Upload API 403s | Use service role client (adminClient already does) — test with Postman/curl before UI |
| File too large crashes backend | Low | Memory exhaustion | Validate size client-side + server-side (both checks needed) |
| Image URL breaks if file deleted | Medium | Broken image display | Soft-delete pattern: never delete files, only mark DB records as inactive. OR: Always keep old images—they cost storage pennies |
| next/image ignores remotePatterns | Low | Image won't render | Test in dev: import Image from 'next/image', render Supabase URL, check console for errors |
| MIME type validation too strict | Low | User can't upload valid images | Allow ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] — test with file extension upload |
| Entity ID validation missing | Medium | Upload succeeds but URL stored wrong ID | Validate entityId regex: `^[a-f0-9-]{36}$` (UUID format) or whatever your ID format is |
| Therapist has no photo_url in form | Low | Avatar falls back to initials | This is acceptable UX — Avatar component already handles null |

---

## ARCHITECTURE COMPLIANCE CHECKLIST

Before any code is written, verify:

- [ ] **storage.repo.ts is ONLY file importing Supabase Storage API**
  - Check: No other file in codebase imports `supabase.storage`
  - Reason: Centralize all Storage logic for testability + security

- [ ] **Upload API route uses service role via storage.repo**
  - Check: API calls `createStorageRepository()` (which uses adminClient)
  - Reason: Service role bypasses RLS, allowing uploads

- [ ] **No Supabase Storage imports in services or UI**
  - Check: Only API routes call storage.repo
  - Reason: Enforce dependency rules (UI → API → services → infra)

- [ ] **ImageUpload component calls /api/admin/upload (not Storage)**
  - Check: Component POSTs formData to `/api/admin/upload` endpoint
  - Reason: Keep client code away from Storage auth logic

- [ ] **Domain types updated before infra changes**
  - Check: upload.types.ts exists before storage.repo.ts imports it
  - Reason: Avoid circular dependencies

- [ ] **All new functions follow existing DI pattern**
  - Check: StorageRepository functions don't instantiate clients—take adminClient as param (or call getSupabaseAdminClient inside)
  - Reason: Match existing code patterns (see how therapist.repo.ts does it)

- [ ] **Build passes with 0 TypeScript errors after changes**
  - Command: `pnpm run build`
  - Reason: Prod deployment will fail otherwise

---

## OPEN QUESTIONS (to answer before implementation)

**Before you start code, answer these:**

### 1. Database schema verification

**Question:** In your Supabase database, do these columns already exist?

```sql
-- Check therapists table
SELECT * FROM information_schema.columns 
WHERE table_name = 'therapists' AND column_name IN ('photo_url');

-- Check services table
SELECT * FROM information_schema.columns 
WHERE table_name = 'services' AND column_name IN ('thumbnail_url');
```

**Expected answer:** Both columns should already exist as `TEXT` with `NULL` default.

**If NOT found:** You need to run this migration in Supabase SQL Editor FIRST:
```sql
ALTER TABLE therapists 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
```

### 2. next.config.ts status

**Question:** Does your `next.config.ts` already have any `images` section?

**Expected:** It's empty or missing (as seen in current codebase).

**If already configured with remotePatterns:** Verify that the Supabase domain will be added to existing patterns (don't overwrite).

### 3. Static images in public/

**Question:** Do you have static images in `public/images/` that should be:
- A) Left as-is (static public images stay in public/)
- B) Migrated to Supabase Storage (therapist/service photos)

**Recommendation:** Keep static images (`hero-spa.jpg`, `about-hero.jpg`) in `public/`. Only user-uploaded images go to Supabase Storage.

### 4. Image requirements

**Question:** For uploaded images:
- Should service images be **required** or **optional** when creating a service?
- Should therapist photos be **required** or **optional**?

**Recommendation:** Make both **optional**. Admins can add photos later. Having default initials fallback is better UX than forcing uploads.

### 5. Image cropping

**Question:** Should the upload widget support image cropping before upload?

**Recommendation:** No for MVP. Cropping adds complexity:
- Need a cropping library (react-easy-crop, etc.)
- Extra UI states (crop mode, confirm/cancel)
- File size doesn't matter much for 2 MB limit

Keep simple: user uploads → validation → store. Admins can pre-crop images outside the app if needed.

---

## SUPABASE MIGRATION REQUIRED (IF COLUMNS DON'T EXIST)

**Run this in Supabase SQL Editor ONLY IF the columns don't exist in your database:**

```sql
-- Add photo_url to therapists table (if missing)
ALTER TABLE therapists 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add thumbnail_url to services table (if missing)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('therapists', 'services')
AND column_name IN ('photo_url', 'thumbnail_url')
ORDER BY table_name, column_name;
```

**Expected output:**
```
| column_name | data_type | is_nullable |
|-------------|-----------|-----------|
| photo_url | text | YES |
| thumbnail_url | text | YES |
```

**If either column is missing after ALTER TABLE:** Contact Supabase support (rare bug).

---

## SUMMARY TABLE

| Layer | What's needed | Status | Effort |
|-------|--------------|--------|--------|
| **Supabase** | Buckets + RLS | Must create | 15 min |
| **Domain** | upload.types.ts | Create new | 15 min |
| **Infrastructure** | storage.repo.ts | Create new | 20 min |
| **Services** | — | No change | 0 min |
| **API** | /api/admin/upload | Create new | 20 min |
| **UI** | ImageUpload component | Create new | 25 min |
| **UI** | TherapistForm update | Update | 10 min |
| **UI** | ServiceForm update | Update | 10 min |
| **UI** | Display updates | Update | 15 min |
| **Config** | next.config.ts | Update | 5 min |
| **Testing** | Build + verify | Test | 20 min |

---

## NEXT STEPS

1. **Verify the database columns exist** (run the SQL query in Supabase)
2. **Create Supabase buckets** (therapist-photos, service-images)
3. **Add RLS policies** (via console or SQL)
4. **Start implementation** from Layer 1 (Domain), proceeding in order through Layer 5
5. **Test after each layer** (type check: `pnpm run typecheck`, build: `pnpm run build`)
6. **Manual smoke test** in admin panel (upload photo, verify it shows)

---

[END OF PLAN]

---

## APPENDIX: FILE CHECKLIST FOR REFERENCE

Files that will be created:
- [ ] `lib/domain/upload.types.ts` (NEW)
- [ ] `lib/infra/supabase/storage.repo.ts` (NEW)
- [ ] `app/api/admin/upload/route.ts` (NEW)
- [ ] `components/ui/ImageUpload.tsx` (NEW)

Files that will be updated:
- [ ] `lib/domain/index.ts` (add export)
- [ ] `components/admin/TherapistForm.tsx` (replace input with ImageUpload)
- [ ] `components/admin/ServiceForm.tsx` (add ImageUpload field)
- [ ] `app/(public)/about/page.tsx` (use Avatar with photo_url)
- [ ] `components/booking/BookingWizard.tsx` (show therapist photo)
- [ ] `app/api/booking/therapists/*route.ts` (add photo_url to SELECT)
- [ ] `next.config.ts` (add remotePatterns)

Files that will NOT change:
- `lib/application/admin.service.ts` — already correct
- `lib/infra/supabase/therapist.repo.ts` — already correct
- `lib/infra/supabase/service.repo.ts` — already correct
- `app/api/admin/therapists/route.ts` — forms will send correct data
- `app/api/admin/services/route.ts` — forms will send correct data
