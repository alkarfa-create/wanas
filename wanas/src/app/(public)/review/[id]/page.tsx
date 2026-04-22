'use client'
// src/app/(public)/review/[id]/page.tsx

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

const CRITERIA = [
    { key: 'hygiene', label: 'الجودة والسلامة الصحية', icon: '🧼', desc: 'النظافة والتعقيم وجودة التجهيزات' },
    { key: 'accuracy', label: 'الموثوقية والمطابقة', icon: '✅', desc: 'توافق الخدمة مع الصور والأوصاف' },
    { key: 'communication', label: 'كفاءة التواصل', icon: '💬', desc: 'سرعة ووضوح الاستجابة ومهنية التعامل' },
    { key: 'location', label: 'دقة الموقع والتنفيذ', icon: '📍', desc: 'دقة الموقع والالتزام بالموعد' },
    { key: 'checkin', label: 'انسيابية التسليم والخدمة', icon: '🚀', desc: 'سهولة الاستلام وخلو التجربة من التعقيد' },
    { key: 'value', label: 'الكفاءة مقابل التكلفة', icon: '💰', desc: 'جودة التجربة مقارنة بالسعر المدفوع' },
]

const STARS = [1, 2, 3, 4, 5]

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hovered, setHovered] = useState(0)
    return (
        <div className="flex gap-1.5">
            {STARS.map(s => (
                <button key={s} type="button"
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(s)}
                    className="transition-transform hover:scale-110 active:scale-95">
                    <svg viewBox="0 0 32 32" className={`w-8 h-8 transition-colors ${s <= (hovered || value) ? 'fill-amber-400' : 'fill-gray-200'}`}>
                        <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.736l7.293 6.565-1.965 9.852a1 1 0 0 0 1.483 1.061L16 26.322l8.625 4.626a1 1 0 0 0 1.483-1.061l-1.965-9.852 7.293-6.565a1 1 0 0 0-.542-1.736l-9.86-1.27-4.124-8.885a1 1 0 0 0-1.816 0z" />
                    </svg>
                </button>
            ))}
        </div>
    )
}

type Step = 'verify' | 'rate' | 'done'

export default function ReviewPage() {
    const params = useParams()
    const requestId = params.id as string

    const [step, setStep] = useState<Step>('verify')
    const [refInput, setRefInput] = useState('')
    const [request, setRequest] = useState<any>(null)
    const [verifyError, setVerifyError] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [ratings, setRatings] = useState<Record<string, number>>({})
    const [comment, setComment] = useState('')
    const [wouldRepeat, setWouldRepeat] = useState<boolean | null>(null)

    const avgRating = Object.values(ratings).length > 0
        ? Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length
        : 0

    const allRated = CRITERIA.every(c => ratings[c.key] >= 1)

    async function handleVerify() {
        if (!refInput.trim()) { setVerifyError('أدخل رقم الحجز'); return }
        setVerifying(true)
        setVerifyError('')

        const { data } = await supabaseBrowser
            .from('requests')
            .select('request_id, request_ref, visitor_name, listing_id, listing:listings(title), status')
            .eq('request_id', requestId)
            .eq('request_ref', refInput.trim().toUpperCase())
            .single()

        if (!data) {
            setVerifyError('رقم الحجز غير صحيح. تأكد من الرقم وأعد المحاولة.')
            setVerifying(false)
            return
        }

        const { data: existing } = await supabaseBrowser
            .from('reviews')
            .select('review_id')
            .eq('request_id', requestId)
            .single()

        if (existing) {
            setVerifyError('لقد قيّمت هذا الحجز مسبقاً. شكراً لك!')
            setVerifying(false)
            return
        }

        setRequest(data)
        setStep('rate')
        setVerifying(false)
    }

    async function handleSubmit() {
        if (!allRated || wouldRepeat === null) return
        setSubmitting(true)

        const { error } = await supabaseBrowser
            .from('reviews')
            .insert({
                request_id: requestId,
                listing_id: request.listing_id,
                rating: Math.round(avgRating),
                reasons: ratings,
                would_repeat: wouldRepeat,
                provider_responded: false,
                fraud_flags: {},
            })

        if (!error) setStep('done')
        setSubmitting(false)
    }

    if (step === 'verify') return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">⭐</div>
                    <h1 className="text-xl font-black text-gray-900 mb-2">تقييم تجربتك</h1>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">
                        أدخل رقم الحجز للتحقق من هويتك قبل التقييم
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-black text-gray-700 block mb-2">رقم الحجز</label>
                        <input
                            value={refInput}
                            onChange={e => setRefInput(e.target.value.toUpperCase())}
                            placeholder="مثال: WNS-2026-XXXX"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:border-[#f63659] transition-colors text-center tracking-widest"
                        />
                        {verifyError && (
                            <p className="text-xs text-red-500 font-bold mt-2 text-center">{verifyError}</p>
                        )}
                    </div>
                    <button onClick={handleVerify} disabled={verifying}
                        className="w-full py-3.5 rounded-2xl font-black text-white text-sm transition-all active:scale-95 disabled:opacity-60"
                        style={{ backgroundColor: '#f63659' }}>
                        {verifying ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                جارٍ التحقق...
                            </span>
                        ) : 'تحقق وابدأ التقييم →'}
                    </button>
                </div>
            </div>
        </div>
    )

    if (step === 'rate') return (
        <div className="min-h-screen bg-gray-50 pb-10" dir="rtl">
            <div className="max-w-lg mx-auto px-4 py-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-5 mb-5 text-center">
                    <div className="text-4xl mb-2">
                        {avgRating >= 4.5 ? '🌟' : avgRating >= 3 ? '😊' : avgRating >= 1 ? '😐' : '⭐'}
                    </div>
                    <h1 className="text-lg font-black text-gray-900 mb-1">
                        {(request.listing as any)?.title ?? 'تقييم التجربة'}
                    </h1>
                    <p className="text-xs text-gray-400 font-bold">مرحباً {request.visitor_name} 👋</p>
                    {avgRating > 0 && (
                        <div className="mt-3 text-2xl font-black" style={{ color: '#f63659' }}>
                            {avgRating.toFixed(1)} / 5.0
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 mb-5">
                    {CRITERIA.map(c => (
                        <div key={c.key} className="bg-white rounded-2xl border border-gray-100 p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span>{c.icon}</span>
                                        <h3 className="text-sm font-black text-gray-900">{c.label}</h3>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">{c.desc}</p>
                                </div>
                                {ratings[c.key] && (
                                    <span className="text-sm font-black text-amber-500 shrink-0 mr-2">
                                        {ratings[c.key]}/5
                                    </span>
                                )}
                            </div>
                            <StarRating
                                value={ratings[c.key] ?? 0}
                                onChange={v => setRatings(r => ({ ...r, [c.key]: v }))}
                            />
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
                    <h3 className="text-sm font-black text-gray-900 mb-3">هل ستعود وتوصي بهذه الخدمة؟</h3>
                    <div className="flex gap-3">
                        <button onClick={() => setWouldRepeat(true)}
                            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all border ${wouldRepeat === true ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            👍 نعم، بالتأكيد
                        </button>
                        <button onClick={() => setWouldRepeat(false)}
                            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all border ${wouldRepeat === false ? 'bg-red-500 text-white border-red-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            👎 لا أعتقد
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
                    <label className="text-sm font-black text-gray-900 block mb-2">
                        شاركنا تجربتك <span className="text-gray-400 font-medium">(اختياري)</span>
                    </label>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="ما الذي أعجبك أو لم يعجبك في التجربة؟"
                        rows={3}
                        maxLength={500}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-[#f63659] transition-colors resize-none"
                    />
                    <p className="text-[10px] text-gray-300 text-left mt-1">{comment.length}/500</p>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!allRated || wouldRepeat === null || submitting}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#f63659' }}>
                    {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            جارٍ الإرسال...
                        </span>
                    ) : !allRated ? `باقي ${CRITERIA.filter(c => !ratings[c.key]).length} معايير للتقييم` : 'إرسال التقييم ⭐'}
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-xl font-black text-gray-900 mb-2">شكراً على تقييمك!</h1>
                <p className="text-sm text-gray-400 font-medium mb-2">تقييمك يساعد الآخرين في اتخاذ قرارات أفضل</p>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 my-5">
                    <div className="text-3xl font-black text-amber-500 mb-1">{avgRating.toFixed(1)} ⭐</div>
                    <p className="text-xs text-amber-700 font-bold">متوسط تقييمك</p>
                </div>
                <a href="/" className="w-full py-3 rounded-2xl font-black text-white text-sm block"
                    style={{ backgroundColor: '#f63659' }}>
                    العودة للرئيسية
                </a>
            </div>
        </div>
    )
}
