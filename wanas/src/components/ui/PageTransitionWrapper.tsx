"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* هذا المكون يضمن دخول العناصر بترتيب متتابع (Stagger) */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1, // الفارق الزمني بين ظهور كل بطاقة
            },
          },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
