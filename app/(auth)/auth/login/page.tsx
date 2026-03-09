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
import { OAuthButtons } from "@/components/auth/OAuthButtons";

const INITIAL_VALUES: LoginInput = {
  email: "",
  password: "",
};

function LoginContent() {
  const router = useRouter();
  const { loading, error, call, setError } = useApi();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"magic-link" | "password">("magic-link");
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [values, setValues] = useState<LoginInput>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof LoginInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: event.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

  const handleMagicLinkSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!magicLinkEmail.trim()) {
      setError("Email is required.");
      return;
    }

    const success = await call(async () =>
      postJson("/api/auth/magic-link", { email: magicLinkEmail })
    );

    if (success !== null) {
      setMagicLinkSent(true);
      setMagicLinkEmail("");
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse(values);
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

    const success = await call(async () =>
      postJson("/api/auth/login", parsed.data)
    );

    if (success !== null) {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      
      let redirectPath = "/dashboard";

      if (next) {
        const decoded = decodeURIComponent(next);
        if (decoded.includes("serviceId=")) {
          redirectPath = decoded;
        }
      }

      if (redirectPath === "/dashboard") {
        try {
          const pendingId = sessionStorage.getItem("pendingServiceId");
          if (pendingId) {
            sessionStorage.removeItem("pendingServiceId");
            redirectPath = `/book?serviceId=${pendingId}`;
          }
        } catch (_) {
          // sessionStorage unavailable
        }
      }

      window.location.href = redirectPath;
    }
  };

  return (
    <SectionWrapper>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <h1 className="mb-6 text-2xl font-semibold text-slate-900">Login</h1>

          <OAuthButtons />

          <div aria-live="polite" role="alert">
            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 flex gap-2 border-b border-slate-200">
            <button
              onClick={() => {
                setActiveTab("magic-link");
                setError(null);
                setMagicLinkSent(false);
              }}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "magic-link"
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Magic Link
            </button>
            <button
              onClick={() => {
                setActiveTab("password");
                setError(null);
              }}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "password"
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Password
            </button>
          </div>

          {/* Magic Link Tab */}
          {activeTab === "magic-link" && (
            <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
              {magicLinkSent ? (
                <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                  Check your email — we sent you a login link. Click it to sign in.
                </div>
              ) : (
                <>
                  <Input
                    id="magic-email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={magicLinkEmail}
                    onChange={(e) => {
                      setMagicLinkEmail(e.target.value)
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }))
                    }}
                    required
                    error={fieldErrors.email}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full"
                  >
                    Send magic link
                  </Button>
                </>
              )}
            </form>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                value={values.password}
                onChange={handleChange("password")}
                required
                error={fieldErrors.password}
              />

              <Button type="submit" variant="primary" loading={loading} className="w-full">
                Sign in
              </Button>
            </form>
          )}

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

