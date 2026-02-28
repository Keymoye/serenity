"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  resetPasswordConfirmSchema,
  type ResetPasswordConfirmInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

type FormState = {
  values: ResetPasswordConfirmInput;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
  isSessionReady: boolean;
};

const INITIAL_VALUES: ResetPasswordConfirmInput = {
  password: "",
  confirmPassword: "",
};

export default function ResetPasswordConfirmPage() {
  const router = useRouter();

  const [state, setState] = useState<FormState>({
    values: INITIAL_VALUES,
    error: null,
    success: null,
    isSubmitting: false,
    isSessionReady: false,
  });

  // Ensure that Supabase has a recovery session from the magic link.
  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        logger.error("No valid recovery session for password reset", error);
        setState((prev) => ({
          ...prev,
          error:
            "This password reset link is invalid or has expired. Please request a new one.",
          isSessionReady: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isSessionReady: true,
      }));
    });
  }, []);

  const handleChange =
    (field: keyof ResetPasswordConfirmInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, [field]: value },
      }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setState((prev) => ({
      ...prev,
      error: null,
      success: null,
      isSubmitting: true,
    }));

    const parsed = resetPasswordConfirmSchema.safeParse(state.values);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Invalid input.";
      setState((prev) => ({
        ...prev,
        error: firstError,
        isSubmitting: false,
      }));
      return;
    }

    try {
      const supabase = getBrowserSupabaseClient();

      const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (error) {
        logger.error("Password reset confirmation failed", error);
        setState((prev) => ({
          ...prev,
          error: error.message || "Unable to update password.",
          isSubmitting: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        success: "Your password has been updated. You can now sign in.",
        isSubmitting: false,
      }));

      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (error) {
      logger.error("Unexpected error during password reset confirmation", error);
      setState((prev) => ({
        ...prev,
        error: "Something went wrong. Please try again.",
        isSubmitting: false,
      }));
    }
  };

  const { error, success, isSessionReady, isSubmitting } = state;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">
          Choose a new password
        </h1>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </div>
        )}

        {!isSessionReady && !error && (
          <p className="text-sm text-slate-600">
            Validating your reset link...
          </p>
        )}

        {isSessionReady && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={state.values.password}
                onChange={handleChange("password")}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={state.values.confirmPassword}
                onChange={handleChange("confirmPassword")}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {isSubmitting ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

