"use client";

import { useBookings } from "@/lib/hooks/useBookings";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar, Trash2, MessageSquare, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function BookingsContent() {
    const { bookings, removeBooking } = useBookings();

    return (
        <div className="min-h-screen bg-white pb-20 px-4 md:px-8" dir="rtl">
            <div className="max-w-7xl mx-auto pt-12">
                <div className="flex items-center justify-between mb-10">
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <Calendar className="text-rose-600" size={32} />
                        تاريخ الحجوزات
                    </h1>
                    <Link href="/profile" className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1">
                        الملف الشخصي
                        <ChevronLeft size={16} />
                    </Link>
                </div>

                {bookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                                <button
                                    onClick={() => removeBooking(booking.id)}
                                    className="absolute top-4 left-4 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <div className="space-y-4">
                                    <div className="bg-rose-50 text-rose-600 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                        تم التواصل عبر واتساب
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{booking.title}</h3>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {format(booking.timestamp, "d MMMM yyyy - h:mm a", { locale: ar })}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">تاريخ الحجز</p>
                                            <p className="text-sm font-bold text-gray-900">{booking.date}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">المناسبة</p>
                                            <p className="text-sm font-bold text-gray-900">{booking.eventType || 'غير محدد'}</p>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/listing/${booking.listingId}`}
                                        className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-2xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 mt-2"
                                    >
                                        عرض الإعلان
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-6">
                            <Calendar size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">لا يوجد حجوزات سابقة</h2>
                        <p className="text-gray-500 mb-8 max-w-sm">لم تقم بإجراء أي طلبات حجز بعد. استكشف الأماكن وقم بالتواصل مع المزودين ليبدأ تاريخك هنا.</p>
                        <Link href="/" className="px-8 py-3 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">
                            اكتشف الآن
                        </Link>
                    </div>
                )}

                <div className="mt-16 p-6 bg-blue-50 rounded-[32px] border border-blue-100 flex items-start gap-4 max-w-2xl">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 mb-1 leading-tight">كيف يعمل هذا السجل؟</h4>
                        <p className="text-xs text-blue-700/80 leading-relaxed font-medium">
                            يتم تسجيل طلبات الحجز محلياً في متصفحك بمجرد ضغطك على زر التواصل عبر واتساب. هذا يساعدك على تذكر الأماكن التي اهتممت بها والتواريخ التي قمت بتحديدها.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
