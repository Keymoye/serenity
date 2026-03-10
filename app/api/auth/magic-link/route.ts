import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { sendMagicLink } from "@/lib/application/auth.service";
import { checkRateLimit, authRatelimit } from "@/lib/infra/upstash/ratelimit";

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "auth.magic-link" });

  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")
      ?? req.headers.get("x-real-ip")
      ?? "anonymous"
    const { blocked, headers } =
      await checkRateLimit(
        `magic-link:${ip}`,
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
    const parsed = magicLinkSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    await sendMagicLink({ email: parsed.data.email });
    return NextResponse.json({ 
      message: "Magic link sent. Check your email to sign in." 
    });
  } catch (error) {
    log.error("POST /api/auth/magic-link failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}
