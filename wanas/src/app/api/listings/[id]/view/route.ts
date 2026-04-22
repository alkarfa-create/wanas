// src/app/api/listings/[id]/view/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ANALYTICS_SCHEMA_VERSION } from '@/domain/analytics/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params

    // Read optional analytics context from body (best-effort, never fail on it)
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const session_id  = typeof body.session_id  === 'string' ? body.session_id  : null
    const category_id = typeof body.category_id === 'number' ? body.category_id : null
    const district_id = typeof body.district_id === 'number' ? body.district_id : null

    // Increment the denormalised counter on the listing row
    await supabaseAdmin.rpc('increment_counter', {
      listing_uuid: listingId,
      col:          'views_count',
    })

    // Log a listing_view event into public.events
    const { error: eventError } = await supabaseAdmin.from('events').insert({
      schema_version: ANALYTICS_SCHEMA_VERSION,
      event_type:     'listing_view',
      listing_id:     listingId,
      session_id,
      category_id,
      district_id,
      properties:     {},
      occurred_at:    new Date().toISOString(),
    })

    if (eventError) {
      // Non-fatal: counter was already incremented, log and continue
      console.error('VIEW EVENT INSERT ERROR:', eventError.message)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
