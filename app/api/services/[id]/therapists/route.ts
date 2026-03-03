import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { listTherapistsForService } from "@/lib/application/service.service";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "services.therapists.GET" });

  try {
    const therapists = await listTherapistsForService({ serviceId: params.id });
    return NextResponse.json(
      (therapists ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title ?? null,
      })),
    );
  } catch (error) {
    log.error("GET /api/services/[id]/therapists failed", error, { serviceId: params.id });
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

