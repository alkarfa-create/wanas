"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation'

export default function CategoryHighlight({ currentCategory = "chalets" }) {
  const router = useRouter()
  const [activeId, setActiveId] = useState(currentCategory);

  const categories = [
    { id: "chalets", label: "شاليهات", icon: "🏠" },
    { id: "hospitality", label: "ضيافة", icon: "☕" },
    { id: "buffets", label: "بوفيهات", icon: "🍽️", badge: "جديد", color: "bg-[#f97316]" },
    { id: "events", label: "تنسيق حفلات", icon: "🎉", badge: "جديد", color: "bg-[#3c2484]" },
    { id: "games", label: "ألعاب", icon: "🎮" },
  ];

  return (
    <div className="bg-white border-b border-[#ebebeb] sticky top-[162px] z-40" aria-label="الفئات">
      <div className="max-w-[1760px] mx-auto px-4 md:px-6 flex items-center gap-8 overflow-x-auto no-scrollbar py-2">
        {categories.map((c) => {
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => { setActiveId(c.id); router.push(`/jeddah/${c.id}`); }}
              className={`flex flex-col items-center gap-1 group transition-colors relative pb-2 min-w-max ${isActive ? 'text-gray-900 font-bold' : 'text-gray-500 font-semibold hover:text-gray-900'}`}
            >
              <div className="relative text-[24px] group-hover:scale-105 transition-transform">
                {c.icon}
                {c.badge && (
                  <span className={`absolute -top-1 -right-4 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full shadow-sm ${c.color}`}>
                    {c.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1`}>{c.label}</span>
              {/* خط التحديد السفلي */}
              {isActive && (
                <div className="absolute bottom-0 h-[2px] w-full bg-[#f63659]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}