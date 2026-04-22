'use client'
// src/app/(public)/error.tsx

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Wanas error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center" dir="rtl">

            {/* خلفية */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, #f63659, transparent)' }} />
            </div>

            <div className="relative z-10 max-w-sm">

                {/* أيقونة الخطأ */}
                <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl"
                    style={{ background: 'linear-gradient(135deg, #fff0f3, #ffe0e6)' }}>
                    ⚡
                </div>

                <h1 className="text-2xl font-black text-gray-900 mb-3">حدث خطأ ما</h1>
                <p className="text-gray-400 font-medium text-sm leading-relaxed mb-8">
                    واجهنا مشكلة غير متوقعة.<br />
                    حاول مرة أخرى أو عد للرئيسية.
                </p>

                {/* كود الخطأ للمطورين */}
                {error.digest && (
                    <div className="bg-gray-50 rounded-xl px-4 py-2 mb-6 text-left" dir="ltr">
                        <p className="text-[10px] text-gray-300 font-mono">Error ID: {error.digest}</p>
                    </div>
                )}

                {/* أزرار */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={reset}
                        className="w-full py-3.5 rounded-2xl font-black text-white text-sm transition-all active:scale-95 shadow-lg shadow-rose-100"
                        style={{ backgroundColor: '#f63659' }}>
                        حاول مرة أخرى
                    </button>
                    <Link href="/"
                        className="w-full py-3.5 rounded-2xl font-black text-gray-700 text-sm bg-gray-50 hover:bg-gray-100 transition-all">
                        العودة للرئيسية
                    </Link>
                </div>

                <div className="mt-10">
                    <span className="text-xs font-black text-gray-200 tracking-widest">ونَس</span>
                </div>
            </div>
        </div>
    )
}
