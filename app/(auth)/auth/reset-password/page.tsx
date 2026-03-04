"use client";

import { useState } from "react";
import {
  resetPasswordRequestSchema,
  type ResetPasswordRequestInput,
} from "@/lib/utils/validation";
import { useApi, postJson } from "@/lib/utils/api";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
    <SectionWrapper>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <h1 className="mb-6 text-2xl font-semibold text-slate-900">Reset password</h1>

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
            <Input
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              required
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Send reset link
            </Button>
          </form>
        </Card>
      </div>
    </SectionWrapper>
  );
}

