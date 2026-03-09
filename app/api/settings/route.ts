import { randomUUID } from "crypto"
import { NextResponse } from 'next/server'
import { getPublicSiteSettings } from '@/lib/application/siteSettings.service'
import { logger } from '@/lib/utils/logger'
import { mapErrorToLegacyHttp } from '@/lib/utils/errorMapper'

export async function GET() {
  const correlationId = randomUUID()
  const log = logger.withContext({ correlationId, route: "settings.get" })
  
  try {
    const settings = await getPublicSiteSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    log.error("GET /api/settings failed", error)
    const { status, body } = mapErrorToLegacyHttp(error)
    return NextResponse.json(body, { status })
  }
}
