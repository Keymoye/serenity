import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { getCurrentUser } from "@/lib/infra/supabase/currentUser";
import {
  listTherapistsAdmin,
  createTherapistAdmin,
  updateTherapistAdmin,
  deleteTherapistAdmin,
} from "@/lib/application/admin.service";
import {
  adminTherapistSchema,
  adminTherapistUpdateSchema,
} from "@/lib/domain/admin.types";

export async function GET() {
  const correlationId = randomUUID();
  const log = logger.withContext({
    correlationId,
    route: "admin.therapists.GET",
  });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

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
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = adminTherapistSchema.parse(body);

    const created = await createTherapistAdmin(
      parsed,
      { userId: current.user.id, role: current.profile.role },
    );
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
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = adminTherapistUpdateSchema.parse(body);

    const updated = await updateTherapistAdmin(
      parsed.id,
      parsed,
      { userId: current.user.id, role: current.profile.role },
    );
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
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

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

