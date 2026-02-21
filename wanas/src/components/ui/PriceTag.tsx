interface PriceTagProps {
    priceMin: number | null
    priceMax?: number | null
    priceLabel?: string | null
    size?: 'sm' | 'md' | 'lg'
}

export default function PriceTag({ priceMin, priceLabel, size = 'md' }: PriceTagProps) {
    const text = priceLabel ?? (priceMin ? priceMin.toLocaleString('ar-SA') : null)
    if (!text) return <span className="text-xs text-gray-400">تواصل للسعر</span>

    const numSize = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }[size]

    return (
        <div className="flex items-baseline gap-1">
            <span className={`font-black ${numSize}`} style={{ color: '#4C2494' }}>
                {priceMin ? priceMin.toLocaleString('ar-SA') : text}
            </span>
            {priceMin && <span className="text-xs text-gray-400">ر.س / ليلة</span>}
        </div>
    )
}
