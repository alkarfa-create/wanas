import { supabaseAdmin } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import CategoryHighlight from '@/components/ui/CategoryHighlight'
import ListingCard from '@/components/listings/ListingCard'
import { ListingData } from '@/components/listings/types'

// تطوير دالة جلب البيانات بإضافة حماية من الأخطاء (Error Handling)
async function getListings() {
  try {
    const { data, error } = await supabaseAdmin
      .from('listings')
      .select(`
        listing_id, title, price_min, price_max, price_label,
        capacity_min, capacity_max, rank_score, features,
        district:districts(name_ar),
        category:service_categories(name_ar, icon_key),
        provider:providers(display_name, phone_whatsapp, verification_status, trust_score)
      `)
      .eq('status', 'approved')
      .order('rank_score', { ascending: false })
      .limit(12)

    if (error) throw error

    return (data ?? []) as unknown as ListingData[]
  } catch (error) {
    console.error("Error fetching listings:", error)
    return [] // إرجاع مصفوفة فارغة في حال حدوث خطأ لكي لا ينهار الموقع
  }
}

export default async function HomePage() {
  const listings = await getListings()

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* الهيدر المطور (الذي يحتوي بداخله على الهايلايتس وشريط البحث العائم) */}
      <Navbar />

      {/* CategoryHighlight needs to be pushed down below fixed Navbar */}
      <div className="mt-[80px]">
        <CategoryHighlight />
      </div>

      {/* تم توحيد العرض إلى max-w-[1200px] ليتطابق مع الهيدر.
        تم إضافة pt-4 (مساحة علوية بسيطة) لأن الهايلايتس دفع المحتوى.
      */}
      <main className="max-w-[1200px] mx-auto px-6 pt-6 pb-16">

        {/* عنوان القسم وتنسيق زر "عرض الكل" */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            بيوت وشاليهات رائجة في جدة
          </h2>
          <a
            href="/jeddah/chalets"
            className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            عرض الكل <span className="text-lg leading-none mb-1">‹</span>
          </a>
        </div>

        {/* شبكة البطاقات (Grid) - معالجة الحالة الفارغة */}
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.listing_id} listing={listing} />
            ))}
          </div>
        ) : (
          // واجهة احترافية تظهر في حال لم توجد إعلانات بدلاً من شاشة بيضاء
          <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-2xl border border-gray-100">
            <div className="text-4xl mb-4 opacity-50">🏡</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد إعلانات حالياً</h3>
            <p className="text-gray-500 text-sm">جرب البحث في وقت لاحق أو تصفح أقسام أخرى.</p>
          </div>
        )}

      </main>
    </div>
  )
}