import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/authService";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { updateProfile } from "@/lib/application/profile.service";
import { createProfileRepository } from "@/lib/infra/supabase/profile.repo";

export async function GET() {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "profile.get" });
  
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const profileRepo = createProfileRepository();
    const profile = await profileRepo.findById(current.user.id);
    
    return NextResponse.json({ profile });
  } catch (error) {
    log.error("Unexpected error in profile get route", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "profile.update" });
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const json = (await request.json()) as unknown;
    const parsed = profileUpdateSchema.safeParse(json);

    if (!parsed.success) {
      logger.warn("Profile update validation failed", {
        userId: current.user.id,
        issues: parsed.error.issues,
      });

      return NextResponse.json(
        { error: "Invalid profile data.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const payload: ProfileUpdateInput = parsed.data;
    await updateProfile(
      { 
        name: payload.name, 
        phone: payload.phone || null,
        avatar_url: payload.avatar_url 
      },
      { userId: current.user.id, profileId: current.profile.id },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Unexpected error in profile update route", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

