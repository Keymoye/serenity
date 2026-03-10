import { NextRequest, NextResponse } from "next/server"
import { requireCustomer } from "@/lib/infra/supabase/currentUser"
import { createStorageRepository } from "@/lib/infra/supabase/storage.repo"
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper"
import { logger } from "@/lib/utils/logger"
import {
  MAX_UPLOAD_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/domain/upload.types"

const AVATAR_BUCKET = "avatar-uploads" as const

export async function POST(
  request: NextRequest
) {
  try {
    const current = await requireCustomer()
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided.",
          code: "MISSING_FILE" },
        { status: 400 }
      )
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error:
          "File too large. Maximum 2MB.",
          code: "FILE_TOO_LARGE" },
        { status: 400 }
      )
    }

    if (!ALLOWED_IMAGE_TYPES.includes(
      file.type as typeof
        ALLOWED_IMAGE_TYPES[number]
    )) {
      return NextResponse.json(
        { error: "Invalid file type.",
          code: "INVALID_TYPE" },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop()
      ?? 'jpg'
    const filename =
      `avatar-${current.user.id}` 
      + `-${Date.now()}.${ext}` 

    const storageRepo =
      createStorageRepository()
    const buffer = await file.arrayBuffer()
    const url = await storageRepo
      .uploadFile(
        AVATAR_BUCKET,
        filename,
        buffer,
        file.type
      )

    return NextResponse.json(
      { url, filename,
        bucket: AVATAR_BUCKET },
      { status: 201 }
    )
  } catch (error) {
    logger.error(
      "Avatar upload failed", error)
    const { status, body } =
      mapErrorToLegacyHttp(error)
    return NextResponse.json(
      body, { status })
  }
}
