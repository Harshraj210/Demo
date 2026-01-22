"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Summarizer } from './Summarizer';
import { QuizGenerator } from './QuizGenerator';
import { AIChat } from './AIChat';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type AIToolType = 'summarize' | 'chat' | 'quiz' | null;

interface AISidebarPanelProps {
    isOpen: boolean;
    activeTool: AIToolType;
    onClose: () => void;
    onToolChange: (tool: AIToolType) => void;
    noteContent: string;
}

export function AISidebarPanel({ isOpen, activeTool, onClose, onToolChange, noteContent }: AISidebarPanelProps) {
    if (!activeTool) return null;

    const renderTool = () => {
        switch (activeTool) {
            case 'summarize':
                return <Summarizer content={noteContent} />;
            case 'quiz':
                return <QuizGenerator content={noteContent} />;
            case 'chat':
                return <AIChat content={noteContent} />;
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 w-full bg-background/95 backdrop-blur-xl flex flex-col h-full shadow-2xl md:static md:w-full md:h-full md:border-none md:shadow-none md:z-auto"
        >
            <div className="p-6 border-b border-cyan-500/20 flex flex-col gap-6 bg-[#050505]/40 backdrop-blur-md shrink-0">
                <div className="flex items-center justify-between relative">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        <h3 className="font-black text-xl tracking-tighter text-white uppercase">
                            Klaer <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">AI</span>
                        </h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full hover:bg-cyan-500/10 text-zinc-500 hover:text-cyan-400 transition-all border border-transparent hover:border-cyan-500/20"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex bg-[#050505] rounded-full p-1 border border-cyan-500/20 w-full shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                    {(['chat', 'summarize', 'quiz'] as const).map((tool) => {
                        const isActive = activeTool === tool;
                        const label = tool.charAt(0).toUpperCase() + tool.slice(1);

                        return (
                            <button
                                key={tool}
                                onClick={() => onToolChange(tool)}
                                className={cn(
                                    "flex-1 relative py-2 rounded-full text-xs font-bold transition-all duration-500 overflow-hidden",
                                    isActive ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-cyan-500/10 border border-cyan-500/30 rounded-full"
                                        animate={{
                                            opacity: [0.5, 0.8, 0.5],
                                            boxShadow: [
                                                "0 0 0px rgba(6,182,212,0)",
                                                "0 0 15px rgba(6,182,212,0.2)",
                                                "0 0 0px rgba(6,182,212,0)"
                                            ]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                )}
                                <span className="relative z-10">{label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {renderTool()}
            </div>
        </motion.div>
    );
}
