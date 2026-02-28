"use client";

import { useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  resetPasswordRequestSchema,
  type ResetPasswordRequestInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

type FormState = {
  values: ResetPasswordRequestInput;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
};

const INITIAL_VALUES: ResetPasswordRequestInput = {
  email: "",
};

export default function ResetPasswordRequestPage() {
  const [state, setState] = useState<FormState>({
    values: INITIAL_VALUES,
    error: null,
    success: null,
    isSubmitting: false,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setState((prev) => ({
      ...prev,
      values: { email: value },
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

    const parsed = resetPasswordRequestSchema.safeParse(state.values);
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message ?? "Invalid input.";
      setState((prev) => ({
        ...prev,
        error: firstError,
        isSubmitting: false,
      }));
      return;
    }

    try {
      const supabase = getBrowserSupabaseClient();

      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined;

      const redirectTo = origin
        ? `${origin}/auth/reset-password/confirm`
        : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        redirectTo ? { redirectTo } : undefined
      );

      if (error) {
        logger.error("Reset password request failed", error);
        setState((prev) => ({
          ...prev,
          error: error.message || "Unable to send reset link.",
          isSubmitting: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        success:
          "If an account exists for this email, a password reset link has been sent.",
        isSubmitting: false,
      }));
    } catch (error) {
      logger.error("Unexpected error during reset password request", error);
      setState((prev) => ({
        ...prev,
        error: "Something went wrong. Please try again.",
        isSubmitting: false,
      }));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">
          Reset password
        </h1>

        {state.error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {state.success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={state.values.email}
              onChange={handleChange}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={state.isSubmitting}
            className="flex w-full items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {state.isSubmitting ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}

