import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { getCurrentUser } from "@/lib/infra/supabase/currentUser";
import {
  listServices,
  createServiceAdmin,
  updateServiceAdmin,
  deleteServiceAdmin,
} from "@/lib/application/admin.service";
import {
  adminServiceSchema,
  adminServiceUpdateSchema,
} from "@/lib/domain/admin.types";

export async function GET() {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "admin.services.GET" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const items = await listServices(
      { userId: current.user.id, role: current.profile.role },
    );
    return NextResponse.json(items);
  } catch (error) {
    log.error("GET /api/admin/services failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "admin.services.POST" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = adminServiceSchema.parse(body);
    const created = await createServiceAdmin(
      parsed,
      { userId: current.user.id, role: current.profile.role },
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    log.error("POST /api/admin/services failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "admin.services.PUT" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = adminServiceUpdateSchema.parse(body);
    const updated = await updateServiceAdmin(
      parsed.id,
      parsed,
      { userId: current.user.id, role: current.profile.role },
    );
    return NextResponse.json(updated);
  } catch (error: unknown) {
    log.error("PUT /api/admin/services failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({
    correlationId,
    route: "admin.services.DELETE",
  });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing id", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    await deleteServiceAdmin(
      id,
      { userId: current.user.id, role: current.profile.role },
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    log.error("DELETE /api/admin/services failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
