// src/domain/listings/constants.ts
import { ListingStatus } from './types'

// ─── State Machine — ALLOWED_TRANSITIONS ─────────────────────────────────────
//
//  draft ──→ pending_review ──→ approved ──→ paused ──→ approved
//                          └──→ rejected ──→ draft      └──→ archived
//  approved  ──→ archived   (admin/provider voluntary withdrawal)
//  approved  ──→ expired    (pg_cron or admin when expires_at reached)
//  paused    ──→ archived
//  expired   ──→ draft      (provider renews listing)
//  archived  ──→ draft      (provider reactivates)
//
// Special: admin may move rejected → approved directly (type = 'direct_approval')
// This must be logged in moderation_events with type = 'direct_approval'.

export const ALLOWED_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  [ListingStatus.DRAFT]: [
    ListingStatus.PENDING_REVIEW,    // provider submits for review
  ],
  [ListingStatus.PENDING_REVIEW]: [
    ListingStatus.APPROVED,           // admin approves
    ListingStatus.REJECTED,           // admin rejects
  ],
  [ListingStatus.APPROVED]: [
    ListingStatus.PAUSED,             // admin pauses temporarily
    ListingStatus.ARCHIVED,           // admin or provider archives
    ListingStatus.EXPIRED,            // pg_cron / admin marks as expired
    ListingStatus.PENDING_REVIEW,     // admin triggers re-review after material change
  ],
  [ListingStatus.PAUSED]: [
    ListingStatus.APPROVED,           // admin resumes
    ListingStatus.ARCHIVED,           // admin archives while paused
    ListingStatus.REJECTED,           // admin rejects while paused
  ],
  [ListingStatus.REJECTED]: [
    ListingStatus.DRAFT,              // provider revises and re-submits
    ListingStatus.APPROVED,           // admin direct approval (must log direct_approval)
  ],
  [ListingStatus.ARCHIVED]: [
    ListingStatus.DRAFT,              // provider or admin reactivates
  ],
  [ListingStatus.EXPIRED]: [
    ListingStatus.DRAFT,              // provider renews
  ],
}

// ─── Helper: is transition allowed? ──────────────────────────────────────────
export function isTransitionAllowed(
  from: ListingStatus,
  to:   ListingStatus
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

// ─── Helper: actions available per role ──────────────────────────────────────
export const ROLE_ALLOWED_ACTIONS = {
  admin:    ['approve', 'reject', 'pause', 'resume', 'archive', 'expire', 'direct_approve'] as const,
  reviewer: ['approve', 'reject'] as const,
  provider: ['submit', 'revise', 'archive'] as const,
} as const

export type AdminAction    = typeof ROLE_ALLOWED_ACTIONS.admin[number]
export type ReviewerAction = typeof ROLE_ALLOWED_ACTIONS.reviewer[number]
export type ProviderAction = typeof ROLE_ALLOWED_ACTIONS.provider[number]

// ─── Action → Status mapping ─────────────────────────────────────────────────
export const ACTION_TO_STATUS: Record<AdminAction, ListingStatus> = {
  approve:        ListingStatus.APPROVED,
  reject:         ListingStatus.REJECTED,
  pause:          ListingStatus.PAUSED,
  resume:         ListingStatus.APPROVED,
  archive:        ListingStatus.ARCHIVED,
  expire:         ListingStatus.EXPIRED,
  direct_approve: ListingStatus.APPROVED, // rejected → approved bypass; requires audit log
}
