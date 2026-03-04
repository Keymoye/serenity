import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ title, message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}
      {ctaLabel && <div className="mt-4"><Button onClick={onCta}>{ctaLabel}</Button></div>}
    </div>
  );
}
