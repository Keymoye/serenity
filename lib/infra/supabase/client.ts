import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabaseClient } from "../../supabase/server";

export type SupabaseServerClient = SupabaseClient;

export async function getSupabaseServerClient(): Promise<SupabaseServerClient> {
  return getServerSupabaseClient();
}

