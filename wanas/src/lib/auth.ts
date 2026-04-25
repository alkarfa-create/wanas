// src/lib/auth.ts
// Non-authoritative UI helpers only. Session truth is always server cookie based.

export interface ProviderUIState {
  provider_id: string
  display_name: string
  phone_whatsapp: string
  email: string | null
  username: string | null
  avatar_url?: string | null
}

export type AuthProvider = ProviderUIState

export function getAuth(): AuthProvider | null {
  return null
}

export function setAuth(_provider: ProviderUIState) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-change'))
  }
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-change'))
  }
}

export function isLoggedIn(): boolean {
  return false
}
