import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
  '/add-listing',
  '/profile',
  '/favorites',
]

const PROVIDER_SESSION_COOKIE = 'wanas_session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  if (!isProtected) return NextResponse.next()

  const sessionCookie = request.cookies.get(PROVIDER_SESSION_COOKIE)

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/add-listing/:path*',
    '/profile/:path*',
    '/favorites/:path*',
  ],
}
