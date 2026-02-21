export type ListingStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended'
export type VerificationStatus = 'unverified' | 'verified' | 'rejected'
export type ProviderStatus = 'active' | 'suspended' | 'deleted'
export type Channel = 'google_ads' | 'organic' | 'direct' | 'social' | 'referral'
export type EventName =
    | 'page_view'
    | 'search'
    | 'filter_use'
    | 'listing_view'
    | 'whatsapp_click'
    | 'request_created'
    | 'review_submitted'

export interface ServiceCategory {
    category_id: number
    name_ar: string
    slug: string
    icon_key?: string
    is_active: boolean
    sort_order: number
}

export interface District {
    district_id: number
    city: string
    name_ar: string
    slug: string
    geo_center_lat?: number
    geo_center_lng?: number
    is_active: boolean
}

export interface Provider {
    provider_id: string
    display_name: string
    phone_whatsapp: string
    phone_call?: string
    provider_type?: string
    district_id?: number
    verification_status: VerificationStatus
    status: ProviderStatus
    trust_score: number
    created_at: string
    updated_at: string
}

export interface Listing {
    listing_id: string
    provider_id: string
    category_id: number
    district_id: number
    title: string
    slug: string
    description?: string
    price_min?: number
    price_max?: number
    price_label?: string
    capacity_min?: number
    capacity_max?: number
    features: string[]
    policies: Record<string, unknown>
    status: ListingStatus
    rank_score: number
    views_count: number
    clicks_count: number
    published_at?: string
    created_at: string
    updated_at: string
    // joined
    provider?: Provider
    district?: District
    category?: ServiceCategory
    media?: ListingMedia[]
}

export interface ListingMedia {
    media_id: number
    listing_id: string
    url: string
    media_type: 'image' | 'video'
    sort_order: number
}

export interface Request {
    request_id: string
    request_ref: string
    review_token: string
    visitor_id: string
    session_id: string
    listing_id: string
    provider_id: string
    category_id: number
    district_id: number
    channel: Channel
    status_inferred: string
    whatsapp_click_at?: string
    post_click_browse_flag: boolean
    post_click_listings_count: number
    followup_sent_at?: string
    review_submitted_at?: string
    event_date?: string
    guest_count?: number
    created_at: string
}
