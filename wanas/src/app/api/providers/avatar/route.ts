// src/app/api/providers/avatar/route.ts

import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { supabaseAdmin } from '@/lib/supabase'
import { PROVIDER_COOKIE, verifyProviderToken } from '@/lib/session'

const BUCKET = 'chalets-images'
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

function getProviderIdFromCookie(cookieHeader: string): string | null {
    const providerCookie = cookieHeader
        .split(';')
        .map(part => part.trim())
        .find(part => part.startsWith(`${PROVIDER_COOKIE}=`))
        ?.split('=')[1]

    return providerCookie ? verifyProviderToken(providerCookie) : null
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const provider_id = formData.get('provider_id') as string
        const file = formData.get('avatar') as File | null
        const sessionProviderId = getProviderIdFromCookie(request.headers.get('cookie') ?? '')

        if (!provider_id || !sessionProviderId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        if (sessionProviderId !== provider_id) {
            return NextResponse.json({ error: 'ممنوع' }, { status: 403 })
        }

        if (!file) {
            return NextResponse.json({ error: 'لم يتم إرسال صورة' }, { status: 400 })
        }

        if (!ALLOWED.includes(file.type)) {
            return NextResponse.json({ error: 'نوع الصورة غير مدعوم' }, { status: 422 })
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'حجم الصورة كبير جدا (5MB كحد أقصى)' }, { status: 422 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const webpBuffer = await sharp(buffer)
            .resize(400, 400, { fit: 'cover', position: 'centre' })
            .webp({ quality: 85 })
            .toBuffer()

        const path = `avatars/${provider_id}/${Date.now()}.webp`
        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(path, webpBuffer, {
                contentType: 'image/webp',
                upsert: true,
                cacheControl: '31536000',
            })

        if (uploadError) {
            console.error('Avatar upload error:', uploadError)
            return NextResponse.json({ error: 'فشل رفع الصورة' }, { status: 500 })
        }

        const {
            data: { publicUrl },
        } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

        const { error: updateError } = await supabaseAdmin
            .from('providers')
            .update({ avatar_url: publicUrl })
            .eq('provider_id', provider_id)

        if (updateError) {
            console.error('Avatar update error:', updateError)
            return NextResponse.json({ error: 'فشل حفظ الصورة' }, { status: 500 })
        }

        return NextResponse.json({ success: true, avatar_url: publicUrl })
    } catch (err) {
        console.error('Avatar error:', err)
        return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 })
    }
}
