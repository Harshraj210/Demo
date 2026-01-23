"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Wait for client-side hydration to complete
    useEffect(() => {
        setMounted(true);
        router.replace('/');
    }, []);

    // NOTE: Removed the useEffect timer here because LoadingScreen drives the completion now via onComplete

    const isNotePage = pathname?.startsWith('/notes/') ?? false;

    // Don't render sidebar-dependent layout until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="flex h-screen w-full bg-background overflow-hidden" />
        );
    }

    return (
        <>
            <AnimatePresence mode="wait">
                {isLoading && (
                    <motion.div
                        key="loading-screen"
                        initial={{ y: 0 }}
                        exit={{
                            y: "-100%",
                            transition: {
                                duration: 0.8,
                                ease: [0.43, 0.13, 0.23, 0.96] // Custom heavy mechanical ease
                            }
                        }}
                        className="fixed inset-0 z-100 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                    >
                        <LoadingScreen onComplete={() => setIsLoading(false)} />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="flex h-screen w-full bg-background overflow-hidden transition-colors duration-500"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { delay: 0.2, duration: 0.5 }
                }}
            >
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
            </motion.div>
        </>
    );
}
