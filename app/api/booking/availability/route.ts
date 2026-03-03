import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/authService";
import { logger } from "@/lib/utils/logger";
import { getAvailability } from "@/lib/application/booking.service";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";

type AvailabilityRequestBody = {
  serviceId?: string;
  therapistId?: string;
  date?: string; // YYYY-MM-DD
};

export async function POST(request: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "booking.availability" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const json = (await request.json()) as AvailabilityRequestBody;
    const { serviceId, therapistId, date } = json;

    const slots = await getAvailability(
      {
        serviceId: serviceId ?? "",
        therapistId: therapistId ?? "",
        date: date ?? "",
      },
    );

    return NextResponse.json({
      slots,
    });
  } catch (error) {
    log.error("Error in availability route", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}


