import { getSupabaseServerAuthClient } from "./authClient";

export interface AuthRepository {
  signOut(): Promise<void>;
  updatePassword(password: string): Promise<void>;
  setSession(accessToken: string, refreshToken: string): Promise<void>;
  signInWithPassword(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, options?: { data?: Record<string, unknown> }): Promise<{
    requiresEmailConfirmation: boolean;
  }>;
  resetPasswordForEmail(email: string, redirectTo?: string): Promise<void>;
  signInWithGoogle(redirectUrl?: string): Promise<void>;
  sendMagicLink(email: string): Promise<void>;
}

export function createAuthRepository(): AuthRepository {
  return {
    async signOut() {
      const supabase = await getSupabaseServerAuthClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },

    async updatePassword(password: string) {
      const supabase = await getSupabaseServerAuthClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },

    async setSession(accessToken: string, refreshToken: string) {
      const supabase = await getSupabaseServerAuthClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
    },

    async signInWithPassword(email: string, password: string) {
      const supabase = await getSupabaseServerAuthClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },

    async signUp(email: string, password: string, options?: { data?: Record<string, unknown> }) {
      const supabase = await getSupabaseServerAuthClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: options?.data ? { data: options.data } : undefined,
      });
      if (error) throw error;

      const requiresEmailConfirmation =
        !data.session && data.user && !data.user.email_confirmed_at;

      return { requiresEmailConfirmation: Boolean(requiresEmailConfirmation) };
    },

    async resetPasswordForEmail(email: string, redirectTo?: string) {
      const supabase = await getSupabaseServerAuthClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
    },

    async signInWithGoogle(redirectUrl?: string) {
      const supabase = await getSupabaseServerAuthClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });
      if (error) throw error;
    },

    async sendMagicLink(email: string) {
      const supabase = await getSupabaseServerAuthClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
    },
  };
}

