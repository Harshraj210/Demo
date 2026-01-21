"use client";

import React from 'react';
import { Sidebar } from './Sidebar';

import { motion, AnimatePresence } from 'framer-motion';

export function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            <React.Suspense fallback={<div className="w-16 h-full bg-background border-r border-border" />}>
                <Sidebar />
            </React.Suspense>
            <main className="flex-1 h-full overflow-hidden flex flex-col relative w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex-1 h-full flex flex-col"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
