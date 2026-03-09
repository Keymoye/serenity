import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { requireAdmin } from "@/lib/infra/supabase/currentUser";
import { listMessagesAdmin, toggleMessageReadAdmin } from "@/lib/application/admin.service";
import { z } from "zod";

const ToggleReadSchema = z.object({
  id: z.string().min(1),
  is_read: z.boolean(),
});

export async function GET() {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "admin.messages.GET" });

  try {
    const current = await requireAdmin();

    const messages = await listMessagesAdmin({ userId: current.user.id, role: current.profile.role });
    return NextResponse.json(messages ?? []);
  } catch (error) {
    log.error("GET /api/admin/messages failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "admin.messages.PUT" });

  try {
    const current = await requireAdmin();

    const body = await req.json();
    const parsed = ToggleReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    await toggleMessageReadAdmin(
      { messageId: parsed.data.id, isRead: parsed.data.is_read },
      { userId: current.user.id, role: current.profile.role },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("PUT /api/admin/messages failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

