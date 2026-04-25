import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function cleanWhatsappPhone(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  return digits.length > 0 ? digits : null
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

  const visitorId = request.cookies.get('visitor_id')?.value || randomUUID()
  const sessionId = request.cookies.get('session_id')?.value || randomUUID()
  const now = new Date().toISOString()
  const pagePath = `/listing/${listing_id}`
  const { data: counterRow } = await supabaseAdmin
    .from('listings')
    .select('clicks_count')
    .eq('listing_id', listing_id)
    .single()

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
        visitor_id: visitorId,
        session_id: sessionId,
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
  response.cookies.set('visitor_id', visitorId, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  response.cookies.set('session_id', sessionId, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
  return response
}
