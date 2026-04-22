import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import ViewTracker from '@/components/listings/ViewTracker'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Share2, MapPin } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

// features هي مصفوفة نصوص عربية مثل ["مسبح صغير", "مطبخ", "واي فاي"]
function hasFeature(features: string[], ...keywords: string[]): boolean {
  return features.some(f =>
    keywords.some(k => f.toLowerCase().includes(k.toLowerCase()))
  )
}

const FEATURE_ICONS: { keywords: string[]; icon: string; label: string }[] = [
  { keywords: ['مسبح', 'pool'],       icon: '🏊', label: 'مسبح' },
  { keywords: ['مطبخ', 'kitchen'],    icon: '🍳', label: 'مطبخ' },
  { keywords: ['غرفة', 'room'],       icon: '🛏', label: 'غرف نوم' },
  { keywords: ['حديقة', 'garden'],    icon: '🌿', label: 'حديقة' },
  { keywords: ['واي فاي', 'wifi'],    icon: '📶', label: 'واي فاي' },
  { keywords: ['باركينج', 'parking', 'موقف'], icon: '🅿️', label: 'موقف سيارات' },
  { keywords: ['أطفال', 'kids'],      icon: '👶', label: 'مناسب للأطفال' },
  { keywords: ['ملعب', 'playground'], icon: '⚽', label: 'ملعب' },
  { keywords: ['شواء', 'bbq', 'باربيكيو'], icon: '🔥', label: 'شواء' },
  { keywords: ['تكييف', 'ac'],        icon: '❄️', label: 'تكييف' },
]

const LEGACY_CANCELLATION_POLICIES: Record<string, string> = {
  flexible: 'مرنة — استرداد كامل قبل 24 ساعة',
  moderate: 'متوسطة — استرداد 50% قبل 48 ساعة',
  strict: 'صارمة — لا استرداد بعد الحجز',
}

const LEGACY_DEPOSIT_POLICIES: Record<string, string> = {
  refundable: 'يُسترد العربون بالكامل عند الإلغاء حسب الشروط',
  partial_refundable: 'يُسترد جزء من العربون فقط',
  non_refundable: 'العربون لا يُسترد بعد التأكيد',
  reschedule_only: 'لا يُسترد نقدًا لكن يمكن تحويله إلى موعد آخر',
}

const SUPABASE_STORAGE_BASE =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chalets-images/`
    : null

function getListingImageUrl(path?: string | null) {
  const normalized = path?.trim()
  if (!normalized) return null
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized
  if (normalized.startsWith('/')) return normalized
  return SUPABASE_STORAGE_BASE ? `${SUPABASE_STORAGE_BASE}${normalized}` : null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select(`
      title, description, price_min, district_name,
      capacity_max, features, cover_url,
      district:districts!listings_district_id_fkey(name_ar),
      category:service_categories!listings_category_id_fkey(name_ar),
      media:listing_media(url, sort_order)
    `)
    .eq('listing_id', id)
    .eq('status', 'approved')
    .single()

  if (!listing) return { title: 'إعلان غير موجود' }

  const district = Array.isArray(listing.district) ? listing.district[0] : listing.district
  const category = Array.isArray(listing.category) ? listing.category[0] : listing.category
  const media = Array.isArray(listing.media)
    ? [...listing.media].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : []
  const features: string[] = Array.isArray(listing.features) ? listing.features as string[] : []

  const districtName = listing.district_name || district?.name_ar || 'جدة'
  const categoryName = (category as any)?.name_ar ?? ''

  const descParts: string[] = []
  if (listing.price_min) descParts.push(`يبدأ من ${Number(listing.price_min).toLocaleString('ar-SA')} ر.س`)
  if (listing.capacity_max) descParts.push(`سعة ${listing.capacity_max} شخص`)
  if (hasFeature(features, 'مسبح', 'pool')) descParts.push('مسبح')
  if (hasFeature(features, 'مطبخ', 'kitchen')) descParts.push('مطبخ')
  if (listing.description) descParts.push(listing.description.slice(0, 100))

  const description = descParts.join(' · ') || `${categoryName} في ${districtName}، جدة`
  const title = `${listing.title} — ${districtName}، جدة`
  const coverUrl =
    getListingImageUrl(listing.cover_url) ||
    getListingImageUrl((media[0] as any)?.url) ||
    '/og-image.jpg'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://wanas.sa/listing/${id}`,
      siteName: 'ونس',
      locale: 'ar_SA',
      type: 'article',
      images: [{ url: coverUrl, width: 1200, height: 630, alt: listing.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverUrl],
    },
  }
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params

  // استعلام واحد يجلب كل شيء
  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select(`
      listing_id, title, description,
      price_min, price_max, price_label,
      capacity_min, capacity_max,
      rank_score, features, policies, district_name, cover_url,
      security_deposit_required, security_deposit_amount, security_deposit_policy,
      booking_deposit_required, booking_deposit_amount, booking_deposit_policy,
      cancellation_policy,
      provider_id, category_id, district_id,
      district:districts!listings_district_id_fkey(name_ar),
      category:service_categories!listings_category_id_fkey(name_ar, icon_key),
      provider:providers!listings_provider_id_fkey(display_name, phone_whatsapp, verification_status, trust_score, subscription_tier),
      media:listing_media(url, sort_order)
    `)
    .eq('listing_id', id)
    .eq('status', 'approved')
    .single()

  if (!listing) notFound()

  // تحويل البيانات
  const media = Array.isArray((listing as any).media)
    ? [...(listing as any).media].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : []
  const imageUrls: string[] = [listing.cover_url, ...media.map((m: any) => m.url)]
    .map((url) => getListingImageUrl(url))
    .filter((url): url is string => Boolean(url))
    .filter((url, index, arr) => arr.indexOf(url) === index)

  const provider = Array.isArray(listing.provider) ? listing.provider[0] : listing.provider
  const district = Array.isArray(listing.district) ? listing.district[0] : listing.district
  const districtName = (listing as any).district_name || (district as any)?.name_ar || 'جدة'
  const providerPhone =
    typeof (provider as any)?.phone_whatsapp === 'string'
      ? (provider as any).phone_whatsapp.replace(/\D/g, '')
      : null
  const whatsappHref = providerPhone ? `https://wa.me/${providerPhone}` : null

  // ✅ features هي مصفوفة نصوص ["مسبح صغير", "مطبخ", ...]
  const features: string[] = Array.isArray(listing.features) ? listing.features as string[] : []
  const policies = (listing.policies as Record<string, any>) ?? {}
  const bookingDepositRequired =
    typeof (listing as any).booking_deposit_required === 'boolean'
      ? Boolean((listing as any).booking_deposit_required)
      : Boolean(policies.depositRequired)
  const bookingDepositAmount =
    (listing as any).booking_deposit_amount ?? policies.depositAmount ?? null
  const bookingDepositPolicy =
    String((listing as any).booking_deposit_policy ?? '').trim() ||
    String(policies.depositPolicyNote ?? '').trim() ||
    LEGACY_DEPOSIT_POLICIES[String(policies.depositPolicyType ?? '')] ||
    null
  const securityDepositRequired = Boolean((listing as any).security_deposit_required)
  const securityDepositAmount = (listing as any).security_deposit_amount ?? null
  const securityDepositPolicy =
    String((listing as any).security_deposit_policy ?? '').trim() || null
  const cancellationPolicy =
    String((listing as any).cancellation_policy ?? '').trim() ||
    LEGACY_CANCELLATION_POLICIES[String(policies.cancellationPolicy ?? '')] ||
    null

  // استخرج الخصائص المعروفة + الباقي كـ "مرافق"
  const recognizedKeywords = FEATURE_ICONS.flatMap(f => f.keywords)
  const extraAmenities = features.filter(
    f => !recognizedKeywords.some(k => f.toLowerCase().includes(k.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-white text-[#222] antialiased pb-32 lg:pb-0" dir="rtl">
      <ViewTracker listingId={listing.listing_id} />
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-4 md:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* المحتوى الرئيسي */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* الصورة الرئيسية */}
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[28px] overflow-hidden bg-gray-100">
            {imageUrls[0] ? (
              <Image src={imageUrls[0]} alt={listing.title} fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🏡</div>
            )}
            <div className="absolute top-4 left-4 z-10">
              <button className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                <Share2 size={20} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* صور إضافية */}
          {imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imageUrls.slice(1).map((url, i) => (
                <div key={i} className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-gray-100">
                  <Image src={url} alt={`صورة ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* العنوان والتقييم */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-black text-gray-900 leading-tight">{listing.title}</h1>
              <div className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl shrink-0">
                <span className="text-xs font-black text-blue-600">منصة ونَس</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-sm font-bold">{districtName}، جدة</span>
            </div>
          </div>

          {/* السعر */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900">
                {listing.price_min ? Number(listing.price_min).toLocaleString('ar-SA') : 'تواصل'}
              </span>
              {listing.price_min && <span className="text-sm text-gray-400 font-medium">ر.س</span>}
              {listing.price_max && listing.price_max !== listing.price_min && (
                <span className="text-sm text-gray-400 font-medium">
                  — {Number(listing.price_max).toLocaleString('ar-SA')} ر.س
                </span>
              )}
            </div>
            {listing.price_label && (
              <p className="text-xs text-gray-400 font-bold mt-0.5">{listing.price_label}</p>
            )}
            {policies.negotiable && (
              <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-1 rounded-full mt-2 inline-block">
                قابل للتفاوض
              </span>
            )}
          </div>

          {/* الخصائص — من مصفوفة features */}
          {features.length > 0 && (
            <div>
              <h2 className="text-base font-black text-gray-900 mb-3">الخصائص</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* السعة */}
                {listing.capacity_max && (
                  <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                    <span className="text-xl block mb-1">👥</span>
                    <span className="text-sm font-black text-gray-700">حتى {listing.capacity_max} شخص</span>
                  </div>
                )}
                {/* الخصائص المعروفة */}
                {FEATURE_ICONS.filter(f => hasFeature(features, ...f.keywords)).map(f => (
                  <div key={f.label} className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                    <span className="text-xl block mb-1">{f.icon}</span>
                    <span className="text-sm font-black text-gray-700">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* المرافق الإضافية (ما لم يُعرَّف في الأيقونات) */}
          {extraAmenities.length > 0 && (
            <div>
              <h2 className="text-base font-black text-gray-900 mb-3">المرافق والخدمات</h2>
              <div className="flex flex-wrap gap-2">
                {extraAmenities.map((a) => (
                  <span key={a} className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full text-sm font-bold text-gray-700">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* الوصف */}
          {listing.description && (
            <div>
              <h2 className="text-base font-black text-gray-900 mb-3">عن المكان</h2>
              <p className="text-sm text-gray-600 leading-loose font-medium whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}

          {/* السياسات */}
          {Object.keys(policies).length > 0 && (
            <div>
              <h2 className="text-base font-black text-gray-900 mb-3">السياسات</h2>
              <div className="flex flex-wrap gap-2">
                {policies.checkin && (
                  <span className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full text-sm font-bold text-gray-700">
                    🕐 تسجيل دخول: {policies.checkin}
                  </span>
                )}
                {policies.checkout && (
                  <span className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full text-sm font-bold text-gray-700">
                    🕐 تسجيل خروج: {policies.checkout}
                  </span>
                )}
                {policies.smoking === false && (
                  <span className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full text-sm font-bold text-gray-700">
                    🚭 ممنوع التدخين
                  </span>
                )}
                {policies.pets && (
                  <span className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full text-sm font-bold text-gray-700">
                    🐾 الحيوانات الأليفة مسموحة
                  </span>
                )}
              </div>
            </div>
          )}

          {/* المزود */}
          {(securityDepositRequired || bookingDepositRequired || cancellationPolicy) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {securityDepositRequired && (
                <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h2 className="text-base font-black text-gray-900">التأمين</h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        مبلغ تأمين مستقل يُوضح قبل تأكيد الحجز.
                      </p>
                    </div>
                    <div className="px-3 py-2 rounded-2xl bg-white border border-amber-100 text-center shrink-0">
                      <p className="text-[10px] text-gray-400 font-bold">القيمة</p>
                      <p className="text-sm font-black text-amber-600">
                        {securityDepositAmount != null
                          ? `${Number(securityDepositAmount).toLocaleString('ar-SA')} ر.س`
                          : 'يحدد لاحقًا'}
                      </p>
                    </div>
                  </div>
                  {securityDepositPolicy && (
                    <p className="text-sm text-gray-600 leading-loose font-medium whitespace-pre-line">
                      {securityDepositPolicy}
                    </p>
                  )}
                </div>
              )}

              {bookingDepositRequired && (
                <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h2 className="text-base font-black text-gray-900">العربون</h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        مبلغ يُدفع لتأكيد الحجز أو الموعد حسب الشروط.
                      </p>
                    </div>
                    <div className="px-3 py-2 rounded-2xl bg-white border border-rose-100 text-center shrink-0">
                      <p className="text-[10px] text-gray-400 font-bold">القيمة</p>
                      <p className="text-sm font-black text-[#f63659]">
                        {bookingDepositAmount != null
                          ? `${Number(bookingDepositAmount).toLocaleString('ar-SA')} ر.س`
                          : 'يحدد لاحقًا'}
                      </p>
                    </div>
                  </div>
                  {bookingDepositPolicy && (
                    <p className="text-sm text-gray-600 leading-loose font-medium whitespace-pre-line">
                      {bookingDepositPolicy}
                    </p>
                  )}
                </div>
              )}

              {cancellationPolicy && (
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5 md:col-span-2">
                  <h2 className="text-base font-black text-gray-900 mb-2">سياسة الإلغاء</h2>
                  <p className="text-sm text-gray-600 leading-loose font-medium whitespace-pre-line">
                    {cancellationPolicy}
                  </p>
                </div>
              )}
            </div>
          )}

          {provider && (
            <div className="border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-xl font-black text-rose-400 shrink-0">
                {(provider as any).display_name?.charAt(0) ?? '؟'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-gray-900">{(provider as any).display_name}</h3>
                  {(provider as any).verification_status === 'verified' && (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">موثق</span>
                  )}
                  {(provider as any).subscription_tier === 'pro' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                      ⭐ PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-bold">مزود خدمة</p>
              </div>
            </div>
          )}

        </div>{/* end lg:col-span-8 */}

        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-[110px]">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-gray-900 mb-2">التواصل مع المزود</h2>
            <p className="text-sm text-gray-500 font-medium mb-4">
              هذه الصفحة للعرض والاكتشاف في Launch 1. التواصل يتم مباشرة مع المزود.
            </p>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center rounded-2xl bg-[#25D366] text-white font-black py-3"
              >
                تواصل عبر واتساب
              </a>
            ) : (
              <div className="w-full rounded-2xl bg-gray-100 text-gray-500 text-center py-3 font-bold">
                رقم واتساب غير متوفر حالياً
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full z-[9999] bg-white border-t border-gray-200 p-4 lg:hidden">
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center rounded-2xl bg-[#25D366] text-white font-black py-3"
          >
            تواصل عبر واتساب
          </a>
        ) : (
          <div className="w-full rounded-2xl bg-gray-100 text-gray-500 text-center py-3 font-bold">
            رقم واتساب غير متوفر حالياً
          </div>
        )}
      </div>
    </div>
  )
}
