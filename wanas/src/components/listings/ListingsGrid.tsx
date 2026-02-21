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

    if (variant === 'list') {
        return (
            <div className="flex flex-col gap-3">
                {listings.map((l) => <ListingCard key={l.listing_id} listing={l} />)}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => <ListingCard key={l.listing_id} listing={l} />)}
        </div>
    )
}
