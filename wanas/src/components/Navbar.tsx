'use client'
// src/components/Navbar.tsx

import { Search, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { supabaseBrowser } from '@/lib/supabase-browser'

// تحميل AuthButton بدون SSR — يحل مشكلة hydration نهائياً
const AuthButton = dynamic(() => import('@/components/ui/AuthButton'), { ssr: false })

export default function Navbar() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(searchParams.get('search') || '')
    
    // حالات الإشعارات
    const [unreadCount, setUnreadCount] = useState(0)
    const [providerId, setProviderId] = useState<string | null>(null)

    useEffect(() => {
        setQuery(searchParams.get('search') || '')
    }, [searchParams])

    // جلب بيانات المورد وعدد الإشعارات غير المقروءة
    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { session } } = await supabaseBrowser.auth.getSession()
            if (session?.user) {
                // التحقق مما إذا كان المستخدم مورداً
                const { data: provider } = await supabaseBrowser
                    .from('providers')
                    .select('provider_id')
                    .eq('provider_id', session.user.id)
                    .single()

                if (provider) {
                    setProviderId(provider.provider_id)
                    // جلب عدد الإشعارات غير المقروءة
                    const { count } = await supabaseBrowser
                        .from('notifications')
                        .select('*', { count: 'exact', head: true })
                        .eq('provider_id', provider.provider_id)
                        .eq('is_read', false)

                    if (count !== null) setUnreadCount(count)
                }
            }
        }

        fetchNotifications()
    }, [])

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault()
        const params = new URLSearchParams(searchParams.toString())
        if (query.trim()) {
            params.set('search', query.trim())
        } else {
            params.delete('search')
        }
        router.push(`/?${params.toString()}`)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch()
    }

    return (
        <header className="sticky top-0 z-[100] bg-white border-b border-gray-100 shadow-sm w-full" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between py-3 md:py-4">

                    {/* اللوجو */}
                    <Link href="/" className="shrink-0">
                        <div className="relative w-12 h-12 md:w-14 md:h-14 overflow-hidden rounded-xl">
                            <Image src="/img/logo.png" alt="ونس" fill className="object-contain" priority />
                        </div>
                    </Link>

                    {/* البحث - كمبيوتر */}
                    <div className="hidden md:block flex-1 min-w-0 max-w-2xl mx-8">
                        <div className="relative group">
                            <input type="text" value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="ابحث عن شاليه، ضيافة، أو ألعاب..."
                                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-rose-500 focus:shadow-md outline-none transition-all text-sm font-medium"
                            />
                            <div onClick={() => handleSearch()}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-rose-500 text-white p-2 rounded-full cursor-pointer hover:bg-rose-600 transition-colors">
                                <Search size={16} />
                            </div>
                        </div>
                    </div>

                    {/* الأزرار العلوية */}
                    <div className="shrink-0 flex items-center gap-2 md:gap-3">
                        
                        {/* 🔔 جرس الإشعارات الاحترافي (يظهر للموردين فقط) */}
                        {providerId && (
                            <Link href={`/profile/${providerId}`} 
                                className="relative p-2.5 text-gray-500 hover:text-[#f63659] hover:bg-rose-50 rounded-full transition-all active:scale-95"
                                title="الإشعارات"
                            >
                                <Bell size={22} strokeWidth={2.2} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-in zoom-in duration-300">
                                        {unreadCount > 9 ? '+9' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        <Link href="/add-listing"
                            className="hidden sm:flex items-center gap-1.5 bg-[#f63659] hover:bg-rose-600 text-white text-sm font-black px-4 py-2.5 rounded-full transition-all active:scale-95 shadow-sm shadow-rose-200 whitespace-nowrap">
                            <span className="text-base leading-none">+</span>
                            <span>أضف إعلانك</span>
                        </Link>

                        {/* AuthButton بدون SSR */}
                        <div className="mr-1">
                            <AuthButton />
                        </div>
                    </div>
                </div>

                {/* البحث - جوال */}
                <div className="block md:hidden pb-4">
                    <div className="relative flex items-center w-full bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2 focus-within:border-rose-500 transition-all">
                        <Search size={18} className="text-gray-400 ml-3 shrink-0" />
                        <input type="text" value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="ابحث عن وجهتك..."
                            className="w-full bg-transparent outline-none text-sm font-medium"
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}