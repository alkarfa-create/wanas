// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { PROVIDER_COOKIE } from '@/lib/session'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(PROVIDER_COOKIE, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   0,
  })
  return response
}
