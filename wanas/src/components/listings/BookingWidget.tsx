'use client'

import { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface BookingWidgetProps {
    listingId: string
    listingTitle: string
    providerId: string
    categoryId: number
    districtId: number
    price: number | null
    rating: number
    providerPhone?: string | null
    isPro?: boolean          // ← جديد
    variant?: 'desktop' | 'mobile'
}

type Step = 'form' | 'loading' | 'success'

const EVENT_TYPES = ['عائلية', 'تخرج', 'زواج', 'خطوبة', 'عيد ميلاد', 'اجتماع عمل', 'أخرى']
const BRAND = '#f63659'

// خريطة الـ Cross-Sell حسب الفئة
const CROSS_SELL: Record<number, { icon: string; label: string; desc: string; slug: string }[]> = {
    1: [ // شاليهات
        { icon: '🍽️', label: 'بوفيهات', desc: 'أكمل جمعتك بأشهى البوفيهات', slug: 'buffets' },
        { icon: '🎮', label: 'ألعاب وترفيه', desc: 'أضف المتعة للمناسبة', slug: 'entertainment' },
        { icon: '🎉', label: 'تنسيق حفلات', desc: 'ديكور وإضاءة احترافية', slug: 'events' },
    ],
    2: [ // بوفيهات
        { icon: '🏡', label: 'شاليهات', desc: 'احجز المكان المناسب لمناسبتك', slug: 'chalets' },
        { icon: '🎉', label: 'تنسيق حفلات', desc: 'ديكور وإضاءة لتكتمل الصورة', slug: 'events' },
        { icon: '🎮', label: 'ألعاب وترفيه', desc: 'سهرة لا تُنسى للضيوف', slug: 'entertainment' },
    ],
    3: [ // ألعاب
        { icon: '🏡', label: 'شاليهات', desc: 'مكان مثالي للمناسبة', slug: 'chalets' },
        { icon: '🍽️', label: 'بوفيهات', desc: 'أطعمة فاخرة لضيوفك', slug: 'buffets' },
    ],
    4: [ // ضيافة
        { icon: '🏡', label: 'شاليهات', desc: 'احجز المكان المناسب', slug: 'chalets' },
        { icon: '🎉', label: 'تنسيق حفلات', desc: 'لمسة احترافية للمناسبة', slug: 'events' },
    ],
    5: [ // تنسيق حفلات
        { icon: '🏡', label: 'شاليهات', desc: 'المكان الأمثل لمناسبتك', slug: 'chalets' },
        { icon: '🍽️', label: 'بوفيهات', desc: 'ضيافة فاخرة لضيوفك', slug: 'buffets' },
    ],
}

const KEYFRAMES = `
    @keyframes wn-fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes wn-slideUp { from { transform: translateY(20px) scale(0.95); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
    @keyframes wn-spin { to { transform: rotate(360deg) } }
    .wn-overlay { animation: wn-fadeIn 0.2s ease; }
    .wn-box { animation: wn-slideUp 0.25s ease; }
    .wn-spin { animation: wn-spin 0.8s linear infinite; }
`

function formatPrice(price: unknown): string {
    const num = Number(price)
    if (!price || isNaN(num)) return 'تواصل لمعرفة السعر'
    return `${num.toLocaleString('en-US')} ر.س`
}

// ── شارة PRO ─────────────────────────────────
function ProBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
    return (
        <span
            className={`inline-flex items-center font-black tracking-wide rounded-full
                ${size === 'sm'
                    ? 'text-[9px] px-1.5 py-0.5'
                    : 'text-[10px] px-2 py-0.5'
                }`}
            style={{
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                color: '#fff',
            }}
        >
            ⭐ PRO
        </span>
    )
}

export default function BookingWidget({
    listingId, listingTitle, providerId,
    categoryId, districtId, price, rating, providerPhone,
    isPro = false,
    variant = 'desktop'
}: BookingWidgetProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState<Step>('form')
    const [requestRef, setRequestRef] = useState('')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formData, setFormData] = useState({
        name: '', phone: '966', date: '', eventType: '', guestsCount: '',
    })

    // 📅 حالات التحقق من التواريخ
    const [unavailableDates, setUnavailableDates] = useState<string[]>([])
    const [dateError, setDateError] = useState('')
    const [isLoadingDates, setIsLoadingDates] = useState(true)

    // جلب الأيام المحجوزة عند إضافة البيانات
    useEffect(() => {
        async function fetchUnavailableDates() {
            if (!listingId) return
            setIsLoadingDates(true)
            try {
                // الأيام المغلقة يدوياً
                const { data: blocked } = await supabaseBrowser
                    .from('blocked_dates')
                    .select('blocked_date')
                    .eq('listing_id', listingId)

                // الطلبات المقبولة
                const { data: bookedRequests } = await supabaseBrowser
                    .from('requests')
                    .select('event_date')
                    .eq('listing_id', listingId)
                    .eq('status', 'completed')

                const allBlocked = new Set([
                    ...(blocked?.map(b => b.blocked_date) || []),
                    ...(bookedRequests?.map(r => r.event_date).filter(Boolean) || [])
                ])

                setUnavailableDates(Array.from(allBlocked))
            } catch (err) {
                console.error("Error fetching dates:", err)
            } finally {
                setIsLoadingDates(false)
            }
        }
        
        // الجلب يتم بمجرد أن يفتح العميل النافذة
        if (isOpen) {
            fetchUnavailableDates()
        }
    }, [listingId, isOpen])

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const chosenDate = e.target.value
        
        if (unavailableDates.includes(chosenDate)) {
            setDateError('عذراً، هذا اليوم محجوز مسبقاً! 🔒 يرجى اختيار يوم آخر.')
            setFormData({ ...formData, date: '' })
        } else {
            setDateError('')
            setFormData({ ...formData, date: chosenDate })
        }
    }

    const displayPrice = formatPrice(price)
    const crossSellItems = CROSS_SELL[categoryId] ?? CROSS_SELL[1]

    function validate() {
        const e: Record<string, string> = {}
        if (!formData.name.trim()) e.name = 'الاسم مطلوب'
        if (!/^966\d{9}$/.test(formData.phone)) e.phone = 'رقم غير صحيح، يجب أن يبدأ بـ 966 ويكون 12 رقماً'
        if (!formData.eventType) e.eventType = 'اختر نوع المناسبة'
        return e
    }

    function openModal() { setStep('form'); setErrors({}); setIsOpen(true) }
    function closeModal() { setIsOpen(false); setTimeout(() => setStep('form'), 300) }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }
        setStep('loading')

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listing_id: listingId,
                    provider_id: providerId,
                    category_id: categoryId,
                    district_id: districtId,
                    customer_name: formData.name,
                    phone_number: formData.phone,
                    event_date: formData.date || null,
                    event_type: formData.eventType,
                    guests_count: formData.guestsCount ? parseInt(formData.guestsCount) : null,
                }),
            })

            const data = await res.json()
            const ref = data.request_ref ?? data.data?.request_ref ?? 'WN-00000'
            setRequestRef(ref)

            const arabicDate = formData.date
                ? new Date(formData.date).toLocaleDateString('ar-SA', {
                    weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
                })
                : 'لم يحدد'

            const message = `🎉 بشرى سارة! لديك حجز جديد\n\nوصلك طلب حجز جديد عبر منصة ونَس:\n\n• المكان: ${listingTitle}\n• المناسبة: ${formData.eventType}${formData.guestsCount ? ` (${formData.guestsCount} ضيف)` : ''}\n• التاريخ: ${arabicDate}\n• صاحب الطلب: ${formData.name}\n• جوال العميل: ${formData.phone}\n• رقم الطلب: ${ref}\n\n🌊 ونَس — نجمعكم في أجمل اللحظات`

            if (!providerPhone) {
                setErrors({ submit: 'رقم واتساب غير متوفر لهذا المزود حالياً' })
                setStep('form')
                return
            }

            fetch(`/api/listings/${listingId}/click`, { method: 'POST' })
            window.open(`https://wa.me/${providerPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
            setStep('success')
        } catch (err) {
            setErrors({ submit: 'حدث خطأ، حاول مرة أخرى' })
            setStep('form')
        }
    }

    const Modal = isOpen ? (
        <>
            <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
            <div className="wn-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
                <div className="absolute inset-0" onClick={closeModal} />
                <div className="wn-box relative w-full max-w-[480px] bg-white rounded-[32px] p-6 shadow-2xl overflow-y-auto max-h-[90vh] pb-10" onClick={e => e.stopPropagation()}>

                    <button onClick={closeModal} className="absolute top-5 left-5 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors z-10">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-gray-600 stroke-2 fill-none">
                            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {step === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="wn-spin w-10 h-10 rounded-full border-4 border-gray-200" style={{ borderTopColor: BRAND }} />
                            <p className="font-bold text-gray-700">جارٍ إرسال طلبك...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center pt-4 gap-4 text-center">
                            {/* أيقونة النجاح */}
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-green-500 stroke-2 fill-none">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-900">تم إرسال طلبك! 🎉</h3>

                            {/* رقم الطلب */}
                            <div className="bg-gray-50 rounded-2xl p-4 w-full text-right">
                                <p className="text-xs text-gray-400 font-bold mb-1">رقم طلبك — احتفظ به للتقييم لاحقاً</p>
                                <p className="text-2xl font-black tracking-widest" style={{ color: BRAND }}>{requestRef}</p>
                            </div>

                            <p className="text-sm text-gray-500 font-bold leading-relaxed">
                                تم إرسال طلبك للمزود عبر واتساب.<br />سيتم التواصل معك خلال دقائق.
                            </p>

                            {/* Cross-Sell */}
                            <div className="w-full border-t border-gray-100 pt-4 mt-1">
                                <p className="text-xs font-black text-gray-400 mb-3 tracking-wide uppercase">أكمل جمعتك ✨</p>
                                <div className="flex flex-col gap-2">
                                    {crossSellItems.map(item => (
                                        <Link key={item.slug}
                                            href={`/?category=${item.slug}`}
                                            onClick={closeModal}
                                            className="flex items-center gap-3 bg-gray-50 hover:bg-rose-50 border border-gray-100 hover:border-rose-100 rounded-2xl px-4 py-3 transition-all group text-right">
                                            <span className="text-2xl shrink-0">{item.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-gray-800 group-hover:text-[#f63659]">{item.label}</p>
                                                <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
                                            </div>
                                            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-gray-300 group-hover:stroke-[#f63659] stroke-2 fill-none shrink-0 rotate-180">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <button onClick={closeModal} className="w-full text-white py-3 rounded-2xl font-black hover:opacity-90 transition-all active:scale-95" style={{ backgroundColor: BRAND }}>
                                إغلاق
                            </button>
                        </div>
                    )}

                    {step === 'form' && (
                        <>
                            <div className="mb-6 pr-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-black text-gray-900">طلب حجز</h3>
                                    {isPro && <ProBadge />}
                                </div>
                                <p className="text-sm text-gray-500 truncate font-bold">{listingTitle}</p>
                            </div>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div>
                                    <input type="text" placeholder="الاسم الكريم *"
                                        className={`w-full bg-gray-50 border rounded-2xl py-3.5 px-4 text-sm font-bold outline-none transition-colors ${errors.name ? 'border-red-400' : 'border-gray-200 focus:border-[#f63659]'}`}
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    {errors.name && <p className="text-xs text-red-500 mt-1 font-bold">{errors.name}</p>}
                                </div>
                                <div>
                                    <input type="tel" placeholder="966XXXXXXXXX *" dir="ltr"
                                        className={`w-full bg-gray-50 border rounded-2xl py-3.5 px-4 text-sm font-bold outline-none text-left transition-colors ${errors.phone ? 'border-red-400' : 'border-gray-200 focus:border-[#f63659]'}`}
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1 font-bold">{errors.phone}</p>}
                                </div>
                                <div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="date"
                                            disabled={isLoadingDates}
                                            className={`w-full bg-gray-50 border rounded-2xl py-3.5 px-3 text-xs font-bold outline-none transition-colors ${
                                                dateError ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-200 focus:border-[#f63659]'
                                            } ${isLoadingDates ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            value={formData.date} min={new Date().toISOString().split('T')[0]}
                                            onChange={handleDateChange} />
                                        <select
                                            className={`w-full bg-gray-50 border rounded-2xl py-3.5 px-3 text-xs font-bold outline-none cursor-pointer transition-colors ${errors.eventType ? 'border-red-400' : 'border-gray-200 focus:border-[#f63659]'}`}
                                            value={formData.eventType} onChange={e => setFormData({ ...formData, eventType: e.target.value })}>
                                            <option value="" disabled>المناسبة *</option>
                                            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    {dateError && <p className="text-xs text-rose-500 font-bold mt-1.5">{dateError}</p>}
                                    {errors.eventType && !dateError && <p className="text-xs text-red-500 font-bold mt-1.5">{errors.eventType}</p>}
                                </div>
                                <input type="number" placeholder="عدد الضيوف (اختياري)" min="1"
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#f63659] rounded-2xl py-3.5 px-4 text-sm font-bold outline-none transition-colors"
                                    value={formData.guestsCount} onChange={e => setFormData({ ...formData, guestsCount: e.target.value })} />
                                {errors.submit && <p className="text-sm text-red-500 text-center font-bold">{errors.submit}</p>}
                                <button type="submit" disabled={!!dateError || isLoadingDates} className="mt-2 w-full text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 shadow-md" style={{ backgroundColor: (!!dateError || isLoadingDates) ? '#9CA3AF' : BRAND }}>
                                    <span>💬</span><span>إرسال عبر واتساب</span>
                                </button>
                                <p className="text-center text-xs text-gray-400 font-bold">سيتم إرسال طلبك للمزود مباشرة عبر واتساب</p>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </>
    ) : null

    if (variant === 'mobile') {
        return (
            <Fragment>
                <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col text-right">
                        <span className="text-xl font-black text-gray-900">{displayPrice}</span>
                        {isPro && <ProBadge size="sm" />}
                    </div>
                    <button onClick={openModal} className="px-8 py-3 rounded-xl font-black text-white text-sm shadow-md transition-all active:scale-95" style={{ backgroundColor: BRAND }}>
                        تواصل للحجز الآن
                    </button>
                </div>
                {Modal}
            </Fragment>
        )
    }

    return (
        <Fragment>
            <div className="border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 bg-white">
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-3xl font-black text-gray-900">{displayPrice}</span>
                            {price && <span className="text-sm font-medium text-gray-400">/ ليلة</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {rating ? (
                                <div className="flex items-center gap-1">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-amber-400">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    <span className="text-sm font-black text-gray-900">{rating}</span>
                                </div>
                            ) : (
                                <span className="text-xs font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">✨ جديد</span>
                            )}
                            {isPro && <ProBadge />}
                        </div>
                    </div>
                    <button onClick={openModal} className="w-full py-4 rounded-2xl font-black text-white text-lg hover:opacity-95 shadow-lg shadow-rose-200 transition-all active:scale-[0.98]" style={{ backgroundColor: BRAND }}>
                        تواصل للحجز الآن
                    </button>
                    <p className="text-center text-xs text-gray-400 font-bold">لن يتم خصم أي مبلغ الآن</p>
                </div>
            </div>
            {Modal}
        </Fragment>
    )
}
