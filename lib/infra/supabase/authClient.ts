import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logger } from "../../utils/logger";

export async function getSupabaseServerAuthClient(
  response?: NextResponse
): Promise<SupabaseClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    logger.error("Supabase auth env vars missing", null, {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(anonKey),
    });
    throw new Error("Supabase auth environment variables are not configured");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }>,
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            // If a response was passed, also write to it
            // so the browser receives the session cookie
            response?.cookies.set(name, value, options ?? {});
          });
        } catch {
          // cookies might be read-only in some contexts
        }
      },
    },
  });
}

