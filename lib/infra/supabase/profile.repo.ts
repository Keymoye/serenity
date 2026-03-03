import { getSupabaseServerClient } from "./client";

export interface ProfileRepository {
  updateProfile(profileId: string, payload: { name: string; phone: string | null }): Promise<void>;
}

export function createProfileRepository(): ProfileRepository {
  return {
    async updateProfile(profileId, payload) {
      const supabase = await getSupabaseServerClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          name: payload.name,
          phone: payload.phone,
        })
        .eq("id", profileId);
      if (error) throw error;
    },
  };
}

