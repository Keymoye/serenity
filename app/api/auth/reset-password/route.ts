import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { resetPasswordRequestSchema } from "@/lib/utils/validation";
import { requestPasswordReset } from "@/lib/application/auth.service";
import { checkRateLimit, authRatelimit } from "@/lib/infra/upstash/ratelimit";

export async function POST(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "auth.resetPassword" });

  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")
      ?? req.headers.get("x-real-ip")
      ?? "anonymous"
    const { blocked, headers } =
      await checkRateLimit(
        `reset-password:${ip}`,
        authRatelimit
      )
    if (blocked) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later.",
          code: "RATE_LIMITED" },
        { status: 429, headers }
      )
    }

    const body = await req.json();
    const parsed = resetPasswordRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    await requestPasswordReset({
      email: parsed.data.email,
      redirectTo: typeof body.redirectTo === "string" ? body.redirectTo : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("POST /api/auth/reset-password failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

