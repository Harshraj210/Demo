"use client";

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/hooks/useNotes';
import { useFolders } from '@/hooks/useFolders';
import { useNote } from '@/hooks/useNote';
import { Cell, Folder, Note } from '@/store/types';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder as FolderIcon, MoreVertical, Copy, Clipboard, Trash2, FolderPlus, Clock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { createNote, copyNote, deleteNote } = useNotes();
    const { folders, createFolder, deleteFolder, updateFolder } = useFolders();
    const searchParams = useSearchParams();

    const router = useRouter();
    const params = useParams();
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

                {/* User / Engagement */}
                <div
                    className="p-6 border-t border-border cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => router.push('/profile')}
                >
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
