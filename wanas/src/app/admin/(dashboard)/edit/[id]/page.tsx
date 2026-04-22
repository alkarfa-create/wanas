"use client";

import { useEffect, useState, use } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import ListingForm from "@/components/admin/ListingForm";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Loader2 } from "lucide-react";

interface EditableListingMedia {
    url: string;
}

interface EditableListing {
    media?: EditableListingMedia[];
    media_urls?: string[];
    [key: string]: unknown;
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [listing, setListing] = useState<EditableListing | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchListing = async () => {
            const { data, error } = await supabaseBrowser
                .from("listings")
                .select(`
                    *,
                    media:listing_media(url)
                `)
                .eq("listing_id", id)
                .single();

            if (error) {
                console.error("Error fetching listing for edit:", error);
            } else {
                setListing({
                    ...data,
                    media_urls: data.media?.map((m: EditableListingMedia) => m.url) || []
                });
            }
            setLoading(false);
        };

        fetchListing();
    }, [id]);

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto pb-20">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">تعديل الإعلان</h1>
                    <p className="text-gray-500 font-medium">قم بتحديث معلومات الإعلان ونشر التعديلات فوراً.</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-rose-500" size={40} />
                        <p className="font-bold text-gray-400">جاري تحميل بيانات الإعلان...</p>
                    </div>
                ) : listing ? (
                    <ListingForm initialData={listing} isEditing={true} />
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <p className="text-gray-500 font-bold text-lg">عذراً، لم يتم العثور على هذا الإعلان.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
