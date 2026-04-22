"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CalendarDays, Users, Sparkles } from "lucide-react";

const OCCASIONS = [
    { id: 'wedding', label: 'عقد قران', icon: '💍' },
    { id: 'grad', label: 'حفلة تخرج', icon: '🎓' },
    { id: 'marriage', label: 'حفل زواج', icon: '🎊' },
    { id: 'family', label: 'جمعة عائلية', icon: '🏡' },
    { id: 'small', label: 'مناسبة صغيرة', icon: '✨' },
    { id: 'other', label: 'أخرى', icon: '🎈' },
];

export default function BookingCard({ price, phone }: { price: number, phone: string }) {
    const [isOccasionOpen, setIsOccasionOpen] = useState(false);
    const [isGuestsOpen, setIsGuestsOpen] = useState(false);

    const [selectedOccasion, setSelectedOccasion] = useState(OCCASIONS[3]);
    const [date, setDate] = useState('');
    const [guests, setGuests] = useState(10);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOccasionOpen(false);
                setIsGuestsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleWhatsApp = () => {
        const message = `السلام عليكم، أود الاستفسار عن حجز المكان:\n\n` +
            `✨ المناسبة: ${selectedOccasion.label}\n` +
            `📅 التاريخ: ${date ? date : 'لم يتم التحديد'}\n` +
            `👥 عدد الضيوف: ${guests} شخص\n\n` +
            `هل المكان متاح؟`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            // تم ضبط العرض ليتناسب مع الـ Sidebar الجانبي فقط
            className="border border-gray-200 rounded-[24px] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] bg-white w-full max-w-[380px] sticky top-28 font-sans"
            dir="rtl"
        >
            {/* السعر */}
            <div className="mb-6 flex items-end gap-2">
                <span className="text-4xl font-black tracking-tighter text-gray-900">
                    {price?.toLocaleString('ar-SA')}
                </span>
                <span className="text-gray-500 font-bold text-lg mb-1">ر.س</span>
            </div>

            {/* صندوق الخيارات المدمج */}
            <div ref={containerRef} className="border border-gray-300 rounded-2xl bg-white mb-6 shadow-sm relative">
                <div className="flex border-b border-gray-300">
                    {/* التاريخ */}
                    <div className="w-1/2 p-3 border-l border-gray-300 relative group hover:bg-gray-50 transition-colors rounded-tr-2xl cursor-text">
                        <label className="text-[10px] font-black text-gray-800 uppercase block mb-1">التاريخ</label>
                        <input
                            type="date"
                            min={today}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full text-sm font-bold text-gray-600 focus:outline-none bg-transparent cursor-pointer appearance-none"
                        />
                        {!date && <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />}
                    </div>

                    {/* الضيوف */}
                    <div
                        onClick={() => { setIsGuestsOpen(!isGuestsOpen); setIsOccasionOpen(false); }}
                        className="w-1/2 p-3 relative group hover:bg-gray-50 transition-colors rounded-tl-2xl cursor-pointer"
                    >
                        <label className="text-[10px] font-black text-gray-800 uppercase block mb-1">الضيوف</label>
                        <div className="text-sm font-bold text-gray-600 flex justify-between items-center">
                            <span>{guests} شخص</span>
                            <Users size={16} className="text-gray-400" />
                        </div>

                        <AnimatePresence>
                            {isGuestsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-[-100%] mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 z-50 cursor-default"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-sm text-gray-700">العدد</span>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-lg hover:border-black transition-colors">-</button>
                                            <span className="font-black text-lg w-6 text-center">{guests}</span>
                                            <button onClick={() => setGuests(guests + 1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-lg hover:border-black transition-colors">+</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* المناسبة */}
                <div
                    onClick={() => { setIsOccasionOpen(!isOccasionOpen); setIsGuestsOpen(false); }}
                    className="p-3 w-full cursor-pointer hover:bg-gray-50 transition-colors rounded-b-2xl relative"
                >
                    <label className="text-[10px] font-black text-gray-800 uppercase block mb-1">المناسبة</label>
                    <div className="text-sm font-bold text-gray-600 flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <span className="text-base">{selectedOccasion.icon}</span>
                            {selectedOccasion.label}
                        </span>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isOccasionOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                        {isOccasionOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 5, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                className="absolute top-full right-0 left-0 z-50 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden p-1"
                            >
                                {OCCASIONS.map((occ) => (
                                    <button
                                        key={occ.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedOccasion(occ);
                                            setIsOccasionOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right ${selectedOccasion.id === occ.id ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                                    >
                                        <span className="text-lg">{occ.icon}</span>
                                        <span className={`font-bold text-sm ${selectedOccasion.id === occ.id ? 'text-black' : 'text-gray-500'}`}>
                                            {occ.label}
                                        </span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* زر التواصل */}
            <button
                onClick={handleWhatsApp}
                className="group relative w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-[16px] font-black text-lg overflow-hidden transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                <span className="relative z-10">التواصل</span>
                <svg className="relative z-10 w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
            </button>

            <div className="mt-4 text-center">
                <p className="text-[11px] font-bold text-gray-400 flex items-center justify-center gap-1.5">
                    <Sparkles size={12} className="text-gray-300" />
                    لن يتم خصم أي مبالغ الآن
                </p>
            </div>
        </motion.div>
    );
}