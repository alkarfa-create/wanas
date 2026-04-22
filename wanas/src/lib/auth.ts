// src/lib/auth.ts
// دوال المصادقة البسيطة

export const AUTH_KEY = 'wanas_provider'

export interface ProviderUIState {
    provider_id: string
    display_name: string
    phone_whatsapp: string
    email: string | null
    username: string | null
    avatar_url?: string | null
}

export type AuthProvider = ProviderUIState

export function getUIState(): ProviderUIState | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(AUTH_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

// Security boundary is cookie session; localStorage is UI-only
export function getAuth(): AuthProvider | null {
    return getUIState()
}

export function setAuth(provider: ProviderUIState) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(provider))
    window.dispatchEvent(new Event('auth-change'))
}

export function clearAuth() {
    localStorage.removeItem(AUTH_KEY)
    window.dispatchEvent(new Event('auth-change'))
}

export function isLoggedIn(): boolean {
    return getUIState() !== null
}
