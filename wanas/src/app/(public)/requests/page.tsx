'use client'
// src/app/(public)/requests/page.tsx

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Link from 'next/link'

type RequestStatus = 'pending' | 'completed' | 'cancelled'

interface Request {
    request_id: string
    request_ref: string
    visitor_name: string
    visitor_phone: string
    event_type: string | null
    event_date: string | null
    guest_count: number | null
    notes: string | null
    status: RequestStatus
    created_at: string
    listing: { title: string; listing_id: string } | null
}

const STATUS_CONFIG = {
    pending: { label: 'معلق', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', icon: '⏳' },
    completed: { label: 'مكتمل', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400', icon: '✅' },
    cancelled: { label: 'ملغي', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-400', icon: '❌' },
}

const TABS: { key: RequestStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'pending', label: 'معلق' },
    { key: 'completed', label: 'مكتمل' },
    { key: 'cancelled', label: 'ملغي' },
]

export default function RequestsPage() {
    const router = useRouter()
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<RequestStatus | 'all'>('all')
    const [updating, setUpdating] = useState<string | null>(null)
    const [providerId, setProviderId] = useState<string | null>(null)

    useEffect(() => {
        const auth = getAuth()
        if (!auth) { router.replace('/login'); return }
        setProviderId(auth.provider_id)
        fetchRequests(auth.provider_id)
    }, [])

    async function fetchRequests(pid: string) {
        setLoading(true)
        const { data } = await supabaseBrowser
            .from('requests')
            .select(`
                request_id, request_ref, visitor_name, visitor_phone,
                event_type, event_date, guest_count, notes, status, created_at,
                listing:listings(title, listing_id)
            `)
            .eq('provider_id', pid)
            .order('created_at', { ascending: false })

        setRequests((data as any[]) ?? [])
        setLoading(false)
    }

    async function updateStatus(request_id: string, status: RequestStatus) {
        setUpdating(request_id)
        const { error } = await supabaseBrowser
            .from('requests')
            .update({ status })
            .eq('request_id', request_id)

        if (!error) {
            setRequests(rs => rs.map(r => r.request_id === request_id ? { ...r, status } : r))
        }
        setUpdating(null)
    }

    const filtered = tab === 'all' ? requests : requests.filter(r => r.status === tab)

    const counts = {
        all: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        completed: requests.filter(r => r.status === 'completed').length,
        cancelled: requests.filter(r => r.status === 'cancelled').length,
    }

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">

            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href={`/profile/${providerId}`}
                        className="text-sm font-black text-gray-400 hover:text-gray-700 transition-colors">
                        ← الملف الشخصي
                    </Link>
                    <span className="text-base font-black text-gray-900">إدارة الطلبات</span>
                    <div className="w-20 flex justify-end">
                        <span className="text-xs font-black bg-rose-50 text-[#f63659] px-2 py-1 rounded-full">
                            {counts.pending} معلق
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-5 pb-10">

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {([
                        { label: 'إجمالي', value: counts.all, color: '#6366f1' },
                        { label: 'مكتملة', value: counts.completed, color: '#10b981' },
                        { label: 'معلقة', value: counts.pending, color: '#f59e0b' },
                    ] as const).map(s => (
                        <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                            <span className="text-2xl font-black block" style={{ color: s.color }}>{s.value}</span>
                            <span className="text-xs font-bold text-gray-400">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-2xl p-1 mb-5 overflow-x-auto gap-1">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap px-2 ${tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                            {t.label}
                            {counts[t.key] > 0 && (
                                <span className={`mr-1 text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-rose-100 text-[#f63659]' : 'bg-gray-200 text-gray-500'}`}>
                                    {counts[t.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Requests List */}
                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                                <div className="h-3 bg-gray-100 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">📭</div>
                        <p className="text-gray-400 font-bold">لا توجد طلبات {tab !== 'all' ? STATUS_CONFIG[tab as RequestStatus].label : ''}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filtered.map(r => {
                            const s = STATUS_CONFIG[r.status]
                            return (
                                <div key={r.request_id} className={`bg-white rounded-2xl border p-4 ${r.status === 'pending' ? 'border-amber-200 shadow-sm shadow-amber-50' : 'border-gray-100'}`}>

                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                                            <div>
                                                <h3 className="text-sm font-black text-gray-900">{r.visitor_name || 'زائر'}</h3>
                                                <p className="text-xs text-gray-400 font-mono" dir="ltr">{r.visitor_phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${s.bg} ${s.border} ${s.text}`}>
                                                {s.icon} {s.label}
                                            </span>
                                            <p className="text-[10px] text-gray-300 font-bold mt-1 text-right">{r.request_ref}</p>
                                        </div>
                                    </div>

                                    {/* تفاصيل */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {r.listing?.title && (
                                            <Link href={`/listing/${r.listing.listing_id}`}
                                                className="bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                                                🏡 {r.listing.title}
                                            </Link>
                                        )}
                                        {r.event_type && (
                                            <span className="bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full text-xs font-bold text-purple-700">
                                                🎉 {r.event_type}
                                            </span>
                                        )}
                                        {r.event_date && (
                                            <span className="bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full text-xs font-bold text-blue-700">
                                                📅 {new Date(r.event_date).toLocaleDateString('ar-SA')}
                                            </span>
                                        )}
                                        {r.guest_count && (
                                            <span className="bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-xs font-bold text-gray-600">
                                                👥 {r.guest_count} ضيف
                                            </span>
                                        )}
                                    </div>

                                    {r.notes && (
                                        <p className="text-xs text-gray-500 font-medium bg-gray-50 rounded-xl px-3 py-2 mb-3 leading-relaxed">
                                            💬 {r.notes}
                                        </p>
                                    )}

                                    {/* تاريخ */}
                                    <p className="text-[10px] text-gray-300 font-bold mb-3">
                                        {new Date(r.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>

                                    {/* أزرار التحكم */}
                                    <div className="flex gap-2 border-t border-gray-50 pt-3">
                                        <a href={`https://wa.me/${r.visitor_phone}`} target="_blank" rel="noreferrer"
                                            className="flex-1 py-2 rounded-xl text-xs font-black text-center text-white bg-[#25D366] hover:bg-[#20c45e] transition-colors">
                                            واتساب
                                        </a>
                                        {r.status !== 'completed' && (
                                            <button
                                                onClick={() => updateStatus(r.request_id, 'completed')}
                                                disabled={updating === r.request_id}
                                                className="flex-1 py-2 rounded-xl text-xs font-black text-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                                                {updating === r.request_id ? '...' : '✅ مكتمل'}
                                            </button>
                                        )}
                                        {r.status === 'completed' && (
                                            <a href={`https://wa.me/${r.visitor_phone}?text=${encodeURIComponent(`مرحباً ${r.visitor_name}، شكراً لاختيارك خدمتنا 🌟\nنرجو منك تقييم تجربتك عبر الرابط:\nhttps://wanas.sa/review/${r.request_id}`)}`}
                                                target="_blank" rel="noreferrer"
                                                className="flex-1 py-2 rounded-xl text-xs font-black text-center text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors">
                                                ⭐ أرسل رابط التقييم
                                            </a>
                                        )}
                                        {r.status !== 'pending' && (
                                            <button
                                                onClick={() => updateStatus(r.request_id, 'pending')}
                                                disabled={updating === r.request_id}
                                                className="flex-1 py-2 rounded-xl text-xs font-black text-center text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50">
                                                {updating === r.request_id ? '...' : '⏳ معلق'}
                                            </button>
                                        )}
                                        {r.status !== 'cancelled' && (
                                            <button
                                                onClick={() => updateStatus(r.request_id, 'cancelled')}
                                                disabled={updating === r.request_id}
                                                className="flex-1 py-2 rounded-xl text-xs font-black text-center text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                                                {updating === r.request_id ? '...' : '❌ ملغي'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
