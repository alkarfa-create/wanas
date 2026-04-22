import { getListingsWithMedia } from '@/lib/data/listings'
import CategoryHighlight from '@/components/ui/CategoryHighlight'
import ListingCard from '@/components/listings/ListingCard'
import PageTransitionWrapper from '@/components/ui/PageTransitionWrapper'
import { getCategories, getCategoryBySlug } from '@/lib/data/categories'

interface PageProps {
    params: Promise<{ category: string }>
    searchParams: Promise<{ district?: string; price?: string; capacity?: string }>
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
    const resolvedParams = await params
    await searchParams
    const categories = await getCategories()
    const cat = await getCategoryBySlug(resolvedParams.category)

    if (!cat) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-bounce text-6 shadow-2xl p-4 bg-white rounded-full mb-4">🚫</div>
                <p className="text-gray-500 font-black text-2xl tracking-tight">القسم غير موجود</p>
            </div>
        )
    }

    const listings = await getListingsWithMedia({
        categoryId: cat.id,
        limit: 20
    })

    return (
        // أضفت تدرج لوني ناعم جداً يتغير حسب الفئة في الخلفية
        <div className={`min-h-screen transition-colors duration-1000 bg-gradient-to-b ${cat.color}`}>
            <CategoryHighlight categories={categories} currentCategory={resolvedParams.category} />

            {/* نغلف المحتوى بمكون حركي للتحكم في الدخول والخروج */}
            <PageTransitionWrapper key={resolvedParams.category}>
                <main className="max-w-[1440px] mx-auto px-6 py-12">

                    {/* رأس الصفحة الديناميكي (Dynamic Header) */}
                    <div className="mb-10 text-right">
                        <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3 justify-end">
                            <span>{cat.label}</span>
                            <span className="text-5xl">{cat.icon}</span>
                        </h1>
                        <p className="text-gray-500 mt-2 mr-2 font-medium">{cat.description}</p>
                    </div>

                    {listings.length === 0 ? (
                        <div className="text-center py-32 bg-white/40 backdrop-blur-xl rounded-3xl border border-white shadow-sm">
                            <div className="text-8xl mb-6 animate-pulse opacity-50">{cat.icon}</div>
                            <p className="text-gray-600 font-black text-xl">لا توجد إعلانات متاحة حالياً</p>
                            <button className="mt-4 text-blue-600 font-bold hover:underline">أبلغني عند توفر جديد</button>
                        </div>
                    ) : (
                        // Grid مطور مع تأثير Cascade
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 md:gap-8">
                            {listings.map((listing) => (
                                <div
                                    key={listing.listing_id}
                                    className="transform transition-all duration-500"
                                >
                                    <ListingCard
                                        listing={{
                                            ...listing,
                                            district: Array.isArray(listing.district) ? listing.district[0] : listing.district,
                                            category: Array.isArray(listing.category) ? listing.category[0] : listing.category,
                                            provider: Array.isArray(listing.provider) ? listing.provider[0] : listing.provider
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </PageTransitionWrapper>
        </div>
    )
}
