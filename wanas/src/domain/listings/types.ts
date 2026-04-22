// src/domain/listings/types.ts

// ─── Status Enum ─────────────────────────────────────────────────────────────
//
// Primary lifecycle states (stored in listings.status):
//   draft          → created, not yet submitted for review
//   pending_review → submitted, awaiting admin decision
//   approved       → live, visible to public (published_at is set here)
//   rejected       → failed review, provider must revise
//   archived       → voluntarily withdrawn from market (provider or admin action)
//   expired        → exceeded expires_at timestamp (set by pg_cron or admin)
//
// Operational state (also stored in status):
//   paused         → temporarily hidden by admin (kept for backward compatibility)
//
// NOT a status value:
//   featured       → is_featured boolean flag on an approved listing
//
export const ListingStatus = {
  DRAFT:          'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED:       'approved',
  REJECTED:       'rejected',
  PAUSED:         'paused',
  ARCHIVED:       'archived',
  EXPIRED:        'expired',
} as const

export type ListingStatus = typeof ListingStatus[keyof typeof ListingStatus]

// ─── Core Interfaces ─────────────────────────────────────────────────────────
export interface Listing {
  listing_id:            string
  provider_id:           string
  category_id:           number
  district_id:           number | null
  city_id:               number | null
  title:                 string
  slug:                  string | null
  description:           string | null
  price_min:             number | null
  price_max:             number | null
  price_label:           string | null
  capacity_min:          number | null
  capacity_max:          number | null
  features:              string[]
  policies:              Record<string, unknown>
  status:                ListingStatus
  is_featured:           boolean
  quality_score:         number
  duplicate_risk_score:  number
  rank_score:            number
  views_count:           number
  clicks_count:          number
  district_name:         string | null
  latitude:              number | null
  longitude:             number | null
  contact_phone:         string | null
  contact_whatsapp:      string | null
  occasion_type:         string | null
  metadata:              Record<string, unknown>
  published_at:          string | null
  expires_at:            string | null
  created_at:            string
  updated_at:            string
}

export interface ListingWithRelations extends Listing {
  category:  { name_ar: string; icon_key: string } | null
  district:  { name_ar: string } | null
  provider:  {
    provider_id:         string
    display_name:        string
    phone_whatsapp:      string
    verification_status: string
    subscription_tier:   string | null
  } | null
  media:     { url: string; sort_order: number }[]
}

// ─── Action Result Pattern ────────────────────────────────────────────────────
export type Ok<T>  = { success: true;  data: T }
export type Err    = { success: false; error: string; code?: string }
export type ActionResult<T> = Ok<T> | Err

export const ok  = <T>(data: T): Ok<T>         => ({ success: true,  data })
export const err = (error: string, code?: string): Err => ({ success: false, error, code })
