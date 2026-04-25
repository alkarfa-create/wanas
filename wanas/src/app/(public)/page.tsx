import Link from "next/link"
import { getListingsWithMedia } from "@/lib/data/listings"
import ListingCard from "@/components/listings/ListingCard"
import CategoryHighlight from "@/components/ui/CategoryHighlight"
import FilterBar from "@/components/ui/FilterBar"
import { getCategories } from "@/lib/data/categories"

function normalizeSort(
  sort?: string
): "rank" | "price_min" | "price_max_desc" | "views_count" | "created_at" {
  if (sort === "newest") return "created_at"
  if (sort === "price_asc") return "price_min"
  if (sort === "price_desc") return "price_max_desc"
  if (sort === "views_count") return "views_count"
  return "rank"
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    search?: string
    district?: string
    priceMin?: string
    priceMax?: string
    pool?: string
    kitchen?: string
    capacity?: string
    sort?: string
  }>
}) {
  const p = await searchParams
  const categories = await getCategories()
  const activeCategorySlug = p.category || null
  const activeCatId = activeCategorySlug
    ? categories.find((c) => c.slug === activeCategorySlug)?.id
    : undefined

  const hasFilters = !!(
    p.district ||
    p.priceMin ||
    p.priceMax ||
    p.pool ||
    p.kitchen ||
    p.capacity ||
    p.sort ||
    p.search
  )

  const listings = await getListingsWithMedia({
    categoryId: activeCatId,
    searchQuery: p.search,
    districtName: p.district,
    priceMin: p.priceMin ? parseInt(p.priceMin, 10) : undefined,
    priceMax: p.priceMax ? parseInt(p.priceMax, 10) : undefined,
    hasPool: p.pool === "1",
    hasKitchen: p.kitchen === "1",
    capacityMin: p.capacity ? parseInt(p.capacity, 10) : undefined,
    sortBy: normalizeSort(p.sort),
    limit: 20,
  })

  return (
    <div className="min-h-screen bg-white w-full max-w-[100vw] pb-20" dir="rtl">
      <CategoryHighlight mode="query" categories={categories} />

      <div className="mt-4 mb-2">
        <FilterBar />
      </div>

      <section className="mt-4 mb-12 w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-4 md:px-8 mb-4">
          <div>
            <h2 className="text-[20px] font-black text-gray-900 tracking-tight">
              {p.search
                ? `نتائج البحث عن: "${p.search}"`
                : hasFilters
                  ? "نتائج الفلترة"
                  : activeCategorySlug
                    ? `أفضل الـ ${categories.find((c) => c.slug === activeCategorySlug)?.label ?? ""}`
                    : "جميع الإعلانات"}
            </h2>
            {listings.length > 0 && (
              <p className="text-sm text-gray-400 font-medium">
                {listings.length} نتيجة
                {p.district && <span className="text-[#f63659]"> في {p.district}</span>}
              </p>
            )}
          </div>
        </div>

        {listings.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 px-4 md:hidden">
              {listings.map((item, index) => (
                <div key={item.listing_id} className="w-full min-w-0">
                  <ListingCard
                    listing={{
                      ...item,
                      district: Array.isArray(item.district) ? item.district[0] : item.district,
                      category: Array.isArray(item.category) ? item.category[0] : item.category,
                      provider: Array.isArray(item.provider) ? item.provider[0] : item.provider,
                    }}
                    position={index}
                  />
                </div>
              ))}
            </div>

            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-8">
              {listings.map((item, index) => (
                <ListingCard
                  key={item.listing_id}
                  listing={{
                    ...item,
                    district: Array.isArray(item.district) ? item.district[0] : item.district,
                    category: Array.isArray(item.category) ? item.category[0] : item.category,
                    provider: Array.isArray(item.provider) ? item.provider[0] : item.provider,
                  }}
                  position={index}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لم نجد نتائج</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              جرب تغيير الفلاتر أو توسيع نطاق البحث
            </p>
            <Link href="/" className="mt-6 text-[#f63659] font-bold hover:underline">
              عرض كل الإعلانات
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
