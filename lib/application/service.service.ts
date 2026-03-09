import { InternalError } from "../domain/errors";
import { createServiceRepository, type ServiceRepository } from "../infra/supabase/service.repo";
import { createTherapistRepository } from "../infra/supabase/therapist.repo";

export interface ServiceDependencies {
  serviceRepo: ServiceRepository;
}

function createDefaultDeps(): ServiceDependencies {
  return { serviceRepo: createServiceRepository() };
}

export async function listPublicServices(
  input: { category?: string },
  deps: ServiceDependencies = createDefaultDeps(),
) {
  try {
    return await deps.serviceRepo.listPublicServiceSummaries(input.category);
  } catch (error) {
    throw new InternalError("SERVICES_FAILED", "Failed to load services", { error });
  }
}

export async function getPublicServiceDetail(
  input: { id: string },
  deps: ServiceDependencies = createDefaultDeps(),
) {
  try {
    return await deps.serviceRepo.getPublicServiceDetail(input.id);
  } catch (error) {
    throw new InternalError("SERVICE_DETAIL_FAILED", "Failed to load service detail", { error });
  }
}

export async function listBookingServices(
  deps: ServiceDependencies = createDefaultDeps(),
) {
  try {
    return await deps.serviceRepo.listActiveServices();
  } catch (error) {
    throw new InternalError("SERVICES_FAILED", "Unable to load services.", { error });
  }
}

export async function listTherapistsForService(
  input: { serviceId: string },
  deps: ServiceDependencies = createDefaultDeps(),
) {
  try {
    const therapists = await deps.serviceRepo.listTherapistsForService(input.serviceId);
    return therapists.filter((t) => (t as { is_active?: boolean | null }).is_active !== false);
  } catch (error) {
    throw new InternalError("THERAPISTS_FAILED", "Unable to load therapists.", { error });
  }
}

export async function getTherapistDetail(
  input: { therapistId: string },
  deps: ServiceDependencies = createDefaultDeps(),
) {
  try {
    // fetch active therapists from therapist repository and find matching
    const therapists = await createTherapistRepository().listActiveTherapists();
    const therapist = therapists.find((t) => t.id === input.therapistId);
    if (!therapist) return null;
    const services = await deps.serviceRepo.listServicesForTherapist(input.therapistId);
    return { therapist, services };
  } catch (error) {
    throw new InternalError("THERAPIST_DETAIL_FAILED", "Unable to load therapist.", { error });
  }
}

