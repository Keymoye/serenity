import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/services/authService";
import { logger } from "@/lib/utils/logger";

type LockRequestBody = {
  timeSlotId?: string;
};

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const json = (await request.json()) as LockRequestBody;
    const { timeSlotId } = json;

    if (!timeSlotId) {
      return NextResponse.json(
        { error: "Missing timeSlotId.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const supabase = getServerSupabaseClient();

    const lockUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    // Attempt to atomically lock this slot if it's still available and not currently locked.
    const { data, error } = await supabase
      .from("time_slots")
      .update({
        locked_until: lockUntil,
      })
      .eq("id", timeSlotId)
      .eq("is_available", true)
      .or(`locked_until.is.null,locked_until.lt.${nowIso}`)
      .select("id")
      .maybeSingle();

    if (error) {
      logger.error("Failed to lock time slot", error, {
        timeSlotId,
        userId: current.user.id,
      });
      return NextResponse.json(
        { error: "Unable to lock time slot.", code: "LOCK_FAILED" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "This time slot is no longer available.", code: "SLOT_TAKEN" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Unexpected error in lock route", error);
    return NextResponse.json(
      { error: "Internal server error.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

