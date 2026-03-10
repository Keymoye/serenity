export function Spinner({ size = 4 }: { size?: number }) {
  const cls = `h-${size} w-${size} animate-spin rounded-full border-2 border-t-transparent`;
  return <div className={cls} />;
}
