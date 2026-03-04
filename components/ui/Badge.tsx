interface BadgeProps {
  status: 'confirmed' | 'pending' | 'cancelled' | 'available';
  className?: string;
}

export function Badge({ status, className = '' }: BadgeProps) {
  const map: Record<string,string> = {
    confirmed: 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700',
    pending: 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700',
    cancelled: 'rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700',
    available: 'rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600',
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span role="status" aria-label={label} className={`${map[status]} ${className}`}>{label}</span>
  );
}
