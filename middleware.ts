import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerAuthClient } from "./lib/infra/supabase/authClient";
import { getSupabaseUserClient } from "./lib/infra/supabase/userClient";
import { logger } from "./lib/utils/logger";

const CUSTOMER_PATHS = ["/dashboard", "/profile", "/book"];
const ADMIN_PREFIX = "/admin";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  const res = NextResponse.next();

  try {
    const authClient = await getSupabaseServerAuthClient();
    const supabase = await getSupabaseUserClient();

    const {
      data: { session },
      error: sessionError,
    } = await authClient.auth.getSession();

    if (sessionError) {
      logger.error("Failed to read Supabase session in middleware", sessionError, {
        pathname,
      });
    }

    const isCustomerRoute =
      CUSTOMER_PATHS.includes(pathname) ||
      CUSTOMER_PATHS.some((base) => pathname.startsWith(`${base}/`));

    const isAdminRoute =
      pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);

    if (isCustomerRoute && !session?.user) {
      const next = encodeURIComponent(pathname + url.search);
      url.pathname = "/auth/login";
      url.search = `?next=${next}`;
      return NextResponse.redirect(url);
    }

    if (isAdminRoute) {
    if (!session?.user) {
      const next = encodeURIComponent(
        pathname + url.search
      )
      url.pathname = "/auth/login"
      url.search = `?next=${next}`
      return NextResponse.redirect(url)
    }
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError) {
      logger.error("Failed to load profile in middleware", profileError, {
        userId: session.user.id,
      });
    }

    if (!profile || profile.role !== "admin") {
      logger.warn("Blocked non-admin access to admin route", {
        userId: session.user.id,
        role: profile?.role,
        pathname,
      });
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

    return res;
  } catch (error) {
    logger.error("Unexpected error in middleware", error, { pathname });
    // On unexpected middleware failure, prefer to fail closed for protected routes.
    const isProtected =
      CUSTOMER_PATHS.includes(pathname) ||
      CUSTOMER_PATHS.some((base) => pathname.startsWith(`${base}/`)) ||
      pathname === ADMIN_PREFIX ||
      pathname.startsWith(`${ADMIN_PREFIX}/`);

    if (isProtected) {
      url.pathname = "/auth/login";
      url.search = `?next=${encodeURIComponent(pathname + url.search)}`;
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/book/:path*", "/admin/:path*"],
};

