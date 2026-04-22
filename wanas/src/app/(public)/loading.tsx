// src/app/(public)/loading.tsx
export default function Loading() {
    return (
        <div className="min-h-screen bg-white" dir="rtl">

            {/* Category bar skeleton */}
            <div className="w-full bg-white border-b border-gray-100 sticky top-[64px] z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex items-center justify-center gap-6 py-3 overflow-hidden">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="shrink-0 flex flex-col items-center gap-2 px-3 pb-2 pt-1">
                                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                                <div className="w-12 h-2.5 rounded bg-gray-100 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filter bar skeleton */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4 mb-2">
                <div className="flex gap-2 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-9 rounded-xl bg-gray-100 animate-pulse shrink-0"
                            style={{ width: `${60 + i * 15}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                </div>
            </div>

            {/* Section header skeleton */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 mb-4">
                <div className="h-6 bg-gray-100 rounded-lg w-48 animate-pulse" />
                <div className="h-3.5 bg-gray-50 rounded w-24 mt-2 animate-pulse" />
            </div>

            {/* Cards skeleton — موبايل: أفقي */}
            <div className="flex md:hidden gap-4 overflow-hidden px-4 pb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="shrink-0 w-[80vw] flex flex-col bg-white rounded-[24px] overflow-hidden"
                        style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="relative aspect-[1/1] rounded-[20px] m-2 bg-gray-100 animate-pulse" />
                        <div className="p-4 pt-2 flex flex-col gap-3">
                            <div className="flex justify-between gap-2">
                                <div className="h-5 bg-gray-100 rounded w-2/3 animate-pulse" />
                                <div className="h-5 bg-gray-50 rounded-full w-12 animate-pulse" />
                            </div>
                            <div className="h-3.5 bg-gray-50 rounded w-1/2 animate-pulse" />
                            <div className="pt-3 border-t border-gray-50">
                                <div className="h-6 bg-gray-100 rounded w-24 animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cards skeleton — لاب توب: grid */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-8 max-w-7xl mx-auto">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col bg-white rounded-[24px] overflow-hidden"
                        style={{ animationDelay: `${i * 0.07}s` }}>
                        <div className="relative aspect-[1/1] rounded-[20px] m-2 bg-gray-100 animate-pulse" />
                        <div className="p-4 pt-2 flex flex-col gap-3">
                            <div className="flex justify-between gap-2">
                                <div className="h-5 bg-gray-100 rounded w-2/3 animate-pulse" />
                                <div className="h-5 bg-gray-50 rounded-full w-12 animate-pulse" />
                            </div>
                            <div className="h-3.5 bg-gray-50 rounded w-1/2 animate-pulse" />
                            <div className="pt-3 border-t border-gray-50">
                                <div className="h-6 bg-gray-100 rounded w-24 animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    )
}
