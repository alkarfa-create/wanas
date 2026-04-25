import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function cleanWhatsappPhone(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  return digits.length > 0 ? digits : null
}

async function ensureVisitorAndSession(visitorId: string | null, sessionId: string | null) {
  if (visitorId && sessionId) {
    const { data: existingSession } = await supabaseAdmin
      .from('sessions')
      .select('session_id, visitor_id')
      .eq('session_id', sessionId)
      .eq('visitor_id', visitorId)
      .maybeSingle()

    if (existingSession) {
      return { visitor_id: visitorId, session_id: sessionId, error: null as string | null }
    }
  }

  const { data: visitor, error: visitorError } = await supabaseAdmin
    .from('visitors')
    .insert({ utm_first_source: 'direct' })
    .select('visitor_id')
    .single()

  if (visitorError || !visitor?.visitor_id) {
    return { visitor_id: null, session_id: null, error: 'Failed to record event' }
  }

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .insert({ visitor_id: visitor.visitor_id })
    .select('session_id')
    .single()

  if (sessionError || !session?.session_id) {
    return { visitor_id: null, session_id: null, error: 'Failed to record event' }
  }

  return {
    visitor_id: visitor.visitor_id,
    session_id: session.session_id,
    error: null as string | null,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listing_id: string }> }
) {
  const { listing_id } = await params

  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select(`
      listing_id,
      provider_id,
      category_id,
      district_id,
      provider:providers!listings_provider_id_fkey(phone_whatsapp)
    `)
    .eq('listing_id', listing_id)
    .eq('status', 'approved')
    .single()

  if (!listing) {
    return NextResponse.redirect(new URL('/404', request.url))
  }

  const provider = Array.isArray(listing.provider) ? listing.provider[0] : listing.provider
  const phone = cleanWhatsappPhone(provider?.phone_whatsapp)

  if (!phone) {
    return NextResponse.redirect(new URL(`/listing/${listing_id}`, request.url))
  }

  const visitorId = request.cookies.get('visitor_id')?.value ?? null
  const sessionId = request.cookies.get('session_id')?.value ?? null
  const now = new Date().toISOString()
  const pagePath = `/listing/${listing_id}`
  const { data: counterRow } = await supabaseAdmin
    .from('listings')
    .select('clicks_count')
    .eq('listing_id', listing_id)
    .single()
  const { visitor_id, session_id, error: identityError } = await ensureVisitorAndSession(visitorId, sessionId)

  if (identityError || !visitor_id || !session_id) {
    return NextResponse.redirect(new URL(`/listing/${listing_id}`, request.url))
  }

  const [counterResult, eventResult] = await Promise.all([
    supabaseAdmin
      .from('listings')
      .update({
        clicks_count: (counterRow?.clicks_count ?? 0) + 1,
      })
      .eq('listing_id', listing_id),
    supabaseAdmin
      .from('events')
      .insert({
        event_name: 'whatsapp_click',
        payload: {
          destination: 'whatsapp',
          listing_id,
          provider_id: listing.provider_id,
        },
        visitor_id,
        session_id,
        page_path: pagePath,
        listing_id,
        category_id: listing.category_id,
        district_id: listing.district_id,
        created_at: now,
      }),
  ])

  if (counterResult.error || eventResult.error) {
    return NextResponse.redirect(new URL(`/listing/${listing_id}`, request.url))
  }

  const response = NextResponse.redirect(`https://wa.me/${phone}`)
  response.cookies.set('visitor_id', visitor_id, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  response.cookies.set('session_id', session_id, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
  return response
}
