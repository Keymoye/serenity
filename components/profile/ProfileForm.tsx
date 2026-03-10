"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { pushToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface Props {
  initialName?: string | null;
  initialPhone?: string | null;
  initialAvatarUrl?: string | null;
  profileId: string;
  email: string;
}

export default function ProfileForm({ initialName, initialPhone, initialAvatarUrl, profileId, email }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, avatar_url: avatarUrl }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? j?.message ?? "Unable to update profile.");
      }
      pushToast("success", "Profile updated");
      router.refresh();
    } catch (err) {
      pushToast("error", (err as Error).message || "Unable to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <Avatar
          src={avatarUrl}
          name={initialName ?? ''}
          size="lg"
        />
        <ImageUpload
          currentUrl={avatarUrl}
          bucket="avatar-uploads"
          entityId={profileId}
          uploadEndpoint="/api/profile/upload"
          onUpload={(url) => setAvatarUrl(url)}
          label="Upload profile photo"
          aspectRatio="square"
        />
      </div>

      <h3 className="text-sm font-semibold text-slate-900">Profile</h3>
      <div>
        <label className="block text-xs font-medium text-slate-700">Full name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">Phone</label>
        <Input value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">Email</label>
        <p className="text-sm text-slate-600">{email}</p>
      </div>

      <div>
        <Button type="submit" loading={loading}>
          {loading ? <><Spinner size={4} /> Saving...</> : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
