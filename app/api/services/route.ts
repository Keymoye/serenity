import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { listBookingServices } from "@/lib/application/service.service";

export async function GET() {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "services.GET" });
  

  try {
    const services = await listBookingServices();
    // Keep response minimal for client usage.
    return NextResponse.json(
      (services ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category ?? null,
        duration_minutes: s.duration_minutes ?? null,
        thumbnail_url: s.thumbnail_url ?? null,
      })),
    );
  } catch (error) {
    log.error("GET /api/services failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

