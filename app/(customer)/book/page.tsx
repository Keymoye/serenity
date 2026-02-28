import { getCurrentUser } from "@/lib/services/authService";
import { BookingWizard } from "@/components/booking/BookingWizard";

type BookPageProps = {
  searchParams: {
    serviceId?: string;
  };
};

export default async function BookPage({ searchParams }: BookPageProps) {
  const current = await getCurrentUser();

  if (!current) {
    // Middleware already protects this route; this is a safety net.
    return null;
  }

  const initialServiceId = searchParams.serviceId;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Book a treatment
        </h1>
        <p className="text-sm text-slate-700">
          Follow the steps to choose your service, therapist, and time.
        </p>
      </header>

      <BookingWizard initialServiceId={initialServiceId} />
    </div>
  );
}

