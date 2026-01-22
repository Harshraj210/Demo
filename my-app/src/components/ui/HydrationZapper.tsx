"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Starfield } from './Starfield';
import { Loader2 } from 'lucide-react';

interface HydrationZapperProps {
    children: React.ReactNode;
}

export function HydrationZapper({ children }: HydrationZapperProps) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    return (
        <AnimatePresence mode="wait">
            {!hasMounted ? (
                <motion.div
                    key="hydration-loading"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
                >
                    <Starfield />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="relative w-16 h-16 mb-4">
                            <div className="absolute inset-0 bg-cyan-500/20 blur-xl animate-pulse rounded-full" />
                            <Loader2 className="h-16 w-16 animate-spin text-cyan-500 stroke-1" />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/60 animate-pulse">
                            Synchronizing Neural Link
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="hydration-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="h-full w-full"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
