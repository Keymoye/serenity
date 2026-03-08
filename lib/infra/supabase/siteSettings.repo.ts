import { getSupabaseUserClient } from './userClient'
import { getSupabaseAdminClient } from './adminClient'
import type { SiteSettings } from '@/lib/domain/siteSettings.types'
import { DEFAULT_SITE_SETTINGS } from '@/lib/domain/siteSettings.types'

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await getSupabaseUserClient()

  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')

  if (error) {
    console.error('Failed to load site settings', error)
    return { ...DEFAULT_SITE_SETTINGS }
  }

  const raw: Record<string, string> = {}
  for (const row of data ?? []) {
    raw[row.key] = row.value ?? ''
  }

  let opening_hours = DEFAULT_SITE_SETTINGS.opening_hours
  try {
    if (raw.opening_hours) {
      opening_hours = JSON.parse(raw.opening_hours)
    }
  } catch {
    // Keep default if JSON is malformed
  }

  return {
    spa_name: raw.spa_name || DEFAULT_SITE_SETTINGS.spa_name,
    tagline: raw.tagline || DEFAULT_SITE_SETTINGS.tagline,
    hero_image_url: raw.hero_image_url || '',
    about_image_url: raw.about_image_url || '',
    about_story: raw.about_story || DEFAULT_SITE_SETTINGS.about_story,
    phone: raw.phone || '',
    email: raw.email || '',
    address: raw.address || DEFAULT_SITE_SETTINGS.address,
    opening_hours,
    instagram_url: raw.instagram_url || '',
    facebook_url: raw.facebook_url || '',
    twitter_url: raw.twitter_url || '',
    location_lat: raw.location_lat || DEFAULT_SITE_SETTINGS.location_lat,
    location_lng: raw.location_lng || DEFAULT_SITE_SETTINGS.location_lng,
    location_embed_url: raw.location_embed_url || '',
  }
}

export async function updateSiteSettings(
  updates: Record<string, string>
): Promise<void> {
  const supabase = await getSupabaseAdminClient()

  const rows = Object.entries(updates).map(
    ([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    })
  )

  const { error } = await supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) throw error
}
