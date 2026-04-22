// src/app/api/listings/add/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { verifyProviderToken, PROVIDER_COOKIE } from '@/lib/session'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_IMAGES = 8
const MIN_IMAGES = 3
const BUCKET = 'chalets-images'
const SAUDI_WHATSAPP_REGEX = /^9665\d{8}$/

function parseBooleanField(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value === 'true'
}

function parseNullableNumber(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function getPolicyBoolean(policies: Record<string, unknown>, key: string) {
  return typeof policies[key] === 'boolean' ? policies[key] : false
}

function getPolicyNumber(policies: Record<string, unknown>, key: string) {
  return typeof policies[key] === 'number'
    ? policies[key]
    : typeof policies[key] === 'string' && policies[key].trim()
      ? Number(policies[key])
      : null
}

function getPolicyString(policies: Record<string, unknown>, key: string) {
  return typeof policies[key] === 'string' && policies[key].trim() ? policies[key].trim() : null
}

async function convertToWebP(file: File): Promise<Buffer | null> {
  try {
    const sharp = await import('sharp').catch(() => null)
    if (!sharp) return null
    const buf = Buffer.from(await file.arrayBuffer())
    const img = sharp.default(buf)
    const meta = await img.metadata()
    const pipeline = meta.width && meta.width > 2000
      ? img.resize(2000, undefined, { withoutEnlargement: true })
      : img
    return await pipeline.webp({ quality: 82 }).toBuffer()
  } catch { return null }
}

async function uploadImage(file: File, listing_id: string, index: number) {
  if (!ALLOWED_TYPES.includes(file.type)) return { error: `صيغة الصورة ${index + 1} غير مقبولة` }
  if (file.size > MAX_FILE_SIZE) return { error: `الصورة ${index + 1} تتجاوز 10MB` }

  const converted = await convertToWebP(file)
  const buffer = converted ?? Buffer.from(await file.arrayBuffer())
  const contentType = converted ? 'image/webp' : file.type
  const ext = converted ? 'webp' : (file.name.split('.').pop() || 'jpg')
  const path = `listings/${listing_id}/${Date.now()}-${index}.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, cacheControl: '31536000', upsert: false })

  if (uploadError) return { error: `فشل رفع الصورة ${index + 1}: ${uploadError.message}` }

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return { url: pub.publicUrl }
}

export async function POST(request: NextRequest) {
  try {
    // ── Verify provider session cookie ────────────────────────
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(PROVIDER_COOKIE)?.value
    const provider_id_from_session = sessionToken ? verifyProviderToken(sessionToken) : null

    if (!provider_id_from_session) {
      return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const formData = await request.formData()

    // ── استخراج البيانات (provider_id comes from verified session, not FormData) ──
    const provider_id     = provider_id_from_session
    const title           = formData.get('title') as string
    const description     = formData.get('description') as string
    const category_id     = formData.get('category_id') as string
    const district_id     = formData.get('district_id') as string
    const district_name   = formData.get('district_name') as string || null
    const price_min       = formData.get('price_min') as string
    const price_max       = formData.get('price_max') as string
    const price_label     = formData.get('price_label') as string || null
    const capacity_min    = formData.get('capacity_min') as string
    const capacity_max    = formData.get('capacity_max') as string
    const occasion_type   = formData.get('occasion_type') as string || null
    const contact_whatsapp = formData.get('contact_whatsapp') as string
    const contact_phone   = formData.get('contact_phone') as string || null
    const latitude        = formData.get('latitude') as string
    const longitude       = formData.get('longitude') as string
    const features_str    = formData.get('features') as string
    const policies_str    = formData.get('policies') as string
    const metadata_str    = formData.get('metadata') as string
    const cover_index     = parseInt(formData.get('cover_index') as string) || 0
    const booking_deposit_required = parseBooleanField(formData.get('booking_deposit_required'))
    const booking_deposit_amount = parseNullableNumber(formData.get('booking_deposit_amount'))
    const booking_deposit_policy =
      (formData.get('booking_deposit_policy') as string)?.trim() || null
    const security_deposit_required = parseBooleanField(formData.get('security_deposit_required'))
    const security_deposit_amount = parseNullableNumber(formData.get('security_deposit_amount'))
    const security_deposit_policy =
      (formData.get('security_deposit_policy') as string)?.trim() || null
    const cancellation_policy =
      (formData.get('cancellation_policy') as string)?.trim() || null
    const images          = formData.getAll('images') as File[]

    // ── Validation ────────────────────────────────────────────
    if (!title?.trim() || !description?.trim() || !category_id || !price_min || !contact_whatsapp) {
      return NextResponse.json({ success: false, error: 'بيانات مطلوبة ناقصة' }, { status: 400 })
    }

    if (!SAUDI_WHATSAPP_REGEX.test(contact_whatsapp.trim())) {
      return NextResponse.json({ success: false, error: 'رقم واتساب غير صحيح' }, { status: 400 })
    }

    // category_id و district_id أرقام صحيحة (integer) وليست UUID
    const categoryIdInt = parseInt(category_id)
    const districtIdInt = parseInt(district_id || '1')

    if (isNaN(categoryIdInt) || categoryIdInt < 1) {
      return NextResponse.json({ success: false, error: 'فئة غير صحيحة' }, { status: 400 })
    }

    if (images.length < MIN_IMAGES) {
      return NextResponse.json({ success: false, error: `أضف ${MIN_IMAGES} صور على الأقل` }, { status: 400 })
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json({ success: false, error: `الحد الأقصى ${MAX_IMAGES} صور` }, { status: 400 })
    }

    // ── التحقق من المزود ──────────────────────────────────────
    const { data: provider } = await supabaseAdmin
      .from('providers')
      .select('provider_id')
      .eq('provider_id', provider_id)
      .single()

    if (!provider) {
      return NextResponse.json({ success: false, error: 'مزود غير موجود' }, { status: 401 })
    }

    // ── Parse JSON fields ─────────────────────────────────────
    let features: string[] = []
    let policies: Record<string, unknown> = {}
    let metadata: Record<string, unknown> = {}

    try { features = features_str ? JSON.parse(features_str) : [] } catch {}
    try { policies = policies_str ? JSON.parse(policies_str) : {} } catch {}
    try { metadata = metadata_str ? JSON.parse(metadata_str) : {} } catch {}

    // ── إنشاء الإعلان ─────────────────────────────────────────
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .insert({
        provider_id,
        category_id: categoryIdInt,
        district_id: districtIdInt,
        title: title.trim(),
        slug: title.trim().replace(/\s+/g, '-').replace(/[^\u0621-\u064Aa-zA-Z0-9-]/g, '') + '-' + Date.now(),
        description: description.trim(),
        price_min: parseFloat(price_min),
        price_max: price_max ? parseFloat(price_max) : parseFloat(price_min),
        price_label: price_label || `يبدأ من ${price_min} ر.س`,
        capacity_min: capacity_min ? parseInt(capacity_min) : null,
        capacity_max: capacity_max ? parseInt(capacity_max) : null,
        features,
        policies,
        metadata,
        booking_deposit_required:
          booking_deposit_required || getPolicyBoolean(policies, 'depositRequired'),
        booking_deposit_amount:
          booking_deposit_required
            ? booking_deposit_amount ?? getPolicyNumber(policies, 'depositAmount') ?? 0
            : null,
        booking_deposit_policy:
          booking_deposit_required
            ? booking_deposit_policy || getPolicyString(policies, 'depositPolicyNote')
            : null,
        security_deposit_required,
        security_deposit_amount: security_deposit_required ? security_deposit_amount : null,
        security_deposit_policy: security_deposit_required ? security_deposit_policy : null,
        cancellation_policy:
          cancellation_policy || getPolicyString(policies, 'cancellationPolicy'),
        status: 'pending_review', // listings enter moderation immediately after submission
        district_name,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        contact_whatsapp,
        contact_phone,
        occasion_type,
        rank_score: 50,
        views_count: 0,
        clicks_count: 0,
        published_at: null,
      })
      .select('listing_id')
      .single()

    if (listingError || !listing) {
      console.error('LISTING INSERT ERROR:', JSON.stringify(listingError))
      return NextResponse.json(
        { success: false, error: listingError?.message || 'خطأ في حفظ الإعلان' },
        { status: 500 }
      )
    }

    const listing_id = listing.listing_id

    // ── رفع الصور ─────────────────────────────────────────────
    const uploadResults = await Promise.all(
      images.map((img, i) => uploadImage(img, listing_id, i))
    )

    const failures = uploadResults.filter(r => 'error' in r)
    if (failures.length > 0) {
      await supabaseAdmin.from('listings').delete().eq('listing_id', listing_id)
      return NextResponse.json(
        { success: false, error: 'error' in failures[0] ? failures[0].error : 'فشل رفع الصور' },
        { status: 422 }
      )
    }

    const validUploads = uploadResults as { url: string }[]
    const coverUrl = validUploads[cover_index]?.url || validUploads[0]?.url

    // ── تحديث cover_url ───────────────────────────────────────
    await supabaseAdmin
      .from('listings')
      .update({ cover_url: coverUrl })
      .eq('listing_id', listing_id)

    // ── حفظ الصور في listing_media ────────────────────────────
    const mediaRows = validUploads.map((r, i) => ({
      listing_id,
      url: r.url,
      media_type: 'image',
      sort_order: i,
    }))

    const { error: mediaError } = await supabaseAdmin.from('listing_media').insert(mediaRows)
    if (mediaError) console.error('Media insert error:', mediaError.message)

    const ref = `WN-${Math.floor(1000 + Math.random() * 9000)}`

    return NextResponse.json({ success: true, ref, listing_id }, { status: 201 })

  } catch (error: unknown) {
    console.error('Add listing error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'خطأ في السيرفر' }, { status: 500 })
  }
}
