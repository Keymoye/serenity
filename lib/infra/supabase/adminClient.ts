import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../../utils/logger";

export type SupabaseAdminClient = SupabaseClient;

/**
 * Admin/Service-role Supabase client (RLS-bypassing)
 *
 * Configuration:
 * - Uses service role key (SUPABASE_SERVICE_ROLE_KEY)
 * - NO cookies — this is not session-based
 * - RLS policies are BYPASSED deliberately
 *
 * Use ONLY for:
 * ✅ Admin-only backend operations
 * ✅ Admin creates/updates/deletes services
 * ✅ Admin manages therapists and schedules
 * ✅ Admin views all bookings and messages
 * ✅ Internal system writes (background jobs, etc.)
 *
 * Do NOT use for:
 * ❌ User-scoped operations (use getSupabaseUserClient instead)
 * ❌ Browser/client-side code (SECURITY RISK)
 * ❌ Non-admin operations
 *
 * SECURITY: This key must never be exposed to the client browser.
 */
export async function getSupabaseAdminClient(): Promise<SupabaseAdminClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    logger.error("Supabase admin client env vars missing", null, {
      hasUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(serviceRoleKey),
    });
    throw new Error("Supabase admin environment variables are not configured");
  }

  // NO cookies — service role doesn't use session context
  // This deliberately bypasses RLS for admin operations
  const client = createClient(supabaseUrl, serviceRoleKey);

  return client;
}
