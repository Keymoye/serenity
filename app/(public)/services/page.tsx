import { logger } from "@/lib/utils/logger";
import { ServiceCard, type ServiceSummary } from "@/components/ServiceCard";
import Link from "next/link";
import { listPublicServices } from "@/lib/application/service.service";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services — Serenity Spa",
  description: "Explore our full catalog of spa treatments, massages, facials, and wellness services.",
};

type ServicesPageProps = {
  searchParams: {
    category?: string;
  };
};

async function getServices(category?: string): Promise<ServiceSummary[]> {
  try {
    const rows = await listPublicServices({ category });
    return (rows ?? []) as unknown as ServiceSummary[];
  } catch (error) {
    logger.error("Unexpected error while loading services", error, {
      category,
    });
    return [];
  }
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const { category } = (await searchParams) ?? {};
  const services = await getServices(category);

  const categories = Array.from(
    new Set(
      services
        .map((s) => s.category)
        .filter((c): c is string => Boolean(c && c.trim().length > 0))
    )
  ).sort();

  return (
    <SectionWrapper>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Services</h1>
          <p className="text-sm text-slate-700">Explore our full catalog of treatments. Choose a category to narrow down your options.</p>
        </header>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/services"
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                !category
                  ? "border-sky-600 bg-sky-50 text-sky-700"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              All
            </Link>
            {categories.map((cat) => {
              const isActive = category === cat;
              return (
                <Link
                  key={cat}
                  href={`/services?category=${encodeURIComponent(cat)}`}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    isActive
                      ? "border-sky-600 bg-sky-50 text-sky-700"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        )}

        {services.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="slate-700 font-medium">
              No services available right now.
            </p>
            <p className="text-sm text-slate-500">
              We&apos;re updating our offerings.
              Please check back soon or contact
              us for assistance.
            </p>
            <a href="/contact"
               className="inline-block mt-2
                          rounded-full border
                          border-slate-300 px-4 py-1.5
                          text-sm text-slate-700
                          hover:bg-slate-50">
              Contact us
            </a>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} href={`/services/${service.id}`} />
            ))}
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

