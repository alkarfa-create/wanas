// src/app/sitemap.ts
import { supabaseAdmin } from '@/lib/supabase'
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://wanas.sa'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // جلب جميع الإعلانات المعتمدة
    const { data: listings } = await supabaseAdmin
        .from('listings')
        .select('listing_id, created_at, rank_score')
        .eq('status', 'approved')
        .order('rank_score', { ascending: false })

    // جلب التصنيفات
    const { data: categories } = await supabaseAdmin
        .from('service_categories')
        .select('slug')

    const listingUrls: MetadataRoute.Sitemap = (listings ?? []).map(l => ({
        url: `${BASE_URL}/listing/${l.listing_id}`,
        lastModified: new Date(l.created_at),
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    const categoryUrls: MetadataRoute.Sitemap = (categories ?? []).map(c => ({
        url: `${BASE_URL}/jeddah/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
    }))

    const staticUrls: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: `${BASE_URL}/add-listing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ]

    return [...staticUrls, ...categoryUrls, ...listingUrls]
}
