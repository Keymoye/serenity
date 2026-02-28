type MapEmbedProps = {
  coordinates?: {
    lat: number;
    lng: number;
  };
  address: string;
  openingHours: string[];
};

export function MapEmbed({ coordinates, address, openingHours }: MapEmbedProps) {
  const hasCoordinates =
    typeof coordinates?.lat === "number" &&
    typeof coordinates?.lng === "number";

  // For now we render a styled card; later you can replace this with an
  // actual map widget (Google Maps, Mapbox, etc.) while keeping this API.

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Visit us
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          {address}
        </p>
      </div>

      <div className="mb-3 rounded-lg bg-slate-200/80 px-3 py-6 text-center text-xs text-slate-600">
        {hasCoordinates ? (
          <p>
            Map preview for ({coordinates.lat.toFixed(4)},{" "}
            {coordinates.lng.toFixed(4)}) – integrate your preferred map
            provider here.
          </p>
        ) : (
          <p>
            Map unavailable in this environment. Add a live map integration
            later.
          </p>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Opening hours
        </h4>
        <ul className="mt-1 space-y-1 text-xs text-slate-600">
          {openingHours.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

