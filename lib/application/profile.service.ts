import { InternalError, UnauthorizedError, ValidationError } from "../domain/errors";
import { createProfileRepository, type ProfileRepository } from "../infra/supabase/profile.repo";
import { createAuthRepository, type AuthRepository } from "../infra/supabase/auth.repo";

export interface ProfileContext {
  userId: string;
  profileId: string;
}

export interface ProfileDependencies {
  profileRepo: ProfileRepository;
  authRepo: AuthRepository;
}

function createDefaultDeps(): ProfileDependencies {
  return {
    profileRepo: createProfileRepository(),
    authRepo: createAuthRepository(),
  };
}

export async function updateProfile(
  input: { name: string; phone?: string | null; avatar_url?: string | null },
  context: ProfileContext,
  deps: ProfileDependencies = createDefaultDeps(),
): Promise<void> {
  if (!context?.userId || !context?.profileId) {
    throw new UnauthorizedError("Unauthorized.");
  }
  if (!input.name) {
    throw new ValidationError("Invalid profile data.");
  }
  try {
    await deps.profileRepo.updateProfile(context.profileId, {
      name: input.name,
      phone: input.phone ?? null,
      avatar_url: input.avatar_url,
    });
  } catch (error) {
    throw new InternalError("UPDATE_FAILED", "Unable to update profile.", { error });
  }
}

export async function updatePasswordForCurrentUser(
  input: { password: string },
  context: ProfileContext,
  deps: ProfileDependencies = createDefaultDeps(),
): Promise<void> {
  if (!context?.userId) {
    throw new UnauthorizedError("Unauthorized.");
  }
  if (!input.password || input.password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long.");
  }
  try {
    await deps.authRepo.updatePassword(input.password);
  } catch (error) {
    throw new InternalError("UPDATE_FAILED", "Unable to update password.", { error });
  }
}

