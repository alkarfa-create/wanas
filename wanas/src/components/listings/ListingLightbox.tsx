"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Maximize2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ListingLightboxProps {
    images: string[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (index: number) => void;
}

export default function ListingLightbox({ images, currentIndex, isOpen, onClose, onNavigate }: ListingLightboxProps) {
    const [direction, setDirection] = useState(0);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") {
                setDirection(-1);
                onNavigate((currentIndex - 1 + images.length) % images.length);
            }
            if (e.key === "ArrowLeft") {
                setDirection(1);
                onNavigate((currentIndex + 1) % images.length);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95
        })
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence initial={false} custom={direction}>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center select-none"
                    dir="ltr" // Force LTR for standard swipe logic
                >
                    {/* Header Actions */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-[210]">
                        <div className="text-white/60 font-medium text-sm">
                            {currentIndex + 1} / {images.length}
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all active:scale-90"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-[210] bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-md transition-all active:scale-90 hidden md:flex"
                        onClick={() => {
                            setDirection(-1);
                            onNavigate((currentIndex - 1 + images.length) % images.length);
                        }}
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <button
                        className="absolute right-6 top-1/2 -translate-y-1/2 z-[210] bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-md transition-all active:scale-90 hidden md:flex"
                        onClick={() => {
                            setDirection(1);
                            onNavigate((currentIndex + 1) % images.length);
                        }}
                    >
                        <ChevronRight size={32} />
                    </button>

                    {/* Main Image Container */}
                    <div className="relative w-full h-full max-w-7xl max-h-[85vh] px-4 overflow-hidden">
                        <AnimatePresence initial={false} custom={direction}>
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                className="absolute inset-0 flex items-center justify-center p-4 md:p-12"
                            >
                                <div className="relative w-full h-full">
                                    <Image
                                        src={images[currentIndex]}
                                        alt={`Image ${currentIndex + 1}`}
                                        fill
                                        className="object-contain pointer-events-none"
                                        quality={100}
                                        priority
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Thumbnail Strip (Desktop Only) */}
                    <div className="absolute bottom-6 left-0 right-0 overflow-x-auto px-10 [&::-webkit-scrollbar]:hidden flex gap-3 justify-center">
                        {images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setDirection(i > currentIndex ? 1 : -1);
                                    onNavigate(i);
                                }}
                                className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${i === currentIndex ? "border-rose-500 scale-110 shadow-lg shadow-rose-500/20" : "border-transparent opacity-40 hover:opacity-100"
                                    }`}
                            >
                                <Image src={img} alt="Thumb" fill className="object-cover" />
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
