"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Summarizer } from './Summarizer';
import { QuizGenerator } from './QuizGenerator';
import { AIChat } from './AIChat';
import { motion } from 'framer-motion';

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
            <div className="p-4 border-b-2 border-white flex flex-col gap-4 bg-muted/20 shrink-0">
                <div className="flex items-center justify-center relative pb-2">
                    <h3 className="font-bold text-xl">
                        Klaer <span className="text-cyan-400">AI</span>
                    </h3>
                    <Button variant="ghost" size="icon" className="absolute right-0 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="w-full h-px bg-linear-to-r from-transparent via-cyan-500/40 to-transparent" />

                <div className="flex bg-black/60 backdrop-blur-xl rounded-full p-1.5 gap-3 border border-white/5 w-full">
                    {(['chat', 'summarize', 'quiz'] as const).map((tool) => {
                        const isActive = activeTool === tool;
                        const label = tool.charAt(0).toUpperCase() + tool.slice(1);

                        return isActive ? (
                            <div key={tool} className="relative flex-1 group">
                                <div className="absolute -inset-0.5 bg-linear-to-r from-cyan-500 to-blue-500 rounded-full opacity-20 blur group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                                <div className="relative h-full w-full rounded-full p-px overflow-hidden">
                                    <div className="absolute -inset-full bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#22d3ee_50%,#00000000_100%)]" />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="relative h-8 w-full rounded-full text-xs font-medium bg-black/90 text-cyan-400 hover:text-cyan-300 hover:bg-black/80 transition-all border border-transparent"
                                        onClick={() => onToolChange(tool)}
                                    >
                                        {label}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                key={tool}
                                variant="ghost"
                                size="sm"
                                className="flex-1 h-8 rounded-full text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all duration-300"
                                onClick={() => onToolChange(tool)}
                            >
                                {label}
                            </Button>
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
