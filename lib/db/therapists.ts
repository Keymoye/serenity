import { getServerSupabaseClient } from "../supabase/server";

export type Therapist = {
  id?: string;
  name: string;
  bio?: string | null;
  created_at?: string;
};

export async function listTherapists() {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("therapists").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Therapist[];
}

export async function createTherapist(payload: Therapist) {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("therapists").insert(payload).select().single();
  if (error) throw error;
  return data as Therapist;
}

export async function updateTherapist(id: string, payload: Partial<Therapist>) {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("therapists").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data as Therapist;
}

export async function deleteTherapist(id: string) {
  const supabase = await getServerSupabaseClient();
  const { error } = await supabase.from("therapists").delete().eq("id", id);
  if (error) throw error;
  return true;
}
