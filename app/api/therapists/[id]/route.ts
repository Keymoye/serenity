import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { getTherapistDetail } from "@/lib/application/service.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "therapists.detail.GET" });

  try {
    const { id } = await params;
    const result = await getTherapistDetail({ therapistId: id });
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { therapist, services } = result;
    return NextResponse.json({ therapist, services });
  } catch (error) {
    const { id } = await params;
    log.error("GET /api/therapists/[id] failed", error, { therapistId: id });
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
