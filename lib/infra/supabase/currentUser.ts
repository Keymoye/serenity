import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { logger } from "../../utils/logger";
import { getSupabaseServerAuthClient } from "./authClient";
import { getSupabaseUserClient } from "./userClient";

export type AppRole = "customer" | "admin";

export interface AppProfile {
  id: string;
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

    const supabase = await getSupabaseUserClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
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

export async function requireCustomer(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) {
    logger.info("Unauthenticated access to customer-only route");
    redirect("/auth/login");
  }
  return current;
}

export async function requireAdmin(): Promise<CurrentUser> {
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

