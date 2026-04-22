'use client'
// src/components/ui/FilterBar.tsx

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'

const SORT_OPTIONS = [
    { value: 'rank', label: 'الأكثر تميزاً' },
    { value: 'newest', label: 'الأحدث' },
    { value: 'price_asc', label: 'السعر: الأقل' },
    { value: 'price_desc', label: 'السعر: الأعلى' },
]

const CAPACITY_OPTIONS = [
    { value: '', label: 'أي عدد' },
    { value: '10', label: '10+' },
    { value: '20', label: '20+' },
    { value: '50', label: '50+' },
    { value: '100', label: '100+' },
]

export default function FilterBar() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    const [district, setDistrict] = useState(searchParams.get('district') ?? '')
    const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') ?? '')
    const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') ?? '')
    const [hasPool, setHasPool] = useState(searchParams.get('pool') === '1')
    const [hasKitchen, setHasKitchen] = useState(searchParams.get('kitchen') === '1')
    const [capacity, setCapacity] = useState(searchParams.get('capacity') ?? '')
    const [sortBy, setSortBy] = useState(searchParams.get('sort') ?? 'rank')

    const activeCount = [
        district, priceMin, priceMax,
        hasPool ? '1' : '', hasKitchen ? '1' : '', capacity,
        sortBy !== 'rank' ? sortBy : ''
    ].filter(Boolean).length

    function applyFilters() {
        const params = new URLSearchParams(searchParams.toString())
        const set = (k: string, v: string) => v ? params.set(k, v) : params.delete(k)
        set('district', district)
        set('priceMin', priceMin)
        set('priceMax', priceMax)
        set('pool', hasPool ? '1' : '')
        set('kitchen', hasKitchen ? '1' : '')
        set('capacity', capacity)
        set('sort', sortBy !== 'rank' ? sortBy : '')
        startTransition(() => router.push(`${pathname}?${params.toString()}`))
        setOpen(false)
    }

    function clearAll() {
        setDistrict(''); setPriceMin(''); setPriceMax('')
        setHasPool(false); setHasKitchen(false); setCapacity(''); setSortBy('rank')
        const params = new URLSearchParams(searchParams.toString())
            ;['district', 'priceMin', 'priceMax', 'pool', 'kitchen', 'capacity', 'sort'].forEach(k => params.delete(k))
        startTransition(() => router.push(`${pathname}?${params.toString()}`))
        setOpen(false)
    }

    return (
        <div className="relative" dir="rtl">
            {/* شريط الفلاتر السريعة */}
            <div className="flex items-center gap-2 px-4 md:px-8 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                {/* زر الفلاتر */}
                <button onClick={() => setOpen(o => !o)}
                    className={`flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl border text-sm font-black transition-all ${open || activeCount > 0 ? 'bg-[#f63659] text-white border-[#f63659]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                    <SlidersHorizontal size={15} />
                    <span>فلترة</span>
                    {activeCount > 0 && (
                        <span className="bg-white text-[#f63659] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                            {activeCount}
                        </span>
                    )}
                </button>

                {/* الترتيب السريع */}
                {SORT_OPTIONS.map(s => (
                    <button key={s.value}
                        onClick={() => {
                            setSortBy(s.value)
                            const params = new URLSearchParams(searchParams.toString())
                            s.value !== 'rank' ? params.set('sort', s.value) : params.delete('sort')
                            startTransition(() => router.push(`${pathname}?${params.toString()}`))
                        }}
                        className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-black transition-all whitespace-nowrap ${sortBy === s.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                        {s.label}
                    </button>
                ))}

                {/* مسبح */}
                <button onClick={() => {
                    const next = !hasPool
                    setHasPool(next)
                    const params = new URLSearchParams(searchParams.toString())
                    next ? params.set('pool', '1') : params.delete('pool')
                    startTransition(() => router.push(`${pathname}?${params.toString()}`))
                }}
                    className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-black transition-all ${hasPool ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                    🏊 مسبح
                </button>

                {/* مطبخ */}
                <button onClick={() => {
                    const next = !hasKitchen
                    setHasKitchen(next)
                    const params = new URLSearchParams(searchParams.toString())
                    next ? params.set('kitchen', '1') : params.delete('kitchen')
                    startTransition(() => router.push(`${pathname}?${params.toString()}`))
                }}
                    className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-black transition-all ${hasKitchen ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                    🍳 مطبخ
                </button>

                {/* مسح الكل */}
                {activeCount > 0 && (
                    <button onClick={clearAll}
                        className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-500 text-xs font-black hover:bg-red-100 transition-colors">
                        <X size={12} /> مسح
                    </button>
                )}
            </div>

            {/* درج الفلاتر التفصيلية */}
            {open && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="absolute top-full right-4 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-5 flex flex-col gap-4">

                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-900">فلاتر البحث</h3>
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>

                        {/* الحي */}
                        <div>
                            <label className="text-xs font-black text-gray-600 block mb-1.5">الحي</label>
                            <input value={district} onChange={e => setDistrict(e.target.value)}
                                placeholder="ابحث عن حي..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#f63659] transition-colors" />
                        </div>

                        {/* السعر */}
                        <div>
                            <label className="text-xs font-black text-gray-600 block mb-1.5">نطاق السعر (ر.س)</label>
                            <div className="flex gap-2">
                                <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)}
                                    placeholder="من"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#f63659] transition-colors" />
                                <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)}
                                    placeholder="إلى"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#f63659] transition-colors" />
                            </div>
                        </div>

                        {/* السعة */}
                        <div>
                            <label className="text-xs font-black text-gray-600 block mb-1.5">عدد الضيوف</label>
                            <div className="flex flex-wrap gap-2">
                                {CAPACITY_OPTIONS.map(c => (
                                    <button key={c.value} onClick={() => setCapacity(c.value)}
                                        className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${capacity === c.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* الخصائص */}
                        <div>
                            <label className="text-xs font-black text-gray-600 block mb-1.5">الخصائص</label>
                            <div className="flex gap-2">
                                <button onClick={() => setHasPool(p => !p)}
                                    className={`flex-1 py-2 rounded-xl border text-xs font-black transition-all ${hasPool ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    🏊 مسبح
                                </button>
                                <button onClick={() => setHasKitchen(k => !k)}
                                    className={`flex-1 py-2 rounded-xl border text-xs font-black transition-all ${hasKitchen ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    🍳 مطبخ
                                </button>
                            </div>
                        </div>

                        {/* أزرار */}
                        <div className="flex gap-2 pt-1 border-t border-gray-50">
                            <button onClick={clearAll}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-black text-gray-600 hover:bg-gray-50 transition-colors">
                                مسح الكل
                            </button>
                            <button onClick={applyFilters} disabled={isPending}
                                className="flex-1 py-2.5 rounded-xl text-xs font-black text-white transition-all disabled:opacity-60"
                                style={{ backgroundColor: '#f63659' }}>
                                {isPending ? '...' : 'تطبيق الفلاتر'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
