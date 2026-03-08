import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { getCurrentUser } from "@/lib/services/authService";
import { createStorageRepository } from "@/lib/infra/supabase/storage.repo";
import {
  UploadBucket,
  UPLOAD_BUCKETS,
  MAX_UPLOAD_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/domain/upload.types";

export async function POST(request: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "admin.upload.POST" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    // only admin may upload
    if (current.profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden.", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;
    const entityId = formData.get("entityId") as string | null;

    if (!bucket || !UPLOAD_BUCKETS.includes(bucket as UploadBucket)) {
      return NextResponse.json(
        { error: "Invalid or missing bucket", code: "INVALID_BUCKET" },
        { status: 400 },
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", code: "MISSING_FILE" },
        { status: 400 },
      );
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB", code: "FILE_TOO_LARGE" },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF",
          code: "INVALID_TYPE",
        },
        { status: 400 },
      );
    }

    if (!entityId || entityId.trim() === "") {
      return NextResponse.json(
        { error: "Missing entityId", code: "MISSING_ENTITY_ID" },
        { status: 400 },
      );
    }

    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const entityType = bucket === "therapist-photos" ? "therapist" : "service";
    const filename = `${entityType}-${entityId.trim()}-${Date.now()}.${ext}`;

    const buffer = await file.arrayBuffer();
    const storageRepo = createStorageRepository();
    const url = await storageRepo.uploadFile(
      bucket as UploadBucket,
      filename,
      buffer,
      file.type,
    );

    return NextResponse.json({ url, filename, bucket });
  } catch (error) {
    log.error("POST /api/admin/upload failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
