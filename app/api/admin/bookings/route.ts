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

export async function GET(req: Request) {
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

    // fetch all rows first, then apply any filtering/pagination in-memory
    let rows = await listAdminBookingRows({
      userId: current.user.id,
      role: current.profile.role,
    });

    const urlObj = new URL(req.url);
    // filter by created date range (ISO date strings)
    const startDate = urlObj.searchParams.get("startDate");
    const endDate = urlObj.searchParams.get("endDate");
    if (startDate) {
      const startIso = new Date(startDate);
      rows = rows.filter(
        (r) => r.created_at && new Date(r.created_at) >= startIso,
      );
    }
    if (endDate) {
      const endIso = new Date(endDate);
      rows = rows.filter(
        (r) => r.created_at && new Date(r.created_at) <= endIso,
      );
    }

    // simple pagination support
    const limitParam = urlObj.searchParams.get("limit");
    const offsetParam = urlObj.searchParams.get("offset");
    if (limitParam) {
      const limitNum = parseInt(limitParam, 10);
      const offsetNum = parseInt(offsetParam || "0", 10) || 0;
      if (!isNaN(limitNum)) {
        rows = rows.slice(offsetNum, offsetNum + limitNum);
      }
    }

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

    const body = await req.json();
    const id = body?.bookingId || body?.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing bookingId", code: "VALIDATION_ERROR" },
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

