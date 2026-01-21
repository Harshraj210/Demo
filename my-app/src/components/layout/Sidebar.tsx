"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from "next-themes";
import {
    FileText,
    Settings,
    Brain,
    MessageSquare,
    BarChart,
    Plus,
    X,
    Moon,
    Sun,
    Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/hooks/useNotes';
import { useFolders } from '@/hooks/useFolders';
import { useNote } from '@/hooks/useNote';
import { Cell, Folder, Note } from '@/store/types';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AISidebarPanel, AIToolType } from '@/components/ai/AISidebarPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder as FolderIcon, MoreVertical, Copy, Clipboard, Trash2, FolderPlus, Clock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function SidebarContent() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeAITool, setActiveAITool] = useState<AIToolType>(null);
    
    // Combined hooks
    const { notes, createNote, copyNote, deleteNote } = useNotes();
    const { folders, createFolder, deleteFolder, updateFolder } = useFolders();
    const { theme, setTheme } = useTheme();
    
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    
    const activeNoteId = params?.id as string;
    const [noteClipboard, setNoteClipboard] = useState<Note | null>(null);

    // Auto-collapse on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsCollapsed(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Get active note content for AI context
    const { note: activeNote } = useNote(activeNoteId || '');

    // Get raw text content from the note for AI processing
    const getNoteContent = () => {
        if (!activeNote) return "";
        return activeNote.cells.map((c: Cell) => c.content).join('\n\n');
    };


    const toggleAITool = (tool: AIToolType) => {
        if (activeAITool === tool) {
            setActiveAITool(null);
        } else {
            setActiveAITool(tool);
        }
    };

    const handleOpenNote = (noteId: string) => {
        router.push(`/note/${noteId}`);
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
                className="h-full bg-background/60 backdrop-blur-xl border-r border-border flex flex-col z-20 overflow-hidden"
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
                <div className="flex-1 overflow-y-auto py-4 space-y-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Link href="/">
                            <Button
                                variant={!searchParams.get('folder') && !searchParams.get('view') ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start h-10 px-4 transition-all duration-200",
                                    isCollapsed ? "justify-center px-0" : "",
                                    !searchParams.get('folder') && !searchParams.get('view') ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-foreground hover:bg-accent/50"
                                )}
                            >
                                <Clock className={cn("h-5 w-5 shrink-0", !searchParams.get('folder') && !searchParams.get('view') ? "text-primary" : "text-muted-foreground")} />
                                {!isCollapsed && <span className="ml-3 font-medium">Recent Files</span>}
                            </Button>
                        </Link>
                    </motion.div>

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
                                        className="ml-2 truncate"
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

                    {/* Folders Link */}
                     <div className="px-3 mt-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="group relative"
                        >
                            <Button
                                variant={searchParams.get('view') === 'folders' || searchParams.get('folder') ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start h-10 px-4 transition-all duration-200",
                                    isCollapsed ? "justify-center px-0" : "",
                                    (searchParams.get('view') === 'folders' || searchParams.get('folder')) ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-foreground hover:bg-accent/50"
                                )}
                                onClick={() => {
                                    router.push('/?view=folders');
                                }}
                            >
                                <FolderIcon className={cn("h-5 w-5 shrink-0", (searchParams.get('view') === 'folders' || searchParams.get('folder')) ? "text-primary" : "text-muted-foreground")} />
                                {!isCollapsed && <span className="ml-3 font-medium">Folders</span>}
                            </Button>
                        </motion.div>
                    </div>

                    {/* AI Tools Section - Restored */}
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
                <div
                    className="p-6 border-t border-border cursor-pointer hover:bg-muted/30 transition-colors"
                >
                    <div className="flex items-center justify-between">
                         <div 
                            className="flex items-center gap-3 flex-1"
                            onClick={() => router.push('/profile')}
                        >
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                                U
                            </div>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex-1 overflow-hidden"
                                >
                                    <p className="text-sm font-medium truncate">User</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        🔥 5 Day Streak
                                    </p>
                                </motion.div>
                            )}
                        </div>
                         {!isCollapsed && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setIsSettingsOpen(true)}
                                title="Settings"
                            >
                                <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Settings Modal - Restored */}
            {isSettingsOpen && (
                <div 
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsSettingsOpen(false)}
                >
                    <div 
                        className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Settings
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Appearance</h4>
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 text-primary rounded-md">
                                            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium">Theme</span>
                                            <span className="text-xs text-muted-foreground">
                                                {theme === 'dark' ? 'Dark mode is active' : 'Light mode is active'}
                                            </span>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    >
                                        Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="pt-2 text-center text-xs text-muted-foreground">
                                <p>Version 0.1.0 • Built with Next.js 16</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Panel - Restored */}
            <AISidebarPanel
                isOpen={!!activeAITool}
                activeTool={activeAITool}
                onClose={() => setActiveAITool(null)}
                noteContent={getNoteContent()}
            />
        </div>
    );
}

export function Sidebar() {
    return (
        <React.Suspense fallback={<div className="w-16 h-full bg-background border-r border-border" />}>
            <SidebarContent />
        </React.Suspense>
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
