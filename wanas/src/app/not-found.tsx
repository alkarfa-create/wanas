// src/app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center" dir="rtl">

            {/* خلفية زخرفية */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-64 h-64 rounded-full opacity-5"
                    style={{ background: 'radial-gradient(circle, #f63659, transparent)' }} />
                <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full opacity-5"
                    style={{ background: 'radial-gradient(circle, #f63659, transparent)' }} />
            </div>

            <div className="relative z-10 max-w-sm">
                {/* الرقم 404 */}
                <div className="relative mb-6">
                    <span className="text-[120px] font-black leading-none select-none"
                        style={{
                            background: 'linear-gradient(135deg, #f63659, #ff8a65)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                        404
                    </span>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-4xl">🏡</div>
                </div>

                <div className="mt-8 mb-3">
                    <h1 className="text-2xl font-black text-gray-900 mb-2">الصفحة غير موجودة</h1>
                    <p className="text-gray-400 font-medium text-sm leading-relaxed">
                        يبدو أن هذا المكان لا يوجد على الخريطة!<br />
                        ربما تم حذف الإعلان أو تغيير رابطه.
                    </p>
                </div>

                {/* أزرار */}
                <div className="flex flex-col gap-3 mt-8">
                    <Link href="/"
                        className="w-full py-3.5 rounded-2xl font-black text-white text-sm transition-all active:scale-95 shadow-lg shadow-rose-100"
                        style={{ backgroundColor: '#f63659' }}>
                        العودة للرئيسية
                    </Link>
                    <Link href="/?category=chalets"
                        className="w-full py-3.5 rounded-2xl font-black text-gray-700 text-sm bg-gray-50 hover:bg-gray-100 transition-all">
                        تصفح الشاليهات 🏊
                    </Link>
                </div>

                {/* لوغو */}
                <div className="mt-10">
                    <span className="text-xs font-black text-gray-200 tracking-widest">ونَس</span>
                </div>
            </div>
        </div>
    )
}
