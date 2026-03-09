# Supabase Storage

## Overview
Supabase Storage stores uploaded images for the Serenity Spa booking application. All uploads go through the admin upload API endpoint - never directly from the client browser. This provides security, validation, and consistent file handling.

## Buckets

| Bucket | Purpose | Used by | File types | Typical size |
|--------|---------|---------|------------|--------------|
| `therapist-photos` | Therapist profile photos | TherapistForm | JPEG, PNG, WebP, GIF | 50-500 KB |
| `service-images` | Service gallery images | ServiceForm | JPEG, PNG, WebP, GIF | 100 KB - 2 MB |
| `spa-hero` | Hero/branding images | Settings | JPEG, PNG, WebP, GIF | 200 KB - 2 MB |
| `avatar-uploads` | Customer avatars | Profile | JPEG, PNG, WebP, GIF | 50-200 KB |

### Bucket creation in Supabase:
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Enter bucket name
4. Set as **Public** (for image access)
5. Add CORS policy if needed

### Bucket permissions:
```typescript
// All buckets are public for reading
// Private for writing (via service role key)
```

## Upload constraints

| Constraint | Value | Enforcement |
|-----------|-------|-------------|
| Max file size | 2 MB | API validation |
| Allowed types | image/jpeg, image/png, image/webp, image/gif | MIME type check |
| Max gallery images | 8 per service | UI validation |
| Upload auth | Admin only | requireAdmin() check |

### Validation implementation:
```typescript
// app/api/admin/upload/route.ts
if (file.size > MAX_UPLOAD_SIZE_BYTES) {
  return NextResponse.json(
    { error: "File too large. Maximum size is 2MB", code: "FILE_TOO_LARGE" },
    { status: 400 }
  );
}

if (!ALLOWED_IMAGE_TYPES.includes(file.type as ImageType)) {
  return NextResponse.json(
    { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF", code: "INVALID_TYPE" },
    { status: 400 }
  );
}
```

### Constants:
```typescript
// lib/domain/upload.types.ts
export const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_GALLERY_IMAGES = 8;
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'image/gif',
] as const;
```

## Upload flow

### Complete upload process:
```
Client (ImageUpload component)
  │
  ▼ FormData POST /api/admin/upload
  │   - file: File object
  │   - bucket: string
  │   - entityId: string
  │
app/api/admin/upload/route.ts
  │ 1. requireAdmin() - validates admin session
  │ 2. Zod validates bucket name
  │ 3. File size validation (≤ 2MB)
  │ 4. MIME type validation (image/*)
  │ 5. Generate filename
  │ 6. storage.repo.uploadFile()
  │
lib/infra/supabase/storage.repo.ts
  │ 1. getSupabaseAdminClient()
  │ 2. supabase.storage.from(bucket).upload()
  │ 3. Returns public URL
  │
Supabase Storage
  │ 1. Stores file in bucket
  │ 2. Generates public URL
  │ 3. Returns file metadata
  │
Response to client
  │ { url: string, filename: string, bucket: string }
```

### Request format:
```typescript
// FormData sent to /api/admin/upload
const formData = new FormData();
formData.append("file", file);
formData.append("bucket", "service-images");
formData.append("entityId", "service-123");
```

### Response format:
```typescript
// Successful upload response
{
  "url": "https://xyz.supabase.co/storage/v1/object/public/service-images/service-123-1704067200000.jpg",
  "filename": "service-123-1704067200000.jpg", 
  "bucket": "service-images"
}
```

## Filename convention

### Format:
`{entityType}-{entityId}-{timestamp}.{extension}`

### Examples:
- `service-abc123-1704067200000.jpg`
- `therapist-def456-1704067201000.png`
- `user-ghi789-1704067202000.webp`

### Implementation:
```typescript
// app/api/admin/upload/route.ts
const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
const entityType = bucket === "therapist-photos" ? "therapist" 
  : bucket === "avatar-uploads" ? "user" 
  : "service";
const filename = `${entityType}-${entityId.trim()}-${Date.now()}.${ext}`;
```

### Why this convention:
- **Human readable** - Entity type and ID visible
- **Unique** - Timestamp prevents collisions
- **Sortable** - Chronological by timestamp
- **Traceable** - Can identify source entity

## Public URL pattern

### URL structure:
```
https://{SUPABASE_URL}/storage/v1/object/public/{bucket}/{filename}
```

### Example:
```
https://abc123.supabase.co/storage/v1/object/public/service-images/service-abc123-1704067200000.jpg
```

### URL generation:
```typescript
// lib/infra/supabase/storage.repo.ts
export function getPublicUrl(bucket: UploadBucket, filename: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;
}
```

### Next.js image optimization:
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') ?? '',
      pathname: '/storage/v1/object/public/**',
    }],
  },
};
```

## Deleting files

### Delete API flow:
```
Client (admin UI)
  │
  ▼ DELETE /api/admin/upload
  │   Body: { url: string, bucket: string }
  │
app/api/admin/upload/route.ts
  │ 1. requireAdmin() validation
  │ 2. adminUploadDeleteSchema validation
  │ 3. Parse filename from URL
  │ 4. storage.repo.deleteFile()
  │
lib/infra/supabase/storage.repo.ts
  │ 1. getSupabaseAdminClient()
  │ 2. supabase.storage.from(bucket).remove([filename])
  │ 3. Graceful handling of "not found"
  │
Supabase Storage
  │ 1. Removes file from bucket
  │ 2. Returns success/error
  │
Response to client
  │ { success: true }
```

### Request format:
```typescript
// DELETE /api/admin/upload
{
  "url": "https://xyz.supabase.co/storage/v1/object/public/service-images/service-123-1704067200000.jpg",
  "bucket": "service-images"
}
```

### Filename parsing:
```typescript
// Extract filename from URL for deletion
const urlParts = new URL(parsed.data.url).pathname.split('/');
const filename = urlParts[urlParts.length - 1];
// Result: "service-123-1704067200000.jpg"
```

### Graceful deletion:
```typescript
// lib/infra/supabase/storage.repo.ts
const { error } = await supabase.storage
  .from(bucket)
  .remove([filename]);

if (error && !error.message.toLowerCase().includes('not found')) {
  throw new Error(`Storage delete failed: ${error.message}`);
}
// "not found" errors are ignored - file already gone
```

## Adding a new bucket

### Step-by-step process:

#### 1. Create bucket in Supabase
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Enter bucket name (e.g., `blog-images`)
4. Set as **Public** bucket
5. Click "Save"

#### 2. Update domain types
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

#### 3. Update validation schemas
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

#### 4. Update filename generation (optional)
**File:** `app/api/admin/upload/route.ts`

```typescript
// Add entity type mapping
const entityType = bucket === "therapist-photos" ? "therapist"
  : bucket === "avatar-uploads" ? "user"
  : bucket === "service-images" ? "service"
  : bucket === "blog-images" ? "blog"  // ← New mapping
  : "unknown";
```

#### 5. Test the new bucket
```typescript
// Test upload
const formData = new FormData();
formData.append("file", file);
formData.append("bucket", "blog-images");
formData.append("entityId", "post-123");

const response = await fetch("/api/admin/upload", {
  method: "POST",
  body: formData,
});
```

## Storage security

### Access patterns:
- **Public read** - All buckets are public for image URLs
- **Admin write** - Only admins can upload via API
- **Service role** - Server-side uploads bypass RLS
- **No direct client** - Browser never talks to Supabase Storage directly

### Security measures:
```typescript
// 1. Admin authentication
const current = await requireAdmin();
if (current.profile.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// 2. Bucket validation  
if (!UPLOAD_BUCKETS.includes(bucket as UploadBucket)) {
  return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
}

// 3. File validation
if (!ALLOWED_IMAGE_TYPES.includes(file.type as ImageType)) {
  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
```

### CORS considerations:
- Images served from Supabase domain
- Next.js image optimization handles cross-origin
- No CORS issues with public buckets

## Storage optimization

### Image optimization:
- **Next.js Image component** - Automatic resizing and optimization
- **WebP support** - Modern format preferred
- **Lazy loading** - Images load as needed
- **Responsive images** - Different sizes for different screens

### Storage costs:
- **Supabase free tier** - 1GB storage, 2GB bandwidth
- **Image compression** - Recommend optimizing before upload
- **Cache headers** - Supabase handles HTTP caching
- **CDN** - Supabase provides global CDN

### Cleanup strategies:
```typescript
// Optional: Clean up orphaned files
async function cleanupOrphanedFiles() {
  // Find files not referenced in database
  // Delete from storage
  // Run periodically via cron job
}
```

## Troubleshooting

### Common issues:

#### 1. Upload fails with "Invalid bucket"
**Causes:** Bucket not added to domain types
**Solution:** Update `UploadBucket` type and `UPLOAD_BUCKETS` constant

#### 2. Images not displaying
**Causes:** Next.js image config missing remote pattern
**Solution:** Update `next.config.ts` with Supabase URL pattern

#### 3. Large uploads fail
**Causes:** File exceeds 2MB limit
**Solution:** Compress images or increase limit

#### 4. Delete fails silently
**Causes:** File already deleted (graceful handling)
**Solution:** This is expected behavior

### Debugging tools:
```typescript
// Check bucket exists
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Available buckets:', buckets);

// Check file exists
const { data: file } = await supabase.storage
  .from('service-images')
  .getPublicUrl('filename.jpg');
console.log('Public URL:', file.publicUrl);

// List files in bucket
const { data: files } = await supabase.storage
  .from('service-images')
  .list();
console.log('Files:', files);
```

### Monitoring:
- **Supabase Dashboard** - Storage usage and file count
- **Next.js images** - Optimization statistics
- **API logs** - Upload success/failure rates
- **File size trends** - Monitor for large uploads
