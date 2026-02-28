import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export async function POST() {
  try {
    const supabase = await getServerSupabaseClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Supabase sign-out failed", error);
      return NextResponse.json(
        { error: "Failed to sign out.", code: "SIGN_OUT_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Unexpected error in logout route", error);
    return NextResponse.json(
      { error: "Internal server error.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

