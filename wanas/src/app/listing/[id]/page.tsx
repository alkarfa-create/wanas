// src/app/listing/[id]/page.tsx
import { supabaseAdmin } from '@/lib/supabase'
import Image from "next/image";
import Navbar from "@/components/layout/Navbar"; // Added Navbar based on user's preference for Airbnb-like layout

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ListingPage({ params }: PageProps) {
    const { id } = await params

    // جلب بيانات الشاليه بالكامل من Supabase
    const { data: listing } = await supabaseAdmin
        .from('listings')
        .select(`
      listing_id, title, slug, description,
      price_min, price_max, price_label,
      capacity_min, capacity_max,
      features, policies,
      status, rank_score,
      districts(name_ar),
      providers(display_name, phone_whatsapp, trust_score)
    `)
        .eq('listing_id', id)
        .single();

    if (!listing) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">جاري التحميل أو الإعلان غير موجود...</div>;

    // Safe access to related data (assuming single object based on query, but defensiveness is good)
    const provider = Array.isArray(listing.providers) ? listing.providers[0] : listing.providers;
    // districts is usually returned as an array in joins even if it's many-to-one in some Supabase versions
    const districtData = Array.isArray(listing.districts) ? listing.districts[0] : listing.districts;
    const districtName = districtData?.name_ar || 'جدة';

    return (
        <div className="min-h-screen bg-white font-sans text-[#222222]">
            <Navbar />

            {/* القسم العلوي: العنوان والتفاعل */}
            <header className="max-w-[1120px] mx-auto px-6 pt-8 pb-4">
                <h1 className="text-[26px] font-bold">{listing.title}</h1>
                <div className="flex justify-between items-center mt-2 text-sm font-bold underline">
                    <p>{districtName}، جدة</p>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition">📎 مشاركة</button>
                        <button className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition">❤️ حفظ</button>
                    </div>
                </div>
            </header>

            {/* معرض الصور الديناميكي */}
            <section className="max-w-[1120px] mx-auto px-6 mb-10">
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[480px] rounded-2xl overflow-hidden shadow-sm relative">
                    <div className="col-span-2 row-span-2 relative border-e border-white">
                        {/* Schema reset: using 🏡 placeholder until images are added back to DB */}
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-5xl">🏡</div>
                    </div>
                    {/* هنا يمكن عرض بقية الصور من مصفوفة الصور */}
                    <div className="relative border-b border-white">
                        <Image src="/img/room1.jpg" alt="1" fill className="object-cover hover:opacity-90 transition" />
                    </div>
                    <div className="relative border-b border-s border-white">
                        <Image src="/img/room2.jpg" alt="2" fill className="object-cover hover:opacity-90 transition" />
                    </div>
                    <div className="relative">
                        <Image src="/img/room3.jpg" alt="3" fill className="object-cover hover:opacity-90 transition" />
                    </div>
                    <div className="relative border-s border-white">
                        <Image src="/img/room4.jpg" alt="4" fill className="object-cover hover:opacity-90 transition" />
                    </div>

                    <button className="absolute bottom-6 left-6 bg-white border border-black px-4 py-1.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                        <span className="text-lg">⣿</span> عرض كل الصور
                    </button>
                </div>
            </section>

            {/* المحتوى الرئيسي و "كارد" الحجز الذكي */}
            <main className="max-w-[1120px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">

                {/* تفاصيل المسكن */}
                <div className="md:col-span-2">
                    <div className="border-b pb-8 mb-8">
                        <h2 className="text-2xl font-bold mb-2">يدير هذا الإعلان: {provider?.display_name || 'مضيف'}</h2>
                        <div className="flex gap-2 text-gray-600">
                            <span>{listing.capacity_max} ضيوف</span> • <span>{listing.features?.rooms || 1} غرف</span> • <span>{listing.features?.bathrooms || 1} حمام</span>
                        </div>
                    </div>

                    {/* شارة "مفضل لدى الضيوف" - ديناميكية */}
                    {listing.rank_score > 90 && (
                        <div className="border rounded-2xl p-6 flex items-center justify-between mb-10 shadow-sm border-gray-200">
                            <div className="flex items-center gap-5">
                                <div className="text-5xl">🏆</div>
                                <div>
                                    <h3 className="text-lg font-bold">مفضل لدى الضيوف</h3>
                                    <p className="text-[#717171]">واحد من أكثر البيوت تميزاً وتقييماً في وناسة.</p>
                                </div>
                            </div>
                            <div className="text-center border-s ps-8">
                                <div className="text-2xl font-black">5.0</div>
                                <div className="flex gap-0.5 text-[8px] mt-1">⭐⭐⭐⭐⭐</div>
                            </div>
                        </div>
                    )}

                    {/* المرافق (تأتي من الجدولlisting_features) */}
                    <section className="py-8 border-t border-gray-200">
                        <h2 className="text-xl font-bold mb-6">ما يقدمه هذا المسكن</h2>
                        <div className="grid grid-cols-2 gap-y-5">
                            {Array.isArray(listing.features) && listing.features.map((feat: string) => (
                                <div key={feat} className="flex items-center gap-4 text-[#222222]">
                                    <span className="text-2xl">✅</span>
                                    <span className="text-[16px]">{feat}</span>
                                </div>
                            ))}
                        </div>
                        <button className="mt-8 border-2 border-black px-6 py-3 rounded-xl font-black hover:bg-gray-50 transition-all">
                            عرض كل المرافق
                        </button>
                    </section>
                </div>

                {/* كارد الحجز العائم (Sticky) */}
                <aside className="relative">
                    <div className="sticky top-28 border rounded-2xl p-6 shadow-2xl bg-white border-gray-100">
                        <div className="flex justify-between items-baseline mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{listing.price_min?.toLocaleString('ar-SA')} ر.س</span>
                                <span className="text-[#717171] text-sm">/ ليلة</span>
                            </div>
                            <div className="text-xs font-bold underline">15 تقييم</div>
                        </div>

                        {/* حقول التواريخ والضيوف */}
                        <div className="border border-gray-400 rounded-xl mb-4">
                            <div className="grid grid-cols-2 border-b border-gray-400">
                                <div className="p-3 border-e border-gray-400">
                                    <div className="text-[10px] font-black uppercase">تسجيل الوصول</div>
                                    <div className="text-sm">أضف تاريخ</div>
                                </div>
                                <div className="p-3">
                                    <div className="text-[10px] font-black uppercase">المغادرة</div>
                                    <div className="text-sm">أضف تاريخ</div>
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="text-[10px] font-black uppercase">الضيوف</div>
                                <div className="text-sm">1 ضيف</div>
                            </div>
                        </div>

                        <button className="w-full bg-[#f97316] text-white py-3.5 rounded-lg font-black text-lg shadow-lg hover:shadow-xl hover:translate-y-[-1px] active:scale-95 transition-all mb-4">
                            احجز الآن
                        </button>

                        <div className="bg-[#25D366]/5 border border-[#25D366] text-[#1DA851] p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-[#25D366] hover:text-white transition-all">
                            <span className="font-bold">استفسر عبر واتساب</span>
                            <span className="text-2xl">💬</span>
                        </div>

                        <p className="text-center text-xs text-gray-500 mt-5 italic">لن يتم سحب أي مبالغ منك في هذه المرحلة</p>
                    </div>
                </aside>
            </main>
        </div>
    );
}
