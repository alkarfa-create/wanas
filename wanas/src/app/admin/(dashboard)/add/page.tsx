"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import ListingForm from "@/components/admin/ListingForm";

export default function AddListingPage() {
    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto pb-20">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">إضافة إعلان جديد</h1>
                    <p className="text-gray-500 font-medium">أدخل تفاصيل الشالية أو الخدمة التي ترغب بإضافتها للمنصة.</p>
                </div>

                <ListingForm />
            </div>
        </AdminLayout>
    );
}
