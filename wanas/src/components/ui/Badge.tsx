interface BadgeProps {
    label: string
    bg: string
    color: string
    size?: 'sm' | 'md'
}

export default function Badge({ label, bg, color, size = 'sm' }: BadgeProps) {
    const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
    return (
        <span
            className={`${padding} font-bold rounded-md inline-block`}
            style={{ backgroundColor: bg, color }}
        >
            {label}
        </span>
    )
}
