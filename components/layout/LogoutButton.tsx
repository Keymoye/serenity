"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/utils/logger";
import { postJson } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await postJson("/api/auth/logout", {});
    } catch (err: unknown) {
      logger.error("Logout API returned non-OK status", err);
    } finally {
      setIsSubmitting(false);
      router.push("/auth/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
    >
      {isSubmitting ? (
        <>
          <Spinner size={4} /> Logging out...
        </>
      ) : (
        "Logout"
      )}
    </button>
  );
}

