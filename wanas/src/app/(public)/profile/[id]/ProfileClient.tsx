'use client'
// src/app/(public)/profile/[id]/ProfileClient.tsx

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { getAuth, setAuth } from '@/lib/auth'

const BRAND = '#f63659'
const BRAND_LIGHT = '#ff6b8b'
const GOLD = '#f59e0b'
const DARK = '#1a1a2e'

interface Provider {
    provider_id: string
    display_name: string
    phone_whatsapp: string
    phone_call: string | null
    verification_status: string
    status: string
    trust_score: number
    created_at: string
    avatar_url: string | null
    trial_ends_at?: string | null
    subscription_tier?: string | null
}
interface Listing {
    listing_id: string
    title: string
    status: string
    price_min: number | null
    price_label: string | null
    views_count: number
    clicks_count: number
    created_at: string
    category: { name_ar: string; icon_key: string } | null
}
interface Request {
    request_id: string
    request_ref: string
    visitor_name: string
    visitor_phone: string
    event_type: string
    event_date: string | null
    guest_count: number | null
    created_at: string
    status: string
    listing: { title: string } | null
}
interface Review {
    rating: number
    would_repeat: boolean
    reasons: Record<string, number>
    created_at: string
}
interface Stats {
    totalViews: number
    totalClicks: number
    activeListings: number
    totalRequests: number
}

const CATEGORY_ICONS: Record<string, string> = {
    chalet: '🏠', coffee: '☕', buffet: '🍽️',
    party: '🎉', games: '🎮', machine: '🍦', icecream: '🍿',
}

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedNumber({ target, duration = 1200 }: { target: number; duration?: number }) {
    const [val, setVal] = useState(0)
    useEffect(() => {
        let start = 0
        const steps = 40
        const increment = target / steps
        const stepDuration = duration / steps
        const t = setInterval(() => {
            start += increment
            if (start >= target) { setVal(target); clearInterval(t) }
            else setVal(Math.floor(start))
        }, stepDuration)
        return () => clearInterval(t)
    }, [target, duration])
    return <>{val.toLocaleString('ar-SA')}</>
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        approved: { label: 'نشط', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
        pending_review: { label: 'قيد المراجعة', cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
        rejected: { label: 'مرفوض', cls: 'bg-rose-50 text-rose-600 border border-rose-100' },
        completed: { label: 'مكتمل', cls: 'bg-blue-50 text-blue-700 border border-blue-100' },
        cancelled: { label: 'ملغي', cls: 'bg-gray-50 text-gray-500 border border-gray-200' },
    }
    const s = map[status] ?? { label: status, cls: 'bg-gray-50 text-gray-600 border border-gray-200' }
    return <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
}

// ─── Locked Row (Ultra Premium Glassmorphism) ─────────────────────────────────
const FAKE_DATA = [
    [42, 68, 31, 85, 55, 72, 29, 91, 47, 63, 38, 79, 52, 44, 67, 83, 35, 58, 76, 49],
    [61, 33, 88, 45, 72, 27, 95, 51, 69, 38, 84, 56, 43, 77, 32, 90, 48, 65, 39, 74],
    [55, 78, 42, 66, 89, 34, 71, 48, 83, 57, 29, 93, 45, 68, 36, 81, 53, 70, 41, 87],
    [37, 82, 59, 44, 73, 91, 28, 65, 50, 86, 40, 75, 32, 94, 47, 61, 78, 35, 88, 54],
]

function LockedRow({ icon, label, hint, dataIndex = 0 }: { icon: string; label: string; hint?: string; dataIndex?: number }) {
    const bars = FAKE_DATA[dataIndex % FAKE_DATA.length]
    return (
        <div className="relative py-4 border-b border-gray-100 last:border-0 group cursor-pointer overflow-hidden">
            {/* Subtle Hover Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center shrink-0 shadow-sm group-hover:border-rose-200 transition-colors">
                    <span className="text-sm">{icon}</span>
                </div>
                <span className="flex-1" />
                <span className="text-sm font-black text-gray-800 tracking-tight">{label}</span>
            </div>

            {/* The Blur Container (Frosted Glass Effect) */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-50/50 p-2 border border-gray-100/50">
                <div className="h-12 flex items-end gap-1 px-1 opacity-70" style={{ filter: 'blur(6px)', transition: 'filter 0.3s ease' }}>
                    {bars?.map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm"
                            style={{
                                height: `${h}%`,
                                background: `linear-gradient(to top, rgba(246,54,89,${0.1 + (h / 100) * 0.4}), rgba(246,54,89,0.05))`
                            }} />
                    ))}
                </div>
                {/* Floating "Discover" Badge on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-white/90 backdrop-blur-md text-xs font-black text-rose-600 px-4 py-1.5 rounded-full shadow-sm border border-rose-100 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        اكتشف التفاصيل ✨
                    </span>
                </div>
            </div>

            {hint && (
                <p className="text-[11px] font-bold mt-2.5 text-right text-gray-500 relative z-10 group-hover:text-rose-600 transition-colors">
                    {hint}
                </p>
            )}
        </div>
    )
}

// ─── Testimonial ──────────────────────────────────────────────────────────────
function Testimonial({ text, name, role }: { text: string; name: string; role: string }) {
    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 text-right shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2 text-rose-100 leading-none font-serif">"</div>
            <p className="text-sm text-gray-600 font-bold leading-relaxed mb-4">{text}</p>
            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5]?.map(s => (
                        <svg key={s} viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-amber-400 drop-shadow-sm">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    ))}
                </div>
                <div className="text-right">
                    <p className="text-xs font-black text-gray-900">{name}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">{role}</p>
                </div>
            </div>
        </div>
    )
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="border-b border-gray-100 last:border-0 group">
            <button className="w-full flex items-center justify-between py-4 text-right gap-4 outline-none" onClick={() => setOpen(!open)}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${open ? 'bg-rose-100 scale-110' : 'bg-gray-50 group-hover:bg-gray-100'}`}>
                    <span className={`text-sm font-black transition-colors ${open ? 'text-rose-600' : 'text-gray-400'}`}>{open ? '−' : '+'}</span>
                </div>
                <span className={`text-sm font-black flex-1 text-right transition-colors ${open ? 'text-gray-900' : 'text-gray-700'}`}>{q}</span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-xs text-gray-500 font-bold leading-relaxed pb-5 pr-10 pl-2">{a}</p>
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfileClient({ provider: initialProvider, listings: initialListings, requests, stats, reviews = [], hasFullAccess = false }: {
    provider: Provider
    listings: Listing[]
    requests: Request[]
    stats: Stats
    reviews?: Review[]
    hasFullAccess?: boolean
}) {
    const [tab, setTab] = useState<'listings' | 'requests' | 'calendar' | 'notifications' | 'reviews' | 'analytics'>('analytics') // Default to analytics for demo
    const [provider, setProvider] = useState(initialProvider)
    const [listings, setListings] = useState(initialListings)
    const [localReviews, setLocalReviews] = useState(reviews || [])
    const [avatarLoading, setAvatarLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ✅ حالات (States) الرسائل والنوافذ الاحترافية
    const [confirmAction, setConfirmAction] = useState<{ id: string, status: 'completed' | 'cancelled' } | null>(null);
    const [toastMsg, setToastMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // 📅 === حالات (States) التقويم === 📅
    // افتراضياً نختار أول إعلان للمورد
    const [selectedListingId, setSelectedListingId] = useState<string | null>(listings?.[0]?.listing_id || null);
    const [blockedDates, setBlockedDates] = useState<string[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);

    // 🔔 === حالات (States) الإشعارات === 🔔
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // ✅ تعريف dalalة markAsRead مرة واحدة فقط هنا (إزالة التكرار)
    const markAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return; // إذا كان مقروءاً مسبقاً، لا تفعل شيئاً

        try {
            // 1. ⚡ تحديث فوري (Optimistic Update) لجعل النقطة الحمراء تختفي فوراً
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            // 2. 🌍 تحديث قاعدة البيانات في الخلفية
            const { error } = await supabaseBrowser
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('Error marking notification as read:', err);
            // في حالة الخطأ، سيظل الإشعار مقروءاً في الواجهة لكنك ستعرف السبب من الكونسول
        }
    };

    // ✅ حالات نموذج طلب PRO
    const [isProModalOpen, setIsProModalOpen] = useState(false);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmittingPro, setIsSubmittingPro] = useState(false);

    // دالة حساب تاريخ النهاية تلقائياً (بعد شهر)
    const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().split('T')[0];

    // جلب الإشعارات من القاعدة
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!provider?.provider_id) return;
            try {
                const { data, error } = await supabaseBrowser
                    .from('notifications')
                    .select('*')
                    .eq('provider_id', provider.provider_id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setNotifications(data || []);
                setUnreadCount(data?.filter(n => !n.is_read).length || 0);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };
        fetchNotifications();
    }, [provider?.provider_id]);

    // جلب الأيام المحجوزة من قاعدة البيانات
    const fetchBlockedDates = async () => {
        if (!selectedListingId) return;
        setIsCalendarLoading(true);
        try {
            const { data, error } = await supabaseBrowser
                .from('blocked_dates')
                .select('blocked_date')
                .eq('listing_id', selectedListingId);

            if (error) throw error;
            setBlockedDates(data?.map(d => d.blocked_date));
        } catch (err) {
            console.error('Error fetching blocked dates:', err);
        } finally {
            setIsCalendarLoading(false);
        }
    };

    // جلب البيانات كلما تغير الإعلان المختار أو فتحنا تبويب التقويم
    useEffect(() => {
        if (tab === 'calendar') fetchBlockedDates();
    }, [tab, selectedListingId]);

    // دالة إغلاق / فتح اليوم (عند النقر على الخلية)
    const toggleDate = async (dateStr: string) => {
        if (!selectedListingId) return;

        // منع حجز أيام في الماضي
        if (new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0))) {
            setToastMsg({ text: 'لا يمكن تعديل أيام سابقة', type: 'error' });
            return;
        }

        const isBlocked = blockedDates.includes(dateStr);

        // تحديث الواجهة محلياً فوراً (لإحساس بالسرعة)
        if (isBlocked) {
            setBlockedDates(prev => prev.filter(d => d !== dateStr));
        } else {
            setBlockedDates(prev => [...prev, dateStr]);
        }

        try {
            if (isBlocked) {
                // إذا كان محجوزاً -> نحذفه (نفتحه)
                await supabaseBrowser
                    .from('blocked_dates')
                    .delete()
                    .match({ listing_id: selectedListingId, blocked_date: dateStr });
            } else {
                // إذا كان متاحاً -> نضيفه (نغلقه)
                await supabaseBrowser
                    .from('blocked_dates')
                    .insert({ listing_id: selectedListingId, blocked_date: dateStr });
            }
        } catch (err) {
            console.error('Error toggling date:', err);
            setToastMsg({ text: 'حدث خطأ في تحديث التقويم', type: 'error' });
            fetchBlockedDates(); // إعادة الجلب لتصحيح الواجهة في حال الخطأ
        }
    };

    // دوال مساعدة لرسم التقويم
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    // إخفاء رسالة النجاح التلقائي بعد 3 ثوانٍ
    useEffect(() => {
        if (toastMsg) {
            const timer = setTimeout(() => setToastMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMsg]);

    // دالة تنفيذ القرار (بعد التأكيد من النافذة الاحترافية)
    const executeRequestAction = async () => {
        if (!confirmAction) return;
        setIsProcessing(true);

        try {
            // إرسال الحالة المتطابقة مع قاعدة البيانات ('completed' للقبول، 'cancelled' للرفض)
            const { error } = await supabaseBrowser
                .from('requests')
                .update({ status: confirmAction.status })
                .eq('request_id', confirmAction.id);

            if (error) throw error;

            // إظهار رسالة نجاح احترافية
            setToastMsg({
                text: confirmAction.status === 'completed' ? 'تم قبول الطلب بنجاح 🎉' : 'تم رفض وإلغاء الطلب',
                type: 'success'
            });

            // إغلاق النافذة وتحديث الصفحة بعد ثانية ونصف ليشاهد المستخدم رسالة النجاح
            setConfirmAction(null);
            setTimeout(() => window.location.reload(), 1500);

        } catch (err: any) {
            console.error('Error updating request:', err);
            setToastMsg({ text: 'عذراً، لم نتمكن من تحديث الطلب', type: 'error' });
            setConfirmAction(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const joinDate = new Date(provider.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' })
    const conversionRate = stats.totalViews > 0 ? ((stats.totalRequests / stats.totalViews) * 100).toFixed(1) : '0.0'
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
    const wouldRepeatPct = reviews.length > 0 ? Math.round((reviews.filter(r => r.would_repeat).length / reviews.length) * 100) : 0
    const isTop10 = stats.totalRequests >= 10 || parseFloat(conversionRate) >= 20

    // حالة الاشتراك - محسوبة في الخادم وممررة كـ prop
    // hasFullAccess = true → مشترك PRO ساري الاشتراك

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]; if (!file) return
        setAvatarLoading(true)
        try {
            const fd = new FormData()
            fd.append('provider_id', provider.provider_id)
            fd.append('avatar', file)
            const res = await fetch('/api/providers/avatar', { method: 'POST', body: fd })
            const data = await res.json()
            if (res.ok) {
                const nextProvider = { ...provider, avatar_url: data.avatar_url }
                setProvider(nextProvider)

                const authProvider = getAuth()
                if (authProvider?.provider_id === nextProvider.provider_id) {
                    setAuth({ ...authProvider, avatar_url: data.avatar_url })
                }
            }
            else alert(data.error)
        } catch { alert('تعذر رفع الصورة') }
        finally { setAvatarLoading(false) }
    }

    async function handleDelete(listing_id: string) {
        if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return
        setDeletingId(listing_id)
        try {
            const res = await fetch(`/api/listings/${listing_id}`, { method: 'DELETE' })
            if (res.ok) setListings(ls => ls.filter(l => l.listing_id !== listing_id))
            else alert('فشل الحذف')
        } catch { alert('تعذر الحذف') }
        finally { setDeletingId(null) }
    }

    return (
        <div className="min-h-screen bg-[#F7F7F9]" dir="rtl">

            {/* ─── Header (Airbnb Style Clean) ─── */}
            <div className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
                <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
                    <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors">
                        <span className="text-gray-400 text-lg">←</span>
                    </Link>
                    <span className="text-base font-black text-gray-900 tracking-tight">لوحة التحكم</span>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-400">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current stroke-2 fill-none">
                            <circle cx="12" cy="12" r="3" /><path strokeLinecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 pb-40">

                {/* ─── Provider Identity Card ─── */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6 relative overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-rose-100 to-orange-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

                    <div className="flex items-center gap-5 mb-6 relative z-10">
                        <div className="relative shrink-0 group">
                            <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-[3px] border-white shadow-md bg-gray-50">
                                {provider.avatar_url
                                    ? <Image src={provider.avatar_url} alt={provider.display_name} width={96} height={96} className="object-cover w-full h-full" />
                                    : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white bg-gradient-to-br from-rose-400 to-orange-400">
                                        {provider.display_name?.charAt(0) ?? '؟'}
                                    </div>}
                            </div>
                            <button onClick={() => fileInputRef.current?.click()} disabled={avatarLoading}
                                className="absolute -bottom-2 -left-2 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                {avatarLoading
                                    ? <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin" />
                                    : <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-gray-600 stroke-2 fill-none"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="4" /></svg>}
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <h1 className="text-xl font-black text-gray-900 tracking-tight">{provider.display_name}</h1>
                                {provider.verification_status === 'verified' && (
                                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg> موثق
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 font-bold mb-2">عضو منذ {joinDate}</p>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-700" dir="ltr">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> {provider.phone_whatsapp}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Trust Score Bar */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative z-10">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className="text-xs font-black text-gray-500 block mb-0.5">مؤشر جودة الإعلانات</span>
                                <span className="text-lg font-black leading-none text-gray-900">{provider.trust_score}%</span>
                            </div>
                            {provider.trust_score >= 80 && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">أداء ممتاز 🚀</span>}
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${provider.trust_score}%`, background: `linear-gradient(90deg, ${BRAND}, ${BRAND_LIGHT})` }} />
                        </div>
                    </div>
                </div>

                {/* ─── Modern Tabs ─── */}
                <div className="flex bg-white border border-gray-200 rounded-2xl p-1 mb-6 shadow-sm sticky top-[136px] z-30 overflow-x-auto">
                    {([
                        { key: 'listings', label: `إعلاناتي (${listings.length})`, icon: '📋' },
                        { key: 'requests', label: `الطلبات (${requests.length})`, icon: '💬' },
                        { key: 'calendar', label: 'إدارة التوفر', icon: '📅' },
                        { key: 'notifications', label: 'الإشعارات', icon: '🔔' },
                        { key: 'reviews', label: 'التقييمات', icon: '⭐' },
                        { key: 'analytics', label: 'التحليلات ✨', icon: '📊' },
                    ] as const)?.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`relative flex-1 min-w-[120px] md:min-w-0 py-3 rounded-xl text-xs font-black transition-all duration-300 flex justify-center items-center gap-1.5 ${tab === t.key ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                            <span>{t.icon}</span>
                            {t.label}
                            {t.key === 'notifications' && unreadCount > 0 && (
                                <span className="absolute top-2 left-2 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full shadow-sm">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ─── LISTINGS TAB ─── */}
                {tab === 'listings' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* كاشف أخطاء مؤقت (احذفه بعد التأكد) */}
                        <div className="col-span-full text-[10px] text-gray-400 font-bold bg-gray-50 border border-gray-200 p-2 rounded-xl text-center">DEBUG: Array length is {listings?.length ?? 'undefined'} | {Array.isArray(listings) ? 'Is Array ✅' : 'Not Array ❌'}</div>

                        {listings && listings.length > 0 ? (
                            listings?.map((listing: any) => (
                                <div key={listing.listing_id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm group">

                                    {/* 🖼️ عرض الصورة من رابط cover_url */}
                                    <div className="h-44 bg-gray-100 relative overflow-hidden">
                                        {listing.cover_url ? (
                                            <img
                                                src={
                                                    listing.cover_url.startsWith('http')
                                                        ? listing.cover_url
                                                        : `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbhvjneoiodeinqourrf.supabase.co'}/storage/v1/object/public/chalets-images/${listing.cover_url}`
                                                }
                                                alt={listing.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=خطأ+في+مسار+الصورة';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 text-[10px] font-bold">
                                                لا توجد صورة في القاعدة
                                            </div>
                                        )}

                                        {/* شارة الحالة */}
                                        <div className="absolute top-3 right-3 z-10">
                                            <StatusBadge status={listing.status} />
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h4 className="font-black text-sm text-gray-900 mb-1 truncate">{listing.title}</h4>

                                        {/* أزرار التعديل والعرض */}
                                        <div className="grid grid-cols-2 gap-2 my-4">
                                            <a href={`/listing/${listing.listing_id}`} target="_blank" className="flex items-center justify-center py-2 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black">👁️ عرض</a>
                                            <a href={`/add-listing?edit=${listing.listing_id}`} className="flex items-center justify-center py-2 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black">✏️ تعديل</a>
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-gray-50 text-[10px] font-bold text-gray-400">
                                            <span>👁️ {listing.views_count || 0} المشاهدات</span>
                                            <span className="text-gray-900 font-black">{listing.price_min} ر.س</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                <span className="text-4xl mb-4 block">🏢</span>
                                <p className="text-gray-400 font-bold">لا توجد إعلانات مضافة بعد لهذا المورد</p>
                                <p className="text-[10px] text-gray-300 mt-2">الرقم التعريفي الممرر: {provider.provider_id}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── REQUESTS TAB ─── */}
                {tab === 'requests' && (
                    <div className="space-y-4">
                        {requests && requests.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {requests?.map((request: any) => (
                                    <div key={request.id || request.request_id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 justify-between md:items-center">

                                        {/* معلومات الطلب الأساسية */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-gray-900">{request.customer_name || request.visitor_name || 'عميل ونَس'}</h4>
                                                {/* عرض الحالة بناءً على الكلمات الجديدة */}
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${request.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                        request.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                                                            'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {request.status === 'completed' ? 'تم القبول ✓' :
                                                        request.status === 'cancelled' ? 'ملغي / مرفوض ✕' : 'بانتظار الرد ⏳'}
                                                </span>
                                            </div>

                                            <div className="text-xs font-bold text-gray-500 flex flex-wrap gap-4">
                                                <span>📅 الحجز:
                                                    <span className="text-gray-900 mr-1">
                                                        {(request.booking_date || request.event_date)
                                                            ? new Date(request.booking_date || request.event_date).toLocaleDateString('ar-SA', {
                                                                weekday: 'long',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })
                                                            : 'غير محدد'}
                                                    </span>
                                                </span>
                                                <span>📱 الجوال: <a href={`tel:${request.customer_phone || request.visitor_phone}`} className="text-blue-500 hover:underline">{request.customer_phone || request.visitor_phone || 'غير متوفر'}</a></span>
                                            </div>
                                        </div>

                                        {/* أزرار الإجراءات الاحترافية */}
                                        {(!request.status || request.status === 'pending') && (
                                            <div className="flex gap-2 shrink-0 border-t md:border-t-0 md:border-r border-gray-100 pt-4 md:pt-0 md:pr-4 mt-2 md:mt-0">
                                                <button
                                                    onClick={() => setConfirmAction({ id: request.id || request.request_id, status: 'completed' })}
                                                    className="px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-xs font-black transition-all active:scale-95"
                                                >
                                                    قبول
                                                </button>
                                                <button
                                                    onClick={() => setConfirmAction({ id: request.id || request.request_id, status: 'cancelled' })}
                                                    className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black transition-all active:scale-95"
                                                >
                                                    رفض
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                <span className="text-4xl mb-4 block">📅</span>
                                <p className="text-gray-400 font-bold text-lg">لا توجد طلبات حجز حالياً</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── CALENDAR TAB ─── */}
                {tab === 'calendar' && (
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                            <div className="text-center md:text-right">
                                <h2 className="text-xl font-black text-gray-900">إدارة التوفر والتقويم</h2>
                                <p className="text-sm text-gray-400 font-medium mt-1">اضغط على أي يوم لإغلاقه أو فتحه للحجوزات</p>
                            </div>

                            {/* اختيار الإعلان (في حال كان المورد لديه أكثر من إعلان) */}
                            {listings && listings.length > 0 && (
                                <select
                                    value={selectedListingId || ''}
                                    onChange={(e) => setSelectedListingId(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-[#f63659] shadow-sm cursor-pointer min-w-[200px]"
                                >
                                    {listings?.map((l: any) => (
                                        <option key={l.listing_id} value={l.listing_id}>{l.title}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* لوحة التقويم */}
                        <div className="max-w-3xl mx-auto">
                            {/* أزرار التنقل بين الأشهر */}
                            <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                    className="px-4 py-2 bg-white rounded-xl shadow-sm text-gray-600 hover:text-[#f63659] hover:bg-rose-50 font-black transition-colors"
                                >
                                    &rarr; السابق
                                </button>
                                <h3 className="text-lg font-black text-gray-900" dir="ltr">
                                    {currentMonth.toLocaleString('ar-SA', { month: 'long', year: 'numeric' })}
                                </h3>
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                    className="px-4 py-2 bg-white rounded-xl shadow-sm text-gray-600 hover:text-[#f63659] hover:bg-rose-50 font-black transition-colors"
                                >
                                    التالي &larr;
                                </button>
                            </div>

                            {/* أيام الأسبوع */}
                            <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-black text-gray-400">
                                {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']?.map(day => (
                                    <div key={day} className="py-2">{day}</div>
                                ))}
                            </div>

                            {/* شبكة الأيام */}
                            <div className="grid grid-cols-7 gap-2 md:gap-3" dir="rtl">
                                {/* الفراغات لبداية الشهر */}
                                {Array.from({ length: getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) })?.map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-transparent" />
                                ))}

                                {/* أيام الشهر */}
                                {Array.from({ length: getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) })?.map((_, i) => {
                                    const day = i + 1;
                                    // توليد التاريخ بصيغة YYYY-MM-DD
                                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const isBlocked = blockedDates.includes(dateStr);
                                    const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));

                                    return (
                                        <button
                                            key={dateStr}
                                            onClick={() => toggleDate(dateStr)}
                                            disabled={isPast || isCalendarLoading}
                                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-2 relative overflow-hidden group ${isPast ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' :
                                                    isBlocked ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shadow-sm' :
                                                        'bg-white border-gray-100 text-gray-700 hover:border-emerald-200 hover:bg-emerald-50 shadow-sm'
                                                }`}
                                        >
                                            <span className="text-xl md:text-2xl font-black">{day}</span>
                                            <span className="text-[10px] md:text-xs font-bold mt-1">
                                                {isPast ? 'منتهي' : isBlocked ? 'مغلق 🔒' : 'متاح'}
                                            </span>

                                            {/* تأثير التموج عند التحديد */}
                                            {(!isPast && !isBlocked) && (
                                                <div className="absolute inset-0 bg-emerald-400 opacity-0 group-active:opacity-10 transition-opacity" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* مفتاح الألوان (دليل المستخدم) */}
                            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 border-t border-gray-100 pt-6">
                                <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-lg bg-white border-2 border-gray-200 shadow-sm"></span><span className="text-xs font-bold text-gray-500">متاح</span></div>
                                <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-lg bg-rose-50 border-2 border-rose-200 shadow-sm"></span><span className="text-xs font-bold text-gray-500">مغلق (محجوز)</span></div>
                                <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-lg bg-gray-50 border-2 border-gray-100"></span><span className="text-xs font-bold text-gray-500">يوم سابق</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── NOTIFICATIONS TAB ─── */}
                {tab === 'notifications' && (
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8">
                            <h2 className="text-xl font-black text-gray-900">الإشعارات</h2>
                            <p className="text-sm text-gray-400 font-medium mt-1">تابع أحدث طلبات الحجز وتحديثات إعلاناتك</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {notifications && notifications.length > 0 ? (
                                notifications?.map((note) => (
                                    <div
                                        key={note.id}
                                        onClick={() => markAsRead(note.id, note.is_read)}
                                        className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${note.is_read ? 'bg-white border-gray-100 opacity-70' : 'bg-rose-50/30 border-rose-100 shadow-sm'
                                            }`}
                                    >
                                        {/* أيقونة تعبر عن نوع الإشعار */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-xl ${note.type === 'booking' ? 'bg-blue-50 text-blue-500' :
                                                note.type === 'approval' ? 'bg-emerald-50 text-emerald-500' :
                                                    note.type === 'review' ? 'bg-amber-50 text-amber-500' :
                                                        'bg-gray-100 text-gray-500'
                                            }`}>
                                            {note.type === 'booking' ? '📅' : note.type === 'approval' ? '✅' : note.type === 'review' ? '⭐' : '🔔'}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm font-black ${note.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                    {note.title}
                                                </h4>
                                                <span className="text-[10px] text-gray-400 font-bold shrink-0" dir="ltr">
                                                    {new Date(note.created_at).toLocaleDateString('ar-SA')}
                                                </span>
                                            </div>
                                            <p className={`text-xs leading-relaxed ${note.is_read ? 'text-gray-500' : 'text-gray-600 font-medium'}`}>
                                                {note.message}
                                            </p>
                                        </div>

                                        {/* نقطة للإشعارات غير المقروءة */}
                                        {!note.is_read && (
                                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shrink-0 mt-2"></div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                                    <span className="text-4xl mb-3 block opacity-50">🔕</span>
                                    <p className="text-gray-400 font-bold">لا توجد إشعارات حالياً</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── REVIEWS TAB ─── */}
                {tab === 'reviews' && (
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end mb-8 text-right">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">آراء العملاء</h2>
                                <p className="text-sm text-gray-400 font-medium mt-1">ماذا يقول العملاء عن خدماتك؟</p>
                            </div>

                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-black text-gray-900 leading-none">
                                    {localReviews?.length > 0
                                        ? (localReviews.reduce((acc: number, curr: any) => acc + (curr.rating || 5), 0) / localReviews.length).toFixed(1)
                                        : '0.0'}
                                </span>
                                <div className="flex text-amber-400 text-sm mt-1">
                                    {'★'.repeat(5)}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 mt-1">
                                    من إجمالي {localReviews?.length || 0} تقييم
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {localReviews && localReviews.length > 0 ? (
                                localReviews?.map((review: any) => (
                                    <div key={review.id || review.review_id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all text-right">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-black flex items-center justify-center text-lg">
                                                    {(review.customer_name || review.visitor_name) ? (review.customer_name || review.visitor_name).charAt(0) : 'ع'}
                                                </div>
                                                <div className="text-right">
                                                    <h4 className="text-sm font-black text-gray-900">{review.customer_name || review.visitor_name || 'عميل ونَس'}</h4>
                                                    <span className="text-[10px] font-bold text-gray-400" dir="ltr">
                                                        {new Date(review.created_at).toLocaleDateString('ar-SA')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex text-amber-400 text-sm" dir="ltr">
                                                {'★'.repeat(review.rating || 5)}{'☆'.repeat(5 - (review.rating || 5))}
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4">
                                            "{review.comment || review.notes || 'لا يوجد تعليق نصي'}"
                                        </p>

                                        {review.listing?.title && (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-gray-500">
                                                <span>🏡</span>
                                                {review.listing.title}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-1 md:col-span-2 py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-white">
                                    <span className="text-4xl mb-3 block opacity-50">⭐</span>
                                    <p className="text-gray-400 font-bold">لا توجد تقييمات حتى الآن</p>
                                    <p className="text-xs text-gray-400 mt-1 font-medium">الخدمة الممتازة ستجلب لك تقييمات رائعة قريباً!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── ANALYTICS TAB ─── */}
                {tab === 'analytics' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {!hasFullAccess ? (
                            /* ─── باقة ونَس برو: التصميم المستوحى من سلة ─── */
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-rose-100/30 overflow-hidden" dir="rtl">

                                {/* الهيدر: السعر والعنوان */}
                                <div className="bg-gradient-to-b from-gray-50 to-white p-10 text-center border-b border-gray-50 relative">
                                    <div className="absolute top-4 right-4 bg-rose-500 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg rotate-[-5deg]">
                                        الباقة الأكثر طلباً
                                    </div>
                                    <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-50 flex items-center justify-center mx-auto mb-6 text-4xl">
                                        🚀
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2">ونَس برو</h2>
                                    <p className="text-gray-400 font-bold text-sm mb-6">باقة النمو الاحترافي والسيطرة على السوق</p>

                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-6xl font-black text-gray-900 italic tracking-tighter">99</span>
                                        <span className="text-lg font-black text-gray-400">ر.س / شهرياً</span>
                                    </div>
                                </div>

                                {/* قائمة المزايا الكاملة */}
                                <div className="p-8 md:p-12 space-y-8">
                                    {[
                                        {
                                            t: "أولوية السيادة والظهور",
                                            d: "تصدّر نتائج البحث والفئات بظهور أعلى يضمن وصولك للعميل الجاهز قبل المنافسين المجانيين.",
                                            icon: "🥇"
                                        },
                                        {
                                            t: "وسام 'برو' للثقة والتميز",
                                            d: "شارة تميّز احترافية تزين إعلانك، تكسر حاجز التردد وتضاعف معدلات النقر فوراً.",
                                            icon: "🛡️"
                                        },
                                        {
                                            t: "رادار المشاهدات والتفاعل",
                                            d: "إحصائيات دقيقة للحظة بلحظة؛ اعرف كم عين شاهدت خدمتك وكم عميل نقر للواتساب أو الاتصال.",
                                            icon: "📊"
                                        },
                                        {
                                            t: "بوصلة أوقات ذروة الطلب",
                                            d: "سنكشف لك عن 'الساعات الذهبية' التي ينشط فيها عملاؤك لتبرز عرضك في الوقت المثالي.",
                                            icon: "⏱️"
                                        },
                                        {
                                            t: "خريطة المناطق والأحياء",
                                            d: "اكتشف أكثر المناطق طلباً لخدمتك، لتوجيه مجهودك التسويقي نحو الأماكن الأكثر ربحية.",
                                            icon: "📍"
                                        },
                                        {
                                            t: "تحليل الأداء التنافسي",
                                            d: "افهم موقعك في السوق عبر مقارنة أداء إعلانك بمتوسط الحي أو الفئة بناءً على أرقام حقيقية.",
                                            icon: "📈"
                                        },
                                        {
                                            t: "تحسين الجودة التقنية (Quality Score)",
                                            d: "رفع تلقائي لتقييم جودة إعلانك برمجياً، مما يجعله 'يلمع' في محركات البحث الداخلية.",
                                            icon: "💎"
                                        }
                                    ]?.map((item, i) => (
                                        <div key={i} className="flex items-start gap-5 group">
                                            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <span className="text-xl">{item.icon}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-[15px] font-black text-gray-800 leading-none">{item.t}</h4>
                                                    <div className="h-[1px] flex-1 bg-gray-50"></div>
                                                    <span className="text-emerald-500">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                                    </span>
                                                </div>
                                                <p className="text-[12px] text-gray-400 font-bold leading-relaxed">
                                                    {item.d}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* زر التفعيل النهائي */}
                                <div className="p-8 pt-0">
                                    <button
                                        onClick={() => setIsProModalOpen(true)}
                                        className="w-full bg-[#f63659] hover:bg-[#d42d4d] text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-rose-200 transition-all active:scale-[0.98] transform hover:-translate-y-1"
                                    >
                                        تفعيل PRO الآن
                                    </button>
                                    <div className="mt-6 flex flex-col items-center gap-2">
                                        <p className="text-[10px] text-gray-300 font-black tracking-widest uppercase italic">إلغاء الاشتراك في أي وقت بنقرة واحدة</p>
                                        <div className="flex gap-4 opacity-20 grayscale scale-75">
                                            <span className="font-black">MADA</span>
                                            <span className="font-black">VISA</span>
                                            <span className="font-black">APPLE PAY</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Trophies Section */}
                                {isTop10 && (
                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-100 relative overflow-hidden shadow-sm">
                                        <div className="absolute top-0 left-0 w-32 h-32 bg-white/40 blur-2xl rounded-full" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-3xl shrink-0 border border-amber-50">🏆</div>
                                            <div>
                                                <h3 className="text-base font-black text-amber-900 tracking-tight">أنت تتصدر القائمة!</h3>
                                                <p className="text-xs text-amber-700/80 font-bold leading-relaxed mt-0.5">إعلاناتك ضمن أعلى 10% جذباً للعملاء هذا الشهر.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 1. قسم ملخص الأداء */}
                                <section className="relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-black text-gray-900">ملخص الأداء</h3>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">آخر 7 أيام</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* بطاقة الظهور */}
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
                                            <p className="text-[10px] font-bold text-gray-400 mb-1">الظهور (مفلتر)</p>
                                            <p className="text-2xl font-black text-gray-900">{stats.totalViews}</p>
                                            <span className="text-[9px] text-emerald-500 font-bold">↑ 12%+</span>
                                        </div>

                                        {/* بطاقة الزيارات */}
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
                                            <p className="text-[10px] font-bold text-gray-400 mb-1">الزيارات</p>
                                            <p className="text-2xl font-black text-gray-900">{stats.totalClicks}</p>
                                            <span className="text-[9px] text-emerald-500 font-bold">↑ 5%+</span>
                                        </div>

                                        {/* بطاقة معدل التحويل */}
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
                                            <p className="text-[10px] font-bold text-gray-400 mb-1">معدل التحويل</p>
                                            <p className="text-2xl font-black text-gray-900">{conversionRate}%</p>
                                            <span className="text-[9px] text-emerald-500 font-bold">↑ 2%+</span>
                                        </div>

                                        {/* بطاقة التواصل الفعلي */}
                                        <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm text-center">
                                            <p className="text-[10px] font-bold text-rose-400 mb-1">التواصل الفعلي</p>
                                            <p className="text-2xl font-black text-rose-500">{stats.totalRequests}</p>
                                            <span className="text-[9px] text-rose-400 font-bold">↑ 20%+</span>
                                        </div>
                                    </div>
                                </section>

                                {/* قسم أسرار نمو إعلانك */}
                                <section className="bg-white rounded-3xl border border-gray-100 p-6 relative overflow-hidden shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                            <span className="text-rose-500">★</span> أسرار نمو إعلانك
                                        </h3>
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black border border-emerald-100">
                                            ✓ PRO نشط
                                        </span>
                                    </div>

                                    <div className="space-y-8">
                                        {/* 1. اتجاه الأداء الشامل */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black text-gray-800 text-sm">اتجاه الأداء الشامل</h4>
                                                <span className="p-2 bg-gray-50 rounded-lg text-xs">📈</span>
                                            </div>
                                            <div className="h-32 bg-gray-50 rounded-2xl border border-gray-100 flex items-end p-4 gap-2">
                                                {[40, 70, 45, 90, 65, 80, 50, 30, 85, 60]?.map((h, i) => (
                                                    <div key={i} className="flex-1 bg-rose-200 rounded-t-md hover:bg-rose-400 transition-colors" style={{ height: `${h}%` }}></div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold">لقد تضاعفت نقراتك يوم الخميس.. اكتشف السبب.</p>
                                        </div>

                                        {/* 2. أفضل الكلمات البحثية */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black text-gray-800 text-sm">أفضل الكلمات البحثية</h4>
                                                <span className="p-2 bg-gray-50 rounded-lg text-xs">🔍</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {['شاليه بمسبح', 'حي الروضة', 'شاليهات عائلية', 'مناسبات كبيرة', 'استراحة بجدة']?.map(word => (
                                                    <span key={word} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 shadow-sm">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold">"شاليه بمسبح" جلبت لك 32 زيارة 🔥</p>
                                        </div>

                                        {/* 3. خريطة طلبات الأحياء */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black text-gray-800 text-sm">خريطة طلبات الأحياء</h4>
                                                <span className="p-2 bg-gray-50 rounded-lg text-xs">📍</span>
                                            </div>
                                            <div className="h-40 bg-gray-100 rounded-2xl border border-gray-100 relative overflow-hidden flex items-center justify-center">
                                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i2411!3i1645!2m3!1e0!2sm!3i633140934!3m8!2sar!3sSA!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!5f2')] bg-cover"></div>
                                                <p className="relative z-10 text-[10px] font-black text-gray-400">شمال جدة يمثل 45% من عملائك المحتملين 🗺️</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Social Proof */}
                                <div className="mb-4">
                                    <Testimonial
                                        text='التحليلات أنقذتني! اكتشفت أن صوري القديمة كانت السبب في ضعف الحجوزات. بعد تغييرها بناءً على توصيات المنصة، زاد تواصلي 3 أضعاف.'
                                        name="أبو سعود"
                                        role="مستثمر شاليهات · جدة"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ─── Sticky Bottom CTA ─── */}
            {tab === 'analytics' && !hasFullAccess && (
                <div className="fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-safe">
                    <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-gray-900 tracking-tight mb-0.5">افتح صندوق أسرارك</p>
                            <p className="text-[11px] text-gray-500 font-bold truncate">استثمر 99 ر.س لتعظيم أرباحك 🚀</p>
                        </div>
                        <button className="shrink-0 px-6 py-3.5 rounded-xl font-black text-white text-sm active:scale-95 transition-all shadow-md hover:shadow-lg relative overflow-hidden group"
                            style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})` }}>
                            <span className="relative z-10">ترقية لـ VIP</span>
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </div>
            )}

            {/* 🎯 نافذة التأكيد الاحترافية */}
            {confirmAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl ${confirmAction.status === 'completed' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                            {confirmAction.status === 'completed' ? '🤝' : '⚠️'}
                        </div>
                        <h3 className="text-lg font-black text-center mb-2 text-gray-900">تأكيد الإجراء</h3>
                        <p className="text-sm text-gray-500 text-center mb-6 font-medium">
                            {confirmAction.status === 'completed'
                                ? 'هل أنت متأكد من قبول طلب الحجز لهذا العميل؟'
                                : 'هل أنت متأكد من رفض طلب الحجز؟ لا يمكن التراجع.'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={executeRequestAction}
                                disabled={isProcessing}
                                className={`flex-1 py-3.5 rounded-xl font-black text-white text-sm transition-all flex items-center justify-center gap-2 ${confirmAction.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                                    }`}
                            >
                                {isProcessing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'نعم، تأكيد'}
                            </button>
                            <button
                                onClick={() => setConfirmAction(null)}
                                disabled={isProcessing}
                                className="flex-1 py-3.5 rounded-xl font-black text-gray-600 bg-gray-100 hover:bg-gray-200 text-sm transition-all"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🌟 إشعار النجاح / الخطأ */}
            {toastMsg && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`px-6 py-3.5 rounded-full shadow-lg border text-sm font-black flex items-center gap-2 ${toastMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}>
                        <span className="text-lg">{toastMsg.type === 'success' ? '✨' : '❌'}</span>
                        {toastMsg.text}
                    </div>
                </div>
            )}

            {/* 🌟 نافذة طلب اشتراك PRO */}
            {isProModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">

                        {/* تصميم علوي */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#f63659] to-rose-400"></div>

                        <div className="flex justify-between items-start mb-6 mt-2">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">طلب تفعيل باقة PRO 🚀</h3>
                                <p className="text-sm text-gray-500 font-bold mt-1 text-right">سيتم إرسال طلبك للإدارة للمراجعة والتفعيل</p>
                            </div>
                            <button onClick={() => setIsProModalOpen(false)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setIsSubmittingPro(true);

                            try {
                                // 1. تسجيل الطلب في قاعدة البيانات
                                const { error: requestError } = await supabaseBrowser
                                    .from('pro_requests')
                                    .insert({
                                        provider_id: provider.provider_id,
                                        start_date: startDate,
                                        end_date: endDate,
                                        status: 'pending'
                                    });

                                if (requestError) throw requestError;

                                setToastMsg({ text: 'تم إرسال طلبك للإدارة بنجاح ✨', type: 'success' });
                                setIsProModalOpen(false);
                            } catch (error: any) {
                                console.error('Detailed Error:', error.message || error);
                                setToastMsg({
                                    text: error.message || 'حدث خطأ أثناء إرسال الطلب، تأكد من قاعدة البيانات',
                                    type: 'error'
                                });
                            } finally {
                                setIsSubmittingPro(false);
                            }
                        }} className="space-y-4">

                            {/* الحقول المعبأة تلقائياً */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 mb-1 text-right">اسم المزود</label>
                                    <input type="text" readOnly value={provider.display_name} className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 mb-1 text-right">رقم الاتصال</label>
                                    <input type="text" readOnly value={provider.phone_whatsapp} className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none cursor-not-allowed" dir="ltr" />
                                </div>
                            </div>

                            {/* اختيار التواريخ */}
                            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
                                <div>
                                    <label className="block text-xs font-black text-gray-900 mb-1 text-right">تاريخ البداية</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-white border border-rose-200 focus:border-[#f63659] text-gray-900 text-sm font-bold rounded-xl px-4 py-2.5 outline-none transition-colors cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 mb-1 text-right">تاريخ النهاية (تلقائي)</label>
                                    <div className="w-full bg-rose-50 border border-rose-100 text-rose-700 text-sm font-black rounded-xl px-4 py-2.5 flex items-center justify-between cursor-not-allowed">
                                        <span>{endDate}</span>
                                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-rose-500">شهر واحد</span>
                                    </div>
                                </div>
                            </div>

                            {/* زر الإرسال */}
                            <button
                                type="submit"
                                disabled={isSubmittingPro}
                                className="w-full bg-[#f63659] hover:bg-rose-600 text-white py-4 rounded-xl font-black text-lg transition-all active:scale-95 flex justify-center items-center gap-2 mt-6"
                            >
                                {isSubmittingPro ? (
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'إرسال طلب الاشتراك'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
            `}} />
        </div>
    )
}
