'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from "next/link";
import type { CategoryItem } from '@/lib/data/categories';

interface CategoryHighlightProps {
  categories: CategoryItem[]
  mode?: 'query' | 'route'
  currentCategory?: string
}

export default function CategoryHighlight({ categories, mode = 'route', currentCategory }: CategoryHighlightProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getActiveCategory = () => {
    if (currentCategory) return currentCategory;
    if (mode === 'query') return searchParams.get('category') || categories[0]?.slug || '';
    const parts = pathname.split('/');
    return parts[parts.length - 1] || categories[0]?.slug || '';
  };

  const active = getActiveCategory();
  const searchQuery = searchParams.get('search');

  return (
    <div className="w-full bg-white border-b border-gray-100 z-40 sticky top-[64px] md:top-[72px]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-start md:justify-center gap-1 md:gap-4 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {categories.map((cat) => {
            const isActive = active === cat.slug;
            const href = mode === 'query'
              ? `/?category=${cat.slug}${searchQuery ? `&search=${searchQuery}` : ''}`
              : `/jeddah/${cat.slug}`;
            return (
              <Link key={cat.slug} href={href}
                className={`shrink-0 flex flex-col items-center gap-1 transition-all duration-200 border-b-2 px-3 pb-2 pt-1 min-w-[64px] focus:outline-none ${isActive
                    ? "border-[#f63659] text-[#f63659]"
                    : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200"
                  }`}>
                <div className="relative">
                  <span className="text-2xl block">{cat.icon}</span>
                  {cat.isNew && (
                    <span className={`absolute -top-1 -right-3 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm ${cat.badgeColor || 'bg-[#f63659]'}`}>
                      جديد
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-black whitespace-nowrap ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  {cat.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}