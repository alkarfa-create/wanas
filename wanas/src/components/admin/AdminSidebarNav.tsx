'use client'
// src/components/admin/AdminSidebarNav.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const BRAND = '#f63659'

const NAV = [
  { href: '/admin',          label: 'الرئيسية',    icon: '📊', exact: true },
  { href: '/admin/listings', label: 'الإعلانات',   icon: '📋' },
  { href: '/admin/banners',  label: 'البانرات',    icon: '🖼️' },
  { href: '/admin/providers',label: 'المزودون',    icon: '👥' },
]

export default function AdminSidebarNav() {
  const path = usePathname()
  const active = (href: string, exact?: boolean) =>
    exact ? path === href : path.startsWith(href)

  return (
    <aside className="fixed top-0 right-0 h-screen w-64 bg-white border-l border-gray-100 flex flex-col z-50">
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black" style={{ color: BRAND }}>ونَس</span>
          <span className="text-[10px] font-black text-white bg-gray-400 px-2 py-0.5 rounded-full">ADMIN</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(n => (
          <Link key={n.href} href={n.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              active(n.href, n.exact)
                ? 'text-white'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
            style={active(n.href, n.exact) ? { backgroundColor: BRAND } : {}}>
            <span>{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all">
          <span>🏠</span> العودة للموقع
        </Link>
      </div>
    </aside>
  )
}
