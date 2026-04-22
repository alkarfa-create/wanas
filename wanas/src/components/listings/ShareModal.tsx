"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Link, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
}

export default function ShareModal({ isOpen, onClose, title }: ShareModalProps) {
    const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = useState("");

    useEffect(() => {
        if (isOpen) {
            setCurrentUrl(window.location.href);
        }
    }, [isOpen]);

    const handleShare = async (platform: string) => {
        const text = `تحقق من هذا المكان الرائع: ${title}`;

        if (platform === 'native' && navigator.share) {
            try {
                await navigator.share({ title, text, url: currentUrl });
                return;
            } catch (err) {
                console.log('تم إلغاء المشاركة');
            }
        }

        if (platform === 'whatsapp') {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + currentUrl)}`, '_blank');
        } else if (platform === 'telegram') {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(text)}`, '_blank');
        } else if (platform === 'snapchat' || platform === 'tiktok' || platform === 'copy') {
            navigator.clipboard.writeText(currentUrl);
            setCopiedStatus(platform);
            setTimeout(() => setCopiedStatus(null), 2000);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl border border-white/50 overflow-hidden text-right"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-5 left-5 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-2xl font-black mb-2 text-gray-900">مشاركة المكان</h3>
                        <p className="text-sm font-medium text-gray-500 mb-8">شارك هذا المكان الرائع مع أصدقائك أو عائلتك.</p>

                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <ShareButton
                                icon={<WhatsappIcon />} label="واتساب" color="bg-[#25D366]/10 text-[#25D366]"
                                onClick={() => handleShare('whatsapp')}
                            />
                            <ShareButton
                                icon={<TelegramIcon />} label="تليجرام" color="bg-[#0088cc]/10 text-[#0088cc]"
                                onClick={() => handleShare('telegram')}
                            />
                            <ShareButton
                                icon={copiedStatus === 'snapchat' ? <Check size={28} className="text-amber-500" /> : <SnapchatIcon />}
                                label={copiedStatus === 'snapchat' ? "تم النسخ" : "سناب شات"}
                                color="bg-[#FFFC00]/20 text-black"
                                onClick={() => handleShare('snapchat')}
                            />
                            <ShareButton
                                icon={copiedStatus === 'tiktok' ? <Check size={28} className="text-black" /> : <TiktokIcon />}
                                label={copiedStatus === 'tiktok' ? "تم النسخ" : "تيك توك"}
                                color="bg-gray-100 text-black shadow-[2px_2px_0px_0px_#00f2fe,-2px_-2px_0px_0px_#fe0979] shadow-black/10"
                                onClick={() => handleShare('tiktok')}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleShare('native')}
                                className="md:hidden flex-1 py-3.5 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                مزيد من الخيارات
                            </button>
                            <button
                                onClick={() => handleShare('copy')}
                                className="flex-[2] py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-900 font-bold rounded-2xl flex items-center justify-center gap-2 border border-gray-200 active:scale-95 transition-all text-sm"
                            >
                                {copiedStatus === 'copy' ? <Check size={18} className="text-green-500" /> : <Link size={18} />}
                                {copiedStatus === 'copy' ? "تم نسخ الرابط" : "نسخ الرابط المباشر"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function ShareButton({ icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: () => void }) {
    return (
        <motion.button
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className="flex flex-col items-center gap-2 group"
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${color}`}>
                {icon}
            </div>
            <span className="text-[10px] font-bold text-gray-600">{label}</span>
        </motion.button>
    );
}

const WhatsappIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
);

const TelegramIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.21-1.12-.33-1.08-.7.02-.19.27-.39.75-.6 2.95-1.29 4.93-2.14 5.93-2.55 2.81-1.18 3.4-1.38 3.78-1.38.08 0 .27.02.39.1.1.06.13.15.15.22.01.04.02.13.01.2z" />
    </svg>
);

const SnapchatIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.16 2.05c-1.32-.08-2.64.3-3.69 1.07-1.15.82-1.87 2.1-2.12 3.47-.11.63-.12 1.28-.02 1.91.07.45.2.89.39 1.3-.39-.12-.8-.19-1.21-.21-.35-.01-.71.05-1.04.18-.34.14-.64.36-.88.63-.3.34-.48.77-.52 1.22-.04.48.09.96.35 1.37.24.37.59.66.99.85.34.16.71.25 1.09.28.31.02.62.01.93-.05.15.65.41 1.28.77 1.84.28.42.61.81.99 1.15.42.37.89.68 1.4.92.51.24 1.04.42 1.59.54.43.09.87.13 1.31.12.39 0 .78-.04 1.17-.11.45-.09.89-.23 1.31-.42.44-.19.86-.44 1.24-.73.34-.26.65-.56.92-.9.28-.35.51-.74.69-1.15.15-.36.27-.73.35-1.11.08-.38.12-.77.12-1.16 0-.25-.01-.5-.04-.75-.02-.2-.05-.4-.08-.6.28.05.56.06.84.05.35 0 .69-.06 1.02-.18.35-.13.66-.34.92-.61.31-.32.52-.73.59-1.17.07-.46-.03-.92-.28-1.31-.23-.37-.56-.66-.96-.86-.36-.18-.75-.27-1.15-.29-.41-.01-.83.05-1.23.17.15-.41.25-.84.28-1.28.05-.62.01-1.25-.13-1.85-.26-1.36-.97-2.61-2.1-3.41-1.04-.75-2.33-1.12-3.62-1.03z" />
    </svg>
);

const TiktokIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.36 6.34 6.34 0 0 0 6.34-6.36V10a8.26 8.26 0 0 0 4 1.17V7.71a4.92 4.92 0 0 1-2.02-.99z" />
    </svg>
);
