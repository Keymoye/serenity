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

  // Generate Google Maps embed URL and directions link
  const mapsEmbedUrl = hasCoordinates
    ? `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${coordinates.lng}!3d${coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDkuMjgyNzY3LDEyLjY0MzYyNzg!5e0!3m2!1sen!2s`
    : null;

  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(address)}`;

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

      {hasCoordinates && mapsEmbedUrl ? (
        <div className="mb-3 overflow-hidden rounded-lg border border-slate-200">
          <iframe
            width="100%"
            height="200"
            loading="lazy"
            allowFullScreen
            src={mapsEmbedUrl}
            style={{ border: 0 }}
          />
        </div>
      ) : (
        <div className="mb-3 rounded-lg bg-slate-200/80 px-3 py-6 text-center text-xs text-slate-600">
          <p>
            Map location not available. Use the Get Directions button to navigate.
          </p>
        </div>
      )}

      <div className="mb-3 space-y-2">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700 transition-colors"
        >
          Get Directions
        </a>
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

