import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { listTherapistsForService } from "@/lib/application/service.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "services.therapists.GET" });

  try {
    const { id } = await params;
    const therapists = await listTherapistsForService({ serviceId: id });
    return NextResponse.json(
      (therapists ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title ?? null,
      })),
    );
  } catch (error) {
    const { id } = await params;
    log.error("GET /api/services/[id]/therapists failed", error, { serviceId: id });
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

