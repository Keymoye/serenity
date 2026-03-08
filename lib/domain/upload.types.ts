/**
 * Upload domain types.
 * Used by the upload API route and UI components.
 * No Supabase imports. No business logic.
 */

export type UploadBucket = 'therapist-photos' | 'service-images' | 'spa-gallery' | 'spa-hero' | 'avatar-uploads';

export type UploadEntityType = 'therapist' | 'service';

export interface FileUploadResponse {
  url: string;
  bucket: UploadBucket;
  filename: string;
}

export type UploadErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_TYPE'
  | 'UPLOAD_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_BUCKET'
  | 'MISSING_FILE'
  | 'MISSING_ENTITY_ID';

export const UPLOAD_BUCKETS: UploadBucket[] = [
  'therapist-photos',
  'service-images',
  'spa-gallery',
  'spa-hero',
  'avatar-uploads',
];

export const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;
