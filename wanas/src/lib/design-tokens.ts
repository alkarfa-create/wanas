export const colors = {
    primary: '#4C2494',
    secondary: '#FC9C4B',
    bg: '#FFF4E8',
    ink: '#2A2A2A',
    inkLight: '#6B7280',
    success: '#2FBF71',
    warning: '#F2C94C',
    danger: '#EB5757',
    white: '#FFFFFF',
    whatsapp: '#25D366',
} as const

export const categoryConfig: Record<string, {
    icon: string
    gradient: string
    color: string
    bg: string
}> = {
    chalet: { icon: '🏡', gradient: 'from-violet-50 to-violet-100', color: '#7C3AED', bg: '#F5F3FF' },
    coffee: { icon: '☕', gradient: 'from-amber-50 to-amber-100', color: '#D97706', bg: '#FFFBEB' },
    buffet: { icon: '🍽️', gradient: 'from-green-50 to-green-100', color: '#059669', bg: '#ECFDF5' },
    party: { icon: '🎉', gradient: 'from-pink-50 to-pink-100', color: '#DB2777', bg: '#FDF2F8' },
    games: { icon: '🎮', gradient: 'from-blue-50 to-blue-100', color: '#2563EB', bg: '#EFF6FF' },
    machine: { icon: '🍦', gradient: 'from-yellow-50 to-yellow-100', color: '#CA8A04', bg: '#FEFCE8' },
}

export const trustBadges = {
    verified: { label: '✓ موثّق', bg: '#EFF6FF', color: '#1D4ED8' },
    fast: { label: '⚡ رد سريع', bg: '#F0FDF4', color: '#15803D' },
    popular: { label: '🔥 الأكثر طلباً', bg: '#FFF7ED', color: '#C2410C' },
} as const
