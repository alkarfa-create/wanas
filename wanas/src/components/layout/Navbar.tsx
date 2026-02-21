"use client";

import Link from "next/link";

export default function Navbar() {
    return (
        <header className="bg-white border-b border-gray-200 relative z-50">
            <div className="max-w-[1760px] mx-auto px-6 h-[80px] flex justify-between items-center">

                {/* اليسار: حساب المستخدم والأزرار */}
                <div className="flex-1 basis-0 flex justify-start items-center gap-4 order-1">
                    <button className="flex items-center gap-2 border border-gray-300 rounded-full p-1.5 pl-3 hover:shadow-md transition-shadow">
                        <svg viewBox="0 0 32 32" className="w-4 h-4 ml-1 stroke-gray-600 stroke-[3px]"><path d="M2 16h28M2 24h28M2 8h28" /></svg>
                        <div className="w-8 h-8 bg-[#f63659] rounded-full flex items-center justify-center text-white text-xs font-black">ع</div>
                    </button>
                    <Link href="/add-listing" className="hidden lg:block text-[14px] font-bold text-gray-800 hover:bg-gray-50 px-4 py-2 rounded-full transition-colors">
                        أضف إعلانك
                    </Link>
                </div>

                {/* الوسط: كبسولة البحث */}
                <div className="hidden md:flex flex-[2] justify-center items-center order-2">
                    <div className="bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md h-[48px] px-2 flex items-center transition-shadow cursor-pointer min-w-[320px]">
                        <div className="flex-1 px-4 text-[13px] font-bold border-e border-gray-200">المكان</div>
                        <div className="flex-1 px-4 text-[13px] font-bold border-e border-gray-200">التاريخ</div>
                        <div className="flex-1 px-4 text-[13px] text-gray-400 font-medium">إضافة ضيوف</div>
                        <div className="w-8 h-8 rounded-full bg-[#f63659] flex items-center justify-center text-white mr-2">
                            <svg viewBox="0 0 32 32" className="w-3 h-3 fill-none stroke-white stroke-[4px]"><path d="m13 24c6.0751322 0 11-4.9248678 11-11 0-6.07513225-4.9248678-11-11-11-6.07513225 0-11 4.92486775-11 11 0 6.0751322 4.92486775 11 11 11zm8-3 9 9"></path></svg>
                        </div>
                    </div>
                </div>

                {/* اليمين: الشعار */}
                <div className="flex-1 basis-0 flex justify-end order-3">
                    <Link href="/" style={{ color: '#f63659' }} className="text-2xl font-black tracking-tight flex-shrink-0">
                        ونـ<span>س</span>
                    </Link>
                </div>

            </div>
        </header>
    );
}
