import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/session'
import { isTransitionAllowed, ALLOWED_TRANSITIONS } from '@/domain/listings/constants'
import { ListingStatus } from '@/domain/listings/types'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const BUCKET = 'chalets-images'

// ✅ تحويل path نسبي إلى URL كامل
function getImageUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
}

const STATUS_STYLE: Record<string, string> = {
  draft:          'bg-blue-100 text-blue-700',
  approved:       'bg-emerald-100 text-emerald-700',
  pending_review: 'bg-amber-100 text-amber-700',
  pending:        'bg-amber-100 text-amber-700',
  rejected:       'bg-red-100 text-red-600',
  paused:         'bg-gray-100 text-gray-600',
  archived:       'bg-slate-100 text-slate-600',
  expired:        'bg-orange-100 text-orange-600',
}

const STATUS_LABEL: Record<string, string> = {
  draft:          'مسودة',
  approved:       'معتمد',
  pending_review: 'قيد المراجعة',
  pending:        'قيد المراجعة',
  rejected:       'مرفوض',
  paused:         'موقوف',
  archived:       'مؤرشف',
  expired:        'منتهي الصلاحية',
}

async function updateListingStatus(formData: FormData) {
  'use server'

  // ── Verify admin session ──────────────────────────────────────────────────
  const cookieStore = await cookies()
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value
  if (!adminToken || !verifyAdminToken(adminToken)) {
    throw new Error('غير مصرح: يجب تسجيل دخول المدير')
  }

  const listingId = formData.get('listing_id') as string
  const newStatus = formData.get('status') as ListingStatus
  const oldStatus = formData.get('old_status') as ListingStatus
  const note = formData.get('note') as string

  // ── Validate transition against state machine ─────────────────────────────
  if (!isTransitionAllowed(oldStatus, newStatus)) {
    throw new Error(`التحويل من "${oldStatus}" إلى "${newStatus}" غير مسموح`)
  }

  // ── Build update payload ──────────────────────────────────────────────────
  const updatePayload: Record<string, unknown> = { status: newStatus }
  if (newStatus === ListingStatus.APPROVED) {
    updatePayload.published_at = new Date().toISOString()
  }

  await supabaseAdmin
    .from('listings')
    .update(updatePayload)
    .eq('listing_id', listingId)

  await supabaseAdmin
    .from('moderation_events')
    .insert({
      listing_id:      listingId,
      action:          newStatus === ListingStatus.APPROVED && oldStatus === ListingStatus.REJECTED
                         ? 'direct_approval'
                         : 'status_change',
      actor_id:        'admin',
      actor_name:      'مدير المنصة',
      previous_status: oldStatus,
      next_status:     newStatus,
      note:            note || null,
      source:          'admin_dashboard',
    })

  revalidatePath(`/admin/listings/${listingId}`)
  revalidatePath('/admin/listings')
}

export default async function ListingDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params

  const { data: listing, error } = await supabaseAdmin
    .from('listings')
    .select(`
      *,
      provider:providers(display_name, phone_whatsapp),
      category:service_categories(name_ar),
      media:listing_media(url, sort_order)
    `)
    .eq('listing_id', resolvedParams.id)
    .single()

  if (error || !listing) {
    return (
      <div className="p-8 text-center" dir="rtl">
        <h2 className="text-2xl font-black text-gray-800">الإعلان غير موجود 🧐</h2>
        <Link href="/admin/listings" className="text-rose-500 mt-4 inline-block font-bold">← العودة للقائمة</Link>
      </div>
    )
  }

  // جميع صور الإعلان مرتبة
  const mediaUrls: string[] = Array.isArray((listing as any).media)
    ? [...(listing as any).media]
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((m: any) => getImageUrl(m.url) ?? m.url)
        .filter(Boolean)
    : []

  // الصورة الرئيسية
  const coverUrl = getImageUrl(listing.cover_url) ?? mediaUrls[0] ?? null

  let features: any = []
  let policies: any = {}
  try { features = typeof listing.features === 'string' ? JSON.parse(listing.features) : listing.features || [] } catch(e){}
  try { policies = typeof listing.policies === 'string' ? JSON.parse(listing.policies) : listing.policies || {} } catch(e){}

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/listings" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 border border-gray-100 transition-colors">
            →
          </Link>
          <div>
            <h2 className="text-2xl font-black text-gray-900">{listing.title}</h2>
            <p className="text-sm text-gray-400 font-bold mt-1">
              {(listing as any).category?.name_ar} · {listing.district_name ?? 'بدون حي'}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-xl text-sm font-black ${STATUS_STYLE[listing.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {STATUS_LABEL[listing.status] ?? listing.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* العمود الأيمن */}
        <div className="lg:col-span-2 space-y-6">

          {/* الصورة الرئيسية */}
          <div className="w-full aspect-video bg-gray-100 rounded-3xl overflow-hidden relative border border-gray-100 shadow-sm">
            {coverUrl ? (
              <img src={coverUrl} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-6xl mb-2">🏠</span>
                <span className="font-bold text-sm">لا توجد صورة</span>
              </div>
            )}
          </div>

          {/* الصور الإضافية */}
          {mediaUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                  <img src={url} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* الوصف */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-3">الوصف</h3>
            <p className="text-gray-600 leading-relaxed text-sm font-medium whitespace-pre-wrap">
              {listing.description || 'لا يوجد وصف مضاف.'}
            </p>
          </div>

          {/* المميزات والسياسات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-4">المميزات</h3>
              {Array.isArray(features) && features.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {features.map((f: string, i: number) => (
                    <span key={i} className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full text-xs font-bold text-gray-700">
                      {f}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">لا توجد مميزات</p>
              )}
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-4">السياسات</h3>
              <pre className="text-xs bg-gray-50 p-4 rounded-2xl text-left overflow-auto border border-gray-100" dir="ltr">
                {JSON.stringify(policies, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* العمود الأيسر */}
        <div className="space-y-6">

          {/* قرار المراجعة */}
          <div className="bg-white p-6 rounded-3xl border-2 border-rose-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-4">قرار المراجعة</h3>
            <form action={updateListingStatus} className="space-y-4">
              <input type="hidden" name="listing_id" value={listing.listing_id} />
              <input type="hidden" name="old_status" value={listing.status} />
              <textarea
                name="note"
                placeholder="ملاحظات المراجعة (اختياري، تظهر للمزود في حال الرفض)..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-rose-300 resize-none h-24"
              />
              <div className="flex flex-col gap-2">
                {ALLOWED_TRANSITIONS[listing.status as ListingStatus]?.includes(ListingStatus.PENDING_REVIEW) && (
                  <button type="submit" name="status" value="pending_review"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl transition-colors">
                    📝 إرسال إلى المراجعة
                  </button>
                )}
                {ALLOWED_TRANSITIONS[listing.status as ListingStatus]?.includes(ListingStatus.APPROVED) && (
                  <button type="submit" name="status" value="approved"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-colors">
                    ✅ اعتماد ونشر الإعلان
                  </button>
                )}
                {ALLOWED_TRANSITIONS[listing.status as ListingStatus]?.includes(ListingStatus.REJECTED) && (
                  <button type="submit" name="status" value="rejected"
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl transition-colors">
                    ❌ رفض الإعلان
                  </button>
                )}
                {ALLOWED_TRANSITIONS[listing.status as ListingStatus]?.includes(ListingStatus.PAUSED) && (
                  <button type="submit" name="status" value="paused"
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-xl transition-colors">
                    ⏸ إيقاف مؤقت
                  </button>
                )}
                {ALLOWED_TRANSITIONS[listing.status as ListingStatus]?.includes(ListingStatus.ARCHIVED) && (
                  <button type="submit" name="status" value="archived"
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl transition-colors">
                    🗄 أرشفة الإعلان
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* بيانات المزود */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
            <div>
              <h4 className="text-xs font-bold text-gray-400 mb-1">المزود (صاحب الإعلان)</h4>
              <p className="font-black text-gray-900">{(listing as any).provider?.display_name ?? 'غير معروف'}</p>
              <p className="text-sm font-bold text-rose-500 mt-1" dir="ltr">{(listing as any).provider?.phone_whatsapp}</p>
            </div>
            <hr className="border-gray-50" />
            <div>
              <h4 className="text-xs font-bold text-gray-400 mb-1">نطاق السعر</h4>
              <p className="font-black text-gray-900">
                {listing.price_min} - {listing.price_max ?? 'غير محدد'} <span className="text-xs text-gray-400">ريال/الليلة</span>
              </p>
            </div>
            <hr className="border-gray-50" />
            <div>
              <h4 className="text-xs font-bold text-gray-400 mb-1">السعة الاستيعابية</h4>
              <p className="font-black text-gray-900">
                من {listing.capacity_min ?? 0} إلى {listing.capacity_max ?? 0} <span className="text-xs text-gray-400">شخص</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
