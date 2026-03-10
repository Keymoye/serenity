import * as settingsRepo from '@/lib/infra/supabase/siteSettings.repo'
import type { SiteSettings, SiteSettingsUpdate } from '@/lib/domain/siteSettings.types'

export async function getPublicSiteSettings(): Promise<SiteSettings> {
  return settingsRepo.getSiteSettings()
}

export async function updateSiteSettingsAdmin(
  updates: SiteSettingsUpdate
): Promise<void> {
  const flat: Record<string, string> = {}

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue
    if (key === 'opening_hours' && Array.isArray(value)) {
      flat[key] = JSON.stringify(value)
    } else {
      flat[key] = String(value)
    }
  }

  await settingsRepo.updateSiteSettings(flat)
}
