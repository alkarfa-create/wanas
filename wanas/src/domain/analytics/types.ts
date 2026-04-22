// src/domain/analytics/types.ts

export const ANALYTICS_SCHEMA_VERSION = 1

// ─── Event Types (Discriminated Union) ───────────────────────────────────────
//
// Rules:
//   - No PII in any event payload. Use provider_hash (SHA-256 of provider_id)
//     instead of provider_id directly.
//   - All events carry schema_version for forward-compatible schema evolution.
//
export type AnalyticsEvent =
  | { event_type: 'listing_view';    listing_id: string; category_id?: number; district_id?: number; schema_version?: number }
  | { event_type: 'listing_click';   listing_id: string; category_id?: number;                       schema_version?: number }
  | { event_type: 'whatsapp_click';  listing_id: string; provider_hash?: string;                     schema_version?: number }
  | { event_type: 'search';          query: string;      category_id?: number; results_count?: number; schema_version?: number }
  | { event_type: 'category_switch'; category_id: number; previous_category_id?: number;             schema_version?: number }
  | { event_type: 'filter_applied';  filters: Record<string, unknown>;                               schema_version?: number }

// ─── Session ──────────────────────────────────────────────────────────────────
export interface AnalyticsSession {
  id:          string
  source:      string | null
  device:      string | null
  started_at:  string
  ended_at:    string | null
}

// ─── Raw Event (for DB insert into public.events) ─────────────────────────────
export interface RawAnalyticsEvent {
  schema_version: number
  session_id:     string | null
  event_type:     string
  listing_id?:    string
  category_id?:   number
  district_id?:   number
  properties:     Record<string, unknown>
  occurred_at:    string
}
