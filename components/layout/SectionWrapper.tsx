interface SectionWrapperProps {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'cream';
}

export function SectionWrapper({ children, variant = 'default' }: SectionWrapperProps) {
  const bg = variant === 'muted' ? 'bg-stone-50' : variant === 'cream' ? 'bg-spa-cream' : '';
  return (
    <section className={`${bg} mx-auto max-w-6xl px-4 py-10`}>{children}</section>
  );
}
