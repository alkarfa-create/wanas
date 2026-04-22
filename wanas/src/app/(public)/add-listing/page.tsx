// src/app/(public)/add-listing/page.tsx
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { PROVIDER_COOKIE, verifyProviderToken } from '@/lib/session'
import AddListingForm from './AddListingForm'
import type { ListingEditData } from './AddListingForm'

type PageProps = {
  searchParams: Promise<{ edit?: string }>
}

export default async function AddListingPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get(PROVIDER_COOKIE)?.value
  const providerId = token ? verifyProviderToken(token) : null

  if (!providerId) {
    redirect('/login?redirect=/add-listing')
  }

  const resolvedParams = await searchParams
  const editId = resolvedParams.edit

  const { data: providerData } = await supabaseAdmin
    .from('providers')
    .select('district_id')
    .eq('provider_id', providerId)
    .single()

  const districtId = providerData?.district_id ?? 1

  let existingListing: { listing_id: string; title: string; status: string } | null = null
  let editData: ListingEditData | null = null

  if (!editId) {
    const { data: listings } = await supabaseAdmin
      .from('listings')
      .select('listing_id, title, status')
      .eq('provider_id', providerId)
      .limit(1)

    if (listings && listings.length > 0) {
      existingListing = listings[0]
    }
  }

  if (editId) {
    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select(`
        listing_id, title, description, category_id, district_id, district_name,
        price_min, price_max, price_label, capacity_min, capacity_max,
        occasion_type, latitude, longitude, features, policies, metadata,
        cover_url, media:listing_media(url, sort_order),
        contact_whatsapp, contact_phone,
        security_deposit_required, security_deposit_amount, security_deposit_policy,
        booking_deposit_required, booking_deposit_amount, booking_deposit_policy,
        cancellation_policy
      `)
      .eq('listing_id', editId)
      .eq('provider_id', providerId)
      .single()

    if (listing) editData = listing
  }

  if (existingListing) {
    const statusMap: Record<string, { label: string; color: string; bg: string }> = {
      approved: { label: 'نشط ومنشور', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
      pending_review: { label: 'قيد المراجعة', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
      rejected: { label: 'مرفوض', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    }
    const s = statusMap[existingListing.status] ?? { label: existingListing.status, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">🏡</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">لديك إعلان بالفعل!</h1>
          <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
            كل مزود خدمة مسموح له بإعلان واحد فقط حالياً.
          </p>
          <div className={`border rounded-2xl p-4 mb-6 text-right ${s.bg}`}>
            <p className="text-sm font-black text-gray-900 mb-1">{existingListing.title}</p>
            <span className={`text-xs font-black ${s.color}`}>● {s.label}</span>
          </div>
          <div className="flex flex-col gap-3">
            <Link href={`/add-listing?edit=${existingListing.listing_id}`}
              className="w-full py-3 rounded-2xl font-black text-white text-sm text-center"
              style={{ backgroundColor: '#f63659' }}>
              ✏️ تعديل إعلاني
            </Link>
            <Link href={`/listing/${existingListing.listing_id}`}
              className="w-full py-3 rounded-2xl font-black text-gray-700 text-sm text-center bg-gray-50 border border-gray-200">
              👁 عرض الإعلان
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AddListingForm
      providerId={providerId}
      districtId={districtId}
      editId={editId ?? undefined}
      editData={editData ?? undefined}
    />
  )
}
