import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { confirmPasswordRecovery } from "@/lib/application/auth.service";
import { z } from "zod";

const ConfirmSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "auth.resetPassword.confirm" });

  try {
    const body = await req.json();
    const parsed = ConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "This password reset link is invalid or has expired. Please request a new one.",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    await confirmPasswordRecovery({
      accessToken: parsed.data.access_token,
      refreshToken: parsed.data.refresh_token,
      password: parsed.data.password,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("POST /api/auth/reset-password/confirm failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

