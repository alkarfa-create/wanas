"use client";
import { Heart, Star, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface AirbnbCarouselProps {
    title: string;
    listings: any[];
    href?: string;
}

export default function AirbnbCarousel({ title, listings, href = "/jeddah/chalets" }: AirbnbCarouselProps) {
    return (
        <section className="mt-8 mb-10 w-full">

            {/* 1. الترويسة البسيطة والأنيقة */}
            <div className="flex items-center justify-between px-4 md:px-8 mb-4">
                <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">
                    {title}
                </h2>
                {/* زر السهم الدائري الأنيق */}
                <Link href={href} className="w-8 h-8 flex items-center justify-center bg-transparent hover:bg-gray-100 rounded-full transition-colors shrink-0">
                    <ArrowLeft size={20} className="text-gray-900" />
                </Link>
            </div>

            {/* 2. شريط التمرير الأفقي */}
            <div className="flex gap-4 overflow-x-auto px-4 md:px-8 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] no-scrollbar">

                {listings.map((item) => {
                    const price = item.price_min ? `${item.price_min.toLocaleString('ar-SA')} ر.س` : 'تواصل للسعر';
                    const rating = "4.9";

                    return (
                        // السر هنا: w-[85vw] للجوال لتأخذ البطاقة معظم الشاشة، و w-[300px] للشاشات الأكبر
                        <Link
                            key={item.listing_id}
                            href={`/listing/${item.listing_id}`}
                            className="shrink-0 w-[85vw] sm:w-[300px] snap-start group cursor-pointer flex flex-col gap-3"
                        >
                            {/* حاوية الصورة (مربعة) */}
                            <div className="relative w-full aspect-square bg-gray-100 rounded-[20px] overflow-hidden">
                                {item.cover_url ? (
                                    <Image
                                        src={item.cover_url}
                                        alt={item.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 768px) 85vw, 300px"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">🏡</div>
                                )}

                                {/* شارة "مفضل لدى الضيوف" */}
                                {item.rank_score > 85 && (
                                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md z-10">
                                        <span className="text-[13px] font-bold text-gray-900">
                                            مفضل لدى الضيوف
                                        </span>
                                    </div>
                                )}

                                {/* أيقونة القلب */}
                                <button
                                    className="absolute top-3 left-3 p-1 active:scale-90 transition-transform z-10"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    <Heart size={26} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] hover:fill-rose-500 hover:text-rose-500 transition-colors" strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* تفاصيل النص */}
                            <div className="flex flex-col px-0.5 text-right">
                                {/* العنوان بالأسود العريض */}
                                <h3 className="font-semibold text-gray-900 text-[15px] truncate">
                                    {item.title}
                                </h3>

                                {/* سطر السعر والتقييم مدمجان */}
                                <div className="flex items-center gap-1.5 mt-0.5 text-[14px]">
                                    {/* السعر بالرمادي */}
                                    <span className="text-gray-500 truncate">
                                        {price}
                                    </span>
                                    <span className="text-gray-400 text-xs">•</span>
                                    {/* التقييم بالأسود مع النجمة */}
                                    <span className="flex items-center gap-1 text-gray-900 font-semibold shrink-0">
                                        <Star size={12} className="fill-gray-900 text-gray-900 mb-0.5" />
                                        {rating}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

        </section>
    );
}
