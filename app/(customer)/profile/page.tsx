import { requireCustomer } from "@/lib/services/authService";
import ProfileForm from "@/components/profile/ProfileForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import { SectionWrapper } from "@/components/layout/SectionWrapper";

export default async function ProfilePage() {
  const current = await requireCustomer();

  if (!current) {
    // Middleware should already protect this route, but we guard for safety.
    return null;
  }

  return (
    <SectionWrapper>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="mb-6 text-sm text-slate-600">Manage your personal information and account security.</p>

        <div className="grid gap-6 md:grid-cols-2">
          <ProfileForm 
            initialName={current.profile.name} 
            initialPhone={current.profile.phone} 
            initialAvatarUrl={current.profile.avatar_url}
            profileId={current.profile.id}
            email={current.user.email ?? ""} 
          />
          <ChangePasswordForm />
        </div>
      </div>
    </SectionWrapper>
  );
}

