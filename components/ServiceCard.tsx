export type ServiceSummary = {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
  price: number | null;
  description: string | null;
  first_image_url: string | null;
};

interface ServiceCardProps {
  service: ServiceSummary;
  href: string;
}

export function ServiceCard({ service, href }: ServiceCardProps) {
  const { name, category, duration_minutes, price, first_image_url } = service;

  return (
    <a
      href={href}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-40 w-full bg-slate-100">
        {first_image_url ? (
          <img
            src={first_image_url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
            {name}
          </h3>
          {price != null && (
            <span className="whitespace-nowrap text-sm font-semibold text-slate-900">
              ${price.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1">
            {category && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {category}
              </span>
            )}
          </div>
          {duration_minutes != null && (
            <span>{duration_minutes} min</span>
          )}
        </div>

        <button
          type="button"
          className="mt-2 inline-flex items-center justify-center rounded-full bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700"
        >
          Book now
        </button>
      </div>
    </a>
  );
}

