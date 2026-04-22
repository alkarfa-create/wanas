'use client'

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function AdminProRequestsTable() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // حالات (States) لتعديل الباقة
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabaseBrowser
                .from('pro_requests')
                .select(`
                    id,
                    provider_id,
                    start_date,
                    end_date,
                    created_at,
                    providers (
                        display_name,
                        phone_whatsapp
                    )
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase Error Details:', error.message, error.details, error.hint);
                throw error;
            }
            setRequests(data || []);
        } catch (error: any) {
            console.error('Catch Block Error:', error);
            alert("فشل جلب الطلبات: " + (error.message || "تأكد من العلاقات (Foreign Keys) في قاعدة البيانات"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // تفعيل وضع التعديل
    const startEditing = (req: any) => {
        setEditingId(req.id);
        setEditStartDate(req.start_date);
        setEditEndDate(req.end_date);
    };

    // إلغاء التعديل
    const cancelEditing = () => {
        setEditingId(null);
        setEditStartDate('');
        setEditEndDate('');
    };

    // دالة القبول/الرفض المباشر أو الحفظ بعد التعديل
    const handleAction = async (requestId: string, providerId: string, action: 'approved' | 'rejected') => {
        if (!confirm(`هل أنت متأكد من تنفيذ هذا الإجراء؟`)) return;

        // 🚀 تحديث متفائل: احذف الصف من الشاشة فوراً
        const backup = [...requests];
        setRequests(prev => prev.filter(req => req.id !== requestId));
        setProcessingId(requestId);

        try {
            // 1. تحديث حالة الطلب
            const { error: reqError } = await supabaseBrowser
                .from('pro_requests')
                .update({ status: action })
                .eq('id', requestId);

            if (reqError) throw reqError;

            // 2. إذا كان "قبول"، نرقّي باقة المزود
            if (action === 'approved') {
                const { error: provError } = await supabaseBrowser
                    .from('providers')
                    .update({ subscription_tier: 'pro' })
                    .eq('provider_id', providerId);

                if (provError) throw provError;
            }

            // 3. 🚀 إرسال الإشعار للمزود
            await supabaseBrowser.from('notifications').insert([{
                provider_id: providerId,
                title: action === 'approved' ? 'تم تفعيل PRO 🚀' : 'تحديث الطلب',
                message: 'تمت معالجة طلبك بنجاح.',
                type: action === 'approved' ? 'approval' : 'system'
            }]);

        } catch (error: any) {
            // 🛑 إذا فشل السيرفر، أعد الصف لمكانه ونبه المدير
            setRequests(backup);
            console.error('Action Error:', error);
            alert('فشلت العملية: ' + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-amber-600 font-bold animate-pulse">جاري جلب بيانات الطلبات...</div>;

    if (requests.length === 0) return (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <span className="text-3xl mb-2 block opacity-50">✨</span>
            <p className="text-gray-500 font-bold text-sm">لا توجد طلبات PRO معلقة حالياً.</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" dir="rtl">
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 text-xs font-black text-gray-500">معلومات المزود</th>
                            <th className="p-4 text-xs font-black text-gray-500">تفاصيل الباقة (المدة)</th>
                            <th className="p-4 text-xs font-black text-gray-500">تاريخ التقديم</th>
                            <th className="p-4 text-xs font-black text-gray-500 text-center">الإجراءات والقرارات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">

                                {/* 1. معلومات المزود */}
                                <td className="p-4 align-top">
                                    {(() => {
                                        // 🚀 هذا السطر يحل مشكلة Supabase إذا أرجع البيانات كمصفوفة أو كائن
                                        const providerData = Array.isArray(req.providers) ? req.providers[0] : req.providers;
                                        const displayName = providerData?.display_name || 'مزود غير معروف';
                                        const phone = providerData?.phone_whatsapp || 'لا يوجد رقم';

                                        return (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-lg shrink-0 shadow-sm border border-rose-100">
                                                    {displayName !== 'مزود غير معروف' ? displayName.charAt(0) : 'م'}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 text-sm mb-1">{displayName}</h4>
                                                    <p className="text-xs font-bold text-gray-500 flex items-center gap-1" dir="ltr">
                                                        {phone} <span className="text-emerald-500">📱</span>
                                                    </p>
                                                    {/* سطر لكشف المشكلة للمطور (يمكنك حذفه لاحقاً) */}
                                                    {!providerData && <span className="text-[9px] text-rose-400 font-bold">بيانات المزود محجوبة أو غير مرتبطة</span>}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </td>

                                {/* 2. تفاصيل الباقة (تدعم وضع التعديل) */}
                                <td className="p-4 align-top">
                                    {editingId === req.id ? (
                                        <div className="flex flex-col gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 mb-1 block text-right">تعديل تاريخ البدء</label>
                                                <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="w-full text-xs font-bold px-2 py-1.5 rounded border border-gray-200" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 mb-1 block text-right">تعديل تاريخ الانتهاء</label>
                                                <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="w-full text-xs font-bold px-2 py-1.5 rounded border border-gray-200" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md inline-block w-max border border-emerald-100">
                                                يبدأ: {req.start_date}
                                            </span>
                                            <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md inline-block w-max border border-rose-100">
                                                ينتهي: {req.end_date}
                                            </span>
                                        </div>
                                    )}
                                </td>

                                {/* 3. تاريخ التقديم */}
                                <td className="p-4 align-top text-xs font-bold text-gray-500">
                                    <div className="bg-gray-50 px-3 py-1.5 rounded-lg inline-block border border-gray-100" dir="ltr">
                                        {new Date(req.created_at).toLocaleDateString('ar-SA')}
                                    </div>
                                </td>

                                {/* 4. الأزرار والإجراءات */}
                                <td className="p-4 align-top">
                                    {editingId === req.id ? (
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleAction(req.id, req.provider_id, 'approved')}
                                                disabled={processingId === req.id}
                                                className="w-full bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-emerald-600 shadow-sm transition-all"
                                            >
                                                {processingId === req.id ? 'جاري...' : 'حفظ وتفعيل الباقة'}
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="w-full bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-xs font-black hover:bg-gray-200 transition-all"
                                            >
                                                إلغاء التعديل
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleAction(req.id, req.provider_id, 'approved')}
                                                disabled={processingId === req.id}
                                                className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white px-4 py-2 rounded-lg text-xs font-black transition-all"
                                            >
                                                {processingId === req.id ? '...' : 'تفعيل'}
                                            </button>

                                            <button
                                                onClick={() => startEditing(req)}
                                                disabled={processingId === req.id}
                                                className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-lg text-xs font-black transition-all"
                                            >
                                                ⚙️ تعديل الباقة
                                            </button>

                                            <button
                                                onClick={() => handleAction(req.id, req.provider_id, 'rejected')}
                                                disabled={processingId === req.id}
                                                className="bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-500 hover:text-white px-4 py-2 rounded-lg text-xs font-black transition-all"
                                            >
                                                رفض
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}