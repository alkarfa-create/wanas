export interface ListingData {
    listing_id: string
    title: string
    price_min: number | null
    price_max: number | null
    price_label: string | null
    capacity_min: number | null
    capacity_max: number | null
    rank_score: number
    features: string[]
    district: { name_ar: string }
    category: { name_ar: string; icon_key: string }
    provider: {
        display_name: string
        phone_whatsapp: string
        verification_status: string
        trust_score: number
    }
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
