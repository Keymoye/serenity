interface SkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'table-row';
  className?: string;
}

export function Skeleton({ variant = 'text', className = '' }: SkeletonProps) {
  const base = 'animate-shimmer rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]';
  const map: Record<string,string> = {
    text: 'h-4 w-full',
    card: 'h-48 w-full',
    avatar: 'h-10 w-10 rounded-full',
    'table-row': 'h-12 w-full',
  };
  return <div className={`${base} ${map[variant]} ${className}`} />;
}
