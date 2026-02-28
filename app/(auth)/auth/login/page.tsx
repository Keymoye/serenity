"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/utils/validation";
import type { LoginInput } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

type FormState = {
  values: LoginInput;
  error: string | null;
  isSubmitting: boolean;
};

const INITIAL_VALUES: LoginInput = {
  email: "",
  password: "",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<FormState>({
    values: INITIAL_VALUES,
    error: null,
    isSubmitting: false,
  });

  const handleChange = (field: keyof LoginInput) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, [field]: value },
      }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setState((prev) => ({ ...prev, error: null, isSubmitting: true }));

    const parsed = loginSchema.safeParse(state.values);
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

      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        logger.error("Login failed", error);
        setState((prev) => ({
          ...prev,
          error: "Invalid email or password.",
          isSubmitting: false,
        }));
        return;
      }

      const next = searchParams.get("next");
      router.push(next || "/dashboard");
    } catch (error) {
      logger.error("Unexpected error during login", error);
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
          Login
        </h1>

        {state.error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
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
              onChange={handleChange("email")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
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
              autoComplete="current-password"
              value={state.values.password}
              onChange={handleChange("password")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={state.isSubmitting}
            className="flex w-full items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {state.isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <a href="/auth/register" className="hover:text-sky-700">
            Create account
          </a>
          <a href="/auth/reset-password" className="hover:text-sky-700">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}

