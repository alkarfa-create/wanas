'use client'

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function AdminProRequestBanner({ providerId }: { providerId: string }) {
    const [request, setRequest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // 1. التحقق مما إذا كان هذا المزود لديه طلب PRO معلق
    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const { data, error } = await supabaseBrowser
                    .from('pro_requests')
                    .select('*')
                    .eq('provider_id', providerId)
                    .eq('status', 'pending')
                    .maybeSingle(); // يجلب طلباً واحداً إن وُجد، أو null

                if (error && error.code !== 'PGRST116') throw error;
                setRequest(data);
            } catch (error) {
                console.error('Error fetching PRO request:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (providerId) fetchRequest();
    }, [providerId]);

    // 2. معالجة القرار (قبول أو رفض)
    const handleAction = async (action: 'approved' | 'rejected') => {
        if (!confirm(`هل أنت متأكد من ${action === 'approved' ? 'قبول' : 'رفض'} تفعيل باقة PRO؟`)) return;
        
        setActionLoading(action);
        try {
            // أ. تحديث حالة الطلب
            await supabaseBrowser
                .from('pro_requests')
                .update({ status: action })
                .eq('id', request.id);

            // ب. إذا كان قبول، نقوم بترقية حساب المزود في جدول المزودين
            if (action === 'approved') {
                await supabaseBrowser
                    .from('providers')
                    .update({ 
                        subscription_tier: 'pro',
                        has_full_access: true // لفتح التحليلات
                    })
                    .eq('provider_id', providerId);
            }

            // ج. (اختياري) إرسال إشعار للمزود بنتيجة طلبه
            await supabaseBrowser.from('notifications').insert({
                provider_id: providerId,
                type: 'approval',
                title: action === 'approved' ? 'مبروك! تم تفعيل PRO 🚀' : 'تحديث بخصوص طلب PRO',
                message: action === 'approved' 
                    ? `تم تفعيل اشتراكك في باقة PRO بنجاح حتى تاريخ ${request.end_date}.` 
                    : 'نعتذر، لم يتم الموافقة على طلب تفعيل باقة PRO الخاص بك حالياً.',
                is_read: false
            });

            // إخفاء الشريط بعد الانتهاء
            setRequest(null);
            alert(action === 'approved' ? 'تم تفعيل PRO بنجاح!' : 'تم رفض الطلب.');
            
            // إعادة تحميل الصفحة لتحديث بيانات المزود أمام المدير
            window.location.reload();

        } catch (error) {
            console.error('Action error:', error);
            alert('حدث خطأ أثناء التنفيذ');
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading || !request) return null; // لا نعرض شيئاً إذا لم يكن هناك طلب

    return (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl border border-slate-700 shadow-xl p-5 md:p-6 mb-8 text-white relative overflow-hidden animate-in fade-in slide-in-from-top-4" dir="rtl">
            {/* تأثيرات بصرية */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 blur-3xl rounded-full pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center text-2xl border border-rose-500/30 shrink-0">
                        🚀
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-black text-white">طلب تفعيل باقة PRO</h3>
                            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                بانتظار قرارك
                            </span>
                        </div>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">
                            هذا المزود يطلب تفعيل باقة النمو الاحترافي للفترة من <span className="font-bold text-white">{request.start_date}</span> إلى <span className="font-bold text-white">{request.end_date}</span>.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 shrink-0 w-full md:w-auto">
                    <button 
                        onClick={() => handleAction('approved')}
                        disabled={actionLoading !== null}
                        className="flex-1 md:flex-none bg-[#f63659] hover:bg-rose-500 text-white px-6 py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-rose-500/30 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {actionLoading === 'approved' ? 'جاري التفعيل...' : '✓ تفعيل للمزود'}
                    </button>
                    <button 
                        onClick={() => handleAction('rejected')}
                        disabled={actionLoading !== null}
                        className="flex-1 md:flex-none bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 px-6 py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50 flex justify-center items-center"
                    >
                        {actionLoading === 'rejected' ? '...' : '✕ رفض'}
                    </button>
                </div>

            </div>
        </div>
    );
}
