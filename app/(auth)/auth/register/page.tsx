"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

type FormState = {
  values: RegisterInput;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
};

const INITIAL_VALUES: RegisterInput = {
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  phone: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<FormState>({
    values: INITIAL_VALUES,
    error: null,
    success: null,
    isSubmitting: false,
  });

  const handleChange = (field: keyof RegisterInput) =>
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

    const parsed = registerSchema.safeParse(state.values);
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message ?? "Invalid input.";
      setState((prev) => ({
        ...prev,
        error: firstError,
        isSubmitting: false,
      }));
      return;
    }

    const { email, password, name, phone } = parsed.data;

    try {
      const supabase = getBrowserSupabaseClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone: phone || null,
          },
        },
      });

      if (error) {
        logger.error("Registration failed", error);
        setState((prev) => ({
          ...prev,
          error: error.message || "Unable to create account.",
          isSubmitting: false,
        }));
        return;
      }

      // If email confirmation is enabled, Supabase will send a link.
      const requiresEmailConfirmation =
        !data.session && data.user && !data.user.email_confirmed_at;

      if (requiresEmailConfirmation) {
        setState((prev) => ({
          ...prev,
          success:
            "Account created. Please check your email to confirm your address before logging in.",
          isSubmitting: false,
        }));
        return;
      }

      const next = searchParams.get("next");
      router.push(next || "/dashboard");
    } catch (error) {
      logger.error("Unexpected error during registration", error);
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
          Create account
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
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={state.values.name}
              onChange={handleChange("name")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>

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
              onChange={handleChange("email")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Phone (optional)
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={state.values.phone ?? ""}
              onChange={handleChange("phone")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Password
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
              Confirm password
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
            disabled={state.isSubmitting}
            className="flex w-full items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {state.isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          Already have an account?{" "}
          <a href="/auth/login" className="font-medium text-sky-700 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

