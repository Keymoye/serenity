import { redirect } from "next/navigation";
import { logger } from "../utils/logger";
export {
  getCurrentUser,
  type AppProfile,
  type AppRole,
  type CurrentUser,
} from "../infra/supabase/currentUser";

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

