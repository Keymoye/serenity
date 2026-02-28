import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    logger.error("Supabase browser env vars missing", null, {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(anonKey),
    });
    throw new Error("Supabase browser environment variables are not configured");
  }

  try {
    browserClient = createBrowserClient(supabaseUrl, anonKey);
    return browserClient;
  } catch (error) {
    logger.error("Failed to create Supabase browser client", error);
    throw error;
  }
}

