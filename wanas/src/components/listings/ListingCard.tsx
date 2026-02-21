'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import type { ListingData, ListingAnalyticsEvent } from './types';

function formatPriceSAR(priceMin: number | null) {
    if (!priceMin) return 'تواصل للسعر';
    return `${priceMin.toLocaleString('ar-SA')} ر.س`;
}

function waLink(phone?: string, text?: string) {
    if (!phone) return null;
    const msg = text ? `?text=${encodeURIComponent(text)}` : '';
    return `https://wa.me/${phone}${msg}`;
}

export default function ListingCard({
    listing,
    position,
    onTrack,
}: {
    listing: ListingData;
    position?: number;
    onTrack?: (e: ListingAnalyticsEvent) => void;
}) {
    const title = listing?.title?.trim() || 'إعلان بدون عنوان';
    const location = `${(listing.district as any)?.name_ar ?? ''} · جدة`;
    const price = formatPriceSAR(listing.price_min);

    // ✅ الإصلاح: جلب الصور من listing.media بدلاً من مصفوفة فارغة
    const mediaList: any[] = (listing as any).media ?? [];
    const firstImage = mediaList
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .find((m: any) => m.media_type === 'image' || !m.media_type);
    const imageUrl = firstImage?.url ?? null;

    const isVerified = listing.provider?.verification_status === 'verified';
    const rating = 4.8;

    const [savedUI, setSavedUI] = useState(false);
    const [imgError, setImgError] = useState(false);

    const onCardClickTrack = () => {
        onTrack?.({ name: 'listing_card_click', listing_id: listing.listing_id, position });
    };

    const onToggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setSavedUI(v => {
            const nextState = !v;
            onTrack?.({
                name: 'listing_wishlist_toggle',
                listing_id: listing.listing_id,
                state: nextState ? 'saved' : 'unsaved',
            });
            return nextState;
        });
    };

    const whatsappHref = waLink(
        listing.provider?.phone_whatsapp,
        `السلام عليكم، مهتم بإعلان: ${title} (رقم: ${listing.listing_id})`
    );

    const onWhatsappClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!whatsappHref) return;

        onTrack?.({ name: 'listing_whatsapp_click', listing_id: listing.listing_id, phone: listing.provider?.phone_whatsapp });

        window.open(whatsappHref, '_blank', 'noopener,noreferrer');
    };

    return (
        <article
            className="group relative flex flex-col font-sans"
            dir="rtl"
        >
            {/* Overlay Link */}
            <Link
                href={`/listing/${listing.listing_id}`}
                onClick={onCardClickTrack}
                className="absolute inset-0 z-0 rounded-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f63659] focus-visible:ring-offset-2"
                aria-label={`فتح تفاصيل الإعلان: ${title}`}
            >
                <span className="sr-only">فتح تفاصيل الإعلان</span>
            </Link>

            {/* الصورة */}
            <div
                className="relative z-10 mb-3 overflow-hidden rounded-[14px] border border-black/5 bg-[#f6f6f6] aspect-[20/19]"
                aria-label="صورة الإعلان"
            >
                {/* ✅ عرض الصورة الحقيقية أو fallback */}
                {imageUrl && !imgError ? (
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/20 text-5xl">🏡</div>
                )}

                {/* تدرج خفيف */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent" />

                {/* قلب (Wishlist) */}
                <button
                    type="button"
                    className="absolute top-3 right-3 z-20 grid place-items-center w-10 h-10 rounded-full bg-white/85 backdrop-blur shadow-sm hover:scale-[1.04] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f63659]"
                    aria-label={savedUI ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    aria-pressed={savedUI}
                    onClick={onToggleWishlist}
                >
                    <svg viewBox="0 0 32 32" className={savedUI ? 'w-6 h-6 fill-[#f63659]' : 'w-6 h-6 fill-black/35'} aria-hidden="true">
                        <path d="M16 28S3 20 3 11a7 7 0 0 1 13-3.5A7 7 0 0 1 29 11c0 9-13 17-13 17z" />
                    </svg>
                </button>

                {/* شارة موثوق */}
                {isVerified && (
                    <div className="absolute top-3 left-3 bg-white text-[#222222] text-[11px] font-black px-2.5 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
                        <span className="w-2 h-2 bg-[#f63659] rounded-full"></span>
                        مفضل لدى الضيوف
                    </div>
                )}
            </div>

            {/* النصوص */}
            <div className="relative z-10 flex flex-col px-1 text-right">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h3 className="text-[14px] font-bold text-[#222222] leading-snug line-clamp-1">
                        {title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0 mt-0.5" aria-label={`التقييم ${rating}`}>
                        <span className="text-[12px] font-semibold text-[#222222]">{rating}</span>
                        <svg viewBox="0 0 32 32" className="w-2.5 h-2.5 fill-[#222222]" aria-hidden="true">
                            <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.736l7.293 6.565-1.965 9.852a1 1 0 0 0 1.483 1.061L16 26.322l8.625 4.626a1 1 0 0 0 1.483-1.061l-1.965-9.852 7.293-6.565a1 1 0 0 0-.542-1.736l-9.86-1.27-4.124-8.885a1 1 0 0 0-1.816 0z" />
                        </svg>
                    </div>
                </div>

                <p className="text-[13px] text-[#717171] mb-1 truncate leading-none">
                    {location}
                </p>

                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-baseline gap-1">
                        <span className="text-[14px] font-bold text-[#222222]">{price}</span>
                        {listing.price_min && <span className="text-[12px] text-[#717171] font-normal">/ ليلة</span>}
                    </div>
                    <button
                        type="button"
                        className="text-[11px] font-black text-white px-3.5 py-1.5 rounded-full shadow-sm bg-[#25D366] hover:opacity-90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
                        aria-label="تواصل عبر واتساب"
                        onClick={onWhatsappClick}
                    >
                        تواصل
                    </button>
                </div>
            </div>
        </article>
    );
}
