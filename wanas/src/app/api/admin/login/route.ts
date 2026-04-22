// src/app/api/admin/login/route.ts
// Verifies ADMIN_SECRET and sets an HTTP-only admin session cookie.

import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken, ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS } from '@/lib/session'
import { timingSafeEqual } from 'crypto'

function safeCompare(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8')
    const bb = Buffer.from(b, 'utf8')
    if (ba.length !== bb.length) {
      // Still run timingSafeEqual to avoid timing leaks on length
      timingSafeEqual(Buffer.alloc(1), Buffer.alloc(1))
      return false
    }
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'كلمة المرور مطلوبة' }, { status: 400 })
    }

    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) {
      console.error('[admin/login] ADMIN_SECRET is not set in environment')
      return NextResponse.json({ error: 'الإدارة غير مُهيأة' }, { status: 503 })
    }

    if (!safeCompare(password, adminSecret)) {
      return NextResponse.json({ error: 'كلمة مرور غير صحيحة' }, { status: 401 })
    }

    const token    = signAdminToken()
    const response = NextResponse.json({ success: true })

    response.cookies.set(ADMIN_COOKIE, token, ADMIN_COOKIE_OPTIONS)

    return response
  } catch {
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 })
  }
}
