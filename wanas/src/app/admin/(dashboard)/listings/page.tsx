// src/app/admin/listings/page.tsx
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

const STATUS_TABS = [
  { key: 'all',           label: 'الكل' },
  { key: 'pending_review',label: 'قيد المراجعة' },
  { key: 'approved',      label: 'معتمد' },
  { key: 'rejected',      label: 'مرفوض' },
  { key: 'paused',        label: 'موقوف' },
]

const STATUS_STYLE: Record<string, string> = {
  approved:       'bg-emerald-100 text-emerald-700',
  pending_review: 'bg-amber-100 text-amber-700',
  pending:        'bg-amber-100 text-amber-700',
  rejected:       'bg-red-100 text-red-600',
  paused:         'bg-gray-100 text-gray-600',
  draft:          'bg-blue-100 text-blue-600',
}

const STATUS_LABEL: Record<string, string> = {
  approved:       'معتمد',
  pending_review: 'قيد المراجعة',
  pending:        'قيد المراجعة',
  rejected:       'مرفوض',
  paused:         'موقوف',
  draft:          'مسودة',
}

function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;  // URL كامل مسبقاً
  // حوّل الـ path إلى Supabase public URL
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chalets-images/${path}`;
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const status  = resolvedSearchParams.status ?? 'all'
  const search  = resolvedSearchParams.search ?? ''
  const page    = parseInt(resolvedSearchParams.page ?? '1')
  const limit   = 20
  const from    = (page - 1) * limit

  let query = supabaseAdmin
    .from('listings')
    .select(`
      listing_id, title, status, price_min, is_featured,
      views_count, created_at, district_name, cover_url,
      category:service_categories(name_ar, icon_key),
      provider:providers(display_name, phone_whatsapp, subscription_tier)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (status !== 'all') query = query.eq('status', status)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, count, error } = await query
  
  if (error) {
    console.error('admin listings query error:', error)
    return (
      <div className="p-8 bg-red-50 text-red-900 rounded-2xl border border-red-200 mt-10 max-w-4xl mx-auto" dir="rtl">
        <h2 className="text-xl font-bold mb-4">⚠️ خطأ في الاستعلام (Database Error)</h2>
        <pre className="bg-red-100 p-4 rounded-xl text-left text-sm whitespace-pre-wrap overflow-auto" dir="ltr">
          {'Unable to load listings'}
        </pre>
        <p className="mt-4 text-sm font-bold opacity-80">
          * إذا كان كائن الخطأ فارغاً &#123;&#125;، فقد تكون المشكلة متعلقة بصلاحيات RLS أو في متغيرات البيئة.
        </p>
      </div>
    )
  }
  
  const listings = Array.isArray(data) ? data : []
  const totalPages = Math.ceil((count ?? 0) / limit)

  return (
    <div className="space-y-5" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-bold">{count} إعلان</p>
        <h2 className="text-xl font-black text-gray-900">إدارة الإعلانات</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-gray-100 rounded-2xl p-1 flex-row-reverse overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <Link key={tab.key}
            href={`/admin/listings?status=${tab.key}${search ? `&search=${search}` : ''}`}
            className={`flex-1 min-w-fit py-2.5 px-3 rounded-xl text-xs font-black text-center transition-all whitespace-nowrap ${
              status === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
            }`}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" action="/admin/listings" className="flex gap-2">
        <input type="hidden" name="status" value={status} />
        <input name="search" defaultValue={search}
          placeholder="ابحث بالعنوان..."
          className="flex-1 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-medium text-right focus:outline-none focus:border-rose-300 shadow-sm" />
        <button type="submit"
          className="px-4 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-black hover:bg-rose-600 transition-all">
          بحث
        </button>
        {search && (
          <Link href={`/admin/listings?status=${status}`}
            className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-black hover:bg-gray-200 transition-all">
            مسح
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {listings.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400 font-bold text-sm">لا توجد إعلانات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" dir="rtl">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-right px-5 py-3 text-xs font-black text-gray-400">الإعلان</th>
                  <th className="text-right px-4 py-3 text-xs font-black text-gray-400">المزود</th>
                  <th className="text-right px-4 py-3 text-xs font-black text-gray-400">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-black text-gray-400">الأداء</th>
                  <th className="text-right px-4 py-3 text-xs font-black text-gray-400">التاريخ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((l: any) => (
                  <tr key={l.listing_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          {l.cover_url
                            ? <Image src={getImageUrl(l.cover_url)!} alt={l.title} width={48} height={48} className="object-cover w-full h-full" />
                            : <div className="w-full h-full flex items-center justify-center text-xl">🏠</div>}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 line-clamp-1 max-w-[200px]">{l.title}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                            {l.category?.name_ar} · {l.district_name ?? 'جدة'}
                          </p>
                          {l.is_featured && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">⭐ مميز</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-black text-gray-800">{l.provider?.display_name ?? '—'}</p>
                      {l.provider?.subscription_tier === 'pro' && (
                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">PRO</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${STATUS_STYLE[l.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABEL[l.status] ?? l.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[10px] text-gray-500 font-bold">👁 {l.views_count ?? 0}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[10px] text-gray-400 font-bold">
                        {new Date(l.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/listings/${l.listing_id}`}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors whitespace-nowrap">
                        مراجعة ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-50">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link key={p}
                href={`/admin/listings?status=${status}&page=${p}${search ? `&search=${search}` : ''}`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                  p === page ? 'bg-rose-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}>{p}</Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
