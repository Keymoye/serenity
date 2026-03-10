import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { logger } from "../../utils/logger";

export type SupabaseUserClient = SupabaseClient;

/**
 * User-scoped Supabase client (RLS-enforced)
 *
 * Configuration:
 * - Uses anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * - Includes cookies for session handling
 * - RLS policies are enforced at database level
 *
 * Use for:
 * ✅ User profile reads/updates
 * ✅ Customer booking views/mutations
 * ✅ Public data reads (e.g., available services, therapists)
 * ✅ Authenticated user operations
 *
 * Do NOT use for:
 * ❌ Admin-only operations (use getSupabaseAdminClient instead)
 * ❌ Bypassing RLS policies
 */
export async function getSupabaseUserClient(): Promise<SupabaseUserClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    logger.error("Supabase user client env vars missing", null, {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(anonKey),
    });
    throw new Error("Supabase client environment variables are not configured");
  }

  const cookieStore = await cookies();

  const client = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` call may happen in a context where cookies are read-only.
          // Swallow errors — middleware/session refresh can handle updates if needed.
        }
      },
    },
  });

  return client;
}
