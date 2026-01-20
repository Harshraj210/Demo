"use client";

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Settings,
    Brain,
    MessageSquare,
    BarChart,
    Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/hooks/useNotes';
import { useNote } from '@/hooks/useNote';
import { useRouter, useParams } from 'next/navigation';
import { AISidebarPanel, AIToolType } from '@/components/ai/AISidebarPanel';
import { motion, AnimatePresence } from 'framer-motion';

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeAITool, setActiveAITool] = useState<AIToolType>(null);
    const { notes, createNote } = useNotes();
    const router = useRouter();
    const params = useParams();
    const activeNoteId = params?.id as string;

    // Get active note content for AI context
    const { note: activeNote } = useNote(activeNoteId || '');

    // Get raw text content from the note for AI processing
    const getNoteContent = () => {
        if (!activeNote) return "";
        return activeNote.cells.map(c => c.content).join('\n\n');
    };

    const handleCreateNote = async () => {
        const newNote = await createNote();
        router.push(`/notes/${newNote.id}`);
    };

    const handleOpenNote = (id: string) => {
        router.push(`/notes/${id}`);
    };

    const toggleAITool = (tool: AIToolType) => {
        if (activeAITool === tool) {
            setActiveAITool(null);
        } else {
            setActiveAITool(tool);
        }
    };

    // Close AI panel when navigating to a different note (optional, but good for context)
    useEffect(() => {
        if (activeAITool && !activeNoteId) {
            setActiveAITool(null);
        }
    }, [activeNoteId, activeAITool]);

    const sidebarVariants = {
        collapsed: { width: "4rem" },
        expanded: { width: "16rem" }
    };

    return (
        <div className="relative flex h-screen z-40 bg-background">
            <motion.aside
                initial={false}
                animate={isCollapsed ? "collapsed" : "expanded"}
                variants={sidebarVariants}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="h-full bg-muted/30 border-r border-border flex flex-col z-20 bg-background overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0 h-16">
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="font-bold text-lg tracking-tight whitespace-nowrap"
                            >
                                Markdown AI
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0">
                        <FileText className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
                    <div className="px-3 mb-2">
                        <div className="flex items-center justify-between px-2 mb-2 h-8">
                            {!isCollapsed && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xs font-semibold text-muted-foreground whitespace-nowrap"
                                >
                                    FILES
                                </motion.p>
                            )}
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <Button variant="ghost" size="icon" className="h-4 w-4" onClick={handleCreateNote}>
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </motion.div>
                            )}
                        </div>

                        <nav className="space-y-1">
                            {/* Notes List */}
                            {notes.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => handleOpenNote(note.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer group truncate transition-colors h-9",
                                        activeNoteId === note.id ? "bg-accent text-accent-foreground font-medium" : "text-foreground hover:bg-accent/50"
                                    )}
                                    title={note.title}
                                >
                                    <FileText className={cn("h-4 w-4 shrink-0", activeNoteId === note.id ? "text-primary" : "text-muted-foreground")} />
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="truncate"
                                        >
                                            {note.title || "Untitled"}
                                        </motion.span>
                                    )}
                                </div>
                            ))}
                            {notes.length === 0 && !isCollapsed && (
                                <div className="px-2 py-2 text-xs text-muted-foreground italic whitespace-nowrap">No notes yet.</div>
                            )}
                        </nav>
                    </div>

                    <div className="px-3 mt-6">
                        {!isCollapsed && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs font-semibold text-muted-foreground mb-2 px-2 whitespace-nowrap"
                            >
                                AI TOOLS
                            </motion.p>
                        )}
                        <nav className="space-y-1">
                            <SidebarItem
                                icon={Brain}
                                label="Summarize"
                                isCollapsed={isCollapsed}
                                isActive={activeAITool === 'summarize'}
                                onClick={() => toggleAITool('summarize')}
                            />
                            <SidebarItem
                                icon={MessageSquare}
                                label="Chat"
                                isCollapsed={isCollapsed}
                                isActive={activeAITool === 'chat'}
                                onClick={() => toggleAITool('chat')}
                            />
                            <SidebarItem
                                icon={BarChart}
                                label="Quiz"
                                isCollapsed={isCollapsed}
                                isActive={activeAITool === 'quiz'}
                                onClick={() => toggleAITool('quiz')}
                            />
                        </nav>
                    </div>
                </div>

                {/* User / Engagement */}
                <div className="p-4 border-t border-border shrink-0">
                    {!isCollapsed ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3"
                        >
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                                U
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">User</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    🔥 5 Day Streak
                                </p>
                            </div>
                            <Settings className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground shrink-0" />
                        </motion.div>
                    ) : (
                        <div className="flex justify-center flex-col items-center gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">U</div>
                            <Settings className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                        </div>
                    )}
                </div>
            </motion.aside>

            {/* AI Panel - Renders outside the aside but visually connected */}
            <AnimatePresence>
                {activeAITool && (
                    <AISidebarPanel
                        isOpen={true}
                        activeTool={activeAITool}
                        onClose={() => setActiveAITool(null)}
                        noteContent={getNoteContent()}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function SidebarItem({
    icon: Icon,
    label,
    isCollapsed,
    isActive,
    onClick
}: {
    icon: any,
    label: string,
    isCollapsed: boolean,
    isActive?: boolean,
    onClick?: () => void
}) {
    return (
        <Button
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start h-9 transition-all duration-200",
                isCollapsed ? "justify-center px-0" : "",
                isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
            )}
            onClick={onClick}
        >
            <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "")} />
            {!isCollapsed && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-2 whitespace-nowrap"
                >
                    {label}
                </motion.span>
            )}
        </Button>
    )
}
