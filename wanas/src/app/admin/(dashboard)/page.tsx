// src/app/admin/page.tsx
import Link from 'next/link'

import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type ListingSummary = {
  listing_id: string
  title: string
  status: string
  is_featured: boolean | null
  created_at: string | null
  district_name: string | null
  views_count: number | null
}

type ProviderSummary = {
  provider_id: string
  subscription_tier: string | null
  created_at: string | null
}

async function getDashboardData() {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()

  const [listingsAll, providersAll, modEvents, pendingListings] = await Promise.all([
    supabaseAdmin
      .from('listings')
      .select('listing_id, title, status, is_featured, created_at, district_name, views_count'),
    supabaseAdmin
      .from('providers')
      .select('provider_id, subscription_tier, created_at'),
    supabaseAdmin
      .from('moderation_events')
      .select('id, action, actor_name, next_status, occurred_at, listing:listings(title)')
      .order('occurred_at', { ascending: false })
      .limit(8),
    supabaseAdmin
      .from('listings')
      .select('listing_id, title, created_at, category:service_categories(name_ar), district_name, provider:providers(display_name)')
      .in('status', ['pending_review', 'pending'])
      .order('created_at', { ascending: true })
      .limit(8),
  ])

  const listings = (listingsAll.data ?? []) as ListingSummary[]
  const providers = (providersAll.data ?? []) as ProviderSummary[]

  const todayListings = listings.filter((listing) => listing.created_at?.startsWith(today))
  const pendingAll = listings.filter((listing) => listing.status === 'pending_review' || listing.status === 'pending')
  const approvedAll = listings.filter((listing) => listing.status === 'approved')
  const rejectedAll = listings.filter((listing) => listing.status === 'rejected')
  const featuredAll = listings.filter((listing) => listing.is_featured)
  const newProviders = providers.filter((provider) => !!provider.created_at && provider.created_at >= weekAgo)
  const proProviders = providers.filter((provider) => provider.subscription_tier === 'pro')
  const totalViews = listings.reduce((sum, listing) => sum + (listing.views_count ?? 0), 0)
  const avgViewsPerApproved =
    approvedAll.length > 0
      ? Math.round(
          approvedAll.reduce((sum, listing) => sum + (listing.views_count ?? 0), 0) / approvedAll.length
        )
      : 0

  const topListings = [...approvedAll]
    .sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0))
    .slice(0, 5)

  return {
    kpi: {
      totalListings: listings.length,
      pendingCount: pendingAll.length,
      approvedCount: approvedAll.length,
      rejectedCount: rejectedAll.length,
      featuredCount: featuredAll.length,
      totalProviders: providers.length,
      proProviders: proProviders.length,
      newProviders: newProviders.length,
      todayListings: todayListings.length,
      totalViews,
      avgViewsPerApproved,
    },
    pendingListings: pendingListings.data ?? [],
    recentActivity: modEvents.data ?? [],
    topListings,
  }
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color = '#f63659',
  trend,
}: {
  icon: string
  label: string
  value: string | number
  sub?: string
  color?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div className="text-xs font-bold text-gray-400">{label}</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-base" style={{ backgroundColor: `${color}12` }}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-black tabular-nums text-gray-900">{value}</div>
      {sub && (
        <div
          className={`mt-1.5 flex items-center gap-1 text-[10px] font-bold ${
            trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
          }`}
        >
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''}
          {sub}
        </div>
      )}
    </div>
  )
}

function PriorityBadge({ level }: { level: 'urgent' | 'medium' | 'low' }) {
  const styles = {
    urgent: 'bg-red-100 text-red-600',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-500',
  }[level]

  const label = {
    urgent: 'عاجل',
    medium: 'متابعة',
    low: 'عادي',
  }[level]

  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${styles}`}>{label}</span>
}

export default async function AdminDashboardPage() {
  const { kpi, pendingListings, recentActivity, topListings } = await getDashboardData()
  const now = new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">غرفة القيادة</h1>
          <p className="mt-0.5 text-xs font-bold text-gray-400">نظرة تشغيلية للإعلانات والمزوّدين في ونّس</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-400">{now}</span>
          {kpi.pendingCount > 0 && (
            <Link
              href="/admin/listings?status=pending_review"
              className="rounded-full px-3 py-1.5 text-[11px] font-black text-white animate-pulse"
              style={{ backgroundColor: '#f63659' }}
            >
              {kpi.pendingCount} إعلان ينتظر ←
            </Link>
          )}
        </div>
      </div>

      {(kpi.pendingCount > 0 || kpi.newProviders > 0) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {kpi.pendingCount > 0 && (
            <Link
              href="/admin/listings?status=pending_review"
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm transition-colors hover:bg-gray-50"
            >
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-black text-red-500">عاجل</span>
              <span className="text-xs font-black text-gray-800">{kpi.pendingCount} إعلان مراجعة</span>
            </Link>
          )}
          {kpi.newProviders > 0 && (
            <Link
              href="/admin/providers"
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm transition-colors hover:bg-gray-50"
            >
              <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-black text-blue-600">جديد</span>
              <span className="text-xs font-black text-gray-800">{kpi.newProviders} مزوّد جديد</span>
            </Link>
          )}
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-300">مؤشرات تشغيلية</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            icon="⏳"
            label="إعلانات معلّقة"
            value={kpi.pendingCount}
            color="#f59e0b"
            trend={kpi.pendingCount > 5 ? 'down' : 'neutral'}
            sub={kpi.pendingCount > 5 ? 'تحتاج مراجعة عاجلة' : 'ضمن المعدل'}
          />
          <KpiCard
            icon="✅"
            label="معتمدة ونشطة"
            value={kpi.approvedCount}
            color="#10b981"
            trend="up"
            sub={`${kpi.todayListings} إعلان جديد اليوم`}
          />
          <KpiCard icon="❌" label="مرفوضة" value={kpi.rejectedCount} color="#ef4444" />
          <KpiCard icon="⭐" label="إعلانات مميزة" value={kpi.featuredCount} color="#f59e0b" />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-300">مؤشرات سوقية</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard icon="👁" label="إجمالي المشاهدات" value={kpi.totalViews} color="#3b82f6" />
          <KpiCard icon="📋" label="متوسط مشاهدات/معتمد" value={kpi.avgViewsPerApproved} color="#8b5cf6" />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-300">مؤشرات تجارية</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard icon="👥" label="إجمالي المزوّدين" value={kpi.totalProviders} color="#06b6d4" />
          <KpiCard
            icon="👑"
            label="مشتركو PRO"
            value={kpi.proProviders}
            color="#f63659"
            sub={`${((kpi.proProviders / Math.max(kpi.totalProviders, 1)) * 100).toFixed(0)}% من الكل`}
          />
          <KpiCard icon="🆕" label="مزوّدون جدد (7 أيام)" value={kpi.newProviders} color="#10b981" trend="up" />
          <KpiCard
            icon="💰"
            label="معدل التحويل إلى PRO"
            value={`${((kpi.proProviders / Math.max(kpi.totalProviders, 1)) * 100).toFixed(1)}%`}
            color="#f59e0b"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div
            className="flex items-center justify-between border-b border-gray-50 px-5 py-4"
            style={{ background: kpi.pendingCount > 0 ? 'linear-gradient(135deg, #fff7ed, #fff)' : undefined }}
          >
            <Link href="/admin/listings?status=pending_review" className="text-[11px] font-black text-rose-500 hover:underline">
              مراجعة الكل ←
            </Link>
            <h3 className="text-sm font-black text-gray-900">
              ⏳ مركز المراجعة
              {kpi.pendingCount > 0 && (
                <span className="mr-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                  {kpi.pendingCount}
                </span>
              )}
            </h3>
          </div>

          {pendingListings.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mb-2 text-3xl">✅</div>
              <p className="text-xs font-bold text-gray-400">لا توجد إعلانات معلّقة</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingListings.map((listing: any) => {
                const waitHours = Math.floor((Date.now() - new Date(listing.created_at).getTime()) / 36e5)
                const priority = waitHours > 48 ? 'urgent' : waitHours > 24 ? 'medium' : 'low'

                return (
                  <Link
                    key={listing.listing_id}
                    href={`/admin/listings/${listing.listing_id}`}
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <PriorityBadge level={priority} />
                      <span className="text-[10px] font-bold text-gray-400">{waitHours}س</span>
                    </div>
                    <div className="text-right">
                      <p className="max-w-[200px] line-clamp-1 text-xs font-black text-gray-900">{listing.title}</p>
                      <p className="text-[10px] font-bold text-gray-400">
                        {(listing.category as any)?.name_ar} · {listing.district_name ?? 'جدة'} · {(listing.provider as any)?.display_name}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-50 px-5 py-4">
            <h3 className="text-right text-sm font-black text-gray-900">📋 سجل النشاط</h3>
          </div>
          {recentActivity.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-gray-400">لا توجد نشاطات</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentActivity.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between px-5 py-3">
                  <span className="shrink-0 text-[10px] font-bold text-gray-300">
                    {new Date(event.occurred_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="mr-3 flex-1 text-right">
                    <p className="text-xs font-black text-gray-800">
                      {event.actor_name ?? 'النظام'} ·{' '}
                      <span
                        className={
                          event.next_status === 'approved'
                            ? 'text-emerald-600'
                            : event.next_status === 'rejected'
                              ? 'text-red-500'
                              : event.next_status === 'paused'
                                ? 'text-gray-500'
                                : 'text-blue-500'
                        }
                      >
                        {event.next_status === 'approved'
                          ? 'اعتمد'
                          : event.next_status === 'rejected'
                            ? 'رفض'
                            : event.next_status === 'paused'
                              ? 'أوقف'
                              : event.action}
                      </span>
                    </p>
                    <p className="line-clamp-1 text-[10px] font-bold text-gray-400">{(event.listing as any)?.title ?? '—'}</p>
                  </div>
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      event.next_status === 'approved'
                        ? 'bg-emerald-400'
                        : event.next_status === 'rejected'
                          ? 'bg-red-400'
                          : 'bg-gray-300'
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
            <Link href="/admin/listings?sort=views" className="text-[11px] font-black text-rose-500 hover:underline">
              عرض الكل ←
            </Link>
            <h3 className="text-sm font-black text-gray-900">🔥 أعلى الإعلانات أداءً</h3>
          </div>
          {topListings.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-gray-400">لا توجد بيانات</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topListings.map((listing, index) => (
                <Link
                  key={listing.listing_id}
                  href={`/admin/listings/${listing.listing_id}`}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 text-xs font-black text-gray-300">#{index + 1}</span>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500">👁 {listing.views_count ?? 0}</p>
                    </div>
                  </div>
                  <p className="max-w-[200px] line-clamp-1 text-right text-xs font-black text-gray-900">{listing.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-right text-sm font-black text-gray-900">⚡ إجراءات سريعة</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/admin/listings?status=pending_review', label: `مراجعة المعلّق (${kpi.pendingCount})`, color: '#f59e0b', icon: '⏳' },
              { href: '/admin/providers', label: 'إدارة المزوّدين', color: '#8b5cf6', icon: '👥' },
              { href: '/admin/listings?is_featured=true', label: 'الإعلانات المميزة', color: '#f63659', icon: '⭐' },
              { href: '/admin/listings', label: 'كل الإعلانات', color: '#3b82f6', icon: '📋' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: action.color }}
              >
                <span>{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
