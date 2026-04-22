export const CATEGORY_META: Record<string, {
    icon: string
    color: string
    isNew?: boolean
    badgeColor?: string
    description?: string
}> = {
    chalet: { icon: '🏠', color: 'from-blue-50 to-cyan-50', description: 'اكتشف أفضل الشاليهات والمنتجعات الخاصة' },
    coffee: { icon: '☕', color: 'from-orange-50 to-amber-50', description: 'خدمات ضيافة متكاملة لمناسباتكم' },
    buffet: { icon: '🍽️', color: 'from-red-50 to-rose-50', isNew: true, badgeColor: 'bg-orange-500', description: 'تشكيلة واسعة من البوفيهات الفاخرة' },
    party: { icon: '🎉', color: 'from-purple-50 to-indigo-50', isNew: true, badgeColor: 'bg-purple-600', description: 'نسق حفلتك القادمة مع أفضل المبدعين' },
    games: { icon: '🎮', color: 'from-green-50 to-emerald-50', description: 'ألعاب ترفيهية لجميع الأعمار' },
    machine: { icon: '🍦', color: 'from-yellow-50 to-yellow-100', description: 'تأجير آلات وتجهيزات للمناسبات' },
    icecream: { icon: '🍿', color: 'from-pink-50 to-rose-50', isNew: true, badgeColor: 'bg-pink-500', description: 'آيسكريم' },
}

export type CategoryMeta = typeof CATEGORY_META[string]
