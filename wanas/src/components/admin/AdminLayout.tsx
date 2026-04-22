"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    ListTree,
    PlusCircle,
    Settings,
    LogOut,
    Search,
    Users,
    TrendingUp,
    Package
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState("overview");

    const menuItems = [
        { id: "overview", label: "نظرة عامة", icon: LayoutDashboard, href: "/admin" },
        { id: "listings", label: "الإعلانات", icon: ListTree, href: "/admin/listings" },
        { id: "add", label: "أضف إعلان", icon: PlusCircle, href: "/admin/add" },
        { id: "users", label: "المزودين", icon: Users, href: "/admin/providers" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-row-reverse" dir="rtl">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-l border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
                <div className="p-6 border-b border-gray-100">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-black text-rose-600 tracking-tighter">ونس</span>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ADMN</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id
                                    ? "bg-rose-50 text-rose-600 shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
                        <LogOut size={20} />
                        تسجيل الخروج
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
                    <h2 className="text-xl font-black text-gray-900">
                        {menuItems.find(m => m.id === activeTab)?.label || "لوحة التحكم"}
                    </h2>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden lg:block">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="ابحث في لوحة التحكم..."
                                className="pr-10 pl-4 py-2 bg-gray-100 rounded-full text-sm font-medium focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none transition-all w-64"
                            />
                        </div>
                        <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                            ع
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

// Stats Component for the Overview
export function StatCards() {
    const stats = [
        { label: "إجمالي الإعلانات", value: "128", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "إعلانات نشطة", value: "94", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "طلبات التحقق", value: "12", icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                        <stat.icon size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500">{stat.label}</p>
                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
