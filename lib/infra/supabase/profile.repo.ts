import { getSupabaseUserClient } from "./userClient";

export interface ProfileRepository {
  updateProfile(profileId: string, payload: { name: string; phone: string | null }): Promise<void>;
  findById(userId: string): Promise<import("./currentUser").AppProfile | null>;
}

export function createProfileRepository(): ProfileRepository {
  return {
    async updateProfile(profileId, payload) {
      const supabase = await getSupabaseUserClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          name: payload.name,
          phone: payload.phone,
        })
        .eq("id", profileId);
      if (error) throw error;
    },

    async findById(userId) {
      const supabase = await getSupabaseUserClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, phone, role")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as import("./currentUser").AppProfile | null) ?? null;
    },
  };
}

