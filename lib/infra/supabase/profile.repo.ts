import { getSupabaseUserClient } from "./userClient";
import { getSupabaseAdminClient } from "./adminClient";

export interface ProfileRepository {
  updateProfile(profileId: string, payload: { name: string; phone: string | null; avatar_url?: string | null }): Promise<void>;
  findById(userId: string): Promise<import("./currentUser").AppProfile | null>;
  ensureProfile(payload: { id: string; name: string; role: "customer" | "admin" }): Promise<void>;
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
          avatar_url: payload.avatar_url,
        })
        .eq("id", profileId);
      if (error) throw error;
    },

    async findById(userId) {
      const supabase = await getSupabaseUserClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, phone, role, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as import("./currentUser").AppProfile | null) ?? null;
    },

    async ensureProfile(payload) {
      const supabase = await getSupabaseAdminClient();

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: payload.id,
            name: payload.name,
            role: payload.role,
          },
          {
            onConflict: "id",
            ignoreDuplicates: true,
          }
        );

      if (error) throw error;
    },
  };
}

