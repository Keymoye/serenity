import Image from 'next/image';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageSrc?: string;
}

export function PageHero({ title, subtitle, ctaLabel, ctaHref, imageSrc }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 to-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h1 className="font-display text-3xl font-semibold text-spa-charcoal md:text-4xl">{title}</h1>
            {subtitle && <p className="text-sm text-stone-700">{subtitle}</p>}
            {ctaLabel && ctaHref && (
              <a href={ctaHref} className="inline-flex items-center rounded-full bg-brand-500 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600">{ctaLabel}</a>
            )}
          </div>
          <div className="hidden items-center justify-center md:flex">
            {imageSrc ? (
              <div className="relative h-48 w-full max-w-sm">
                <Image src={imageSrc} alt={title} fill className="object-cover rounded-xl" />
              </div>
            ) : (
              <div className="aspect-video w-full max-w-sm rounded-xl bg-stone-100" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
