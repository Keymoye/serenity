import type { Service } from "../../domain/service.types";
import { getSupabaseUserClient } from "./userClient";
import { getSupabaseAdminClient } from "./adminClient";

export interface ServiceRepository {
  listActiveServices(): Promise<Service[]>;
  listPublicServiceSummaries(category?: string): Promise<
    Array<{
      id: string;
      name: string;
      category: string | null;
      duration_minutes: number | null;
      price: number | null;
      thumbnail_url: string | null;
    }>
  >;
  getPublicServiceDetail(serviceId: string): Promise<{
    service: {
      id: string;
      name: string;
      category: string | null;
      duration_minutes: number | null;
      price: number | null;
      description: string | null;
      thumbnail_url: string | null;
    } | null;
    images: Array<{ id: string; image_url: string; sort_order: number | null }>;
    therapists: Array<{
      id: string;
      name: string;
      title: string | null;
      photo_url: string | null;
      bio_short: string | null;
    }>;
  }>;
  listTherapistsForService(serviceId: string): Promise<
    Array<{ id: string; name: string; title: string | null; photo_url: string | null; is_active?: boolean | null }>
  >;
  listServicesForTherapist(therapistId: string): Promise<
    Array<{ id: string; name: string; category: string | null; duration_minutes: number | null; price: number | null; thumbnail_url: string | null }>
  >;
  listFeaturedServiceSummaries(): Promise<
    Array<{
      id: string;
      name: string;
      category: string | null;
      duration_minutes: number | null;
      price: number | null;
      thumbnail_url: string | null;
    }>
  >;
  listAllServices(): Promise<Service[]>;
  createService(payload: Omit<Service, "id" | "updated_at">): Promise<Service>;
  updateService(id: string, payload: Partial<Omit<Service, "id">>): Promise<Service>;
  deleteService(id: string): Promise<void>;
  isTherapistAssignedToService(serviceId: string, therapistId: string): Promise<boolean>;
  assignServicesToTherapist(therapistId: string, serviceIds: string[]): Promise<void>;
  assignTherapistsToService(serviceId: string, therapistIds: string[]): Promise<void>;
  listAllServicesAdmin(): Promise<Array<{ id: string; name: string; category: string | null }>>;
  listAllTherapistsAdmin(): Promise<Array<{ id: string; name: string; title: string | null }>>;
}

export function createServiceRepository(): ServiceRepository {
  return {
    async listActiveServices() {
      const supabase = await getSupabaseUserClient();
      const { data, error } = await supabase
        .from("services")
        .select("id, name, category, duration_minutes, price, thumbnail_url, is_active, updated_at")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Service[];
    },

    async listPublicServiceSummaries(category?: string) {
      const supabase = await getSupabaseUserClient();
      let query = supabase
        .from("services")
        .select("id, name, category, duration_minutes, price, thumbnail_url, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as any;
    },

    async getPublicServiceDetail(serviceId: string) {
      const supabase = await getSupabaseUserClient();

      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select(
          "id, name, category, duration_minutes, price, description, thumbnail_url, is_active",
        )
        .eq("id", serviceId)
        .eq("is_active", true)
        .maybeSingle();

      if (serviceError) throw serviceError;
      if (!service) {
        return { service: null, images: [], therapists: [] };
      }

      const [
        { data: images, error: imagesError },
        { data: therapistRows, error: therapistsError },
      ] = await Promise.all([
        supabase
          .from("service_images")
          .select("id, image_url, sort_order")
          .eq("service_id", serviceId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("therapist_service")
          .select("therapists(id, name, title, photo_url, bio_short)")
          .eq("service_id", serviceId),
      ]);

      if (imagesError) throw imagesError;
      if (therapistsError) throw therapistsError;

      type Therapist = {
        id: string;
        name: string;
        title: string | null;
        photo_url: string | null;
        bio_short: string | null;
      };
      type RawTherapistRow = { therapists?: Therapist | null };
      const therapists: Therapist[] = (
        (therapistRows ?? []) as unknown as RawTherapistRow[]
      )
        .map((row) => row.therapists)
        .filter((t): t is Therapist => Boolean(t));

      return {
        service: service as any,
        images: (images ?? []) as any,
        therapists,
      };
    },

    async listTherapistsForService(serviceId: string) {
      const supabase = await getSupabaseUserClient();
      const { data, error } = await supabase
        .from("therapist_service")
        .select("therapists(id, name, title, photo_url, is_active)")
        .eq("service_id", serviceId);
      if (error) throw error;

      type Therapist = { id: string; name: string; title: string | null; photo_url: string | null; is_active?: boolean | null };
      type RawRow = { therapists: Therapist | null };
      const rows = (data ?? []) as unknown as RawRow[];
      return rows
        .map((r) => r.therapists)
        .filter((t): t is Therapist => Boolean(t));
    },
    async listServicesForTherapist(therapistId: string) {
      const supabase = await getSupabaseUserClient();
      const { data, error } = await supabase
        .from("therapist_service")
        .select("services(id, name, category, duration_minutes, price, thumbnail_url)")
        .eq("therapist_id", therapistId)
        .eq("services.is_active", true);
      if (error) throw error;

      type ServiceRow = {
        services?: {
          id: string;
          name: string;
          category: string | null;
          duration_minutes: number | null;
          price: number | null;
          thumbnail_url: string | null;
        } | null;
      };
      const rows = (data ?? []) as unknown as ServiceRow[];
      return rows
        .map((r) => r.services)
        .filter((s): s is NonNullable<ServiceRow["services"]> => Boolean(s));
    },

    async listFeaturedServiceSummaries() {
      const supabase = await getSupabaseUserClient();
      const { data, error } = await supabase
        .from("services")
        .select(
          "id, name, category, duration_minutes, price, thumbnail_url, is_featured, is_active",
        )
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(6);
      if (error) throw error;
      return (data ?? []) as any;
    },

    async listAllServices() {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("services")
        .select("id, name, category, duration_minutes, price, thumbnail_url, is_active, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Service[];
    },

    async createService(payload) {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("services")
        .insert(payload)
        .select("id, name, category, duration_minutes, price, thumbnail_url, is_active, updated_at")
        .single();
      if (error) throw error;
      return data as Service;
    },

    async updateService(id, payload) {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("services")
        .update(payload)
        .eq("id", id)
        .select("id, name, category, duration_minutes, price, thumbnail_url, is_active, updated_at")
        .single();
      if (error) throw error;
      return data as Service;
    },

    async deleteService(id) {
      const supabase = await getSupabaseAdminClient();
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },

    async isTherapistAssignedToService(serviceId, therapistId) {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("therapist_service")
        .select("id")
        .eq("service_id", serviceId)
        .eq("therapist_id", therapistId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },

    async assignServicesToTherapist(
      therapistId: string,
      serviceIds: string[]
    ): Promise<void> {
      const supabase = await getSupabaseAdminClient();

      // First delete all existing assignments for therapist
      const { error: deleteError } = await supabase
        .from('therapist_service')
        .delete()
        .eq('therapist_id', therapistId);

      if (deleteError) throw deleteError;

      // If no services to assign, we are done
      if (serviceIds.length === 0) return;

      // Insert new assignments
      const rows = serviceIds.map((serviceId) => ({
        therapist_id: therapistId,
        service_id: serviceId,
      }));

      const { error: insertError } = await supabase
        .from('therapist_service')
        .insert(rows);

      if (insertError) throw insertError;
    },

    async assignTherapistsToService(
      serviceId: string,
      therapistIds: string[]
    ): Promise<void> {
      const supabase = await getSupabaseAdminClient();

      // First delete all existing assignments for service
      const { error: deleteError } = await supabase
        .from('therapist_service')
        .delete()
        .eq('service_id', serviceId);

      if (deleteError) throw deleteError;

      // If no therapists to assign, we are done
      if (therapistIds.length === 0) return;

      // Insert new assignments
      const rows = therapistIds.map((therapistId) => ({
        service_id: serviceId,
        therapist_id: therapistId,
      }));

      const { error: insertError } = await supabase
        .from('therapist_service')
        .insert(rows);

      if (insertError) throw insertError;
    },

    async listAllServicesAdmin(): Promise<
      Array<{ id: string; name: string; category: string | null }>
    > {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from('services')
        .select('id, name, category')
        .order('name');

      if (error) throw error;
      return data ?? [];
    },

    async listAllTherapistsAdmin(): Promise<
      Array<{ id: string; name: string; title: string | null }>
    > {
      const supabase = await getSupabaseAdminClient();
      const { data, error } = await supabase
        .from('therapists')
        .select('id, name, title')
        .order('name');

      if (error) throw error;
      return data ?? [];
    },
  };
}

