import ListingCard from './ListingCard'
import { ListingData } from './types'

interface Props {
    listings: ListingData[]
    variant?: 'grid' | 'list'
    emptyIcon?: string
    emptyText?: string
}

export default function ListingsGrid({
    listings,
    variant = 'grid',
    emptyIcon = '🏡',
    emptyText = 'لا توجد إعلانات بهذه الفلاتر',
}: Props) {
    if (listings.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">{emptyIcon}</div>
                <p className="text-gray-400 font-bold text-lg">{emptyText}</p>
            </div>
        )
    }

    // Debugging: Check if cover_url exists in listings
    console.log('ListingsGrid data:', listings.map((l) => ({ id: l.listing_id, cover_url: l.cover_url })))

    if (variant === 'list') {
        return (
            <div className="flex flex-col gap-3">
                {listings.map((l) => <ListingCard key={l.listing_id} listing={l} />)}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => <ListingCard key={l.listing_id} listing={l} />)}
        </div>
    )
}
