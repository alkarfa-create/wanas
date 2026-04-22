import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/session'

const BUCKET = 'banners'

type BannerMutationBody = {
  id?: string
  title?: string
  image_url?: string
  link?: string | null
  display_order?: number
  is_active?: boolean
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  return Boolean(token && verifyAdminToken(token))
}

function getStoragePath(imageUrl: string) {
  const publicPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`
  return imageUrl.startsWith(publicPrefix) ? imageUrl.slice(publicPrefix.length) : null
}

export async function GET() {
  if (!(await requireAdmin())) {
    return jsonError(401, 'Unauthorized')
  }

  const { data, error } = await supabaseAdmin
    .from('banners')
    .select('id, title, image_url, link, display_order, is_active, created_at, updated_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/banners] list failed', error)
    return jsonError(500, 'Failed to load banners')
  }

  return NextResponse.json({ banners: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return jsonError(401, 'Unauthorized')
  }

  let body: BannerMutationBody
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'Invalid JSON body')
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : ''
  const link = typeof body.link === 'string' ? body.link.trim() || null : null
  const displayOrder = Number.isFinite(body.display_order) ? Number(body.display_order) : 0
  const isActive = body.is_active ?? true

  if (!title) return jsonError(400, 'title is required')
  if (!imageUrl || !imageUrl.endsWith('.webp')) return jsonError(400, 'image_url must reference a webp banner')

  const { data, error } = await supabaseAdmin
    .from('banners')
    .insert({
      title,
      image_url: imageUrl,
      link,
      display_order: displayOrder,
      is_active: Boolean(isActive),
    })
    .select('id, title, image_url, link, display_order, is_active, created_at, updated_at')
    .single()

  if (error || !data) {
    console.error('[admin/banners] create failed', error)
    return jsonError(500, 'Failed to create banner')
  }

  return NextResponse.json({ success: true, banner: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) {
    return jsonError(401, 'Unauthorized')
  }

  let body: BannerMutationBody
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'Invalid JSON body')
  }

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const link = typeof body.link === 'string' ? body.link.trim() || null : null
  const displayOrder = Number.isFinite(body.display_order) ? Number(body.display_order) : 0
  const isActive = typeof body.is_active === 'boolean' ? body.is_active : true

  if (!id) return jsonError(400, 'id is required')
  if (!title) return jsonError(400, 'title is required')

  const { data, error } = await supabaseAdmin
    .from('banners')
    .update({
      title,
      link,
      display_order: displayOrder,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, title, image_url, link, display_order, is_active, created_at, updated_at')
    .single()

  if (error || !data) {
    console.error('[admin/banners] update failed', error)
    return jsonError(500, 'Failed to update banner')
  }

  return NextResponse.json({ success: true, banner: data })
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) {
    return jsonError(401, 'Unauthorized')
  }

  let body: BannerMutationBody
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'Invalid JSON body')
  }

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) return jsonError(400, 'id is required')

  const { data: banner, error: fetchError } = await supabaseAdmin
    .from('banners')
    .select('id, image_url')
    .eq('id', id)
    .single()

  if (fetchError || !banner) {
    console.error('[admin/banners] delete fetch failed', fetchError)
    return jsonError(404, 'Banner not found')
  }

  const storagePath = getStoragePath(banner.image_url)
  if (storagePath) {
    const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove([storagePath])
    if (storageError) {
      console.error('[admin/banners] storage delete failed', storageError)
      return jsonError(500, 'Failed to delete banner image')
    }
  }

  const { error: deleteError } = await supabaseAdmin.from('banners').delete().eq('id', id)
  if (deleteError) {
    console.error('[admin/banners] delete failed', deleteError)
    return jsonError(500, 'Failed to delete banner')
  }

  return NextResponse.json({ success: true, id })
}
