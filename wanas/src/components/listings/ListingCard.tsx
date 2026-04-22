'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ListingData } from './types';

const StarIcon = () => (
  <svg viewBox="0 0 32 32" className="w-3 h-3 fill-amber-400" aria-hidden="true">
    <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.736l7.293 6.565-1.965 9.852a1 1 0 0 0 1.483 1.061L16 26.322l8.625 4.626a1 1 0 0 0 1.483-1.061l-1.965-9.852 7.293-6.565a1 1 0 0 0-.542-1.736l-9.86-1.27-4.124-8.885a1 1 0 0 0-1.816 0z" />
  </svg>
);

export interface ListingAnalyticsEvent {
  name: string;
  listing_id: string;
  position?: number;
}

function isRenderableImage(src?: string | null): boolean {
  if (!src) return false;
  return src.startsWith('/') || /^https?:\/\//i.test(src);
}

function hasFeature(features: ListingData['features'], featureKey: 'pool' | 'kitchen'): boolean {
  if (!features) return false;
  if (Array.isArray(features)) {
    const keywords = featureKey === 'pool' ? ['مسبح', 'pool'] : ['مطبخ', 'kitchen'];
    return features.some((item) => keywords.some((keyword) => item.toLowerCase().includes(keyword)));
  }
  return features[featureKey] === true;
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
  const [isHovered, setIsHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const title = listing?.title?.trim() || 'إعلان بدون عنوان';
  const location = `${listing.district_name ?? 'حي غير محدد'} · جدة`;
  const price =
    typeof listing.price_min === 'number' && listing.price_min > 0
      ? `${listing.price_min.toLocaleString('ar-SA')} ر.س`
      : 'تواصل للسعر';

  const isPro = listing.provider?.subscription_tier === 'pro';
  const isVerified = listing.provider?.verification_status === 'verified';

  const hasPool = hasFeature(listing.features, 'pool');
  const hasKitchen = hasFeature(listing.features, 'kitchen');

  const safeImageSrc = useMemo(() => {
    if (imageFailed) return null;
    return isRenderableImage(listing.cover_url) ? listing.cover_url : null;
  }, [listing.cover_url, imageFailed]);

  return (
    <motion.article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: (position || 0) * 0.05 }}
      className="group relative flex flex-col bg-white rounded-[24px] overflow-hidden transition-all duration-500 shadow-sm hover:shadow-md"
      dir="rtl"
    >
      <Link
        href={`/listing/${listing.listing_id}`}
        onClick={() => {
          onTrack?.({
            name: 'listing_card_click',
            listing_id: listing.listing_id,
            position,
          });
        }}
        className="absolute inset-0 z-10"
        aria-label={title}
      />

      <div className="relative aspect-[1/1] overflow-hidden rounded-[20px] m-2 z-0">
        <motion.div
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
          className="w-full h-full"
        >
          {safeImageSrc ? (
            <Image
              src={safeImageSrc}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={position === 0}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-5xl">
              🏡
            </div>
          )}
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
          {isVerified && (
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-bold text-slate-800">موثوق</span>
            </div>
          )}
          {isPro && (
            <div
              className="flex items-center gap-1 px-3 py-1.5 rounded-full shadow-sm"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
            >
              <span className="text-[11px] font-black text-white">⭐ PRO</span>
            </div>
          )}
        </div>

        {(hasPool || hasKitchen) && (
          <div className="absolute bottom-3 left-3 z-20 flex gap-1.5">
            {hasPool && (
              <div className="bg-blue-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                🏊 مسبح
              </div>
            )}
            {hasKitchen && (
              <div className="bg-orange-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                🍳 مطبخ
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 pt-2 text-right flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="text-[16px] font-bold text-slate-900 leading-tight line-clamp-1 group-hover:text-[#f63659] transition-colors flex-1">
            {title}
          </h3>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md shrink-0">
            <StarIcon />
            <span className="text-[12px] font-bold text-slate-700">4.9</span>
          </div>
        </div>

        <p className="text-[13px] text-slate-500 mb-3 flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current opacity-60 shrink-0">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
          </svg>
          <span className="line-clamp-1">{location}</span>
        </p>

        <div className="border-t border-slate-50 pt-3 mt-auto">
          <div className="flex flex-col">
            <span className="text-[16px] font-black text-slate-900">{price}</span>
            {typeof listing.price_min === 'number' && listing.price_min > 0 && (
              <span className="text-[11px] text-slate-400 -mt-1 font-medium">لكل ليلة</span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
