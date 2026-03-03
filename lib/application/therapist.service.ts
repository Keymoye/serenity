import { InternalError } from "../domain/errors";
import { createTherapistRepository, type TherapistRepository } from "../infra/supabase/therapist.repo";

export interface TherapistDependencies {
  therapistRepo: TherapistRepository;
}

function createDefaultDeps(): TherapistDependencies {
  return { therapistRepo: createTherapistRepository() };
}

export async function listPublicTherapists(
  deps: TherapistDependencies = createDefaultDeps(),
) {
  try {
    return await deps.therapistRepo.listActiveTherapists();
  } catch (error) {
    throw new InternalError("THERAPISTS_FAILED", "Failed to load therapists", { error });
  }
}

