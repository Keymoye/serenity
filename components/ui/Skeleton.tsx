interface SkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'table-row';
  className?: string;
}

export function Skeleton({ variant = 'text', className = '' }: SkeletonProps) {
  const base = 'animate-pulse rounded bg-slate-200';
  const map: Record<string,string> = {
    text: 'h-4 w-full',
    card: 'h-48 w-full',
    avatar: 'h-10 w-10 rounded-full',
    'table-row': 'h-12 w-full',
  };
  return <div className={`${base} ${map[variant]} ${className}`} />;
}

export function SkeletonRow() {
  return (
    <div className="animate-pulse flex gap-4 p-4 border-b border-stone-100">
      <div className="h-4 bg-slate-200 rounded w-24" />
      <div className="h-4 bg-slate-200 rounded w-32" />
      <div className="h-4 bg-slate-200 rounded w-20" />
      <div className="h-4 bg-slate-200 rounded flex-1" />
      <div className="h-4 bg-slate-200 rounded w-16" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}
