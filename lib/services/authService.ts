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
    const supabase = getServerSupabaseClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      logger.error("Failed to get Supabase session", sessionError);
      return null;
    }

    if (!session?.user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profileError) {
      logger.error("Error loading profile", profileError, {
        userId: session.user.id,
      });
      return null;
    }

    if (!profile) {
      logger.warn("Profile not found for authenticated user", {
        userId: session.user.id,
      });
      return null;
    }

    return {
      user: session.user,
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

