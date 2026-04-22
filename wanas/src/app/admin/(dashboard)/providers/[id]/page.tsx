// src/app/admin/providers/[id]/page.tsx
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { revalidatePath } from 'next/cache'
import AdminProRequestBanner from '@/components/admin/AdminProRequestBanner'

export const dynamic = 'force-dynamic'

async function updateProviderSettings(formData: FormData) {
  'use server'
  const providerId = formData.get('provider_id') as string
  const subscriptionTier = formData.get('subscription_tier') as string
  const verificationStatus = formData.get('verification_status') as string
  const startedAt = formData.get('subscription_started_at') as string
  const endedAt = formData.get('subscription_ended_at') as string
  const price = parseFloat(formData.get('subscription_price') as string) || 0

  const updatePayload: any = { 
    subscription_tier: subscriptionTier,
    verification_status: verificationStatus,
    updated_at: new Date().toISOString()
  }

  // الحماية الصارمة: إذا كانت الباقة مجانية، نصفّر كل بيانات الاشتراك
  if (subscriptionTier === 'free') {
    updatePayload.subscription_started_at = null
    updatePayload.subscription_ended_at = null
    updatePayload.subscription_price = 0
  } else {
    updatePayload.subscription_started_at = startedAt ? new Date(startedAt).toISOString() : null
    updatePayload.subscription_ended_at = endedAt ? new Date(endedAt).toISOString() : null
    updatePayload.subscription_price = price
  }

  await supabaseAdmin.from('providers').update(updatePayload).eq('provider_id', providerId)
  revalidatePath(`/admin/providers/${providerId}`)
  revalidatePath('/admin/providers')
}

const formatDateForInput = (dateString?: string | null) => {
  if (!dateString) return ''
  return new Date(dateString).toISOString().split('T')[0]
}

export default async function ProviderSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { data: provider, error } = await supabaseAdmin
    .from('providers')
    .select(`*, listings(listing_id, title, status, views_count)`)
    .eq('provider_id', resolvedParams.id)
    .single()

  if (error || !provider) {
    return (
      <div className="p-8 text-center" dir="rtl">
        <h2 className="text-2xl font-black text-gray-800">المزود غير موجود 🧐</h2>
        <Link href="/admin/providers" className="text-rose-500 mt-4 inline-block font-bold">← العودة للقائمة</Link>
      </div>
    )
  }

  const listings = Array.isArray(provider.listings) ? provider.listings : []
  const isExpired = provider.subscription_ended_at && new Date(provider.subscription_ended_at) < new Date()

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/providers" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 border border-gray-100">
          →
        </Link>
        <div>
          <h2 className="text-2xl font-black text-gray-900">إعدادات الحساب</h2>
          <p className="text-sm text-gray-400 font-bold mt-1">تعديل الباقة (Pro/Free)، السعر، والتواريخ</p>
        </div>
      </div>
      
      {/* 🚀 شريط التنبيه بوجود طلب PRO معلق */}
      <AdminProRequestBanner providerId={resolvedParams.id} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* بطاقة المزود */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center overflow-hidden">
            {isExpired && (
              <div className="bg-red-500 text-white text-[10px] font-black py-1 rounded-t-3xl -mt-6 -mx-6 mb-4">
                اشتراك منتهي
              </div>
            )}
            <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 overflow-hidden mb-4 border-4 border-white shadow-sm">
              {provider.avatar_url
                ? <Image src={provider.avatar_url} alt={provider.display_name} width={96} height={96} className="object-cover w-full h-full" />
                : <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>}
            </div>
            <h3 className="text-lg font-black text-gray-900">{provider.display_name}</h3>
            <p className="text-xs font-bold text-gray-400 mb-4 mt-1" dir="ltr">{provider.phone_whatsapp}</p>
            <div className="flex justify-center gap-2">
              <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-gray-100 text-gray-600">
                {provider.subscription_tier}
              </span>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                provider.verification_status === 'verified'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {provider.verification_status === 'verified' ? 'موثق ✓' : 'غير موثق'}
              </span>
            </div>
          </div>
        </div>

        {/* نموذج التعديل */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border-2 border-rose-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-5">تحديث حالة الحساب والاشتراك</h3>
            <form action={updateProviderSettings} className="space-y-5">
              <input type="hidden" name="provider_id" value={provider.provider_id} />
              
              <div className="grid grid-cols-2 gap-4">
                {/* باقة الاشتراك - مبسطة لخيارين فقط */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">باقة الاشتراك</label>
                  <select
                    name="subscription_tier"
                    defaultValue={provider.subscription_tier === 'free' ? 'free' : 'pro'}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-rose-300"
                  >
                    <option value="free">مجانية (Free)</option>
                    <option value="pro">احترافية (Pro)</option>
                  </select>
                </div>

                {/* قيمة الاشتراك */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">قيمة الاشتراك (ر.س)</label>
                  <input
                    type="number"
                    name="subscription_price"
                    defaultValue={provider.subscription_price || 0}
                    min="0"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-rose-300"
                  />
                </div>

                {/* بداية الاشتراك */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">بداية الاشتراك</label>
                  <input
                    type="date"
                    name="subscription_started_at"
                    defaultValue={formatDateForInput(provider.subscription_started_at)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-rose-300"
                  />
                </div>

                {/* نهاية الاشتراك */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">نهاية الاشتراك</label>
                  <input
                    type="date"
                    name="subscription_ended_at"
                    defaultValue={formatDateForInput(provider.subscription_ended_at)}
                    className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-rose-300 ${
                      isExpired ? 'border-red-300 text-red-600' : ''
                    }`}
                  />
                </div>

                {/* حالة التوثيق */}
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500">حالة التوثيق</label>
                  <select
                    name="verification_status"
                    defaultValue={provider.verification_status || 'unverified'}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-rose-300"
                  >
                    <option value="unverified">غير موثق</option>
                    <option value="pending">قيد المراجعة</option>
                    <option value="verified">موثق بالكامل ✓</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3 mt-4 bg-gray-900 hover:bg-gray-800 text-white font-black rounded-xl transition-colors">
                💾 حفظ البيانات
              </button>
            </form>
          </div>

          {/* قائمة الإعلانات */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-4">إعلانات المزود ({listings.length})</h3>
            {listings.length === 0 ? (
              <p className="text-sm text-gray-400 font-bold text-center py-4">لا توجد إعلانات لهذا المزود</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pl-1">
                {listings.map((listing: any) => (
                  <div key={listing.listing_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-black text-gray-900">{listing.title}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">👁 {listing.views_count || 0} مشاهدة</p>
                    </div>
                    <Link
                      href={`/admin/listings/${listing.listing_id}`}
                      className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      عرض
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
