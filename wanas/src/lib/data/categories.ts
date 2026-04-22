import { supabaseAdmin } from '@/lib/supabase'
import { CATEGORY_META } from '@/lib/categoryMeta'

export interface CategoryItem {
    id: number
    slug: string
    label: string
    icon: string
    isNew: boolean
    badgeColor?: string
    description?: string
    color: string
}

export async function getCategories(): Promise<CategoryItem[]> {
    try {
        const { data: categories, error } = await supabaseAdmin
            .from('service_categories')
            .select('category_id, name_ar, slug, icon_key')
            .order('category_id', { ascending: true })

        if (error) {
            console.error('Error fetching categories:', JSON.stringify(error), error.message, error.code)
            return []
        }

        if (!categories) return [];

        return categories.map(cat => {
            const meta = CATEGORY_META[cat.icon_key] || CATEGORY_META['other'] || {
                icon: '📍',
                color: 'from-gray-50 to-gray-100',
                description: ''
            }

            return {
                id: cat.category_id,
                slug: cat.slug,
                label: cat.name_ar,
                icon: meta.icon,
                isNew: meta.isNew || false,
                badgeColor: meta.badgeColor,
                description: meta.description,
                color: meta.color
            }
        })
    } catch (err: any) {
        console.error('Error fetching categories runtime:', err.message)
        return []
    }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryItem | null> {
    const categories = await getCategories()
    return categories.find(c => c.slug === slug) || null
}
