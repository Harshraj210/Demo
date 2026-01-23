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
import { Folder as FolderIcon, MoreVertical, Copy, Clipboard, Trash2, FolderPlus, Clock, Menu } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TypewriterText = ({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) => (
    <motion.div
        className={cn("flex overflow-hidden", className)}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={{
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: {
                    staggerChildren: 0.1,
                    delayChildren: delay
                }
            },
            exit: {
                opacity: 0,
                transition: {
                    staggerChildren: 0.1, // Slower stagger for smoother exit
                    staggerDirection: -1,
                    delayChildren: 0.2 // Wait a bit before starting to delete
                }
            }
        }}
    >
        {text.split("").map((char, index) => (
            <motion.span
                key={index}
                variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: {
                        opacity: 1,
                        scale: 1,
                        transition: { type: "spring", damping: 20, stiffness: 300 }
                    },
                    exit: {
                        opacity: 0,
                        scale: 0.5,
                        transition: { duration: 0.3 } // Slower individual char exit
                    }
                }}
            >
                {char === " " ? "\u00A0" : char}
            </motion.span>
        ))}
    </motion.div>
);

function SidebarContent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true); // Default Closed
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeAITool, setActiveAITool] = useState<AIToolType>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Combined hooks
    const { notes, createNote, copyNote, deleteNote } = useNotes();
    const { folders, createFolder, deleteFolder, updateFolder } = useFolders();
    const { theme, setTheme } = useTheme();

    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const activeNoteId = params?.id as string;
    const [noteClipboard, setNoteClipboard] = useState<Note | null>(null);

    // Auto-collapse on mobile - Handle initial state
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            if (mobile) {
                setIsCollapsed(true); // Default to collapsed on mobile
            } else {
                setIsMobileMenuOpen(false); // Reset mobile state on desktop
            }
        };

        handleResize(); // Init
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
            // On mobile, if we open AI tool, we might want to close the sidebar or keep it?
            // Let's keep it simple for now.
        }
    };

    const handleOpenNote = (noteId: string) => {
        // Fix: Route correctly to /notes/ instead of /note/
        router.push(`/notes/${noteId}`);
        // On mobile, close sidebar after navigation
        if (window.innerWidth < 768) {
            setIsMobileMenuOpen(false);
        }
    };

    // Removed auto-close useEffect to allow AI tools to stay open even if no note is selected initially (though they need content).
    // Can render a placeholder in the panel if no note is selected.

    const sidebarVariants = {
        collapsed: { width: "4rem" },
        expanded: { width: "16rem" },
        mobileOpen: { x: 0, width: "16rem" },
        mobileClosed: { x: "-100%", width: "16rem" }
    };


    return (
        <>
            {/* Mobile Toggle Button (Visible only on mobile when sidebar is closed) */}
            <div className="md:hidden fixed top-3 left-3 z-50">
                {!isMobileMenuOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="bg-background/80 backdrop-blur-md shadow-sm border border-border h-10 w-10 rounded-full text-foreground/80 hover:text-foreground"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={isMobile ? (isMobileMenuOpen ? "mobileOpen" : "mobileClosed") : (isCollapsed ? "collapsed" : "expanded")}
                variants={sidebarVariants}
                // Swift spring transition
                transition={{ type: "spring", stiffness: 300, damping: 30 }} // Slightly gentler spring for sidebar
                className={cn(
                    "flex flex-col z-50 overflow-hidden bg-background border-r border-zinc-200 dark:border-cyan-500/50 shadow-none", // Seamless solid background
                    // Mobile styles: fixed full height
                    "fixed inset-y-0 left-0 h-full",
                    // Desktop styles: relative
                    "md:relative md:translate-x-0 md:shadow-none"
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-zinc-200 dark:border-cyan-500/50 flex items-center justify-between shrink-0 h-16">
                    <AnimatePresence mode="popLayout">
                        {(!isCollapsed || isMobile) && (
                            <motion.div
                                className="font-bold text-lg tracking-tight whitespace-nowrap flex overflow-hidden"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                <span className="text-zinc-900 dark:text-zinc-100">Klaer </span>
                                <span className="text-blue-600 dark:text-cyan-400">Notebook</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isMobile ? (
                        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="shrink-0">
                            <X className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0">
                            <FileText className="h-5 w-5" />
                        </Button>
                    )}
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
                                    isCollapsed && !isMobile ? "justify-center px-0" : "",
                                    !searchParams.get('folder') && !searchParams.get('view') ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-foreground hover:bg-accent/50"
                                )}
                                onClick={() => isMobile && setIsMobileMenuOpen(false)}
                            >
                                <motion.div layout className="flex items-center">
                                    <Clock className={cn("h-5 w-5 shrink-0", !searchParams.get('folder') && !searchParams.get('view') ? "text-primary" : "text-muted-foreground")} />
                                </motion.div>
                                <AnimatePresence>
                                    {(!isCollapsed || isMobile) && (
                                        <motion.div
                                            key="recent-text"
                                            className="ml-3 font-medium overflow-hidden whitespace-nowrap"
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0, transition: { duration: 0.3 } }}
                                        >
                                            Recent Files
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </Link>
                    </motion.div>

                    <nav className="space-y-1">
                        {/* Notes List removed as per user request */}
                    </nav>

                    {/* Folders Link */}
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
                                isCollapsed && !isMobile ? "justify-center px-0" : "",
                                (searchParams.get('view') === 'folders' || searchParams.get('folder')) ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-foreground hover:bg-accent/50"
                            )}
                            onClick={() => {
                                router.push('/?view=folders');
                                if (isMobile) setIsMobileMenuOpen(false);
                            }}
                        >
                            <motion.div layout className="flex items-center">
                                <FolderIcon className={cn("h-5 w-5 shrink-0", (searchParams.get('view') === 'folders' || searchParams.get('folder')) ? "text-primary" : "text-muted-foreground")} />
                            </motion.div>
                            <AnimatePresence>
                                {(!isCollapsed || isMobile) && (
                                    <motion.div
                                        key="folders-text"
                                        className="ml-3 font-medium overflow-hidden whitespace-nowrap"
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0, transition: { duration: 0.3 } }}
                                    >
                                        Folders
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>
                    </motion.div>

                    {/* AI Tools Section Removed as per user request */}
                </div>

                {/* User / Engagement */}
                <div
                    className="p-6 border-t border-border cursor-pointer hover:bg-muted/30 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div
                            className="flex items-center gap-3 flex-1"
                            onClick={() => {
                                router.push('/profile');
                                if (isMobile) setIsMobileMenuOpen(false);
                            }}
                        >
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                                U
                            </div>
                            {(!isCollapsed || isMobile) && (
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
                        {(!isCollapsed || isMobile) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                    setIsSettingsOpen(true);
                                    if (isMobile) setIsMobileMenuOpen(false);
                                }}
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
                        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <Settings className="h-4 w-4" />
                                Settings
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)} className="text-zinc-950 dark:text-white">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Appearance</h4>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md">
                                            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-zinc-900 dark:text-zinc-100">Theme</span>
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {theme === 'dark' ? 'Dark mode is active' : 'Light mode is active'}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                        className="border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                                    >
                                        Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-2 text-center text-xs text-zinc-400 dark:text-zinc-600">
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
                onToolChange={setActiveAITool}
                noteContent={getNoteContent()}
            />
        </>
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
