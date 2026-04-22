// src/app/(public)/profile/[id]/page.tsx
import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic' // ✅ إجبار السيرفر على جلب بيانات جديدة دائماً

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const { data: provider, error: providerError } = await supabaseAdmin
        .from('providers')
        .select('*')
        .eq('provider_id', id)
        .single()

    if (providerError || !provider) return notFound()

    // جلب الإعلانات + الطلبات + التقييمات بالتوازي
    const [listingsResult, requestsResult, reviewsResult] = await Promise.all([
        supabaseAdmin
            .from('listings')
            .select(`
                listing_id, 
                title, 
                status, 
                price_min, 
                price_label,
                cover_url,
                views_count, 
                clicks_count, 
                created_at,
                category:service_categories(name_ar, icon_key)
            `)
            .eq('provider_id', id)
            .order('created_at', { ascending: false }),
        
        supabaseAdmin
            .from('requests')
            .select('*')
            .eq('provider_id', id)
            .order('created_at', { ascending: false }),

        supabaseAdmin
            .from('reviews')
            .select('*')
            .eq('provider_id', id)
    ])

    const listings = listingsResult.data || [] // ✅ التأكد من استخراج المصفوفة
    const requests = requestsResult.data || []
    const reviews  = reviewsResult.data || []

    // 🕵️ تدقيق برمجي (سيظهر في التيرمينال عندك)
    console.log(`Provider: ${provider.display_name} | Listings found: ${listings.length}`)

    // حساب حالة PRO
    const now = new Date()
    const hasFullAccess = provider.subscription_tier === 'pro' && 
                         provider.subscription_ended_at && 
                         new Date(provider.subscription_ended_at) > now

    const stats = {
        totalViews: listings.reduce((s, l) => s + (l.views_count ?? 0), 0),
        totalClicks: listings.reduce((s, l) => s + (l.clicks_count ?? 0), 0),
        activeListings: listings.filter(l => l.status === 'approved').length,
        totalRequests: requests.length
    }

    return (
        <ProfileClient
            provider={provider as any}
            listings={listings as any[]} // ✅ نمرر الإعلانات الثلاثة هنا
            requests={requests as any[]}
            reviews={reviews as any[]}
            hasFullAccess={hasFullAccess}
            stats={stats}
        />
    )
}