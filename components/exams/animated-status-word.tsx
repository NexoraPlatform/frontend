'use client';

import { AnimatePresence, motion } from 'framer-motion';

type AnimatedStatusWordProps = {
    animationKey: number;
    children: string;
};

export default function AnimatedStatusWord({
    animationKey,
    children,
}: AnimatedStatusWordProps) {
    return (
        <AnimatePresence mode="wait">
            <motion.span
                key={animationKey}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.4 }}
                className="inline-block font-bold text-[var(--emerald-green)]"
            >
                {children}
            </motion.span>
        </AnimatePresence>
    );
}
