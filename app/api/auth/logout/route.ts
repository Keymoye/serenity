import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { randomUUID } from "crypto";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { logout } from "@/lib/application/auth.service";

export async function POST(request: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "auth.logout" });
  try {
    await logout();
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    log.error("Unexpected error in logout route", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

