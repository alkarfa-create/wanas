// src/app/admin/(dashboard)/layout.tsx
// Protected layout — all admin pages except /admin/login live here.
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminSidebarNav from '@/components/admin/AdminSidebarNav'
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/session'

export const metadata: Metadata = { title: 'ونَس — لوحة الإدارة' }

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const adminToken  = cookieStore.get(ADMIN_COOKIE)?.value

  if (!adminToken || !verifyAdminToken(adminToken)) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <AdminSidebarNav />
      <div className="flex-1 flex flex-col mr-64">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white font-black text-sm">م</div>
            <span className="text-xs font-bold text-gray-400">مدير المنصة</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-gray-900">ونَس — لوحة الإدارة</span>
            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                خروج
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
