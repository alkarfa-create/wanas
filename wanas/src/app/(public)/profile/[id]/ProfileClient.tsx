'use client'
// src/app/(public)/profile/[id]/ProfileClient.tsx

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Provider {
  provider_id: string
  display_name: string
  phone_whatsapp: string
  phone_call: string | null
  verification_status: string
  status: string
  trust_score: number
  created_at: string
  avatar_url: string | null
}

interface Listing {
  listing_id: string
  title: string
  status: string
  price_min: number | null
  price_label: string | null
  views_count: number
  created_at: string
  cover_url?: string | null
  category: { name_ar: string; icon_key: string } | null
}

interface Stats {
  totalViews: number
  activeListings: number
  totalListings: number
}

const CATEGORY_ICONS: Record<string, string> = {
  chalet: '🏠',
  coffee: '☕',
  buffet: '🍽️',
  party: '🎉',
  games: '🎮',
  machine: '🍦',
  icecream: '🍿',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: 'نشط', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    pending_review: { label: 'قيد المراجعة', cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
    rejected: { label: 'مرفوض', cls: 'bg-rose-50 text-rose-600 border border-rose-100' },
    paused: { label: 'موقوف', cls: 'bg-gray-50 text-gray-600 border border-gray-200' },
  }

  const current = map[status] ?? { label: status, cls: 'bg-gray-50 text-gray-600 border border-gray-200' }
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${current.cls}`}>{current.label}</span>
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="text-xs font-black text-gray-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-gray-900">{value.toLocaleString('ar-SA')}</div>
    </div>
  )
}

export default function ProfileClient({
  provider: initialProvider,
  listings: initialListings,
  stats,
}: {
  provider: Provider
  listings: Listing[]
  stats: Stats
}) {
  const [provider, setProvider] = useState(initialProvider)
  const [listings, setListings] = useState(initialListings)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const joinDate = new Date(provider.created_at).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
  })

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarLoading(true)
    try {
      const formData = new FormData()
      formData.append('provider_id', provider.provider_id)
      formData.append('avatar', file)

      const response = await fetch('/api/providers/avatar', { method: 'POST', body: formData })
      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'تعذر رفع الصورة')
        return
      }

      const nextProvider = { ...provider, avatar_url: data.avatar_url }
      setProvider(nextProvider)
      window.dispatchEvent(new Event('auth-change'))
    } catch {
      alert('تعذر رفع الصورة')
    } finally {
      setAvatarLoading(false)
    }
  }

  async function handleDelete(listingId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return

    setDeletingId(listingId)
    try {
      const response = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })
      if (!response.ok) {
        alert('فشل الحذف')
        return
      }

      setListings((current) => current.filter((listing) => listing.listing_id !== listingId))
    } catch {
      alert('تعذر الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F9]" dir="rtl">
      <div className="sticky top-[72px] z-40 border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-50">
            <span className="text-lg text-gray-400">←</span>
          </Link>
          <span className="text-base font-black tracking-tight text-gray-900">الملف الشخصي</span>
          <Link href="/add-listing" className="rounded-full bg-rose-500 px-4 py-2 text-xs font-black text-white hover:bg-rose-600">
            إدارة الإعلان
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-rose-100 to-orange-50 opacity-50 blur-3xl" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-[2rem] border-[3px] border-white bg-gray-50 shadow-md">
                {provider.avatar_url ? (
                  <Image src={provider.avatar_url} alt={provider.display_name} width={96} height={96} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-400 to-orange-400 text-3xl font-black text-white">
                    {provider.display_name?.charAt(0) ?? '؟'}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="absolute -bottom-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 bg-white shadow-lg hover:scale-110"
              >
                {avatarLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-rose-500" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-2 text-gray-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-gray-900">{provider.display_name}</h1>
                {provider.verification_status === 'verified' && (
                  <span className="flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600">
                    موثق
                  </span>
                )}
              </div>
              <p className="mb-2 text-xs font-bold text-gray-500">عضو منذ {joinDate}</p>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700" dir="ltr">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {provider.phone_whatsapp}
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <span className="mb-0.5 block text-xs font-black text-gray-500">مؤشر جودة الحساب</span>
                <span className="text-lg font-black leading-none text-gray-900">{provider.trust_score}%</span>
              </div>
              {provider.trust_score >= 80 && (
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-600">أداء ممتاز</span>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-300" style={{ width: `${provider.trust_score}%` }} />
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="إجمالي الإعلانات" value={stats.totalListings} />
          <StatCard label="الإعلانات النشطة" value={stats.activeListings} />
          <StatCard label="المشاهدات" value={stats.totalViews} />
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <Link href="/add-listing" className="text-xs font-black text-rose-500 hover:underline">
              إضافة أو تعديل ←
            </Link>
            <h2 className="text-lg font-black text-gray-900">إعلاناتي</h2>
          </div>

          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm font-bold text-gray-400">
              لا توجد إعلانات بعد.
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div key={listing.listing_id} className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 text-right">
                      <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
                        <StatusBadge status={listing.status} />
                        <span className="text-xs font-bold text-gray-400">
                          {new Date(listing.created_at).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-gray-900">{listing.title}</h3>
                      <p className="mt-1 text-xs font-bold text-gray-500">
                        {(listing.category?.icon_key && CATEGORY_ICONS[listing.category.icon_key]) || '📍'} {listing.category?.name_ar ?? 'بدون تصنيف'}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-end gap-3 text-xs font-bold text-gray-500">
                        <span>{listing.views_count.toLocaleString('ar-SA')} مشاهدة</span>
                        {listing.price_min ? <span>{listing.price_min.toLocaleString('ar-SA')} ر.س</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => handleDelete(listing.listing_id)}
                      disabled={deletingId === listing.listing_id}
                      className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                    >
                      {deletingId === listing.listing_id ? 'جارٍ الحذف...' : 'حذف'}
                    </button>
                    <Link
                      href={`/listing/${listing.listing_id}`}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
                    >
                      عرض
                    </Link>
                    <Link
                      href={`/add-listing?edit=${listing.listing_id}`}
                      className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-black text-white hover:bg-black"
                    >
                      تعديل
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
