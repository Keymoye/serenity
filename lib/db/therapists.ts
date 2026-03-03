import type { Therapist } from "../domain/therapist.types";
import { createTherapistRepository } from "../infra/supabase/therapist.repo";

const therapistRepo = createTherapistRepository();

export type { Therapist };

export async function listTherapists() {
  return therapistRepo.listTherapists();
}

export async function createTherapist(payload: Therapist) {
  return therapistRepo.createTherapist(payload);
}

export async function updateTherapist(id: string, payload: Partial<Therapist>) {
  return therapistRepo.updateTherapist(id, payload);
}

export async function deleteTherapist(id: string) {
  await therapistRepo.deleteTherapist(id);
  return true;
}

