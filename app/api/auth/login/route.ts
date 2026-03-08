import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { loginSchema } from "@/lib/utils/validation";
import { getSupabaseServerAuthClient } from "@/lib/infra/supabase/authClient";

export async function POST(req: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "auth.login" });

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    // Create response first so cookies can be attached
    const response = NextResponse.json({ success: true });

    // Get auth client with response for cookie writing
    const supabase = await getSupabaseServerAuthClient(response);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? 'Invalid email or password' },
        { status: 401 }
      );
    }

    return response;
  } catch (error) {
    log.error("POST /api/auth/login failed", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

