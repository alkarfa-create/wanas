export interface ListingFeatureFlags {
    pool?: boolean
    kitchen?: boolean
}

export type ListingFeatures = string[] | ListingFeatureFlags

export interface ListingData {
    listing_id: string
    title: string
    price_min: number | null
    price_max?: number | null
    price_label?: string | null
    capacity_min?: number | null
    capacity_max?: number | null
    rank_score?: number | null
    features?: ListingFeatures | null
    cover_url?: string | null
    district_name?: string | null
    district?: { name_ar?: string | null } | null
    category?: { name_ar?: string | null; icon_key?: string | null } | null
    provider?: {
        display_name?: string | null
        phone_whatsapp?: string | null
        verification_status?: string | null
        trust_score?: number | null
        subscription_tier?: string | null
    } | null
}

export interface ListingAnalyticsEvent {
    name: 'listing_card_click' | 'listing_wishlist_toggle' | 'listing_carousel_nav' | 'listing_whatsapp_click';
    listing_id: string;
    position?: number;
    to_index?: number;
    method?: 'arrow' | 'swipe' | 'kbd' | 'dot';
    state?: 'saved' | 'unsaved';
    phone?: string;
}
