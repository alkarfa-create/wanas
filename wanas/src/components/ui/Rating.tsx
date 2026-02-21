interface RatingProps {
    score?: number
    count?: number
    size?: 'sm' | 'md'
}

export default function Rating({ score = 4.8, count, size = 'sm' }: RatingProps) {
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
    return (
        <div className={`flex items-center gap-1 ${textSize}`}>
            <span className="text-yellow-500">★</span>
            <span className="font-black text-gray-800">{score.toFixed(1)}</span>
            {count && <span className="text-gray-400">({count})</span>}
        </div>
    )
}
