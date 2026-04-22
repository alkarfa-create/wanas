import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/session'

const BUCKET = 'banners'
const MAX_INPUT_SIZE = 10 * 1024 * 1024
const MAX_OUTPUT_SIZE = 2 * 1024 * 1024
const MIN_WIDTH = 800
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  return Boolean(token && verifyAdminToken(token))
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return jsonError(401, 'Unauthorized')
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return jsonError(400, 'Banner image file is required')
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError(422, 'Unsupported image type')
    }

    if (file.size > MAX_INPUT_SIZE) {
      return jsonError(422, 'Input file exceeds 10MB limit')
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const metadata = await sharp(inputBuffer, { animated: true }).metadata()

    if (!metadata.width || metadata.width < MIN_WIDTH) {
      return jsonError(422, 'Image width must be at least 800px')
    }

    const outputBuffer = await sharp(inputBuffer, { animated: true })
      .webp({ quality: 85 })
      .toBuffer()

    if (outputBuffer.length > MAX_OUTPUT_SIZE) {
      return jsonError(422, 'Converted image exceeds 2MB limit')
    }

    const path = `${randomUUID()}.webp`
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, outputBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: false,
      })

    if (uploadError) {
      console.error('[admin/banners/upload] storage upload failed', uploadError)
      return jsonError(500, 'Failed to store banner image')
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ success: true, image_url: publicUrl, path })
  } catch (error) {
    console.error('[admin/banners/upload] unexpected error', error)
    return jsonError(500, 'Banner upload failed')
  }
}
