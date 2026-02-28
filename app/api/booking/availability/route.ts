import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/services/authService";
import { logger } from "@/lib/utils/logger";

type AvailabilityRequestBody = {
  serviceId?: string;
  therapistId?: string;
  date?: string; // YYYY-MM-DD
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

    const json = (await request.json()) as AvailabilityRequestBody;
    const { serviceId, therapistId, date } = json;

    if (!serviceId || !therapistId || !date) {
      return NextResponse.json(
        { error: "Missing parameters.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const supabase = await getServerSupabaseClient();

    // Validate that the therapist is linked to the service.
    const { data: link, error: linkError } = await supabase
      .from("therapist_service")
      .select("id")
      .eq("service_id", serviceId)
      .eq("therapist_id", therapistId)
      .maybeSingle();

    if (linkError) {
      logger.error("Failed to verify therapist_service link", linkError, {
        serviceId,
        therapistId,
      });
      return NextResponse.json(
        { error: "Unable to verify therapist.", code: "LINK_CHECK_FAILED" },
        { status: 500 }
      );
    }

    if (!link) {
      return NextResponse.json(
        {
          error: "Therapist is not assigned to this service.",
          code: "THERAPIST_NOT_ASSIGNED",
        },
        { status: 400 }
      );
    }

    const startOfDay = new Date(date + "T00:00:00.000Z").toISOString();
    const endOfDay = new Date(date + "T23:59:59.999Z").toISOString();

    // Fetch slots for therapist on this date that are still considered bookable:
    // is_available=true and (locked_until is null or in the past).
    const { data: slots, error: slotsError } = await supabase
      .from("time_slots")
      .select("id, therapist_id, start_time, end_time, is_available, locked_until")
      .eq("therapist_id", therapistId)
      .gte("start_time", startOfDay)
      .lte("start_time", endOfDay)
      .order("start_time", { ascending: true });

    if (slotsError) {
      logger.error("Failed to load time slots", slotsError, {
        therapistId,
        date,
      });
      return NextResponse.json(
        { error: "Unable to load availability.", code: "SLOTS_FAILED" },
        { status: 500 }
      );
    }

    const now = new Date();

    const bookableSlots =
      slots?.filter((slot) => {
        const isAvailable = slot.is_available;
        const lockedUntil = slot.locked_until
          ? new Date(slot.locked_until)
          : null;
        const lockExpired =
          !lockedUntil || (lockedUntil && lockedUntil <= now);
        return isAvailable && lockExpired;
      }) ?? [];

    return NextResponse.json({
      slots: bookableSlots.map((s) => ({
        id: s.id,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
    });
  } catch (error) {
    logger.error("Unexpected error in availability route", error);
    return NextResponse.json(
      { error: "Internal server error.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

