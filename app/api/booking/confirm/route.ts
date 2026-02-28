import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/services/authService";
import {
  bookingConfirmSchema,
  type BookingConfirmInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

function generateReferenceCode() {
  const now = new Date();
  const yyyy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SS-${yyyy}${mm}${dd}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const json = (await request.json()) as unknown;
    const parsed = bookingConfirmSchema.safeParse(json);

    if (!parsed.success) {
      logger.warn("Booking confirm validation failed", {
        userId: current.user.id,
        issues: parsed.error.issues,
      });
      return NextResponse.json(
        { error: "Invalid booking data.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const payload: BookingConfirmInput = parsed.data;

    const supabase = await getServerSupabaseClient();

    // Basic guard to ensure slot is still available by checking for existing bookings.
    const { data: existingBooking, error: existingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("time_slot_id", payload.timeSlotId)
      .maybeSingle();

    if (existingError) {
      logger.error("Failed to check existing booking for time slot", existingError, {
        timeSlotId: payload.timeSlotId,
      });
      return NextResponse.json(
        { error: "Unable to confirm booking.", code: "CHECK_FAILED" },
        { status: 500 }
      );
    }

    if (existingBooking) {
      return NextResponse.json(
        {
          error: "This time slot has already been booked.",
          code: "SLOT_ALREADY_BOOKED",
        },
        { status: 409 }
      );
    }

    const referenceCode = generateReferenceCode();

    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        customer_id: current.profile.id,
        service_id: payload.serviceId,
        therapist_id: payload.therapistId,
        time_slot_id: payload.timeSlotId,
        status: "confirmed",
        reference_code: referenceCode,
        notes: payload.notes || null,
      })
      .select("*")
      .maybeSingle();

    if (insertError) {
      logger.error("Failed to insert booking", insertError, {
        userId: current.user.id,
        timeSlotId: payload.timeSlotId,
      });
      return NextResponse.json(
        { error: "Unable to confirm booking.", code: "INSERT_FAILED" },
        { status: 500 }
      );
    }

    const { error: updateSlotError } = await supabase
      .from("time_slots")
      .update({
        is_available: false,
      })
      .eq("id", payload.timeSlotId);

    if (updateSlotError) {
      logger.error("Failed to update time slot after booking", updateSlotError, {
        timeSlotId: payload.timeSlotId,
      });
    }

    logger.info("Booking confirmed", {
      bookingId: booking?.id,
      referenceCode,
      userId: current.user.id,
    });

    return NextResponse.json({
      booking,
      referenceCode,
    });
  } catch (error) {
    logger.error("Unexpected error in booking confirm route", error);
    return NextResponse.json(
      { error: "Internal server error.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

