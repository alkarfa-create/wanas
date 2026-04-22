"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Upload, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ListingCategoryOption {
    id: number;
    name_ar: string;
}

interface ListingDistrictOption {
    id: number;
    name_ar: string;
}

interface ListingFormInitialData {
    listing_id?: string;
    title?: string;
    description?: string;
    category_id?: number | string;
    district_id?: number | string;
    price_min?: number | string;
    price_max?: number | string | null;
    price_label?: string;
    capacity_max?: number | string;
    features?: string[];
    status?: string;
    provider_id?: string;
    media_urls?: string[];
}

interface ListingFormProps {
    initialData?: ListingFormInitialData;
    isEditing?: boolean;
}

const ALLOWED_LISTING_STATUSES = new Set(["draft", "pending_review", "approved", "rejected", "paused"]);

export default function ListingForm({ initialData, isEditing = false }: ListingFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<ListingCategoryOption[]>([]);
    const [districts, setDistricts] = useState<ListingDistrictOption[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>(initialData?.media_urls || []);

    const initialStatus =
        typeof initialData?.status === "string" && ALLOWED_LISTING_STATUSES.has(initialData.status)
            ? initialData.status
            : "pending_review";

    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        description: initialData?.description || "",
        category_id: initialData?.category_id?.toString() || "",
        district_id: initialData?.district_id?.toString() || "",
        price_min: initialData?.price_min?.toString() || "",
        price_max: initialData?.price_max?.toString() || "",
        price_label: initialData?.price_label || "لكل ليلة",
        capacity_max: initialData?.capacity_max?.toString() || "",
        features: initialData?.features || [] as string[],
        status: initialStatus,
        provider_id: initialData?.provider_id || "",
    });

    useEffect(() => {
        const fetchData = async () => {
            const { data: catData } = await supabaseBrowser.from("service_categories").select("id, name_ar");
            const { data: distData } = await supabaseBrowser.from("districts").select("id, name_ar");
            setCategories(catData || []);
            setDistricts(distData || []);
        };
        fetchData();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...newFiles]);

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            if (!prev[index].startsWith('http')) {
                URL.revokeObjectURL(prev[index]);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    // TODO(security-migration): move listings insert/update mutations to server actions.
    // Current client-side supabase mutations remain until server action endpoints are wired.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const safeStatus = ALLOWED_LISTING_STATUSES.has(formData.status) ? formData.status : "pending_review";
            const listingPayload = {
                title: formData.title,
                description: formData.description,
                category_id: parseInt(formData.category_id),
                district_id: parseInt(formData.district_id),
                price_min: parseInt(formData.price_min),
                price_max: formData.price_max ? parseInt(formData.price_max) : null,
                price_label: formData.price_label,
                capacity_max: parseInt(formData.capacity_max),
                features: formData.features,
                provider_id: formData.provider_id,
                status: safeStatus
            };

            let listingId = initialData?.listing_id;

            if (isEditing) {
                const { error } = await supabaseBrowser
                    .from("listings")
                    .update(listingPayload)
                    .eq("listing_id", listingId);
                if (error) throw error;
            } else {
                const { data, error } = await supabaseBrowser
                    .from("listings")
                    .insert([listingPayload])
                    .select()
                    .single();
                if (error) throw error;
                listingId = data.listing_id;
            }

            // Media Handling (Simulated/Basic)
            if (!isEditing || images.length > 0) {
                const mediaToAdd = previews
                    .filter(url => url.startsWith('http'))
                    .map((url, i) => ({
                        listing_id: listingId,
                        url: url,
                        sort_order: i
                    }));

                // If editing, we'd normally sync images (delete old, add new)
                // For simplicity here, we add any new ones
                if (mediaToAdd.length > 0) {
                    await supabaseBrowser.from("listing_media").delete().eq("listing_id", listingId);
                    await supabaseBrowser.from("listing_media").insert(mediaToAdd);
                }
            }

            router.push("/admin/listings");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error("Error saving listing:", error);
            alert("حدث خطأ: " + message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info Container */}
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center font-black text-sm">١</div>
                    <h3 className="font-bold text-gray-900">المعلومات الأساسية</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">معرّف المزود (UUID)</label>
                        <input
                            type="text"
                            required
                            value={formData.provider_id}
                            onChange={e => setFormData({ ...formData, provider_id: e.target.value })}
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-rose-500 transition-all outline-none font-medium placeholder:text-gray-400"
                            placeholder="أدخل provider_id"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">عنوان الإعلان</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-rose-500 transition-all outline-none font-medium placeholder:text-gray-400"
                            placeholder="مثال: شالية الهدوء والرفاهية العائلي"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">نوع الخدمة (الفئة)</label>
                            <select
                                required
                                value={formData.category_id}
                                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-rose-500 transition-all outline-none font-bold"
                            >
                                <option value="">اختر الفئة...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">الحي (الموقع)</label>
                            <select
                                required
                                value={formData.district_id}
                                onChange={e => setFormData({ ...formData, district_id: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-rose-500 transition-all outline-none font-bold"
                            >
                                <option value="">اختر الحي...</option>
                                {districts.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">وصف تفصيلي</label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-rose-500 transition-all outline-none font-medium resize-none shadow-inner"
                            placeholder="اشرح ما يميز هذا المكان، المرافق المتوفرة، والسياسات..."
                        />
                    </div>
                </div>
            </div>

            {/* Price & Capacity Container */}
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-sm">٢</div>
                    <h3 className="font-bold text-gray-900">الأسعار والقدرة الاستيعابية</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">أقل سعر (ر.س)</label>
                        <input
                            type="number"
                            required
                            value={formData.price_min}
                            onChange={e => setFormData({ ...formData, price_min: e.target.value })}
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold focus:bg-white focus:border-rose-500 border border-transparent transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">أقصى عدد ضيوف</label>
                        <input
                            type="number"
                            required
                            value={formData.capacity_max}
                            onChange={e => setFormData({ ...formData, capacity_max: e.target.value })}
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold focus:bg-white focus:border-rose-500 border border-transparent transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">تسمية السعر</label>
                        <input
                            type="text"
                            value={formData.price_label}
                            onChange={e => setFormData({ ...formData, price_label: e.target.value })}
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold focus:bg-white focus:border-rose-500 border border-transparent transition-all"
                            placeholder="مثال: لكل ليلة"
                        />
                    </div>
                </div>
            </div>

            {/* Media Upload Container */}
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-black text-sm">٣</div>
                    <h3 className="font-bold text-gray-900">الصور والوسائط</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm group">
                            <Image src={src} alt="Preview" fill className="object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}

                    <label className="relative aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-rose-300 transition-all group">
                        <Upload className="mb-2 text-gray-400 group-hover:text-rose-500 transition-colors" size={24} />
                        <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-900">اضغط لرفع الصور</span>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-5 rounded-[24px] bg-rose-600 text-white font-black text-lg shadow-xl shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-rose-700'}`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            جاري الحفظ...
                        </>
                    ) : (
                        isEditing ? "حفظ التعديلات" : "نشر الإعلان الآن"
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-10 py-5 rounded-[24px] bg-white border border-gray-200 text-gray-900 font-bold hover:bg-gray-50 transition-all"
                >
                    إلغاء
                </button>
            </div>
        </form>
    );
}
