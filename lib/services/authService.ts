import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getServerSupabaseClient } from "../supabase/server";
import { logger } from "../utils/logger";

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
    const supabase = await getServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      logger.error("Failed to get authenticated user", userError);
      return null;
    }

    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      logger.error("Error loading profile", profileError, {
        userId: user.id,
      });
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

export async function requireCustomer() {
  const current = await getCurrentUser();
  if (!current) {
    logger.info("Unauthenticated access to customer-only route");
    redirect("/auth/login");
  }
  return current;
}

export async function requireAdmin() {
  const current = await getCurrentUser();
  if (!current) {
    logger.info("Unauthenticated access to admin route");
    redirect("/");
  }

  if (current.profile.role !== "admin") {
    logger.warn("Non-admin user attempted to access admin route", {
      userId: current.user.id,
      role: current.profile.role,
    });
    redirect("/");
  }

  return current;
}

