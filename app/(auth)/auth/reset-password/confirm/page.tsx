"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  resetPasswordConfirmSchema,
  type ResetPasswordConfirmInput,
} from "@/lib/utils/validation";
// logger not used here
import { postJson, useApi } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

const INITIAL_VALUES: ResetPasswordConfirmInput = {
  password: "",
  confirmPassword: "",
};

export default function ResetPasswordConfirmPage() {
  const router = useRouter();

  const [tokens, setTokens] = useState<{
    access_token: string;
    refresh_token: string;
  } | null>(null);

  const { loading, error, call, setError } = useApi();
  const [values, setValues] = useState<ResetPasswordConfirmInput>(INITIAL_VALUES);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Validate the recovery link by checking for tokens in the URL hash.
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const access_token = params.get("access_token") ?? "";
    const refresh_token = params.get("refresh_token") ?? "";

    if (!access_token || !refresh_token) {
      setTokenError(
        "This password reset link is invalid or has expired. Please request a new one."
      );
      setIsSessionReady(false);
      return;
    }

    setTokens({ access_token, refresh_token });
    setIsSessionReady(true);
  }, []);

  const handleChange =
    (field: keyof ResetPasswordConfirmInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = resetPasswordConfirmSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid input.");
      return;
    }

    if (!tokens) {
      setTokenError(
        "This password reset link is invalid or has expired. Please request a new one."
      );
      return;
    }

    const res = await call(async () =>
      postJson("/api/auth/reset-password/confirm", {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        password: parsed.data.password,
      })
    );

    if (res !== null) {
      setSuccess("Your password has been updated. You can now sign in.");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">
          Choose a new password
        </h1>

        {(error || tokenError) && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error || tokenError}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </div>
        )}

        {!isSessionReady && !tokenError && (
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
                value={values.password}
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
                value={values.confirmPassword}
                onChange={handleChange("confirmPassword")}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {loading ? (
                <>
                  <Spinner size={4} /> Updating password...
                </>
              ) : (
                "Update password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

