'use client'
// src/components/ui/AuthButton.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { getAuth, clearAuth } from '@/lib/auth'
import type { AuthProvider } from '@/lib/auth'

export default function AuthButton() {
    const router = useRouter()
    const [auth, setAuth] = useState<AuthProvider | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        setAuth(getAuth())
        setReady(true)

        function onStorage() {
            setAuth(getAuth())
        }

        window.addEventListener('storage', onStorage)
        window.addEventListener('auth-change', onStorage)

        return () => {
            window.removeEventListener('storage', onStorage)
            window.removeEventListener('auth-change', onStorage)
        }
    }, [])

    function handleLogout() {
        clearAuth()
        setAuth(null)
        setMenuOpen(false)
        router.push('/')
        router.refresh()
    }

    if (!ready) {
        return (
            <div className="flex items-center gap-2 border border-gray-200 p-1 md:py-1.5 md:px-2 rounded-full bg-white">
                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                <Menu className="w-5 h-5 text-gray-300 ml-1" />
            </div>
        )
    }

    return (
        <div className="relative">
            <button
                onClick={() => auth ? setMenuOpen(o => !o) : router.push('/login')}
                className="flex items-center gap-2 border border-gray-200 p-1 md:py-1.5 md:px-2 rounded-full hover:shadow-md transition-all bg-white group"
            >
                {auth?.avatar_url ? (
                    <img src={auth.avatar_url} alt={auth.display_name}
                        className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : auth ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, #f63659, #ff8a65)' }}>
                        {auth.display_name?.charAt(0)}
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-gray-500 stroke-2 fill-none">
                            <path strokeLinecap="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                        </svg>
                    </div>
                )}
                <Menu className="w-5 h-5 text-gray-600 ml-1 group-hover:text-black" />
            </button>

            {menuOpen && auth && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-gray-50">
                            <p className="text-sm font-black text-gray-900 truncate">{auth.display_name}</p>
                            <p className="text-xs text-gray-400 font-medium truncate">{auth.email ?? auth.phone_whatsapp}</p>
                        </div>
                        <div className="py-1">
                            <Link href={`/profile/${auth.provider_id}`}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-gray-400 stroke-2 fill-none">
                                    <path strokeLinecap="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                                </svg>
                                ملفي الشخصي
                            </Link>
                            <Link href="/add-listing"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-gray-400 stroke-2 fill-none">
                                    <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                                </svg>
                                إضافة إعلان
                            </Link>
                        </div>
                        <div className="border-t border-gray-50 py-1">
                            <button onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors w-full text-right">
                                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-rose-400 stroke-2 fill-none">
                                    <path strokeLinecap="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                                </svg>
                                تسجيل الخروج
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
