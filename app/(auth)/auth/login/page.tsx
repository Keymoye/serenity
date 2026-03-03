"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "@/lib/utils/validation";
import type { LoginInput } from "@/lib/utils/validation";
import { postJson, useApi } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

const INITIAL_VALUES: LoginInput = {
  email: "",
  password: "",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { loading, error, call, setError } = useApi();
  const [values, setValues] = useState<LoginInput>(INITIAL_VALUES);

  const handleChange = (field: keyof LoginInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid input.");
      return;
    }

    const success = await call(async () =>
      postJson("/api/auth/login", parsed.data)
    );

    if (success !== null) {
      const next = searchParams.get("next");
      router.push(next || "/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">
          Login
        </h1>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
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
              value={values.password}
              onChange={handleChange("password")}
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
                <Spinner size={4} /> Signing in...
              </>
            ) : (
              "Sign in"
            )}
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

