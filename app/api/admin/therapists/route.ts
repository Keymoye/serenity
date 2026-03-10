import { randomUUID } from "crypto";
import { NextResponse, NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { requireAdmin } from "@/lib/infra/supabase/currentUser";
import {
  listTherapistsAdmin,
  createTherapistAdmin,
  updateTherapistAdmin,
  deleteTherapistAdmin,
  assignServicesToTherapistAdmin,
  listAllServicesForAssignment,
} from "@/lib/application/admin.service";
import {
  adminTherapistSchema,
  adminTherapistUpdateSchema,
} from "@/lib/domain/admin.types";

export async function GET(request: NextRequest) {
  const correlationId = randomUUID();
  const log = logger.withContext({
    correlationId,
    route: "admin.therapists.GET",
  });

  try {
    const current = await requireAdmin();

    const url = new URL(request.url);

    // If ?forAssignment=true return all services list
    if (url.searchParams.get('forAssignment') === 'true') {
      const services = await listAllServicesForAssignment(
        { userId: current.user.id, role: current.profile.role }
      );
      return NextResponse.json({ services });
    }

    // Otherwise existing list behaviour
    const items = await listTherapistsAdmin(
      { userId: current.user.id, role: current.profile.role },
    );
    return NextResponse.json(items);
  } catch (error) {
    log.error("GET /api/admin/therapists failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({
    correlationId,
    route: "admin.therapists.POST",
  });

  try {
    const current = await requireAdmin();

    const body = await req.json();
    const parsed = adminTherapistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const created = await createTherapistAdmin(
      parsed.data,
      { userId: current.user.id, role: current.profile.role },
    );

    if (parsed.data.serviceIds !== undefined) {
      await assignServicesToTherapistAdmin(
        created.id,
        parsed.data.serviceIds,
        { userId: current.user.id, role: current.profile.role }
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    log.error("POST /api/admin/therapists failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({
    correlationId,
    route: "admin.therapists.PUT",
  });

  try {
    const current = await requireAdmin();

    const body = await req.json();
    const parsed = adminTherapistUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const updated = await updateTherapistAdmin(
      parsed.data.id,
      parsed.data,
      { userId: current.user.id, role: current.profile.role },
    );

    if (parsed.data.serviceIds !== undefined) {
      await assignServicesToTherapistAdmin(
        parsed.data.id,
        parsed.data.serviceIds,
        { userId: current.user.id, role: current.profile.role }
      );
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    log.error("PUT /api/admin/therapists failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({
    correlationId,
    route: "admin.therapists.DELETE",
  });

  try {
    const current = await requireAdmin();

    const body = await req.json();
    const id = body?.therapistId || body?.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing therapistId", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    await deleteTherapistAdmin(
      id,
      { userId: current.user.id, role: current.profile.role },
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    log.error("DELETE /api/admin/therapists failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

