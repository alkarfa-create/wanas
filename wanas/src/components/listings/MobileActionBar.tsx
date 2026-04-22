"use client";
import { MessageCircle } from "lucide-react";

export default function MobileActionBar({ price, phone }: { price: number, phone: string }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 px-6 z-[100] lg:hidden flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black">{price?.toLocaleString('ar-SA')} ر.س</span>
                    <span className="text-gray-500 text-xs font-bold">/ ليلة</span>
                </div>
                <button className="text-[10px] font-black underline text-black">15 - 20 فبراير</button>
            </div>

            <div className="flex gap-2">
                <a
                    href={`https://wa.me/${phone}`}
                    className="p-3 bg-green-500 text-white rounded-2xl active:scale-90 transition-transform shadow-md"
                >
                    <MessageCircle size={24} fill="currentColor" />
                </a>
                <button className="bg-gradient-to-r from-[#FF385C] to-[#E61E4D] text-white px-8 py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-transform shadow-lg shadow-rose-200">
                    احجز الآن
                </button>
            </div>
        </div>
    );
}
