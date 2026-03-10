import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { registerSchema } from "@/lib/utils/validation";
import { register } from "@/lib/application/auth.service";
import { checkRateLimit, authRatelimit } from "@/lib/infra/upstash/ratelimit";

export async function POST(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "auth.register" });

  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")
      ?? req.headers.get("x-real-ip")
      ?? "anonymous"
    const { blocked, headers } =
      await checkRateLimit(
        `register:${ip}`,
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
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const { requiresEmailConfirmation } = await register({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    });

    return NextResponse.json({ success: true, requiresEmailConfirmation });
  } catch (error) {
    log.error("POST /api/auth/register failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

