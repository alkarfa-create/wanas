import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

import { supabaseAdmin } from '@/lib/supabase'
import { COOKIE_OPTIONS, PROVIDER_COOKIE, signProviderToken } from '@/lib/session'

function hashPassword(password: string): string {
    return createHash('sha256').update(password + (process.env.AUTH_SALT ?? 'wanas_salt')).digest('hex')
}

export async function POST(request: Request) {
    try {
        const {
            full_name,
            brand_name,
            category_id,
            bio,
            phone,
            email,
            username,
            password,
        } = await request.json()

        const display_name = typeof full_name === 'string' ? full_name.trim() : ''

        if (!display_name || !phone || !password) {
            return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'كلمة المرور قصيرة جداً' }, { status: 400 })
        }

        if (email) {
            const { data: existingEmail } = await supabaseAdmin
                .from('providers')
                .select('provider_id')
                .eq('email', email)
                .single()

            if (existingEmail) {
                return NextResponse.json({ error: 'البريد الإلكتروني مستخدم مسبقاً' }, { status: 409 })
            }
        }

        if (username) {
            const { data: existingUsername } = await supabaseAdmin
                .from('providers')
                .select('provider_id')
                .eq('username', username)
                .single()

            if (existingUsername) {
                return NextResponse.json({ error: 'اسم المستخدم مستخدم مسبقاً' }, { status: 409 })
            }
        }

        const { data: existingPhone } = await supabaseAdmin
            .from('providers')
            .select('provider_id')
            .eq('phone_whatsapp', phone)
            .single()

        if (existingPhone) {
            return NextResponse.json({ error: 'رقم الجوال مسجل مسبقاً' }, { status: 409 })
        }

        const { data: provider, error } = await supabaseAdmin
            .from('providers')
            .insert({
                display_name,
                phone_whatsapp: phone,
                email: email || null,
                username: username || null,
                password_hash: hashPassword(password),
                brand_name: brand_name?.trim() || null,
                bio: bio?.trim() || null,
                category_id: category_id ? parseInt(category_id, 10) : null,
                verification_status: 'unverified',
                trust_score: 50,
                status: 'active',
            })
            .select('provider_id, display_name, phone_whatsapp, email, username, brand_name')
            .single()

        if (error || !provider) {
            console.error('Provider register adapter error:', error)
            return NextResponse.json({ error: 'خطأ في إنشاء الحساب' }, { status: 500 })
        }

        const response = NextResponse.json({ success: true, provider })
        response.cookies.set(PROVIDER_COOKIE, signProviderToken(provider.provider_id), COOKIE_OPTIONS)

        return response
    } catch (err) {
        console.error('Provider register adapter error:', err)
        return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 })
    }
}
