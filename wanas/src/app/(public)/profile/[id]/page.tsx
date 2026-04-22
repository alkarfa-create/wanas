// src/app/(public)/profile/[id]/page.tsx
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: provider, error: providerError } = await supabaseAdmin
    .from('providers')
    .select('*')
    .eq('provider_id', id)
    .single()

  if (providerError || !provider) return notFound()

  const { data: listingsData } = await supabaseAdmin
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
    .order('created_at', { ascending: false })

  const listings = listingsData ?? []

  const stats = {
    totalViews: listings.reduce((sum, listing) => sum + (listing.views_count ?? 0), 0),
    totalClicks: listings.reduce((sum, listing) => sum + (listing.clicks_count ?? 0), 0),
    activeListings: listings.filter((listing) => listing.status === 'approved').length,
    totalListings: listings.length,
  }

  return (
    <ProfileClient
      provider={provider as any}
      listings={listings as any[]}
      stats={stats}
    />
  )
}
