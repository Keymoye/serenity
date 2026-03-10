import { InternalError } from "../domain/errors";
import type { Service, ServiceImage, TherapistSummary } from "../domain/service.types";
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
): Promise<Array<{
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
  price: number | null;
  description: string | null;
  first_image_url: string | null;
}>> {
  try {
    return await deps.serviceRepo.listPublicServiceSummaries(input.category);
  } catch (error) {
    throw new InternalError("SERVICES_FAILED", "Failed to load services", { error });
  }
}

export async function getPublicServiceDetail(
  input: { id: string },
  deps: ServiceDependencies = createDefaultDeps(),
): Promise<{
  service: Service | null;
  images: ServiceImage[];
  therapists: TherapistSummary[];
}> {
  try {
    return await deps.serviceRepo.getPublicServiceDetail(input.id);
  } catch (error) {
    throw new InternalError("SERVICE_DETAIL_FAILED", "Failed to load service detail", { error });
  }
}

export async function listBookingServices(
  deps: ServiceDependencies = createDefaultDeps(),
): Promise<Service[]> {
  try {
    return await deps.serviceRepo.listActiveServices();
  } catch (error) {
    throw new InternalError("SERVICES_FAILED", "Unable to load services.", { error });
  }
}

export async function listTherapistsForService(
  input: { serviceId: string },
  deps: ServiceDependencies = createDefaultDeps(),
): Promise<Array<{
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  bio_short: string | null;
  is_active?: boolean | null;
}>> {
  try {
    const therapists = await deps.serviceRepo.listTherapistsForService(input.serviceId);
    return therapists.filter((t) => t.is_active !== false);
  } catch (error) {
    throw new InternalError("THERAPISTS_FAILED", "Unable to load therapists.", { error });
  }
}

export async function getTherapistDetail(
  input: { therapistId: string },
  deps: ServiceDependencies = createDefaultDeps(),
): Promise<{
  therapist: {
    id: string;
    name: string;
    title: string | null;
    photo_url: string | null;
    bio_short: string | null;
  } | null;
  services: Array<{
    id: string;
    name: string;
    category: string | null;
    duration_minutes: number | null;
    price: number | null;
  }>;
} | null> {
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

