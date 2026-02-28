import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/services/authService";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

export async function PATCH(request: Request) {
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

    const supabase = getServerSupabaseClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        name: payload.name,
        phone: payload.phone || null,
      })
      .eq("id", current.profile.id);

    if (error) {
      logger.error("Supabase profile update failed", error, {
        profileId: current.profile.id,
      });
      return NextResponse.json(
        { error: "Unable to update profile.", code: "UPDATE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Unexpected error in profile update route", error);
    return NextResponse.json(
      { error: "Internal server error.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

