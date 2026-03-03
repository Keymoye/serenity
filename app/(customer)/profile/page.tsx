import { getCurrentUser } from "@/lib/infra/supabase/currentUser";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const current = await getCurrentUser();

  if (!current) {
    // Middleware should already protect this route, but we guard for safety.
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">
        Profile
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        Manage your personal information and account security.
      </p>

      <ProfileForm
        initialName={current.profile.name}
        initialPhone={current.profile.phone}
        email={current.user.email ?? ""}
      />
    </div>
  );
}

