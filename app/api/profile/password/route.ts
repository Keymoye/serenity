import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/authService";
import { logger } from "@/lib/utils/logger";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { updatePasswordForCurrentUser } from "@/lib/application/profile.service";

export async function POST(request: Request) {
  const correlationId = randomUUID();
  const log = logger.withContext({ correlationId, route: "profile.password" });
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const json = (await request.json()) as { password?: string };
    const password = json.password;

    await updatePasswordForCurrentUser(
      { password: password ?? "" },
      { userId: current.user.id, profileId: current.profile.id },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Unexpected error in password update route", error);
    const { status, body } = mapErrorToLegacyHttp(error);
    return NextResponse.json(body, { status });
  }
}

