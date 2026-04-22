import type { ListingStatus } from '@/domain/listings/types'

export type ModerationAction =
  | 'status_change'
  | 'note_added'
  | 'featured_toggled'
  | 'quality_updated'

export interface ModerationEvent {
  id:              string
  listing_id:      string
  actor_id:        string | null
  actor_name:      string | null
  action:          ModerationAction
  previous_status: ListingStatus | null
  next_status:     ListingStatus | null
  reason:          string | null
  note:            string | null
  source:          string
  changed_fields:  Record<string, unknown>
  occurred_at:     string
}

export interface LogModerationEventInput {
  listing_id:      string
  actor_id?:       string
  actor_name?:     string
  action:          ModerationAction
  previous_status?: ListingStatus
  next_status?:    ListingStatus
  reason?:         string
  note?:           string
  source?:         string
  changed_fields?: Record<string, unknown>
}
