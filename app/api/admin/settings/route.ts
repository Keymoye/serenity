import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { logger } from '@/lib/utils/logger'
import { mapErrorToLegacyHttp } from '@/lib/utils/errorMapper'
import { requireAdmin } from '@/lib/infra/supabase/currentUser'
import { getPublicSiteSettings, updateSiteSettingsAdmin } from '@/lib/application/siteSettings.service'

export async function GET() {
  const correlationId = randomUUID()
  const log = logger.withContext({ correlationId, route: 'admin.settings.GET' })

  try {
    const current = await requireAdmin()

    const settings = await getPublicSiteSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    log.error('GET /api/admin/settings failed', error)
    const { status, body } = mapErrorToLegacyHttp(error)
    return NextResponse.json(body, { status })
  }
}

export async function PUT(request: NextRequest) {
  const correlationId = randomUUID()
  const log = logger.withContext({ correlationId, route: 'admin.settings.PUT' })

  try {
    const current = await requireAdmin()

    const body = await request.json()

    const ALLOWED_KEYS = [
      'spa_name', 'tagline', 'hero_image_url',
      'about_image_url', 'about_story', 'phone',
      'email', 'address', 'opening_hours',
      'instagram_url', 'facebook_url', 'twitter_url',
      'location_lat', 'location_lng',
      'location_embed_url',
    ]

    const filtered: Record<string, unknown> = {}
    for (const key of ALLOWED_KEYS) {
      if (key in body) filtered[key] = body[key]
    }

    if (Object.keys(filtered).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided' },
        { status: 400 }
      )
    }

    await updateSiteSettingsAdmin(filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('PUT /api/admin/settings failed', error)
    const { status, body } = mapErrorToLegacyHttp(error)
    return NextResponse.json(body, { status })
  }
}
