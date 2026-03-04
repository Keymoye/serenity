"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/lib/utils/validation";
import type { LoginInput } from "@/lib/utils/validation";
import { postJson, useApi } from "@/lib/utils/api";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const INITIAL_VALUES: LoginInput = {
  email: "",
  password: "",
};

function LoginContent() {
  const router = useRouter();

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
      // read 'next' query param client-side without hooks
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      router.push(next || "/dashboard");
    }
  };

  return (
    <SectionWrapper>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <h1 className="mb-6 text-2xl font-semibold text-slate-900">Login</h1>

          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange("email")}
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange("password")}
              required
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
            <a href="/auth/register" className="hover:text-sky-700">
              Create account
            </a>
            <a href="/auth/reset-password" className="hover:text-sky-700">
              Forgot password?
            </a>
          </div>
        </Card>
      </div>
    </SectionWrapper>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

