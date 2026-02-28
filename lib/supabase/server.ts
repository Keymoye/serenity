import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";

let cachedClient: SupabaseClient | null = null;

export function getServerSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    logger.error("Supabase server env vars missing", null, {
      hasUrl: Boolean(supabaseUrl),
      hasServiceKey: Boolean(serviceKey),
    });
    throw new Error("Supabase server environment variables are not configured");
  }

  try {
    const cookieStore = cookies();
    const headerStore = headers();

    cachedClient = createServerClient(supabaseUrl, serviceKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
      headers: {
        get(name: string) {
          return headerStore.get(name) ?? undefined;
        },
      },
    });

    return cachedClient;
  } catch (error) {
    logger.error("Failed to create Supabase server client", error);
    throw error;
  }
}

