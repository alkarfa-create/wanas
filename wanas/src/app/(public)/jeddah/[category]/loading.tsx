export default function Loading() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                        <div className="h-48 bg-gray-100" />
                        <div className="p-4 space-y-3">
                            <div className="h-3 bg-gray-100 rounded w-1/3" />
                            <div className="h-4 bg-gray-100 rounded w-4/5" />
                            <div className="h-4 bg-gray-100 rounded w-3/5" />
                            <div className="h-10 bg-gray-100 rounded-xl mt-4" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
