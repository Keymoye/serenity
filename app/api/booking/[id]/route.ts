import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/authService";
import { logger } from "@/lib/utils/logger";
import { cancelBooking } from "@/lib/application/booking.service";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "booking.[id].DELETE" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const { id: bookingId } = await params;
    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        { error: "Missing booking ID.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const cancelled = await cancelBooking(
      { bookingId },
      {
        userId: current.user.id,
        customerProfileId: current.profile.id,
        correlationId,
      },
    );

    log.info("Booking cancelled", {
      bookingId: cancelled.id,
      userId: current.user.id,
    });

    return NextResponse.json({ success: true, data: cancelled });
  } catch (error) {
    log.error("Error in booking cancel route", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
