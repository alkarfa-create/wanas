"use client";

import { Search } from "lucide-react";
import { useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AuthButton from "@/components/ui/AuthButton";

// useSearchParams must be isolated in its own component and wrapped in
// Suspense. If it lives in the parent, Next.js deopts the entire route to
// client-side rendering and causes streaming hydration mismatches.
function NavbarSearch() {
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (rawQuery?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const query = (rawQuery || "").trim();
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleDesktopKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch(desktopInputRef.current?.value);
  };

  const handleMobileKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch(mobileInputRef.current?.value);
  };

  return (
    <>
      {/* البحث - كمبيوتر */}
      <div className="hidden md:block flex-1 min-w-0 max-w-2xl mx-8">
        <div className="relative group">
          <input
            key={searchParams.toString()}
            ref={desktopInputRef}
            type="text"
            onKeyDown={handleDesktopKeyDown}
            defaultValue={searchParams.get("search") || ""}
            placeholder="ابحث عن شاليه، ضيافة، أو ألعاب..."
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-rose-500 focus:shadow-md outline-none transition-all text-sm font-medium"
          />
          <div
            onClick={() => handleSearch(desktopInputRef.current?.value)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-rose-500 text-white p-2 rounded-full cursor-pointer hover:bg-rose-600 transition-colors"
          >
            <Search size={16} />
          </div>
        </div>
      </div>

      {/* البحث - جوال */}
      <div className="block md:hidden pb-4">
        <div className="relative flex items-center w-full bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2 cursor-text focus-within:border-rose-500 transition-all">
          <Search size={18} className="text-gray-400 ml-3 shrink-0" />
          <input
            key={`mobile-${searchParams.toString()}`}
            ref={mobileInputRef}
            type="text"
            onKeyDown={handleMobileKeyDown}
            defaultValue={searchParams.get("search") || ""}
            placeholder="ابحث عن وجهتك..."
            className="w-full bg-transparent outline-none text-sm font-medium"
          />
        </div>
      </div>
    </>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm w-full" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between py-3 md:py-4">
          {/* اللوجو */}
          <Link href="/" className="shrink-0 group transition-all">
            <div className="relative w-12 h-12 md:w-14 md:h-14 overflow-hidden rounded-xl">
              <Image
                src="/img/logo.png"
                alt="ونس"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* حقل البحث - مغلف بـ Suspense هنا بدلًا من layout */}
          <Suspense fallback={<div className="hidden md:block flex-1 max-w-2xl mx-8" />}>
            <NavbarSearch />
          </Suspense>

          {/* الأزرار اليمينية */}
          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/add-listing"
              className="flex items-center gap-1.5 bg-[#f63659] hover:bg-rose-600 text-white text-sm font-black px-4 py-2 rounded-full transition-all active:scale-95 shadow-sm shadow-rose-200 whitespace-nowrap"
            >
              <span className="text-base leading-none">+</span>
              <span>أضف إعلانك</span>
            </Link>

            <AuthButton />
          </div>
        </div>

        {/* Mobile search row is rendered inside NavbarSearch above */}
      </div>
    </header>
  );
}
