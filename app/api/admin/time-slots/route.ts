import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { getCurrentUser } from "@/lib/infra/supabase/currentUser";
import { adminTimeSlotCreateSchema } from "@/lib/domain/admin.types";
import { listTimeSlotsAdmin, createTimeSlotAdmin, deleteTimeSlotAdmin } from "@/lib/application/admin.service";

export async function GET() {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "admin.timeSlots.GET" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const slots = await listTimeSlotsAdmin({ userId: current.user.id, role: current.profile.role });
    return NextResponse.json(
      (slots ?? []).map((s) => ({
        id: s.id,
        therapist_id: s.therapist_id,
        start_time: s.start_time,
        end_time: s.end_time,
        is_available: s.is_available,
      })),
    );
  } catch (error) {
    log.error("GET /api/admin/time-slots failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "admin.timeSlots.POST" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = adminTimeSlotCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    await createTimeSlotAdmin(
      parsed.data,
      { userId: current.user.id, role: current.profile.role },
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    log.error("POST /api/admin/time-slots failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "admin.timeSlots.DELETE" });

  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const id = body?.timeSlotId || body?.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing timeSlotId", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    await deleteTimeSlotAdmin(
      id,
      { userId: current.user.id, role: current.profile.role },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("DELETE /api/admin/time-slots failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

