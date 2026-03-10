"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/utils/validation";
import { postJson, useApi } from "@/lib/utils/api";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

const INITIAL_VALUES: RegisterInput = {
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  phone: "",
};

export default function RegisterPage() {
  const router = useRouter();

  const { loading, error, call, setError } = useApi();
  const [values, setValues] = useState<RegisterInput>(INITIAL_VALUES);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof RegisterInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: event.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        if (field) errs[field] = issue.message
      })
      setFieldErrors(errs)
      setError(parsed.error.issues[0]?.message || "Invalid input.");
      return;
    }
    setFieldErrors({})

    const res = await call(async () => postJson("/api/auth/register", parsed.data));

    if (res !== null) {
      const body = res as { requiresEmailConfirmation?: boolean };
      if (body?.requiresEmailConfirmation) {
        setSuccess(
          "Account created. Please check your email to confirm your address before logging in."
        );
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      router.push(next || "/dashboard");
    }
  };

  return (
    <SectionWrapper>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <h1 className="mb-6 text-2xl font-semibold text-slate-900">Create account</h1>

          <OAuthButtons />

          <div aria-live="polite" role="alert">
            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {success && (
            <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              label="Full name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={handleChange("name")}
              required
              error={fieldErrors.name}
            />

            <Input
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange("email")}
              required
              error={fieldErrors.email}
            />

            <Input
              id="phone"
              label="Phone (optional)"
              type="tel"
              autoComplete="tel"
              value={values.phone ?? ""}
              onChange={handleChange("phone")}
              error={fieldErrors.phone}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange("password")}
              required
              error={fieldErrors.password}
            />

            <Input
              id="confirmPassword"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={handleChange("confirmPassword")}
              required
              error={fieldErrors.confirmPassword}
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Create account
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-600">
            Already have an account? <a href="/auth/login" className="font-medium text-sky-700 hover:underline">Sign in</a>
          </p>
        </Card>
      </div>
    </SectionWrapper>
  );
}

