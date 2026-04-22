import { supabaseAdmin } from '@/lib/supabase'

export interface ListingParams {
  categoryId?: string | number
  districtId?: number
  districtName?: string
  searchQuery?: string
  priceMin?: number
  priceMax?: number
  occasionType?: string
  capacityMin?: number
  hasPool?: boolean
  hasKitchen?: boolean
  features?: string[]
  sortBy?: 'rank' | 'price_min' | 'views_count' | 'created_at'
  page?: number
  limit?: number
}

type ListingMediaRow = {
  url?: string | null
  sort_order?: number | null
}

type ListingDistrictRow = {
  district_id: number
  name_ar: string
  slug: string
}

function isListingDistrictRow(value: unknown): value is ListingDistrictRow {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return (
    typeof row.district_id === 'number' &&
    typeof row.name_ar === 'string' &&
    typeof row.slug === 'string'
  )
}

type ListingReviewRow = {
  rating: number | null
}

export async function getListingsWithMedia(params: ListingParams = {}) {
  const {
    categoryId,
    districtId,
    districtName,
    searchQuery,
    priceMin,
    priceMax,
    occasionType,
    capacityMin,
    hasPool,
    hasKitchen,
    features = [],
    sortBy = 'rank',
    page = 1,
    limit = 20,
  } = params

  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('listings')
    .select(
      `
      listing_id,
      title,
      price_min,
      cover_url,
      contact_whatsapp,
      features,
      district_name,
      district:districts!listings_district_id_fkey(district_id, name_ar),
      category:service_categories!listings_category_id_fkey(category_id, name_ar, icon_key),
      provider:providers!listings_provider_id_fkey(provider_id, display_name, phone_whatsapp, verification_status, trust_score, subscription_tier),
      media:listing_media(url, sort_order)
      `
    )
    .eq('status', 'approved')

  if (categoryId !== undefined) {
    query = query.eq('category_id', Number(categoryId))
  }

  if (districtId) {
    query = query.eq('district_id', districtId)
  } else if (districtName) {
    query = query.eq('district_name', districtName)
  }

  if (searchQuery?.trim()) {
    query = query.or(
      `title.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%`
    )
  }

  if (priceMin !== undefined) {
    query = query.gte('price_min', priceMin)
  }

  if (priceMax !== undefined) {
    query = query.lte('price_max', priceMax)
  }

  if (occasionType) {
    query = query.eq('occasion_type', occasionType)
  }

  if (capacityMin !== undefined) {
    query = query.gte('capacity_max', capacityMin)
  }

  if (hasPool) {
    query = query.contains('features', JSON.stringify(['مسبح']))
  }

  if (hasKitchen) {
    query = query.contains('features', JSON.stringify(['مطبخ']))
  }

  for (const feat of features) {
    query = query.contains('features', JSON.stringify([feat]))
  }

  query = query.order('is_featured', { ascending: false })

  if (sortBy === 'price_min') {
    query = query.order('price_min', { ascending: true, nullsFirst: false })
  } else if (sortBy === 'views_count') {
    query = query.order('views_count', { ascending: false })
  } else if (sortBy === 'created_at') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('rank_score', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    console.error('[getListingsWithMedia] error:', error.message)
    return []
  }

  return (data ?? []).map((item) => {
    const media: ListingMediaRow[] = Array.isArray(item.media)
      ? [...item.media]
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .filter((m, i, arr) => m.url && arr.findIndex((x) => x.url === m.url) === i)
      : []

    return {
      ...item,
      cover_url: item.cover_url ?? media[0]?.url ?? null,
      media,
      district: Array.isArray(item.district) ? item.district[0] ?? null : item.district ?? null,
      category: Array.isArray(item.category) ? item.category[0] ?? null : item.category ?? null,
      provider: Array.isArray(item.provider) ? item.provider[0] ?? null : item.provider ?? null,
    }
  })
}

export async function getDistrictCounts(categoryId?: number) {
  let query = supabaseAdmin
    .from('listings')
    .select('district_id, district:districts!listings_district_id_fkey(district_id, name_ar, slug)')
    .eq('status', 'approved')

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query
  if (error) return []

  const map = new Map<number, { district_id: number; name_ar: string; slug: string; count: number }>()
  for (const row of data ?? []) {
    const districtValue = Array.isArray(row.district) ? row.district[0] : row.district
    if (!isListingDistrictRow(districtValue)) continue
    const d = districtValue
    const existing = map.get(d.district_id)
    if (existing) {
      existing.count++
    } else {
      map.set(d.district_id, { district_id: d.district_id, name_ar: d.name_ar, slug: d.slug, count: 1 })
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count)
}

export async function getHomePageStats() {
  const [listingsResult, requestsResult, reviewsResult] = await Promise.all([
    supabaseAdmin
      .from('listings')
      .select('listing_id', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabaseAdmin
      .from('requests')
      .select('request_id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('reviews')
      .select('rating'),
  ])

  const totalListings = listingsResult.count ?? 0
  const totalContacts = requestsResult.count ?? 0

  const reviews = (reviewsResult.data ?? []) as ListingReviewRow[]
  const avgRating = reviews.length > 0
    ? (
        reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviews.length
      ).toFixed(1)
    : '4.9'

  return { totalListings, totalContacts, avgRating }
}
