"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/utils/validation";
// logger not used in ProfileForm
import { postJson, apiFetch, useApi } from "@/lib/utils/api";
import { Spinner } from "@/components/ui/Spinner";

interface ProfileFormProps {
  initialName: string | null;
  initialPhone: string | null;
  email: string;
}

export function ProfileForm({
  initialName,
  initialPhone,
  email,
}: ProfileFormProps) {
  const router = useRouter();

  const { loading: loadingProfile, error: profileError, call: callProfile, setError: setProfileError } = useApi();
  const { loading: loadingPassword, error: passwordError, call: callPassword, setError: setPasswordError } = useApi();

  const [values, setValues] = useState<ProfileUpdateInput>({
    name: initialName ?? "",
    phone: initialPhone ?? "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleProfileChange =
    (field: keyof ProfileUpdateInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: event.target.value }));
    };

  const handlePasswordChange =
    (field: "password" | "confirmPassword") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const v = event.target.value;
      if (field === "password") setPassword(v);
      else setConfirmPassword(v);
    };

  const submitProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    setSuccess(null);

    const parsed = profileUpdateSchema.safeParse(values);
    if (!parsed.success) {
      setProfileError(parsed.error.issues[0]?.message || "Invalid input.");
      return;
    }

    const res = await callProfile(async () =>
      apiFetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
    );

    if (res !== null) {
      setSuccess("Profile updated.");
      router.refresh();
    }
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setSuccess(null);

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    const res = await callPassword(async () =>
      postJson("/api/profile/password", { password })
    );

    if (res !== null) {
      setSuccess("Password updated.");
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">
          Profile
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          Update your basic contact information.
        </p>

        <form onSubmit={submitProfile} className="space-y-4">
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
              value={values.name}
              onChange={handleProfileChange("name")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={values.phone ?? ""}
              onChange={handleProfileChange("phone")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <p className="text-sm text-slate-600">{email}</p>
          </div>

          <button
            type="submit"
            disabled={loadingProfile}
            className="flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {loadingProfile ? (
              <>
                <Spinner size={4} /> Saving...
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </form>
      </section>

      <section className="border-t border-slate-200 pt-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">
          Change password
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          Set a new password for your account.
        </p>

        <form onSubmit={submitPassword} className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={password}
              onChange={handlePasswordChange("password")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirmNewPassword"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Confirm new password
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmPassword}
              onChange={handlePasswordChange("confirmPassword")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loadingPassword}
            className="flex items-center justify-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {loadingPassword ? (
              <>
                <Spinner size={4} /> Updating...
              </>
            ) : (
              "Update password"
            )}
          </button>
        </form>
      </section>

      {(profileError || passwordError || success) && (
        <div>
          {profileError && (
            <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {profileError}
            </div>
          )}
          {passwordError && (
            <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {passwordError}
            </div>
          )}
          {success && (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

