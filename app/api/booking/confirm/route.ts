import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/infra/supabase/currentUser";
import { logger } from "@/lib/utils/logger";
import { bookingConfirmSchema } from "@/lib/domain/booking.types";
import type { BookingConfirmInput } from "@/lib/domain/booking.types";
import { confirmBooking } from "@/lib/application/booking.service";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";

export async function POST(request: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "booking.confirm" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const json = (await request.json()) as unknown;
    const parsed = bookingConfirmSchema.safeParse(json);

    if (!parsed.success) {
      log.warn("Booking confirm validation failed", {
        userId: current.user.id,
        issues: parsed.error.issues,
      });
      return NextResponse.json(
        { error: "Invalid booking data.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const payload: BookingConfirmInput = parsed.data;

    const { booking, referenceCode } = await confirmBooking(payload, {
      userId: current.user.id,
      customerProfileId: current.profile.id,
    });

    log.info("Booking confirmed", {
      bookingId: booking.id,
      referenceCode,
      userId: current.user.id,
    });

    return NextResponse.json({ booking, referenceCode });
  } catch (error) {
    log.error("Error in booking confirm route", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}


