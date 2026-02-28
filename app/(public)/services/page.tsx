import { getServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { ServiceCard, type ServiceSummary } from "@/components/ServiceCard";

type ServicesPageProps = {
  searchParams: {
    category?: string;
  };
};

async function getServices(category?: string): Promise<ServiceSummary[]> {
  try {
    const supabase = getServerSupabaseClient();

    let query = supabase
      .from("services")
      .select(
        "id, name, category, duration_minutes, price, thumbnail_url, is_active"
      )
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Failed to load services", error, { category });
      return [];
    }

    return (data ?? []) as ServiceSummary[];
  } catch (error) {
    logger.error("Unexpected error while loading services", error, {
      category,
    });
    return [];
  }
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const category = searchParams.category;
  const services = await getServices(category);

  const categories = Array.from(
    new Set(
      services
        .map((s) => s.category)
        .filter((c): c is string => Boolean(c && c.trim().length > 0))
    )
  ).sort();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Services
        </h1>
        <p className="text-sm text-slate-700">
          Explore our full catalog of treatments. Choose a category to narrow
          down your options.
        </p>
      </header>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <a
            href="/services"
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              !category
                ? "border-sky-600 bg-sky-50 text-sky-700"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            All
          </a>
          {categories.map((cat) => {
            const isActive = category === cat;
            return (
              <a
                key={cat}
                href={`/services?category=${encodeURIComponent(cat)}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  isActive
                    ? "border-sky-600 bg-sky-50 text-sky-700"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {cat}
              </a>
            );
          })}
        </div>
      )}

      {services.length === 0 ? (
        <p className="text-sm text-slate-600">
          No services are available at the moment. Please check back soon.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              href={`/services/${service.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

