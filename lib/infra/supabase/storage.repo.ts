import { getSupabaseAdminClient } from "./adminClient";
import {
  UploadBucket,
  UPLOAD_BUCKETS,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/lib/domain/upload.types";

export interface StorageRepository {
  uploadFile(
    bucket: UploadBucket,
    filename: string,
    buffer: ArrayBuffer,
    contentType: string,
  ): Promise<string>;

  deleteFile(
    bucket: UploadBucket,
    filename: string,
  ): Promise<void>;

  getPublicUrl(
    bucket: UploadBucket,
    filename: string,
  ): string;
}

function assertValidBucket(bucket: string): asserts bucket is UploadBucket {
  if (!UPLOAD_BUCKETS.includes(bucket as UploadBucket)) {
    throw new Error(`Invalid storage bucket: "${bucket}"`);
  }
}

export async function uploadFile(
  bucket: UploadBucket,
  filename: string,
  buffer: ArrayBuffer,
  contentType: string,
): Promise<string> {
  assertValidBucket(bucket);

  if (buffer.byteLength > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('File exceeds maximum size of 2MB');
  }

  const supabase = await getSupabaseAdminClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return getPublicUrl(bucket, filename);
}

export async function deleteFile(
  bucket: UploadBucket,
  filename: string,
): Promise<void> {
  assertValidBucket(bucket);

  const supabase = await getSupabaseAdminClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filename]);

  if (error && !error.message.toLowerCase().includes('not found')) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}

export function getPublicUrl(
  bucket: UploadBucket,
  filename: string,
): string {
  assertValidBucket(bucket);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;
}

export function createStorageRepository(): StorageRepository {
  return { uploadFile, deleteFile, getPublicUrl };
}
