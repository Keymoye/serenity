import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/authService";
import { logger } from "@/lib/utils/logger";
import { lockSlot } from "@/lib/application/booking.service";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";

type LockRequestBody = {
  timeSlotId?: string;
};

export async function POST(request: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "booking.lock" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const json = (await request.json()) as LockRequestBody;
    const { timeSlotId } = json;

    if (!timeSlotId) {
      return NextResponse.json(
        { error: "Missing required parameters", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    await lockSlot(
      { timeSlotId },
      {
        userId: current.user.id,
        customerProfileId: current.profile.id,
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Error in lock route", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}


