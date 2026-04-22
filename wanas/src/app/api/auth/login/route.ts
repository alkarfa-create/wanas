// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'
import { signProviderToken, PROVIDER_COOKIE, COOKIE_OPTIONS } from '@/lib/session'

function hashPassword(password: string): string {
  return createHash('sha256')
    .update(password + (process.env.AUTH_SALT ?? 'wanas_salt'))
    .digest('hex')
}

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json()

    if (!identifier || !password) {
      return NextResponse.json({ error: 'أدخل بيانات الدخول' }, { status: 400 })
    }

    const isEmail = identifier.includes('@')
    const isPhone = /^\d{9,15}$/.test(identifier)

    let query = supabaseAdmin
      .from('providers')
      .select('provider_id, display_name, phone_whatsapp, email, username, avatar_url, password_hash, status')

    if (isEmail) {
      query = query.eq('email', identifier.toLowerCase().trim())
    } else if (isPhone) {
      query = query.eq('phone_whatsapp', identifier)
    } else {
      query = query.eq('username', identifier.trim())
    }

    const { data: provider } = await query.single()

    if (!provider) {
      return NextResponse.json({ error: 'البيانات غير صحيحة' }, { status: 401 })
    }

    if (provider.password_hash !== hashPassword(password)) {
      return NextResponse.json({ error: 'البيانات غير صحيحة' }, { status: 401 })
    }

    // Block suspended/deactivated accounts
    if (provider.status === 'suspended' || provider.status === 'deactivated') {
      return NextResponse.json({ error: 'الحساب موقوف أو معطّل' }, { status: 403 })
    }

    const { password_hash, ...safeProvider } = provider

    // ── Set HTTP-only session cookie ──────────────────────────────────────────
    const token    = signProviderToken(safeProvider.provider_id)
    const response = NextResponse.json({ success: true, provider: safeProvider })
    response.cookies.set(PROVIDER_COOKIE, token, COOKIE_OPTIONS)

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 })
  }
}
