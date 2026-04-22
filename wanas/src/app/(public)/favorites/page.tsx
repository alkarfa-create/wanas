"use client";

import { useFavorites } from "@/lib/hooks/useFavorites";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import ListingCard from "@/components/listings/ListingCard";
import Link from "next/link";
import { Heart } from "lucide-react";

interface FavoriteListing {
    listing_id: string;
}

export default function FavoritesPage() {
    const { favorites } = useFavorites();
    const [listings, setListings] = useState<FavoriteListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            if (favorites.length === 0) {
                setListings([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabaseBrowser
                .from("listings")
                .select(`
          listing_id, title, price_min, price_max, price_label,
          capacity_min, capacity_max, rank_score, features,
          district:districts(name_ar),
          category:service_categories(name_ar, icon_key),
          provider:providers(display_name, phone_whatsapp, verification_status, trust_score)
        `)
                .in("listing_id", favorites);

            if (error) {
                console.error("Error fetching favorites:", error);
            } else {
                // Map data to handle arrays
                const mappedData = data?.map(item => ({
                    ...item,
                    district: Array.isArray(item.district) ? item.district[0] : item.district,
                    category: Array.isArray(item.category) ? item.category[0] : item.category,
                    provider: Array.isArray(item.provider) ? item.provider[0] : item.provider
                })) || [];
                setListings(mappedData);
            }
            setLoading(false);
        };

        fetchFavorites();
    }, [favorites]);

    return (
        <div className="min-h-screen bg-white pb-20 px-4 md:px-8" dir="rtl">
            <div className="max-w-7xl mx-auto pt-12">
                <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
                    <Heart className="fill-rose-500 text-rose-500" size={32} />
                    المفضلة
                </h1>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="animate-pulse flex flex-col gap-4">
                                <div className="aspect-square bg-gray-100 rounded-[20px]" />
                                <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : listings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {listings.map((item, index) => (
                            <ListingCard key={item.listing_id} listing={item} position={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 flex flex-col items-center">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                            <Heart size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">قائمة المفضلات فارغة</h2>
                        <p className="text-gray-500 mb-8 max-w-sm">لم تقم بإضافة أي شاليه أو خدمة للمفضلة بعد. اكتشف الأماكن الرائعة وقم بحفظها هنا للرجوع إليها لاحقاً.</p>
                        <Link href="/" className="px-8 py-3 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 transition-all">
                            اكتشف الآن
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
