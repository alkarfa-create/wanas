import { z } from 'zod'

export const ModerationActionSchema = z.enum([
  'status_change',
  'note_added',
  'featured_toggled',
  'quality_updated',
])

export const LogModerationEventSchema = z.object({
  listing_id:      z.string().uuid(),
  actor_id:        z.string().optional(),
  actor_name:      z.string().optional(),
  action:          ModerationActionSchema,
  previous_status: z.string().optional(),
  next_status:     z.string().optional(),
  reason:          z.string().max(500).optional(),
  note:            z.string().max(1000).optional(),
  source:          z.string().default('admin_ui'),
  changed_fields:  z.record(z.string(), z.unknown()).default({}),
})

export type LogModerationEventInput = z.infer<typeof LogModerationEventSchema>
