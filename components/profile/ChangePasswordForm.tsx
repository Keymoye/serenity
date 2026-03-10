"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { pushToast } from "@/components/ui/Toast";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirm) throw new Error("Passwords do not match.");

      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? j?.message ?? "Unable to update password.");
      }
      pushToast("success", "Password updated");
      setCurrent("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      pushToast("error", (err as Error).message || "Unable to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Change password</h3>

      <div>
        <label className="block text-xs font-medium text-slate-700">Current password</label>
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">New password</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">Confirm new password</label>
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>

      <div>
        <Button type="submit" loading={loading}>
          {loading ? <><Spinner size={4} /> Updating...</> : "Update password"}
        </Button>
      </div>
    </form>
  );
}
