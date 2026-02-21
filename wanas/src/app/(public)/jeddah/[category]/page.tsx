import { supabaseAdmin } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import CategoryHighlight from '@/components/ui/CategoryHighlight'

import ListingCard from '@/components/listings/ListingCard'
import { ListingData } from '@/components/listings/types'
import { Suspense } from 'react'

const CATEGORY_MAP: Record<string, { id: number; name: string; icon: string }> = {
    chalets: { id: 1, name: 'شاليهات', icon: '🏡' },
    hospitality: { id: 2, name: 'ضيافة', icon: '☕' },
    catering: { id: 3, name: 'بوفيهات', icon: '🍽️' },
    events: { id: 4, name: 'تنسيق حفلات', icon: '🎉' },
    entertainment: { id: 5, name: 'الألعاب', icon: '🎮' },
    rentals: { id: 6, name: 'تأجير الآلات', icon: '🍦' },
}

interface PageProps {
    params: Promise<{ category: string }>
    searchParams: Promise<{ district?: string; price?: string; capacity?: string }>
}

async function getListings(categoryId: number, filters: { district?: string; price?: string; capacity?: string }) {
    let query = supabaseAdmin
        .from('listings')
        .select(`
      listing_id, title, price_min, price_max, price_label,
      capacity_min, capacity_max, rank_score, features,
      district:districts(name_ar),
      category:service_categories(name_ar, icon_key),
      provider:providers(display_name, phone_whatsapp, verification_status, trust_score)
    `)
        .eq('status', 'approved')
        .eq('category_id', categoryId)
        .order('rank_score', { ascending: false })

    // Filter: price
    if (filters.price) {
        const [min, max] = filters.price.split('-').map(Number)
        query = query.gte('price_min', min).lte('price_min', max)
    }

    // Filter: capacity
    if (filters.capacity) {
        const [, max] = filters.capacity.split('-').map(Number)
        query = query.lte('capacity_max', max)
    }

    const { data, error } = await query.limit(20)
    if (error) { console.error(error); return [] }
    return (data ?? []) as unknown as ListingData[]
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams

    const cat = CATEGORY_MAP[resolvedParams.category]

    if (!cat) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-400 font-bold">القسم غير موجود</p>
            </div>
        )
    }

    const listings = await getListings(cat.id, resolvedSearchParams)

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <CategoryHighlight currentCategory={resolvedParams.category} />

            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* Grid */}
                {listings.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">{cat.icon}</div>
                        <p className="text-gray-400 font-bold text-lg">لا توجد إعلانات بهذه الفلاتر</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {listings.map((listing) => (
                            <ListingCard key={listing.listing_id} listing={listing} />
                        ))}
                    </div>
                )}

            </main>
        </div>
    )
}
