"use client";

import { useState } from "react";
import {
  resetPasswordRequestSchema,
  type ResetPasswordRequestInput,
} from "@/lib/utils/validation";
import { useApi, postJson } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

const INITIAL_VALUES: ResetPasswordRequestInput = {
  email: "",
};

export default function ResetPasswordRequestPage() {
  const { loading, error, call, setError } = useApi();
  const [values, setValues] = useState<ResetPasswordRequestInput>(INITIAL_VALUES);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ email: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = resetPasswordRequestSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid input.");
      return;
    }

    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const redirectTo = origin
      ? `${origin}/auth/reset-password/confirm`
      : undefined;

    const res = await call(async () =>
      postJson("/api/auth/reset-password", {
        email: parsed.data.email,
        redirectTo,
      })
    );

    if (res !== null) {
      setSuccess(
        "If an account exists for this email, a password reset link has been sent."
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">
          Reset password
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
              value={values.email}
              onChange={handleChange}
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
                <Spinner size={4} /> Sending reset link...
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

