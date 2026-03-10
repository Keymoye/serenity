import Link from 'next/link';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({ title, message, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}
      {ctaLabel && ctaHref && (
        <div className="mt-4">
          <Link href={ctaHref}>
            <Button>{ctaLabel}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}