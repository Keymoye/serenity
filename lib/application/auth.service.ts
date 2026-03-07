import { ValidationError, InternalError } from "../domain/errors";
import { createAuthRepository, type AuthRepository } from "../infra/supabase/auth.repo";

export interface AuthDependencies {
  authRepo: AuthRepository;
}

function createDefaultDeps(): AuthDependencies {
  return { authRepo: createAuthRepository() };
}

export async function login(
  input: { email: string; password: string },
  deps: AuthDependencies = createDefaultDeps(),
): Promise<void> {
  if (!input.email || !input.password) {
    throw new ValidationError("Missing credentials.");
  }
  try {
    await deps.authRepo.signInWithPassword(input.email, input.password);
  } catch (error) {
    throw new InternalError("LOGIN_FAILED", "Invalid email or password.", { error });
  }
}

export async function register(
  input: { email: string; password: string; name: string; phone?: string | null },
  deps: AuthDependencies = createDefaultDeps(),
): Promise<{ requiresEmailConfirmation: boolean }> {
  if (!input.email || !input.password || !input.name) {
    throw new ValidationError("Missing registration details.");
  }
  try {
    return await deps.authRepo.signUp(input.email, input.password, {
      data: { name: input.name, phone: input.phone ?? null },
    });
  } catch (error) {
    throw new InternalError("REGISTER_FAILED", "Unable to create account.", { error });
  }
}

export async function requestPasswordReset(
  input: { email: string; redirectTo?: string },
  deps: AuthDependencies = createDefaultDeps(),
): Promise<void> {
  if (!input.email) throw new ValidationError("Email is required.");
  try {
    await deps.authRepo.resetPasswordForEmail(input.email, input.redirectTo);
  } catch (error) {
    throw new InternalError("RESET_FAILED", "Unable to send reset email.", { error });
  }
}

export async function updatePassword(
  input: { password: string },
  deps: AuthDependencies = createDefaultDeps(),
): Promise<void> {
  if (!input.password || input.password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long.");
  }
  try {
    await deps.authRepo.updatePassword(input.password);
  } catch (error) {
    throw new InternalError("UPDATE_FAILED", "Unable to update password.", { error });
  }
}

export async function confirmPasswordRecovery(
  input: { accessToken: string; refreshToken: string; password: string },
  deps: AuthDependencies = createDefaultDeps(),
): Promise<void> {
  if (!input.accessToken || !input.refreshToken) {
    throw new ValidationError(
      "This password reset link is invalid or has expired. Please request a new one.",
    );
  }
  if (!input.password || input.password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long.");
  }
  try {
    await deps.authRepo.setSession(input.accessToken, input.refreshToken);
    await deps.authRepo.updatePassword(input.password);
  } catch (error) {
    throw new InternalError(
      "UPDATE_FAILED",
      "This password reset link is invalid or has expired. Please request a new one.",
      { error },
    );
  }
}

export async function logout(
  deps: AuthDependencies = createDefaultDeps(),
): Promise<void> {
  try {
    await deps.authRepo.signOut();
  } catch (error) {
    throw new InternalError("SIGN_OUT_FAILED", "Failed to sign out.", { error });
  }
}

export async function sendMagicLink(
  input: { email: string },
  deps: AuthDependencies = createDefaultDeps(),
): Promise<void> {
  if (!input.email) {
    throw new ValidationError("Email is required.");
  }
  try {
    await deps.authRepo.sendMagicLink(input.email);
  } catch (error) {
    throw new InternalError("MAGIC_LINK_FAILED", "Unable to send magic link. Please try again.", { error });
  }
}

