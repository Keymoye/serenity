import type { Therapist } from "../../domain/therapist.types";
import { getSupabaseUserClient } from "./userClient";
import { getSupabaseAdminClient } from "./adminClient";
import { ADMIN_LIST_LIMIT } from "../../config/constants";

export interface TherapistRepository {
  listTherapists(): Promise<Therapist[]>;
  listActiveTherapists(): Promise<
    Array<{
      id: string;
      name: string;
      title: string | null;
      photo_url: string | null;
      bio_short: string | null;
    }>
  >;
  createTherapist(
    payload: Omit<Therapist, "id" | "created_at">,
  ): Promise<Therapist>;
  updateTherapist(
    id: string,
    payload: Partial<Omit<Therapist, "id" | "created_at">>,
  ): Promise<Therapist>;
  deleteTherapist(id: string): Promise<void>;
  findById(id: string): Promise<Therapist | null>;
}

export function createTherapistRepository(): TherapistRepository {
  return {
    async listTherapists() {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("therapists")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(ADMIN_LIST_LIMIT); // reasonable ceiling for spa
      if (error) throw error;
      return (data ?? []) as Therapist[];
    },

    async listActiveTherapists() {
      const supabase = await getSupabaseUserClient();
      const { data, error } = await supabase
        .from("therapists")
        .select("id, name, title, photo_url, bio_short, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        name: string;
        title: string | null;
        photo_url: string | null;
        bio_short: string | null;
      }>;
    },

    async createTherapist(
      payload: Omit<Therapist, "id" | "created_at">,
    ): Promise<Therapist> {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("therapists")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data as Therapist;
    },

    async updateTherapist(
      id: string,
      payload: Partial<Omit<Therapist, "id" | "created_at">>,
    ): Promise<Therapist> {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("therapists")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Therapist;
    },

    async deleteTherapist(id: string): Promise<void> {
      const supabase = await getSupabaseAdminClient();
      const { error } = await supabase.from("therapists").delete().eq("id", id);
      if (error) throw error;
    },

    async findById(id: string): Promise<Therapist | null> {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("therapists")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Therapist | null) ?? null;
    },
  };
}

