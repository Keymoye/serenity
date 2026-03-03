import { InternalError } from "../domain/errors";
import { createServiceRepository, type ServiceRepository } from "../infra/supabase/service.repo";

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

export async function listFeaturedServices(
  deps: ServiceDependencies = createDefaultDeps(),
) {
  try {
    return await deps.serviceRepo.listFeaturedServiceSummaries();
  } catch (error) {
    throw new InternalError("SERVICES_FAILED", "Unable to load featured services.", { error });
  }
}

export async function listTherapistsForService(
  input: { serviceId: string },
  deps: ServiceDependencies = createDefaultDeps(),
) {
  try {
    const therapists = await deps.serviceRepo.listTherapistsForService(input.serviceId);
    return therapists.filter((t) => (t as any).is_active !== false);
  } catch (error) {
    throw new InternalError("THERAPISTS_FAILED", "Unable to load therapists.", { error });
  }
}

