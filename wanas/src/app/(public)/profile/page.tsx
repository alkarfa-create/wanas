import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { supabaseAdmin } from '@/lib/supabase'
import { PROVIDER_COOKIE, verifyProviderToken } from '@/lib/session'

export default async function ProfilePage() {
    const cookieStore = await cookies()
    const token = cookieStore.get(PROVIDER_COOKIE)?.value
    const providerId = token ? verifyProviderToken(token) : null

    if (providerId) {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('provider_id')
            .eq('provider_id', providerId)
            .single()

        if (provider?.provider_id) {
            redirect(`/profile/${provider.provider_id}`)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 pb-24 md:px-8" dir="rtl">
            <div className="mx-auto max-w-2xl pt-16">
                <div className="mb-8 rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-600 text-4xl font-black text-white shadow-xl shadow-rose-100">
                        و
                    </div>
                    <h1 className="mb-2 text-2xl font-black text-gray-900">ملف ونّس</h1>
                    <p className="text-sm font-medium text-gray-500">
                        سجّل دخولك للوصول إلى ملفك الشخصي وإدارة إعلاناتك في Launch 1.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link
                        href="/login"
                        className="flex w-full items-center justify-center gap-3 rounded-[28px] bg-rose-500 p-5 font-black text-white shadow-sm shadow-rose-200 transition-all hover:bg-rose-600 active:scale-95"
                    >
                        <span>تسجيل الدخول / إنشاء حساب</span>
                    </Link>
                    <Link
                        href="/add-listing"
                        className="flex w-full items-center justify-center gap-3 rounded-[28px] border border-gray-200 bg-white p-5 font-black text-gray-900 transition-all hover:bg-gray-50 active:scale-95"
                    >
                        <span>إضافة إعلان جديد</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
