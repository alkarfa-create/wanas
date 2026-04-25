import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/session'

const ALLOWED_STATUSES = new Set(['draft', 'pending_review', 'approved', 'rejected', 'paused'])

type ListingPayload = {
  title?: string
  description?: string
  category_id?: number | string
  district_id?: number | string
  price_min?: number | string
  price_max?: number | string | null
  price_label?: string
  capacity_max?: number | string
  features?: string[]
  status?: string
  provider_id?: string
  media_urls?: string[]
}

function normalizeBody(body: ListingPayload) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const categoryId = Number(body.category_id)
  const districtId = Number(body.district_id)
  const priceMin = Number(body.price_min)
  const capacityMax = Number(body.capacity_max)
  const priceMax =
    body.price_max === null || body.price_max === undefined || body.price_max === ''
      ? null
      : Number(body.price_max)

  if (!title) return { error: 'title is required' }
  if (!Number.isInteger(categoryId)) return { error: 'category_id is invalid' }
  if (!Number.isInteger(districtId)) return { error: 'district_id is invalid' }
  if (!Number.isFinite(priceMin)) return { error: 'price_min is invalid' }
  if (!Number.isFinite(capacityMax)) return { error: 'capacity_max is invalid' }
  if (priceMax !== null && !Number.isFinite(priceMax)) return { error: 'price_max is invalid' }

  const status =
    typeof body.status === 'string' && ALLOWED_STATUSES.has(body.status)
      ? body.status
      : 'pending_review'
  const features = Array.isArray(body.features) ? body.features.filter((item): item is string => typeof item === 'string') : []
  const mediaUrls = Array.isArray(body.media_urls)
    ? body.media_urls.filter((item): item is string => typeof item === 'string' && /^https?:\/\//i.test(item))
    : []

  return {
    title,
    description,
    categoryId,
    districtId,
    priceMin,
    priceMax,
    priceLabel: typeof body.price_label === 'string' ? body.price_label : '',
    capacityMax,
    features,
    status,
    providerId: typeof body.provider_id === 'string' ? body.provider_id.trim() : '',
    mediaUrls,
  }
}

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  return Boolean(token && verifyAdminToken(token))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const listingId = id?.trim()
  if (!listingId) {
    return NextResponse.json({ error: 'Listing id is required' }, { status: 400 })
  }

  let body: ListingPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = normalizeBody(body)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { data: existingListing, error: existingError } = await supabaseAdmin
    .from('listings')
    .select('listing_id, provider_id')
    .eq('listing_id', listingId)
    .single()

  if (existingError || !existingListing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  if (parsed.providerId && parsed.providerId !== existingListing.provider_id) {
    return NextResponse.json({ error: 'provider_id cannot be changed in admin edit flow' }, { status: 400 })
  }

  const coverUrl = parsed.mediaUrls[0] ?? null

  const { error: updateError } = await supabaseAdmin
    .from('listings')
    .update({
      title: parsed.title,
      description: parsed.description,
      category_id: parsed.categoryId,
      district_id: parsed.districtId,
      price_min: parsed.priceMin,
      price_max: parsed.priceMax,
      price_label: parsed.priceLabel || `يبدأ من ${parsed.priceMin} ر.س`,
      capacity_max: parsed.capacityMax,
      features: parsed.features,
      status: parsed.status,
      cover_url: coverUrl,
    })
    .eq('listing_id', listingId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }

  const { error: deleteMediaError } = await supabaseAdmin
    .from('listing_media')
    .delete()
    .eq('listing_id', listingId)

  if (deleteMediaError) {
    return NextResponse.json({ error: 'Failed to refresh listing media' }, { status: 500 })
  }

  if (parsed.mediaUrls.length > 0) {
    const mediaRows = parsed.mediaUrls.map((url, index) => ({
      listing_id: listingId,
      url,
      media_type: 'image',
      sort_order: index,
    }))

    const { error: insertMediaError } = await supabaseAdmin.from('listing_media').insert(mediaRows)
    if (insertMediaError) {
      return NextResponse.json({ error: 'Failed to save listing media' }, { status: 500 })
    }
  }

  revalidatePath('/admin/listings')
  revalidatePath(`/admin/listings/${listingId}`)

  return NextResponse.json({ success: true, listing_id: listingId })
}
