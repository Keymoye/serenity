import { randomUUID } from "crypto";
import { NextResponse, NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { getCurrentUser } from "@/lib/services/authService";
import {
  listServices,
  createServiceAdmin,
  updateServiceAdmin,
  deleteServiceAdmin,
  assignTherapistsToServiceAdmin,
  listAllTherapistsForAssignment,
} from "@/lib/application/admin.service";
import {
  adminServiceSchema,
  adminServiceUpdateSchema,
} from "@/lib/domain/admin.types";

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);

    // If ?forAssignment=true return all therapists list
    if (url.searchParams.get('forAssignment') === 'true') {
      const therapists = await listAllTherapistsForAssignment(
        { userId: current.user.id, role: current.profile.role }
      );
      return NextResponse.json({ therapists });
    }

    // Otherwise existing list behaviour
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
    const parsed = adminServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const created = await createServiceAdmin(
      parsed.data,
      { userId: current.user.id, role: current.profile.role },
    );

    if (parsed.data.therapistIds !== undefined) {
      await assignTherapistsToServiceAdmin(
        created.id,
        parsed.data.therapistIds,
        { userId: current.user.id, role: current.profile.role }
      );
    }

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
    const parsed = adminServiceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const updated = await updateServiceAdmin(
      parsed.data.id,
      parsed.data,
      { userId: current.user.id, role: current.profile.role },
    );

    if (parsed.data.therapistIds !== undefined) {
      await assignTherapistsToServiceAdmin(
        parsed.data.id,
        parsed.data.therapistIds,
        { userId: current.user.id, role: current.profile.role }
      );
    }

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
