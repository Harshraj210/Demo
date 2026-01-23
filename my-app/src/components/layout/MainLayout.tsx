"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    // Wait for client-side hydration to complete
    useEffect(() => {
        setMounted(true);
    }, []);

    const isNotePage = pathname?.startsWith('/notes/') ?? false;

    // Don't render sidebar-dependent layout until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="flex h-screen w-full bg-background overflow-hidden">
                <main className="flex-1 h-full overflow-hidden flex flex-col relative w-full">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            <AnimatePresence mode="wait">
                {!isNotePage && (
                    <motion.div
                        key="sidebar"
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <React.Suspense fallback={<div className="w-16 h-full bg-background border-r border-border" />}>
                            <Sidebar />
                        </React.Suspense>
                    </motion.div>
                )}
            </AnimatePresence>
            <main className="flex-1 h-full overflow-hidden flex flex-col relative w-full transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
