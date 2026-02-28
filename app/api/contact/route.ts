import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import {
  contactFormSchema,
  type ContactFormInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

const MAX_SUBMISSIONS_PER_HOUR = 5;

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

    const supabase = getServerSupabaseClient();

    // Rate limiting: count submissions from same IP in the last hour.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error: countError } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", since);

    if (countError) {
      logger.error("Failed to read contact rate limit counter", countError, {
        ip,
      });
    } else if ((count ?? 0) >= MAX_SUBMISSIONS_PER_HOUR) {
      logger.warn("Contact form rate limit exceeded", { ip, count });
      return NextResponse.json(
        {
          error: "Rate limit exceeded.",
          code: "RATE_LIMIT",
        },
        { status: 429 }
      );
    }

    const { error: insertError } = await supabase.from("messages").insert({
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone || null,
      subject: payload.subject,
      message: payload.message,
      ip_address: ip,
    });

    if (insertError) {
      logger.error("Failed to insert contact message", insertError, { ip });
      return NextResponse.json(
        {
          error: "Unable to save your message.",
          code: "INSERT_FAILED",
        },
        { status: 500 }
      );
    }

    // Email sending would be integrated here (e.g., using an edge function or external provider).
    logger.info("Contact message received", {
      ip,
      email: payload.email,
      subject: payload.subject,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Unexpected error in contact form route", error);
    return NextResponse.json(
      { error: "Internal server error.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

