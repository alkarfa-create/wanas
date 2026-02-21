'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const DISTRICTS = [
    { id: 1, slug: 'al-zahrah', name: 'الزهراء' },
    { id: 2, slug: 'al-rawdah', name: 'الروضة' },
    { id: 3, slug: 'al-hamra', name: 'الحمراء' },
    { id: 4, slug: 'al-shati', name: 'الشاطئ' },
    { id: 5, slug: 'al-nuzhah', name: 'النزهة' },
    { id: 6, slug: 'al-safa', name: 'الصفا' },
    { id: 7, slug: 'al-rabwah', name: 'الربوة' },
    { id: 8, slug: 'al-salamah', name: 'السلامة' },
]

const PRICES = [
    { label: 'أقل من 500', value: '0-500' },
    { label: '500 — 1000', value: '500-1000' },
    { label: '1000 — 2000', value: '1000-2000' },
    { label: 'أكثر من 2000', value: '2000-99999' },
]

const CAPACITIES = [
    { label: 'حتى 20', value: '1-20' },
    { label: 'حتى 50', value: '1-50' },
    { label: 'حتى 100', value: '1-100' },
    { label: '100+', value: '100-999' },
]

export default function FilterBar() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const activeDistrict = searchParams.get('district') ?? ''
    const activePrice = searchParams.get('price') ?? ''
    const activeCap = searchParams.get('capacity') ?? ''

    function setFilter(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (params.get(key) === value) {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    function clearAll() {
        router.push(pathname)
    }

    const hasFilters = activeDistrict || activePrice || activeCap

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">

            {/* Districts */}
            <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 mb-2 tracking-wide">الحي</p>
                <div className="flex gap-2 flex-wrap">
                    {DISTRICTS.map((d) => (
                        <button
                            key={d.slug}
                            onClick={() => setFilter('district', d.slug)}
                            style={activeDistrict === d.slug
                                ? { backgroundColor: '#4C2494', color: 'white' }
                                : { backgroundColor: '#f5f3ff', color: '#4C2494' }
                            }
                            className="text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                        >
                            {d.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price */}
            <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 mb-2 tracking-wide">السعر (ريال)</p>
                <div className="flex gap-2 flex-wrap">
                    {PRICES.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setFilter('price', p.value)}
                            style={activePrice === p.value
                                ? { backgroundColor: '#FC9C4B', color: 'white' }
                                : { backgroundColor: '#fff7ed', color: '#FC9C4B' }
                            }
                            className="text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Capacity */}
            <div className="mb-3">
                <p className="text-xs font-bold text-gray-400 mb-2 tracking-wide">السعة</p>
                <div className="flex gap-2 flex-wrap">
                    {CAPACITIES.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => setFilter('capacity', c.value)}
                            style={activeCap === c.value
                                ? { backgroundColor: '#2FBF71', color: 'white' }
                                : { backgroundColor: '#f0fdf4', color: '#2FBF71' }
                            }
                            className="text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clear */}
            {hasFilters && (
                <button
                    onClick={clearAll}
                    className="text-xs text-red-400 font-bold hover:text-red-600 transition-colors"
                >
                    ✕ مسح الفلاتر
                </button>
            )}
        </div>
    )
}
