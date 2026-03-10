import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerAuthClient } from "@/lib/infra/supabase/authClient";
import { ensureOAuthProfile } from "@/lib/application/auth.service";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Validate next param — prevent open redirect. Must start with /
  const redirectTo = next.startsWith("/") ? next : "/dashboard";

  if (!code) {
    // No code = direct visit or error
    // Redirect to login with error param
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_code", origin)
    );
  }

  const supabase = await getSupabaseServerAuthClient();

  // Exchange the code for a session
  // This is required for both OAuth and magic link PKCE flows
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    logger.error("Auth callback exchange failed", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=auth_failed", origin)
    );
  }

  // Ensure a profile row exists for OAuth/magic link users
  try {
    await ensureOAuthProfile(data.user);
  } catch (profileError) {
    logger.error("Profile ensure failed in callback", profileError);
    // Non-blocking — do not prevent login
  }

  return NextResponse.redirect(new URL(redirectTo, origin));
}
