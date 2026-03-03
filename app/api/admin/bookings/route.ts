import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { getCurrentUser } from "@/lib/infra/supabase/currentUser";
import {
  listAdminBookingRows,
  updateBookingStatusAdmin,
  deleteBookingAdmin,
} from "@/lib/application/admin.service";
import { adminBookingStatusSchema } from "@/lib/domain/admin.types";

export async function GET() {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "admin.bookings.GET" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const rows = await listAdminBookingRows({
      userId: current.user.id,
      role: current.profile.role,
    });
    return NextResponse.json(rows);
  } catch (error) {
    log.error("GET /api/admin/bookings failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "admin.bookings.PUT" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = adminBookingStatusSchema.safeParse({
      bookingId: body.bookingId ?? body.id,
      status: body.status,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const updated = await updateBookingStatusAdmin(
      parsed.data,
      { userId: current.user.id, role: current.profile.role },
    );
    return NextResponse.json(updated);
  } catch (error) {
    log.error("PUT /api/admin/bookings failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({
    correlationId,
    route: "admin.bookings.DELETE",
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

    await deleteBookingAdmin(
      id,
      { userId: current.user.id, role: current.profile.role },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("DELETE /api/admin/bookings failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

