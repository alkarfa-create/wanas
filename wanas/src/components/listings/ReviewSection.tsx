'use client'
// src/components/listings/ReviewSection.tsx

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { getAuth } from '@/lib/auth'

const CRITERIA = [
    { key: 'hygiene', label: 'الجودة والسلامة الصحية', icon: '🧼' },
    { key: 'accuracy', label: 'الموثوقية والمطابقة', icon: '✅' },
    { key: 'communication', label: 'كفاءة التواصل', icon: '💬' },
    { key: 'location', label: 'دقة الموقع والتنفيذ', icon: '📍' },
    { key: 'checkin', label: 'انسيابية التسليم', icon: '🚀' },
    { key: 'value', label: 'الكفاءة مقابل التكلفة', icon: '💰' },
]

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hovered, setHovered] = useState(0)
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button"
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(s)}
                    className="transition-transform hover:scale-110 active:scale-95">
                    <svg viewBox="0 0 32 32" className={`w-7 h-7 transition-colors ${s <= (hovered || value) ? 'fill-amber-400' : 'fill-gray-200'}`}>
                        <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.736l7.293 6.565-1.965 9.852a1 1 0 0 0 1.483 1.061L16 26.322l8.625 4.626a1 1 0 0 0 1.483-1.061l-1.965-9.852 7.293-6.565a1 1 0 0 0-.542-1.736l-9.86-1.27-4.124-8.885a1 1 0 0 0-1.816 0z" />
                    </svg>
                </button>
            ))}
        </div>
    )
}

type Step = 'idle' | 'verify' | 'rate' | 'done'

export default function ReviewSection({ listingId }: { listingId: string }) {
    const [step, setStep] = useState<Step>('idle')
    const [refInput, setRefInput] = useState('')
    const [request, setRequest] = useState<any>(null)
    const [verifyError, setVerifyError] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [ratings, setRatings] = useState<Record<string, number>>({})
    const [wouldRepeat, setWouldRepeat] = useState<boolean | null>(null)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const allRated = CRITERIA.every(c => ratings[c.key] >= 1)
    const avgRating = Object.values(ratings).length > 0
        ? Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length
        : 0

    async function handleVerify() {
        if (!refInput.trim()) { setVerifyError('أدخل رقم الحجز'); return }
        setVerifying(true)
        setVerifyError('')

        const { data } = await supabaseBrowser
            .from('requests')
            .select('request_id, request_ref, visitor_name, listing_id, provider_id')
            .eq('listing_id', listingId)
            .eq('request_ref', refInput.trim().toUpperCase())
            .single()

        if (!data) {
            setVerifyError('رقم الحجز غير صحيح أو لا ينتمي لهذا الإعلان')
            setVerifying(false)
            return
        }

        // تحقق أن المزود لا يقيّم نفسه
        const auth = getAuth()
        if (auth && auth.provider_id === data.provider_id) {
            setVerifyError('لا يمكنك تقييم إعلانك الخاص 🚫')
            setVerifying(false)
            return
        }

        const { data: existingList } = await supabaseBrowser
            .from('reviews')
            .select('review_id')
            .eq('request_id', data.request_id)

        if (existingList && existingList.length > 0) {
            setVerifyError('لقد قيّمت هذا الحجز مسبقاً، شكراً لك! 🌟')
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
                request_id: request.request_id,
                listing_id: listingId,
                provider_id: request.provider_id,
                rating: Math.round(avgRating),
                reasons: ratings,
                notes: comment.trim() || null,
                would_repeat: wouldRepeat,
                provider_responded: false,
                fraud_flags: {},
            })

        if (!error) setStep('done')
        setSubmitting(false)
    }

    if (step === 'done') return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-base font-black text-emerald-800 mb-1">شكراً على تقييمك!</h3>
            <p className="text-sm text-emerald-600 font-medium">تقييمك يساعد الآخرين في اتخاذ قرارات أفضل</p>
            <div className="text-2xl font-black text-amber-500 mt-3">{avgRating.toFixed(1)} ⭐</div>
        </div>
    )

    if (step === 'idle') return (
        <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50 text-center">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="text-base font-black text-gray-900 mb-1">هل زرت هذا المكان؟</h3>
            <p className="text-sm text-gray-400 font-medium mb-4">شارك تجربتك وساعد الآخرين</p>
            <button onClick={() => setStep('verify')}
                className="px-6 py-2.5 rounded-xl font-black text-white text-sm transition-all active:scale-95"
                style={{ backgroundColor: '#f63659' }}>
                اكتب تقييمك ←
            </button>
        </div>
    )

    if (step === 'verify') return (
        <div className="border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep('idle')} className="text-gray-400 hover:text-gray-600 text-sm font-bold">
                    ←
                </button>
                <h3 className="text-base font-black text-gray-900">التحقق من الحجز</h3>
            </div>
            <p className="text-xs text-gray-400 font-medium mb-4 leading-relaxed">
                أدخل رقم حجزك للتحقق من تجربتك الفعلية. رقم الحجز يبدأ بـ WNS
            </p>
            <div className="flex gap-2">
                <input
                    value={refInput}
                    onChange={e => setRefInput(e.target.value.toUpperCase())}
                    placeholder="WNS-2026-XXXX"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-[#f63659] transition-colors text-center tracking-widest"
                />
                <button onClick={handleVerify} disabled={verifying}
                    className="px-4 py-2.5 rounded-xl font-black text-white text-sm disabled:opacity-60 shrink-0"
                    style={{ backgroundColor: '#f63659' }}>
                    {verifying ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'تحقق'}
                </button>
            </div>
            {verifyError && (
                <p className="text-xs text-red-500 font-bold mt-2 text-center">{verifyError}</p>
            )}
        </div>
    )

    // step === 'rate'
    return (
        <div className="border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-black text-gray-900">تقييمك</h3>
                <span className="text-xs text-gray-400 font-bold">— {request.visitor_name}</span>
            </div>
            {avgRating > 0 && (
                <div className="text-lg font-black text-amber-500 mb-3">{avgRating.toFixed(1)} / 5.0 ⭐</div>
            )}

            <div className="flex flex-col gap-3 mb-4">
                {CRITERIA.map(c => (
                    <div key={c.key} className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black text-gray-700 shrink-0 w-36">
                            {c.icon} {c.label}
                        </span>
                        <StarRating
                            value={ratings[c.key] ?? 0}
                            onChange={v => setRatings(r => ({ ...r, [c.key]: v }))}
                        />
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mb-4">
                <button onClick={() => setWouldRepeat(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all border ${wouldRepeat === true ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    👍 سأعود وأوصي به
                </button>
                <button onClick={() => setWouldRepeat(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all border ${wouldRepeat === false ? 'bg-red-500 text-white border-red-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    👎 لا أعتقد
                </button>
            </div>

            <div className="mb-4">
                <textarea
                    value={comment}
                    onChange={e => { if (e.target.value.length <= 250) setComment(e.target.value) }}
                    placeholder="شاركنا تجربتك... (اختياري)"
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-[#f63659] transition-colors resize-none"
                />
                <p className="text-[10px] text-gray-300 text-left mt-1">{comment.length}/250</p>
            </div>

            <button onClick={handleSubmit}
                disabled={!allRated || wouldRepeat === null || submitting}
                className="w-full py-3 rounded-xl font-black text-white text-sm transition-all active:scale-95 disabled:opacity-40"
                style={{ backgroundColor: '#f63659' }}>
                {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جارٍ الإرسال...
                    </span>
                ) : !allRated
                    ? `باقي ${CRITERIA.filter(c => !ratings[c.key]).length} معايير`
                    : 'إرسال التقييم ⭐'
                }
            </button>
        </div>
    )
}
