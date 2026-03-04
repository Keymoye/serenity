interface PriceTagProps {
  price?: number | null;
  durationMinutes?: number | null;
}

export function PriceTag({ price, durationMinutes }: PriceTagProps) {
  return (
    <div className="flex items-baseline gap-2">
      {price != null ? <span className="text-sm font-semibold text-slate-900">${price.toFixed(2)}</span> : <span className="text-sm text-slate-600">Contact for price</span>}
      {durationMinutes != null && <span className="text-xs text-slate-500">· {durationMinutes} min</span>}
    </div>
  );
}
