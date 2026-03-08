"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function AdminMediaPage() {
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<(string | null)[]>([null, null, null, null, null, null, null, null]);

  function updateGallery(index: number, url: string) {
    setGalleryUrls((prev) => {
      const next = [...prev];
      next[index] = url || null;
      return next;
    });
  }

  return (
    <div className="p-6 max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">
          Media
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage images used across the site
        </p>
      </div>

      {/* Hero image section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-stone-700">
            Hero Image
          </h2>
          <p className="text-sm text-stone-400 mt-0.5">
            Shown on the landing page hero section.
            Recommended: 1920×1080px landscape.
          </p>
        </div>
        <div className="max-w-lg">
          <ImageUpload
            currentUrl={heroUrl}
            bucket="spa-hero"
            entityId="hero-main"
            onUpload={(url) => setHeroUrl(url || null)}
            label="Hero image"
            aspectRatio="landscape"
          />
        </div>
        {heroUrl && (
          <div className="rounded-xl overflow-hidden max-w-lg border border-stone-100">
            <img
              src={heroUrl}
              alt="Hero preview"
              className="w-full h-48 object-cover"
            />
          </div>
        )}
      </section>

      {/* Gallery section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-stone-700">
            Gallery
          </h2>
          <p className="text-sm text-stone-400 mt-0.5">
            Shown in the gallery section of the site.
            Up to 8 images. Recommended: square.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {galleryUrls.map((url, i) => (
            <div key={i} className="space-y-2">
              <ImageUpload
                currentUrl={url}
                bucket="spa-gallery"
                entityId={`gallery-${i + 1}`}
                onUpload={(u) => updateGallery(i, u)}
                aspectRatio="square"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Info note */}
      <div className="rounded-xl bg-stone-50 border border-stone-100 p-4">
        <p className="text-xs text-stone-500">
          Images are stored in Supabase Storage and 
          served via CDN. Changes are visible 
          immediately after upload.
        </p>
      </div>
    </div>
  );
}
