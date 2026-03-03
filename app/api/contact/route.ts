import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  contactFormSchema,
  type ContactFormInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { submitContactMessage } from "@/lib/application/contact.service";

function getClientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const firstIp = xff.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return null;
}

export async function POST(request: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "contact.submit" });
  try {
    const json = (await request.json()) as unknown;
    const parsed = contactFormSchema.safeParse(json);

    if (!parsed.success) {
      logger.warn("Contact form validation failed", {
        issues: parsed.error.issues,
      });
      return NextResponse.json(
        { error: "Invalid form data.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const payload: ContactFormInput = parsed.data;
    const ip = getClientIp(request) ?? "unknown";
    await submitContactMessage(
      {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone || null,
        subject: payload.subject,
        message: payload.message,
      },
      { ipAddress: ip },
    );

    // Email sending would be integrated here (e.g., using an edge function or external provider).
    logger.info("Contact message received", {
      ip,
      email: payload.email,
      subject: payload.subject,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Unexpected error in contact form route", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    // Preserve historical 429 for rate limit.
    if (body.code === "RATE_LIMIT") {
      return NextResponse.json(body, { status: 429 });
    }
    return NextResponse.json(body, { status });
  }
}

