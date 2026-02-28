import { NextResponse } from "next/server";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/services/authService";
import { logger } from "@/lib/utils/logger";

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const json = (await request.json()) as { password?: string };
    const password = json.password;

    if (!password || password.length < 8) {
      return NextResponse.json(
        {
          error: "Password must be at least 8 characters long.",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Password update must happen using the auth client bound to the user session.
    const supabase = getBrowserSupabaseClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      logger.error("Supabase updateUser (password) failed", error, {
        userId: current.user.id,
      });
      return NextResponse.json(
        { error: "Unable to update password.", code: "UPDATE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Unexpected error in password update route", error);
    return NextResponse.json(
      { error: "Internal server error.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

