import { NextResponse } from 'next/server'
import { getPublicSiteSettings } from '@/lib/application/siteSettings.service'

export async function GET() {
  try {
    const settings = await getPublicSiteSettings()
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}
