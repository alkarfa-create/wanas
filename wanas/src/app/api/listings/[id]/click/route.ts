// src/app/api/listings/[id]/click/route.ts
import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_CLICK_TYPES = new Set(['listing_click', 'whatsapp_click'])

async function ensureVisitorAndSession(visitorId: string | null, sessionId: string | null) {
  if (visitorId && sessionId) {
    return { visitor_id: visitorId, session_id: sessionId, error: null as string | null }
  }

  const { data: visitor, error: visitorError } = await supabaseAdmin
    .from('visitors')
    .insert({ utm_first_source: 'direct' })
    .select('visitor_id')
    .single()

  if (visitorError || !visitor?.visitor_id) {
    console.error('listing click visitor create error:', visitorError)
    return { visitor_id: null, session_id: null, error: 'Failed to record event' }
  }

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .insert({ visitor_id: visitor.visitor_id })
    .select('session_id')
    .single()

  if (sessionError || !session?.session_id) {
    console.error('listing click session create error:', sessionError)
    return { visitor_id: null, session_id: null, error: 'Failed to record event' }
  }

  return {
    visitor_id: visitor.visitor_id,
    session_id: session.session_id,
    error: null as string | null,
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params

    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const rawEventName = typeof body.event_name === 'string'
      ? body.event_name
      : typeof body.event_type === 'string'
        ? body.event_type
        : 'listing_click'
    const event_name = ALLOWED_CLICK_TYPES.has(rawEventName) ? rawEventName : 'listing_click'
    const visitorId = typeof body.visitor_id === 'string' ? body.visitor_id : null
    const sessionId = typeof body.session_id === 'string' ? body.session_id : null
    const category_id = typeof body.category_id === 'number' ? body.category_id : null
    const district_id = typeof body.district_id === 'number' ? body.district_id : null
    const page_path = typeof body.page_path === 'string' ? body.page_path : `/listing/${listingId}`

    const rawProviderId = typeof body.provider_id === 'string' ? body.provider_id : null
    const provider_hash = rawProviderId
      ? createHash('sha256').update(rawProviderId).digest('hex')
      : null

    await supabaseAdmin.rpc('increment_counter', {
      listing_uuid: listingId,
      col: 'clicks_count',
    })

    const { visitor_id, session_id, error: identityError } = await ensureVisitorAndSession(visitorId, sessionId)
    if (identityError || !visitor_id || !session_id) {
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
    }

    const payload: Record<string, unknown> = {}
    if (provider_hash) payload.provider_hash = provider_hash

    const { error: eventError } = await supabaseAdmin.from('events').insert({
      event_name,
      payload,
      visitor_id,
      session_id,
      page_path,
      listing_id: listingId,
      category_id,
      district_id,
      created_at: new Date().toISOString(),
    })

    if (eventError) {
      console.error('listing click event insert error:', eventError)
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
