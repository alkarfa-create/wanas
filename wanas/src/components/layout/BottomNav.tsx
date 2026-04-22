'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, User } from 'lucide-react'

const NAV_ITEMS = [
    { label: 'الرئيسية', icon: Home, href: '/' },
    { label: 'أضف إعلان', icon: PlusCircle, href: '/add-listing' },
    { label: 'حسابي', icon: User, href: '/profile' },
]

export default function BottomNav() {
    const pathname = usePathname()

    // إخفاء في صفحات معينة لتجنب التعارض مع أزرار الإجراءات
    if (pathname.startsWith('/listing/') || pathname.startsWith('/add-listing')) return null

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-gray-100 pb-safe md:hidden">
            <div className="flex items-center justify-around h-16 px-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 gap-1 transition-all active:scale-90 ${isActive ? 'text-[#f63659]' : 'text-gray-400'
                                }`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-black">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
