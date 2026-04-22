// src/app/admin/providers/page.tsx
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

// تبسيط قاموس الألوان ليناسب الباقتين فقط
const TIER_STYLE: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  pro: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
}

export default async function AdminProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; search?: string; expiring?: string; page?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const tier = resolvedSearchParams.tier ?? 'all'
  const search = resolvedSearchParams.search ?? ''
  const filterExpiring = resolvedSearchParams.expiring === 'true'
  const page = parseInt(resolvedSearchParams.page ?? '1')
  const limit = 20
  const from = (page - 1) * limit

  const now = new Date()
  const fiveDaysFromNow = new Date()
  fiveDaysFromNow.setDate(now.getDate() + 5)

  let query = supabaseAdmin
    .from('providers')
    .select(`
      provider_id, display_name, email, phone_whatsapp, 
      verification_status, status, subscription_tier, created_at, avatar_url,
      subscription_price, subscription_ended_at,
      listings:listings(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (tier !== 'all') query = query.eq('subscription_tier', tier)
  if (filterExpiring) {
    query = query
      .not('subscription_ended_at', 'is', null)
      .lte('subscription_ended_at', fiveDaysFromNow.toISOString())
      .gt('subscription_ended_at', now.toISOString())
  }
  if (search) query = query.or(`display_name.ilike.%${search}%,phone_whatsapp.ilike.%${search}%`)

  const { data, count, error } = await query
  const providers = data || []

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">إدارة المزودين</h2>
          <p className="text-sm font-bold text-gray-400 mt-1">متابعة اشتراكات (Pro) وحالة الحسابات</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* فلتر الباقات المبسط */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl ml-4">
            {['all', 'free', 'pro'].map((t) => (
              <Link key={t} href={`/admin/providers?tier=${t}`}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${tier === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
                {t}
              </Link>
            ))}
          </div>

          {filterExpiring ? (
            <Link href="/admin/providers" className="text-xs font-black bg-red-100 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2">
              <span>⚠️ تصفية: شارف على الانتهاء</span>
              <span className="bg-red-200 p-1 rounded-md">✕</span>
            </Link>
          ) : (
            <Link href="/admin/providers?expiring=true" className="text-xs font-black bg-white border border-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 px-4 py-2 rounded-xl transition-all shadow-sm">
              🚨 عرض المنتهية قريباً
            </Link>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">المزود والاتصال</th>
                <th className="px-6 py-4">الباقة والقيمة</th>
                <th className="px-6 py-4">حالة الاشتراك</th>
                <th className="px-6 py-4 text-center">الإعلانات</th>
                <th className="px-6 py-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {providers.map((p: any) => {
                const endDate = p.subscription_ended_at ? new Date(p.subscription_ended_at) : null
                const daysLeft = endDate
                  ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : null

                const isActuallyExpired = endDate && endDate < now
                const effectiveTier = isActuallyExpired ? 'free' : p.subscription_tier
                const isFree = effectiveTier === 'free'
                const isExpiringSoon = daysLeft !== null && daysLeft <= 5 && daysLeft > 0

                return (
                  <tr key={p.provider_id} className={`transition-colors hover:bg-gray-50/50 ${isExpiringSoon ? 'bg-orange-50/30' : isActuallyExpired ? 'bg-red-50/10' : ''}`}>
                    {/* 1. المزود */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative border border-gray-100">
                          {p.avatar_url
                            ? <Image src={p.avatar_url} alt={p.display_name} width={40} height={40} className="object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg">👤</div>}
                          {p.verification_status === 'verified' && (
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
                              <span className="text-blue-500 text-xs">☑️</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{p.display_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5" dir="ltr">{p.phone_whatsapp}</p>
                        </div>
                      </div>
                    </td>

                    {/* 2. الباقة والقيمة */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${TIER_STYLE[effectiveTier] || 'bg-gray-100'}`}>
                          {effectiveTier}
                        </span>
                        {isActuallyExpired && p.subscription_tier === 'pro' ? (
                          <span className="text-[9px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded">سُحبت باقة (Pro)</span>
                        ) : !isFree && p.subscription_price ? (
                          <span className="text-[10px] font-black text-gray-600">{p.subscription_price} <span className="text-gray-400">ر.س</span></span>
                        ) : null}
                      </div>
                    </td>

                    {/* 3. حالة الاشتراك */}
                    <td className="px-6 py-4">
                      {isActuallyExpired ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                          <span className="text-[11px] font-black text-red-600">اشتراك منتهي</span>
                        </div>
                      ) : isFree ? (
                        <span className="text-[10px] font-bold text-gray-400">بدون اشتراك</span>
                      ) : isExpiringSoon ? (
                        <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg border border-orange-200">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0"></span>
                          <span className="text-[10px] font-black">ينتهي بعد {daysLeft} {daysLeft === 1 ? 'يوم' : 'أيام'}</span>
                        </div>
                      ) : endDate ? (
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-emerald-600 mb-0.5">ساري ({daysLeft} يوم)</span>
                          <span className="text-[9px] text-gray-400 font-bold">حتى {endDate.toLocaleDateString('ar-SA')}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400">—</span>
                      )}
                    </td>

                    {/* 4. الإعلانات */}
                    <td className="px-6 py-4 text-center">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-black">
                        {p.listings?.[0]?.count || 0}
                      </span>
                    </td>

                    {/* 5. الإجراءات */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {isExpiringSoon && (
                          <a
                            href={`https://wa.me/${p.phone_whatsapp}?text=${encodeURIComponent(`مرحباً ${p.display_name}، نود تذكيرك بأن اشتراكك في باقة (PRO) بمنصة وناس سينتهي خلال ${daysLeft} أيام. يرجى التجديد لضمان استمرار ظهور إعلاناتك.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 hover:scale-105 transition-all"
                          >
                            💬
                          </a>
                        )}
                        <Link
                          href={`/admin/providers/${p.provider_id}`}
                          className="text-[10px] font-black bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                        >
                          تعديل ⚙️
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {providers.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <span className="text-4xl mb-2">{filterExpiring ? '🎉' : '✨'}</span>
              <p className="text-sm font-bold text-gray-400">
                {filterExpiring ? 'لا توجد اشتراكات توشك على الانتهاء' : 'لا توجد بيانات مطابقة للبحث'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
