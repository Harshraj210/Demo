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
    // If not open or no tool, we don't render. 
    // However, with AnimatePresence in parent, we might want to handle exit animations here.
    // The parent conditionally renders this component, so we can just use motion.div for enter/exit.

    // We can ignore the internal `isOpen` check if the parent handles mounting/unmounting with AnimatePresence.
    // But for safety let's keep the null check if activeTool is null.
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

    const getTitle = () => {
        switch (activeTool) {
            case 'summarize': return "Summarize Note";
            case 'quiz': return "Quiz Generator";
            case 'chat': return "AI Assistant";
            default: return "AI Tool";
        }
    };

    return (
        <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 w-full bg-background/95 backdrop-blur-xl flex flex-col h-full shadow-2xl md:static md:w-[350px] md:border-l md:shadow-none md:z-auto"
        >
            <div className="p-4 border-b flex flex-col gap-4 bg-muted/20 shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{getTitle()}</h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex bg-muted rounded-lg p-1 gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 h-7 text-xs border ${activeTool === 'chat' ? 'bg-background shadow-sm text-foreground border-border' : 'text-muted-foreground border-transparent'}`}
                        onClick={() => onToolChange('chat')}
                    >
                        Chat
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 h-7 text-xs border ${activeTool === 'summarize' ? 'bg-background shadow-sm text-foreground border-border' : 'text-muted-foreground border-transparent'}`}
                        onClick={() => onToolChange('summarize')}
                    >
                        Summarize
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 h-7 text-xs border ${activeTool === 'quiz' ? 'bg-background shadow-sm text-foreground border-border' : 'text-muted-foreground border-transparent'}`}
                        onClick={() => onToolChange('quiz')}
                    >
                        Quiz
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {renderTool()}
            </div>
        </motion.div>
    );
}
