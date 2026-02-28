"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

interface ProfileFormProps {
  initialName: string | null;
  initialPhone: string | null;
  email: string;
}

type ProfileState = {
  values: ProfileUpdateInput;
  error: string | null;
  success: string | null;
  isSubmittingProfile: boolean;
  isSubmittingPassword: boolean;
  password: string;
  confirmPassword: string;
};

export function ProfileForm({
  initialName,
  initialPhone,
  email,
}: ProfileFormProps) {
  const router = useRouter();

  const [state, setState] = useState<ProfileState>({
    values: {
      name: initialName ?? "",
      phone: initialPhone ?? "",
    },
    error: null,
    success: null,
    isSubmittingProfile: false,
    isSubmittingPassword: false,
    password: "",
    confirmPassword: "",
  });

  const handleProfileChange =
    (field: keyof ProfileUpdateInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, [field]: value },
      }));
    };

  const handlePasswordChange =
    (field: "password" | "confirmPassword") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setState((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const submitProfile = async (event: React.FormEvent) => {
    event.preventDefault();

    setState((prev) => ({
      ...prev,
      error: null,
      success: null,
      isSubmittingProfile: true,
    }));

    const parsed = profileUpdateSchema.safeParse(state.values);
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message ?? "Invalid input.";
      setState((prev) => ({
        ...prev,
        error: firstError,
        isSubmittingProfile: false,
      }));
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const body = await response.json();

      if (!response.ok) {
        logger.error("Profile update failed", null, {
          status: response.status,
          body,
        });
        setState((prev) => ({
          ...prev,
          error: body.error || "Unable to update profile.",
          isSubmittingProfile: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        success: "Profile updated.",
        isSubmittingProfile: false,
      }));

      router.refresh();
    } catch (error) {
      logger.error("Unexpected error during profile update", error);
      setState((prev) => ({
        ...prev,
        error: "Something went wrong. Please try again.",
        isSubmittingProfile: false,
      }));
    }
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    setState((prev) => ({
      ...prev,
      error: null,
      success: null,
      isSubmittingPassword: true,
    }));

    if (state.password.length < 8) {
      setState((prev) => ({
        ...prev,
        error: "Password must be at least 8 characters long.",
        isSubmittingPassword: false,
      }));
      return;
    }

    if (state.password !== state.confirmPassword) {
      setState((prev) => ({
        ...prev,
        error: "Passwords do not match.",
        isSubmittingPassword: false,
      }));
      return;
    }

    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: state.password }),
      });

      const body = await response.json();

      if (!response.ok) {
        logger.error("Password change failed", null, {
          status: response.status,
          body,
        });
        setState((prev) => ({
          ...prev,
          error: body.error || "Unable to change password.",
          isSubmittingPassword: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        success: "Password updated.",
        password: "",
        confirmPassword: "",
        isSubmittingPassword: false,
      }));
    } catch (error) {
      logger.error("Unexpected error during password change", error);
      setState((prev) => ({
        ...prev,
        error: "Something went wrong. Please try again.",
        isSubmittingPassword: false,
      }));
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
              value={state.values.name}
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
              value={state.values.phone ?? ""}
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
            disabled={state.isSubmittingProfile}
            className="flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {state.isSubmittingProfile ? "Saving..." : "Save changes"}
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
              value={state.password}
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
              value={state.confirmPassword}
              onChange={handlePasswordChange("confirmPassword")}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={state.isSubmittingPassword}
            className="flex items-center justify-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {state.isSubmittingPassword ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>

      {(state.error || state.success) && (
        <div>
          {state.error && (
            <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {state.success}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

