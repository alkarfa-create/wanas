// src/app/api/listings/[id]/click/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'
import { ANALYTICS_SCHEMA_VERSION } from '@/domain/analytics/types'

const ALLOWED_CLICK_TYPES = new Set(['listing_click', 'whatsapp_click'])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params

    // Read analytics context from body (best-effort)
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const rawEventType = typeof body.event_type === 'string' ? body.event_type : 'listing_click'
    const event_type   = ALLOWED_CLICK_TYPES.has(rawEventType) ? rawEventType : 'listing_click'
    const session_id   = typeof body.session_id  === 'string' ? body.session_id  : null
    const category_id  = typeof body.category_id === 'number' ? body.category_id : null

    // Hash provider_id to avoid storing PII (only relevant for whatsapp_click)
    const rawProviderId = typeof body.provider_id === 'string' ? body.provider_id : null
    const provider_hash = rawProviderId
      ? createHash('sha256').update(rawProviderId).digest('hex')
      : null

    // Increment the denormalised clicks counter on the listing row
    await supabaseAdmin.rpc('increment_counter', {
      listing_uuid: listingId,
      col:          'clicks_count',
    })

    // Build event properties — no raw provider_id, only hash
    const properties: Record<string, unknown> = {}
    if (provider_hash) properties.provider_hash = provider_hash

    // Log the click event into public.events
    const { error: eventError } = await supabaseAdmin.from('events').insert({
      schema_version: ANALYTICS_SCHEMA_VERSION,
      event_type,
      listing_id:     listingId,
      session_id,
      category_id,
      district_id:    null,
      properties,
      occurred_at:    new Date().toISOString(),
    })

    if (eventError) {
      // Non-fatal: counter was already incremented, log and continue
      console.error('CLICK EVENT INSERT ERROR:', eventError.message)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
