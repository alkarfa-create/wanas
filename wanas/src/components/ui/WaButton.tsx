interface WaButtonProps {
    phone: string
    message?: string
    size?: 'sm' | 'md' | 'lg'
    full?: boolean
}

export default function WaButton({ phone, message = '', size = 'md', full = false }: WaButtonProps) {
    const encoded = encodeURIComponent(message)
    const href = `https://wa.me/${phone}?text=${encoded}`

    const sizeClass = {
        sm: 'h-8  px-3 text-xs  gap-1',
        md: 'h-10 px-4 text-sm  gap-1.5',
        lg: 'h-12 px-6 text-base gap-2',
    }[size]

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`
        ${sizeClass} ${full ? 'w-full justify-center' : ''}
        inline-flex items-center font-black text-white rounded-xl
        transition-all hover:opacity-90 hover:-translate-y-0.5
        shadow-sm active:translate-y-0
      `}
            style={{ background: 'linear-gradient(135deg, #25D366, #1DA851)' }}
        >
            <span>💬</span>
            <span>تواصل واتساب</span>
        </a>
    )
}
