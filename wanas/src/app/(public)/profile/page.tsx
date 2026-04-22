"use client";

import Image from "next/image";
import { Heart, MessageCircle, Settings, LogOut, LogIn, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { getAuth, clearAuth, setAuth, type AuthProvider } from "@/lib/auth";

export default function ProfilePage() {
    const { favorites } = useFavorites();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [provider, setProvider] = useState<AuthProvider | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);

    useEffect(() => {
        setProvider(getAuth());
        const sync = () => setProvider(getAuth());
        window.addEventListener("auth-change", sync);
        return () => window.removeEventListener("auth-change", sync);
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch {
            // non-fatal
        }
        clearAuth();
        router.push("/");
        router.refresh();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !provider) return;

        setAvatarLoading(true);
        try {
            const fd = new FormData();
            fd.append("provider_id", provider.provider_id);
            fd.append("avatar", file);

            const res = await fetch("/api/providers/avatar", { method: "POST", body: fd });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error ?? "تعذر حفظ الصورة");
                return;
            }

            const nextProvider: AuthProvider = { ...provider, avatar_url: data.avatar_url };
            setProvider(nextProvider);
            setAuth(nextProvider);
        } catch {
            alert("تعذر رفع الصورة");
        } finally {
            setAvatarLoading(false);
            e.target.value = "";
        }
    };

    const isGuest = !provider;
    const displayName = provider?.display_name ?? "ضيف ونس";
    const avatarLetter = displayName[0] ?? "ض";

    return (
        <div className="min-h-screen bg-gray-50 pb-24 px-4 md:px-8" dir="rtl">
            <div className="max-w-2xl mx-auto pt-16">
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center mb-8">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 bg-rose-600 rounded-full overflow-hidden flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-rose-100">
                            {provider?.avatar_url ? (
                                <Image
                                    src={provider.avatar_url}
                                    alt={displayName}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                avatarLetter
                            )}
                        </div>

                        {provider && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={avatarLoading}
                                    className="absolute -bottom-1 -left-1 w-9 h-9 rounded-full bg-white border border-gray-100 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-70"
                                >
                                    {avatarLoading ? (
                                        <Loader2 size={16} className="animate-spin text-rose-500" />
                                    ) : (
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-gray-600 stroke-2 fill-none">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </>
                        )}
                    </div>

                    <h1 className="text-2xl font-black text-gray-900 mb-2">{displayName}</h1>
                    <p className="text-sm font-medium text-gray-500">
                        {isGuest
                            ? "مرحبا بك في ونس، مكانك المفضل للبحث عن المتعة"
                            : (provider?.phone_whatsapp ?? "")}
                    </p>
                    {provider && (
                        <p className="text-xs font-bold text-gray-400 mt-3">
                            اضغط على أيقونة الكاميرا لتغيير الصورة الشخصية
                        </p>
                    )}
                </div>

                {isGuest && (
                    <div className="mb-8">
                        <Link
                            href="/login"
                            className="w-full flex items-center justify-center gap-3 p-5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-[28px] font-black transition-all shadow-sm shadow-rose-200"
                        >
                            <LogIn size={22} />
                            <span>تسجيل الدخول / إنشاء حساب</span>
                        </Link>
                    </div>
                )}

                <div className="space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-4">النشاط</h2>
                        <div className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm">
                            <Link
                                href="/favorites"
                                className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-rose-50 text-rose-500 p-2.5 rounded-xl">
                                        <Heart size={22} />
                                    </div>
                                    <span className="font-bold text-gray-900">الأماكن المحفوظة</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-1 rounded-full">
                                        {favorites.length}
                                    </span>
                                    <ChevronLeft size={18} className="text-gray-300 group-hover:text-gray-900 group-hover:-translate-x-1 transition-all" />
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-4">الدعم والمعلومات</h2>
                        <div className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">
                            <a
                                href="/contact"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-50 text-emerald-500 p-2.5 rounded-xl">
                                        <MessageCircle size={22} />
                                    </div>
                                    <span className="font-bold text-gray-900">تواصل معنا</span>
                                </div>
                                <ChevronLeft size={18} className="text-gray-300 group-hover:text-gray-900 group-hover:-translate-x-1 transition-all" />
                            </a>

                            {provider && (
                                <Link
                                    href={`/profile/${provider.provider_id}`}
                                    className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gray-50 text-gray-500 p-2.5 rounded-xl">
                                            <Settings size={22} />
                                        </div>
                                        <span className="font-bold text-gray-900">إدارة حسابي</span>
                                    </div>
                                    <ChevronLeft size={18} className="text-gray-300 group-hover:text-gray-900 group-hover:-translate-x-1 transition-all" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {provider && (
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full flex items-center gap-4 p-5 bg-white rounded-[28px] border border-gray-100 shadow-sm text-red-500 font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                            <div className="bg-red-50 p-2.5 rounded-xl text-red-500">
                                <LogOut size={22} />
                            </div>
                            <span>{loggingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}</span>
                        </button>
                    )}
                </div>

                <p className="text-center text-[10px] font-bold text-gray-300 mt-12 uppercase tracking-widest">
                    ونس v1.0.0
                </p>
            </div>
        </div>
    );
}
