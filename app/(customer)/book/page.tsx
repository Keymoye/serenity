import { BookingWizard } from "@/components/booking/BookingWizard";
import { requireCustomer } from "@/lib/services/authService";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { PageHero } from "@/components/layout/PageHero";

type BookPageProps = {
  searchParams: {
    serviceId?: string;
    therapistId?: string;
  };
};

export default async function BookPage({ searchParams }: BookPageProps) {
  const current = await requireCustomer();

  if (!current) {
    // Middleware already protects this route; this is a safety net.
    return null;
  }

  const { serviceId: initialServiceId, therapistId: initialTherapistId } = (await searchParams) ?? {};

  return (
    <div>
      <PageHero title="Book a treatment" subtitle="Follow the steps to choose your service, therapist, and time." />

      <SectionWrapper>
        <div className="mx-auto max-w-4xl">
          <BookingWizard initialServiceId={initialServiceId} initialTherapistId={initialTherapistId} />
        </div>
      </SectionWrapper>
    </div>
  );
}

