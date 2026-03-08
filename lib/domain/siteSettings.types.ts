export interface SiteSettings {
  spa_name: string
  tagline: string
  hero_image_url: string
  about_image_url: string
  about_story: string
  phone: string
  email: string
  address: string
  opening_hours: string[]
  instagram_url: string
  facebook_url: string
  twitter_url: string
  location_lat: string
  location_lng: string
  location_embed_url: string
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  spa_name: 'Serenity Spa',
  tagline: 'Book massages, facials, and tailored wellness rituals in just a few clicks.',
  hero_image_url: '',
  about_image_url: '',
  about_story: 'Serenity Spa was founded with a simple belief: that true rest is not a luxury, but a necessity.',
  phone: '',
  email: '',
  address: '',
  opening_hours: ['Mon–Fri · 9:00–19:00', 'Sat–Sun · 10:00–18:00'],
  instagram_url: '',
  facebook_url: '',
  twitter_url: '',
  location_lat: '37.7749',
  location_lng: '-122.4194',
  location_embed_url: '',
}

export type SiteSettingsUpdate = Partial<SiteSettings>
