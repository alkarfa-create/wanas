import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const PII_KEYS = [
  'phone',
  'email',
  'provider_id',
  'name',
  'whatsapp',
  'mobile',
  'national_id',
  'password',
]

const ALLOWED_EVENTS = [
  'homepage_view',
  'category_view',
  'listing_impression',
  'listing_view',
  'listing_click',
  'whatsapp_click',
  'add_listing_start',
  'add_listing_step_completed',
  'add_listing_submit',
  'listing_approved',
  'listing_rejected',
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body?.event_name || !ALLOWED_EVENTS.includes(body.event_name)) {
      return NextResponse.json({ error: 'Invalid or missing event_name' }, { status: 400 })
    }

    if (body.payload && (typeof body.payload !== 'object' || Array.isArray(body.payload))) {
      return NextResponse.json({ error: 'payload must be an object' }, { status: 400 })
    }

    const payload = body.payload ?? {}
    const piiFound = Object.keys(payload).filter((key) => PII_KEYS.includes(key))
    if (piiFound.length > 0) {
      return NextResponse.json({ error: `PII not allowed: ${piiFound.join(', ')}` }, { status: 400 })
    }

    let visitor_id = typeof body.visitor_id === 'string' ? body.visitor_id : null
    let session_id = typeof body.session_id === 'string' ? body.session_id : null

    if (!visitor_id || !session_id) {
      const { data: visitor, error: visitorError } = await supabaseAdmin
        .from('visitors')
        .insert({ utm_first_source: 'direct' })
        .select('visitor_id')
        .single()

      if (visitorError || !visitor?.visitor_id) {
        console.error('Track visitor create error:', visitorError)
        return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
      }

      const { data: session, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .insert({ visitor_id: visitor.visitor_id })
        .select('session_id')
        .single()

      if (sessionError || !session?.session_id) {
        console.error('Track session create error:', sessionError)
        return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
      }

      visitor_id = visitor.visitor_id
      session_id = session.session_id
    }

    const { error } = await supabaseAdmin
      .from('events')
      .insert({
        event_name: body.event_name,
        payload,
        visitor_id,
        session_id,
        page_path: typeof body.page_path === 'string' ? body.page_path : null,
        listing_id: typeof body.listing_id === 'string' ? body.listing_id : null,
        category_id: typeof body.category_id === 'number' ? body.category_id : null,
        district_id: typeof body.district_id === 'number' ? body.district_id : null,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Track insert error:', error)
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
