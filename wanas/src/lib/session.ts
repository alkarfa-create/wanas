// src/lib/session.ts
// Server-side session management via HTTP-only signed cookies.
// Uses HMAC-SHA256 — no additional packages required.
// ⚠️  Node.js runtime only — do NOT import in middleware.ts (Edge runtime).

import { createHmac, timingSafeEqual } from 'crypto'
import { getSessionSecret } from './env'

export const PROVIDER_COOKIE = 'wanas_session'
export const ADMIN_COOKIE    = 'wanas_admin'

/** Cookie options for both token types. */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax'  as const,
  path:     '/',
  maxAge:   30 * 24 * 60 * 60, // 30 days in seconds
}

export const ADMIN_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 8 * 60 * 60, // 8 hours in seconds
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hmac(payload: string): Buffer {
  return createHmac('sha256', getSessionSecret()).update(payload).digest()
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

// ─── Provider session ──────────────────────────────────────────────────────────

/**
 * Signs a provider session token containing provider_id.
 * Format (base64url): provider_id|timestamp|hmac_hex
 */
export function signProviderToken(provider_id: string): string {
  const ts      = Date.now()
  const payload = `${provider_id}|${ts}`
  const sig     = hmac(payload).toString('hex')
  return Buffer.from(`${payload}|${sig}`).toString('base64url')
}

/**
 * Verifies a provider session token.
 * Returns provider_id on success, null on any failure.
 */
export function verifyProviderToken(token: string): string | null {
  try {
    const raw   = Buffer.from(token, 'base64url').toString('utf8')
    const sep   = raw.lastIndexOf('|')
    if (sep === -1) return null

    const sig     = raw.slice(sep + 1)
    const payload = raw.slice(0, sep)

    const expected = hmac(payload)
    const actual   = Buffer.from(sig, 'hex')
    if (!safeEqual(actual, expected)) return null

    // Parse provider_id and timestamp
    const firstSep = payload.indexOf('|')
    if (firstSep === -1) return null
    const provider_id = payload.slice(0, firstSep)
    const ts          = parseInt(payload.slice(firstSep + 1), 10)

    if (!provider_id || isNaN(ts)) return null

    // 30-day expiry
    if (Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return null

    return provider_id
  } catch {
    return null
  }
}

// ─── Admin session ────────────────────────────────────────────────────────────

/**
 * Signs an admin session token.
 * Format (base64url): admin|timestamp|hmac_hex
 */
export function signAdminToken(): string {
  const ts      = Date.now()
  const payload = `admin|${ts}`
  const sig     = hmac(payload).toString('hex')
  return Buffer.from(`${payload}|${sig}`).toString('base64url')
}

/**
 * Verifies an admin session token.
 * Returns true on success.
 */
export function verifyAdminToken(token: string): boolean {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8')
    const sep = raw.lastIndexOf('|')
    if (sep === -1) return false

    const sig     = raw.slice(sep + 1)
    const payload = raw.slice(0, sep)

    const expected = hmac(payload)
    const actual   = Buffer.from(sig, 'hex')
    if (!safeEqual(actual, expected)) return false

    // Must start with "admin|"
    if (!payload.startsWith('admin|')) return false

    const ts = parseInt(payload.slice('admin|'.length), 10)
    if (isNaN(ts)) return false

    // 8-hour admin session
    if (Date.now() - ts > 8 * 60 * 60 * 1000) return false

    return true
  } catch {
    return false
  }
}
