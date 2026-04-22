// src/domain/listings/schemas.ts
import { z } from 'zod'
import { ListingStatus } from './types'

// ─── Status Schema ────────────────────────────────────────────────────────────
export const ListingStatusSchema = z.enum([
  ListingStatus.DRAFT,
  ListingStatus.PENDING_REVIEW,
  ListingStatus.APPROVED,
  ListingStatus.REJECTED,
  ListingStatus.PAUSED,
])

// ─── Create Listing ───────────────────────────────────────────────────────────
export const CreateListingSchema = z.object({
  title:         z.string().min(5, 'العنوان قصير جداً').max(120, 'العنوان طويل جداً'),
  description:   z.string().max(2000).optional(),
  category_id:   z.number().int().positive(),
  district_id:   z.number().int().positive().optional(),
  city_id:       z.number().int().positive().default(1),
  price_min:     z.number().int().nonnegative().optional(),
  price_max:     z.number().int().nonnegative().optional(),
  price_label:   z.string().max(50).optional(),
  capacity_min:  z.number().int().nonnegative().optional(),
  capacity_max:  z.number().int().nonnegative().optional(),
  features:      z.array(z.string()).default([]),
  policies:      z.record(z.string(), z.unknown()).default({}),
  contact_phone: z.string().optional(),
  contact_whatsapp: z.string().optional(),
  occasion_type: z.string().optional(),
}).refine(
  data => !data.price_max || !data.price_min || data.price_max >= data.price_min,
  { message: 'السعر الأقصى يجب أن يكون أكبر من الأدنى', path: ['price_max'] }
)

// ─── Update Status ────────────────────────────────────────────────────────────
export const UpdateStatusSchema = z.object({
  listing_id: z.string().uuid(),
  status:     ListingStatusSchema,
  reason:     z.string().max(500).optional(),
  note:       z.string().max(1000).optional(),
})
  .refine(
    data => data.status !== ListingStatus.REJECTED || !!data.reason,
    { message: 'سبب الرفض إلزامي', path: ['reason'] }
  )

// ─── Inferred Types ───────────────────────────────────────────────────────────
export type CreateListingInput = z.infer<typeof CreateListingSchema>
export type UpdateStatusInput  = z.infer<typeof UpdateStatusSchema>
