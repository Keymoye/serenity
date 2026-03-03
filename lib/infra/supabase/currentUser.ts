import type { User } from "@supabase/supabase-js";
import { logger } from "../../utils/logger";
import { getSupabaseServerAuthClient } from "./authClient";
import { getSupabaseServerClient } from "./client";

export type AppRole = "customer" | "admin";

export interface AppProfile {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  role: AppRole;
}

export interface CurrentUser {
  user: User;
  profile: AppProfile;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const authClient = await getSupabaseServerAuthClient();

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError) {
      logger.error("Failed to get authenticated user", userError);
      return null;
    }

    if (!user) return null;

    const supabase = await getSupabaseServerClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      logger.error("Error loading profile", profileError, { userId: user.id });
      return null;
    }

    if (!profile) {
      logger.warn("Profile not found for authenticated user", {
        userId: user.id,
      });
      return null;
    }

    return {
      user,
      profile: profile as AppProfile,
    };
  } catch (error) {
    logger.error("Unexpected error in getCurrentUser", error);
    return null;
  }
}

