import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { verifyProviderToken, PROVIDER_COOKIE } from '@/lib/session'
import { isProviderSessionAllowed } from '@/lib/provider-status'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_IMAGES = 8
const BUCKET = 'chalets-images'
const STORAGE_PUBLIC_PREFIX = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`
  : null

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

function getErrorMessage(caught: unknown): string {
  if (caught instanceof Error && caught.message.trim()) return caught.message
  if (typeof caught === 'string' && caught.trim()) return caught
  try {
    const serialized = JSON.stringify(caught)
    return serialized && serialized !== '{}' ? serialized : 'Unknown error occurred'
  } catch {
    return 'Unknown error occurred'
  }
}

function getStoragePathFromPublicUrl(url: string): string | null {
  const normalized = url.trim()
  if (!normalized) return null
  if (STORAGE_PUBLIC_PREFIX && normalized.startsWith(STORAGE_PUBLIC_PREFIX)) {
    return normalized.slice(STORAGE_PUBLIC_PREFIX.length)
  }
  if (normalized.startsWith('listings/')) {
    return normalized
  }
  return null
}

async function removeStoragePaths(paths: string[]) {
  const uniquePaths = [...new Set(paths.map((path) => path.trim()).filter(Boolean))]
  if (uniquePaths.length === 0) return

  const { error } = await supabaseAdmin.storage.from(BUCKET).remove(uniquePaths)
  if (error) {
    console.error('listing media cleanup storage remove error:', error)
  }
}

async function convertToWebP(file: File): Promise<Buffer | null> {
  try {
    const sharp = await import('sharp').catch(() => null)
    if (!sharp) return null

    const buf = Buffer.from(await file.arrayBuffer())
    const img = sharp.default(buf)
    const meta = await img.metadata()

    const pipeline =
      meta.width && meta.width > 2000
        ? img.resize(2000, undefined, { withoutEnlargement: true })
        : img

    return await pipeline.webp({ quality: 82 }).toBuffer()
  } catch {
    return null
  }
}

async function uploadImage(file: File, listingId: string, index: number) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: `صيغة الصورة ${index + 1} غير مقبولة` }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: `الصورة ${index + 1} تتجاوز 10MB` }
  }

  const converted = await convertToWebP(file)
  const buffer = converted ?? Buffer.from(await file.arrayBuffer())
  const contentType = converted ? 'image/webp' : file.type
  const ext = converted ? 'webp' : file.name.split('.').pop() || 'jpg'
  const path = `listings/${listingId}/${Date.now()}-${index}.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    })

  if (uploadError) {
    return { error: `فشل رفع الصورة ${index + 1}` }
  }

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return { url: pub.publicUrl, path }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Verify provider session cookie ────────────────────────────────────────
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(PROVIDER_COOKIE)?.value
    const provider_id_from_session = sessionToken ? verifyProviderToken(sessionToken) : null

    if (!provider_id_from_session) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      )
    }

    const { data: sessionProvider } = await supabaseAdmin
      .from('providers')
      .select('provider_id, status')
      .eq('provider_id', provider_id_from_session)
      .single()

    if (!sessionProvider || !isProviderSessionAllowed(sessionProvider.status)) {
      return NextResponse.json(
        { success: false, error: 'ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹' },
        { status: 401 }
      )
    }

    const { data: providerBeforeParams } = await supabaseAdmin
      .from('providers')
      .select('provider_id, status')
      .eq('provider_id', provider_id_from_session)
      .single()

    if (!providerBeforeParams || !isProviderSessionAllowed(providerBeforeParams.status)) {
      return NextResponse.json(
        { success: false, error: 'ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹' },
        { status: 401 }
      )
    }

    const { id } = await params
    const listingId = id?.trim()

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'معرف الإعلان مفقود' },
        { status: 400 }
      )
    }

    const formData = await request.formData()

    // provider_id comes from verified session cookie, not FormData
    const { data: providerForWrite } = await supabaseAdmin
      .from('providers')
      .select('provider_id, status')
      .eq('provider_id', provider_id_from_session)
      .single()

    if (!providerForWrite || !isProviderSessionAllowed(providerForWrite.status)) {
      return NextResponse.json(
        { success: false, error: 'ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹' },
        { status: 401 }
      )
    }

    const { data: deleteProvider } = await supabaseAdmin
      .from('providers')
      .select('provider_id, status')
      .eq('provider_id', provider_id_from_session)
      .single()

    if (!deleteProvider || !isProviderSessionAllowed(deleteProvider.status)) {
      return NextResponse.json(
        { success: false, error: 'ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹' },
        { status: 401 }
      )
    }

    const provider_id_for_write = provider_id_from_session
    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const category_id = (formData.get('category_id') as string)?.trim()
    const district_id = (formData.get('district_id') as string)?.trim() || '1'
    const district_name = (formData.get('district_name') as string)?.trim() || null
    const price_min = (formData.get('price_min') as string)?.trim()
    const price_max = (formData.get('price_max') as string)?.trim()
    const price_label = (formData.get('price_label') as string)?.trim() || null
    const capacity_min = (formData.get('capacity_min') as string)?.trim()
    const capacity_max = (formData.get('capacity_max') as string)?.trim()
    const occasion_type = (formData.get('occasion_type') as string)?.trim() || null
    const contact_whatsapp =
      (formData.get('contact_whatsapp') as string)?.trim() || null
    const contact_phone =
      (formData.get('contact_phone') as string)?.trim() || null
    const latitude = (formData.get('latitude') as string)?.trim()
    const longitude = (formData.get('longitude') as string)?.trim()
    const features_str = (formData.get('features') as string) || '[]'
    const policies_str = (formData.get('policies') as string) || '{}'
    const metadata_str = (formData.get('metadata') as string) || '{}'
    const existing_images_str = (formData.get('existing_images') as string) || '[]'
    const cover_index =
      parseInt((formData.get('cover_index') as string) || '0', 10) || 0
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

    const images = formData
      .getAll('images')
      .filter((item): item is File => item instanceof File && item.size > 0)

    if (!title || !description || !category_id || !price_min || !contact_whatsapp) {
      return NextResponse.json(
        { success: false, error: 'بيانات مطلوبة ناقصة' },
        { status: 400 }
      )
    }

    const categoryIdInt = parseInt(category_id, 10)
    const districtIdInt = parseInt(district_id, 10)

    if (Number.isNaN(categoryIdInt) || categoryIdInt < 1) {
      return NextResponse.json(
        { success: false, error: 'فئة غير صحيحة' },
        { status: 400 }
      )
    }

    if (Number.isNaN(districtIdInt) || districtIdInt < 1) {
      return NextResponse.json(
        { success: false, error: 'حي غير صحيح' },
        { status: 400 }
      )
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { success: false, error: `الحد الأقصى ${MAX_IMAGES} صور` },
        { status: 400 }
      )
    }

    let features: string[] = []
    let policies: Record<string, unknown> = {}
    let metadata: Record<string, unknown> = {}
    let existingImages: string[] = []

    try {
      features = features_str ? JSON.parse(features_str) : []
      if (!Array.isArray(features)) features = []
    } catch {
      features = []
    }

    try {
      policies = policies_str ? JSON.parse(policies_str) : {}
      if (!policies || Array.isArray(policies)) policies = {}
    } catch {
      policies = {}
    }

    try {
      metadata = metadata_str ? JSON.parse(metadata_str) : {}
      if (!metadata || Array.isArray(metadata)) metadata = {}
    } catch {
      metadata = {}
    }

    try {
      existingImages = existing_images_str ? JSON.parse(existing_images_str) : []
      if (!Array.isArray(existingImages)) existingImages = []
      existingImages = existingImages
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item, index, arr) => arr.indexOf(item) === index)
    } catch {
      existingImages = []
    }

    const { data: deleteProviderGuard } = await supabaseAdmin
      .from('providers')
      .select('provider_id, status')
      .eq('provider_id', provider_id_from_session)
      .single()

    if (!deleteProviderGuard || !isProviderSessionAllowed(deleteProviderGuard.status)) {
      return NextResponse.json(
        { success: false, error: 'ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹' },
        { status: 401 }
      )
    }

    const { data: existingListing, error: existingError } = await supabaseAdmin
      .from('listings')
      .select('listing_id, provider_id, cover_url')
      .eq('listing_id', listingId)
      .eq('provider_id', provider_id_for_write)
      .maybeSingle()

    if (existingError) {
      console.error('FETCH EXISTING LISTING ERROR:', existingError)
      return NextResponse.json(
        { success: false, error: 'تعذر قراءة الإعلان الحالي' },
        { status: 500 }
      )
    }

    if (!existingListing) {
      return NextResponse.json(
        { success: false, error: 'الإعلان غير موجود أو لا تملك صلاحية تعديله' },
        { status: 404 }
      )
    }

    const { data: currentMediaRows } = await supabaseAdmin
      .from('listing_media')
      .select('url')
      .eq('listing_id', listingId)

    const currentMediaUrls = (currentMediaRows ?? [])
      .map((row) => row.url)
      .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)

    const finalImagesCount = existingImages.length + images.length
    if (finalImagesCount > MAX_IMAGES) {
      return NextResponse.json(
        { success: false, error: `الحد الأقصى ${MAX_IMAGES} صور` },
        { status: 400 }
      )
    }

    if (finalImagesCount > 0 && finalImagesCount < 3) {
      return NextResponse.json(
        { success: false, error: 'أضف 3 صور على الأقل' },
        { status: 400 }
      )
    }

    const updatePayload = {
      category_id: categoryIdInt,
      district_id: districtIdInt,
      title,
      description,
      price_min: parseFloat(price_min),
      price_max: price_max ? parseFloat(price_max) : parseFloat(price_min),
      price_label: price_label || `يبدأ من ${price_min} ر.س`,
      capacity_min: capacity_min ? parseInt(capacity_min, 10) : null,
      capacity_max: capacity_max ? parseInt(capacity_max, 10) : null,
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
      district_name,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      contact_whatsapp,
      contact_phone,
      occasion_type,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update(updatePayload)
      .eq('listing_id', listingId)
      .eq('provider_id', provider_id_for_write)

    if (updateError) {
      console.error('UPDATE LISTING ERROR:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'حدث خطأ أثناء تحديث الإعلان',
        },
        { status: 500 }
      )
    }

    if (images.length > 0 || existingImages.length > 0) {
      const uploadResults = await Promise.all(
        images.map((img, i) => uploadImage(img, listingId, i))
      )

      const failures = uploadResults.filter((r) => 'error' in r)
      if (failures.length > 0) {
        const uploadedPaths = uploadResults
          .filter((result): result is { url: string; path: string } => 'path' in result)
          .map((result) => result.path)
        await removeStoragePaths(uploadedPaths)
        return NextResponse.json(
          { success: false, error: 'error' in failures[0] ? failures[0].error : 'فشل رفع الصور' },
          { status: 422 }
        )
      }

      const validUploads = uploadResults as { url: string; path: string }[]
      const finalImages = [...existingImages, ...validUploads.map((item) => item.url)]
      const coverUrl =
        finalImages[cover_index] ||
        finalImages[0] ||
        existingListing.cover_url ||
        null

      const { error: deleteMediaError } = await supabaseAdmin
        .from('listing_media')
        .delete()
        .eq('listing_id', listingId)

      if (deleteMediaError) {
        console.error('DELETE OLD MEDIA ERROR:', deleteMediaError)
        await removeStoragePaths(validUploads.map((upload) => upload.path))
        return NextResponse.json(
          { success: false, error: 'تعذر تحديث صور الإعلان' },
          { status: 500 }
        )
      }

      const mediaRows = finalImages.map((url, i) => ({
        listing_id: listingId,
        url,
        media_type: 'image',
        sort_order: i,
      }))

      const { error: mediaInsertError } = await supabaseAdmin
        .from('listing_media')
        .insert(mediaRows)

      if (mediaInsertError) {
        console.error('INSERT MEDIA ERROR:', mediaInsertError)
        await removeStoragePaths(validUploads.map((upload) => upload.path))
        return NextResponse.json(
          { success: false, error: 'تم تحديث النصوص لكن فشل حفظ الصور الجديدة' },
          { status: 500 }
        )
      }

      const { error: coverUpdateError } = await supabaseAdmin
        .from('listings')
        .update({
          cover_url: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('listing_id', listingId)

      if (coverUpdateError) {
        console.error('UPDATE COVER ERROR:', coverUpdateError)
        await removeStoragePaths(validUploads.map((upload) => upload.path))
        return NextResponse.json(
          { success: false, error: 'تم تحديث الإعلان لكن فشل تحديث صورة الغلاف' },
          { status: 500 }
        )
      }

      const removedImages = currentMediaUrls.filter((url) => !finalImages.includes(url))
      const removedStoragePaths = removedImages
        .map((url) => getStoragePathFromPublicUrl(url))
        .filter((path): path is string => Boolean(path))
      await removeStoragePaths(removedStoragePaths)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'تم تحديث الإعلان بنجاح',
        listing_id: listingId,
      },
      { status: 200 }
    )
  } catch (caught: unknown) {
    const error = caught instanceof Error ? caught : new Error('Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ± Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ')
    error.message = getErrorMessage(caught)
    console.error('EDIT LISTING ERROR:', caught)
    return NextResponse.json(
      { success: false, error: 'خطأ في السيرفر الداخلي' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(PROVIDER_COOKIE)?.value
    const provider_id_from_session = sessionToken ? verifyProviderToken(sessionToken) : null

    if (!provider_id_from_session) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      )
    }

    const { id } = await params
    const listingId = id?.trim()

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'معرف الإعلان مفقود' },
        { status: 400 }
      )
    }

    const { data: deleteProvider } = await supabaseAdmin
      .from('providers')
      .select('provider_id, status')
      .eq('provider_id', provider_id_from_session)
      .single()

    if (!deleteProvider || !isProviderSessionAllowed(deleteProvider.status)) {
      return NextResponse.json(
        { success: false, error: 'ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹' },
        { status: 401 }
      )
    }

    const provider_id = provider_id_from_session

    const { data: existingListing, error: existingError } = await supabaseAdmin
      .from('listings')
      .select('listing_id, provider_id, cover_url')
      .eq('listing_id', listingId)
      .eq('provider_id', provider_id)
      .maybeSingle()

    if (existingError) {
      console.error('FETCH LISTING FOR DELETE ERROR:', existingError)
      return NextResponse.json(
        { success: false, error: 'تعذر قراءة الإعلان الحالي' },
        { status: 500 }
      )
    }

    if (!existingListing) {
      return NextResponse.json(
        { success: false, error: 'الإعلان غير موجود أو لا تملك صلاحية حذفه' },
        { status: 404 }
      )
    }

    const { data: currentMediaRows } = await supabaseAdmin
      .from('listing_media')
      .select('url')
      .eq('listing_id', listingId)

    const { error: deleteError } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('listing_id', listingId)
      .eq('provider_id', provider_id)

    if (deleteError) {
      console.error('DELETE LISTING ERROR:', deleteError)
      return NextResponse.json(
        { success: false, error: 'تعذر حذف الإعلان' },
        { status: 500 }
      )
    }

    const storagePaths = [
      existingListing.cover_url,
      ...(currentMediaRows ?? []).map((row) => row.url),
    ]
      .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
      .map((url) => getStoragePathFromPublicUrl(url))
      .filter((path): path is string => Boolean(path))
    await removeStoragePaths(storagePaths)

    return NextResponse.json(
      {
        success: true,
        message: 'تم حذف الإعلان بنجاح',
        listing_id: listingId,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('DELETE LISTING ERROR:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'خطأ في السيرفر الداخلي',
      },
      { status: 500 }
    )
  }
}
