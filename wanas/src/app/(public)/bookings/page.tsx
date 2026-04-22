import { Suspense } from "react";
import BookingsContent from "./BookingsContent";

export default function BookingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-[#f63659] font-bold text-lg">جاري تحميل الحجوزات...</p>
            </div>
        }>
            <BookingsContent />
        </Suspense>
    );
}
