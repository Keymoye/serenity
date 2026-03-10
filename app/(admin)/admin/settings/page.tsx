"use client"

import { useState, useEffect } from "react"
import { ImageUpload } from "@/components/ui/ImageUpload"

type SettingsForm = {
  spa_name: string
  tagline: string
  hero_image_url: string
  about_image_url: string
  about_story: string
  phone: string
  email: string
  address: string
  opening_hours: string
  instagram_url: string
  facebook_url: string
  twitter_url: string
  location_lat: string
  location_lng: string
  location_embed_url: string
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    spa_name: '',
    tagline: '',
    hero_image_url: '',
    about_image_url: '',
    about_story: '',
    phone: '',
    email: '',
    address: '',
    opening_hours: 'Mon–Fri · 9:00–19:00, Sat–Sun · 10:00–18:00',
    instagram_url: '',
    facebook_url: '',
    twitter_url: '',
    location_lat: '',
    location_lng: '',
    location_embed_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings
        setForm({
          spa_name: s.spa_name || '',
          tagline: s.tagline || '',
          hero_image_url: s.hero_image_url || '',
          about_image_url: s.about_image_url || '',
          about_story: s.about_story || '',
          phone: s.phone || '',
          email: s.email || '',
          address: s.address || '',
          opening_hours: Array.isArray(s.opening_hours)
            ? s.opening_hours.join(', ')
            : s.opening_hours || '',
          instagram_url: s.instagram_url || '',
          facebook_url: s.facebook_url || '',
          twitter_url: s.twitter_url || '',
          location_lat: s.location_lat || '',
          location_lng: s.location_lng || '',
          location_embed_url: s.location_embed_url || '',
        })
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  function update(key: keyof SettingsForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        ...form,
        opening_hours: form.opening_hours
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean),
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Save failed')

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1,2,3,4].map((i) => (
          <div key={i}
               className="h-12 bg-stone-100
                          rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-10">
      <div className="flex items-center
                      justify-between">
        <div>
          <h1 className="text-2xl font-semibold
                         text-stone-800">
            Site Settings
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Control what visitors see on your website
          </p>
        </div>
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="px-5 py-2.5 bg-stone-800
                     text-white text-sm font-medium
                     rounded-xl hover:bg-stone-700
                     disabled:opacity-50
                     transition-colors"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save all'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600
                      bg-red-50 rounded-xl p-3">
          {error}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold
                       text-stone-500 uppercase
                       tracking-wide">
          Brand
        </h2>
        <div className="space-y-4 bg-white border
                        border-stone-100 rounded-2xl p-5">
          <div>
            <label className="block text-sm font-medium
                              text-stone-700 mb-1.5">
              Spa name
            </label>
            <input
              type="text"
              value={form.spa_name}
              onChange={(e) => update('spa_name', e.target.value)}
              className="w-full px-4 py-2.5 border
                         border-stone-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2
                         focus:ring-stone-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium
                              text-stone-700 mb-1.5">
              Tagline
            </label>
            <textarea
              value={form.tagline}
              onChange={(e) => update('tagline', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border
                         border-stone-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2
                         focus:ring-stone-300 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium
                              text-stone-700 mb-1.5">
              About story
            </label>
            <textarea
              value={form.about_story}
              onChange={(e) => update('about_story', e.target.value)}
              rows={5}
              className="w-full px-4 py-2.5 border
                         border-stone-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2
                         focus:ring-stone-300 resize-none"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold
                       text-stone-500 uppercase
                       tracking-wide">
          Images
        </h2>
        <div className="space-y-6 bg-white border
                        border-stone-100 rounded-2xl p-5">
          <div>
            <label className="block text-sm font-medium
                              text-stone-700 mb-1.5">
              Hero image (landing page)
            </label>
            <ImageUpload
              currentUrl={form.hero_image_url || null}
              bucket="spa-hero"
              entityId="hero-main"
              onUpload={(url) => update('hero_image_url', url)}
              aspectRatio="landscape"
            />
          </div>
          <div>
            <label className="block text-sm font-medium
                              text-stone-700 mb-1.5">
              About page image
            </label>
            <ImageUpload
              currentUrl={form.about_image_url || null}
              bucket="spa-hero"
              entityId="about-hero"
              onUpload={(url) => update('about_image_url', url)}
              aspectRatio="landscape"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold
                       text-stone-500 uppercase
                       tracking-wide">
          Contact
        </h2>
        <div className="space-y-4 bg-white border
                        border-stone-100 rounded-2xl p-5">
          {[
            { key: 'phone', label: 'Phone number',
              placeholder: '+1 555 000 0000' },
            { key: 'email', label: 'Email address',
              placeholder: 'hello@yourspa.com' },
            { key: 'address', label: 'Physical address',
              placeholder: '123 Main St, City' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium
                                text-stone-700 mb-1.5">
                {label}
              </label>
              <input
                type="text"
                value={form[key as keyof SettingsForm]}
                onChange={(e) =>
                  update(key as keyof SettingsForm, e.target.value)
                }
                placeholder={placeholder}
                className="w-full px-4 py-2.5 border
                           border-stone-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-stone-300"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium
                              text-stone-700 mb-1.5">
              Opening hours
              <span className="text-stone-400 font-normal ml-1">
                (separate entries with a comma)
              </span>
            </label>
            <input
              type="text"
              value={form.opening_hours}
              onChange={(e) =>
                update('opening_hours', e.target.value)
              }
              placeholder="Mon–Fri · 9:00–19:00, Sat–Sun · 10:00–18:00"
              className="w-full px-4 py-2.5 border
                         border-stone-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2
                         focus:ring-stone-300"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold
                       text-stone-500 uppercase
                       tracking-wide">
          Location
        </h2>
        <div className="space-y-4 bg-white border
                        border-stone-100 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium
                                text-stone-700 mb-1.5">
                Latitude
              </label>
              <input
                type="text"
                value={form.location_lat}
                onChange={(e) =>
                  update('location_lat', e.target.value)
                }
                placeholder="-1.2921"
                className="w-full px-4 py-2.5 border
                           border-stone-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-stone-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium
                                text-stone-700 mb-1.5">
                Longitude
              </label>
              <input
                type="text"
                value={form.location_lng}
                onChange={(e) =>
                  update('location_lng', e.target.value)
                }
                placeholder="36.8219"
                className="w-full px-4 py-2.5 border
                           border-stone-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-stone-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium
                              text-stone-700 mb-1.5">
              Google Maps embed URL
              <span className="text-stone-400 font-normal ml-1">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={form.location_embed_url}
              onChange={(e) =>
                update('location_embed_url', e.target.value)
              }
              placeholder="https://maps.google.com/maps?..."
              className="w-full px-4 py-2.5 border
                         border-stone-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2
                         focus:ring-stone-300"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold
                       text-stone-500 uppercase
                       tracking-wide">
          Social media
        </h2>
        <div className="space-y-4 bg-white border
                        border-stone-100 rounded-2xl p-5">
          {[
            { key: 'instagram_url', label: 'Instagram URL',
              placeholder: 'https://instagram.com/yourspa' },
            { key: 'facebook_url', label: 'Facebook URL',
              placeholder: 'https://facebook.com/yourspa' },
            { key: 'twitter_url', label: 'X (Twitter) URL',
              placeholder: 'https://twitter.com/yourspa' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium
                                text-stone-700 mb-1.5">
                {label}
              </label>
              <input
                type="text"
                value={form[key as keyof SettingsForm]}
                onChange={(e) =>
                  update(key as keyof SettingsForm, e.target.value)
                }
                placeholder={placeholder}
                className="w-full px-4 py-2.5 border
                           border-stone-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-stone-300"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end pt-4
                      border-t border-stone-100">
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="px-6 py-2.5 bg-stone-800
                     text-white text-sm font-medium
                     rounded-xl hover:bg-stone-700
                     disabled:opacity-50
                     transition-colors"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save all'}
        </button>
      </div>
    </div>
  )
}
