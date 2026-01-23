"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNote } from '@/hooks/useNote';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { Loader2, PanelRightOpen, ArrowLeft, ZoomIn, ZoomOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AISidebarPanel, AIToolType } from '@/components/ai/AISidebarPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFolders } from '@/hooks/useFolders';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function NoteEditor({ id }: { id: string }) {
    const router = useRouter();
    const { note, loading, error, saveNote } = useNote(id);
    const { folders } = useFolders();
    const [activeTool, setActiveTool] = useState<AIToolType>(null);
    const [sidebarWidth, setSidebarWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

    const parentFolder = note?.folderId ? folders.find(f => f.id === note.folderId) : null;

    useEffect(() => {
        if (error) {
            console.error("NoteEditor Error:", error);
        }
    }, [error]);

    const handleBack = () => {
        if (note?.folderId) {
            router.push(`/?folder=${note.folderId}`);
        } else {
            router.push('/');
        }
    };

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback(
        (e: MouseEvent) => {
            if (isResizing) {
                const newWidth = document.body.clientWidth - e.clientX;
                const maxAllowedWidth = document.body.clientWidth - 100;

                if (newWidth > 320 && newWidth < Math.min(800, maxAllowedWidth)) {
                    setSidebarWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    useEffect(() => {
        if (isResizing) {
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, resize, stopResizing]);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));

    if (error) {
         return (
             <div className="flex h-[100vh] w-full items-center justify-center flex-col gap-4 bg-black text-white z-50 relative">
                 <h2 className="text-xl font-bold text-red-500">Error Loading Note</h2>
                 <p className="text-zinc-400">{error}</p>
                 <Button onClick={() => router.push('/')} variant="outline" className="mt-4 border-zinc-800 hover:bg-zinc-900">
                     Return Home
                 </Button>
             </div>
         );
    }

    if (loading) {
        return (
            <div className="flex h-[100vh] w-full items-center justify-center bg-black text-white z-50 relative">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                <span className="ml-3 text-zinc-400 font-medium tracking-wide">Loading Note...</span>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="flex h-[100vh] w-full items-center justify-center flex-col gap-4 bg-black text-white z-50 relative">
                <h2 className="text-xl font-semibold">Note not found</h2>
                <p className="text-zinc-500">This note might have been deleted or does not exist.</p>
                <Button onClick={() => router.push('/')} variant="ghost" className="text-cyan-400 hover:bg-cyan-950/30">
                    Go Home
                </Button>
            </div>
        );
    }

    const noteContent = note.cells.map(c => c.content).join('\n\n');

    return (
        <div className="flex flex-col h-[100vh] w-full overflow-hidden bg-[#050505] select-none">
            {/* Top Bar */}
            <div className="flex-none h-14 border-b border-cyan-500/30 flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="h-9 w-9 text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-1.5 text-sm font-medium">
                        <button
                            onClick={() => router.push('/')}
                            className="text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 px-2 py-1 rounded-md transition-all"
                        >
                            Home
                        </button>
                        <ChevronRight className="h-4 w-4 text-zinc-600" />
                        {parentFolder && (
                            <>
                                <button
                                    onClick={() => router.push(`/?folder=${parentFolder.id}`)}
                                    className="text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 px-2 py-1 rounded-md transition-all truncate max-w-[150px]"
                                >
                                    {parentFolder.name}
                                </button>
                                <ChevronRight className="h-4 w-4 text-zinc-600" />
                            </>
                        )}
                        <span className="text-white drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] px-2 py-1 truncate max-w-[200px]">
                            {note.title || "Untitled Note"}
                        </span>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTool(activeTool ? null : 'chat')}
                        className={cn(
                            "text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/5 gap-2 px-4 rounded-full transition-all border border-transparent",
                            activeTool && "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                        )}
                    >
                        <PanelRightOpen className={cn("h-4 w-4 transition-transform", activeTool && "rotate-180")} />
                        <span className="hidden sm:inline">{activeTool ? "Close AI" : "Open AI"}</span>
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative w-full">
                {/* Editor Area with Status Bar */}
                <div className="flex-1 flex flex-col min-w-0 w-full bg-[#050505] relative transition-all duration-300">
                    <div className="flex-1 overflow-y-auto scrollbar-none">
                        {/* Correctly passing zoomLevel and onCursorMove */}
                        <ErrorBoundary>
                            <EditorCanvas
                                note={note}
                                onUpdate={saveNote}
                                zoomLevel={zoomLevel}
                                onCursorMove={(line, col) => setCursorPos({ line, col })}
                            />
                        </ErrorBoundary>
                    </div>

                    {/* Status Bar */}
                    <div className="h-10 bg-[#050505] border-t border-cyan-500/20 flex items-center justify-end px-4 text-xs shrink-0 select-none z-30 gap-6">
                        {/* Zoom Controls (First) */}
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleZoomOut}
                                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </motion.button>

                            <span className="min-w-[3ch] text-center font-medium text-zinc-300">
                                {Math.round(zoomLevel * 100)}%
                            </span>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleZoomIn}
                                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </motion.button>
                        </div>

                        {/* Cursor Info (Second) */}
                        <div className="flex items-center text-zinc-400 font-mono">
                            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
                        </div>
                    </div>
                </div>

                {/* Resizable Sidebar */}
                <AnimatePresence mode="wait">
                    {activeTool && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: sidebarWidth, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="hidden md:flex relative h-full shrink-0"
                        >
                            <div
                                className="absolute left-0 top-0 bottom-0 w-1.5 hover:bg-cyan-500 cursor-col-resize z-50 transition-colors active:bg-cyan-600"
                                onMouseDown={startResizing}
                            />
                            <div className="flex-1 flex flex-col border-l border-zinc-800 bg-[#050505] h-full overflow-hidden">
                                <AISidebarPanel
                                    isOpen={true}
                                    activeTool={activeTool}
                                    onClose={() => setActiveTool(null)}
                                    onToolChange={setActiveTool}
                                    noteContent={noteContent}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {activeTool && (
                         <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="md:hidden absolute inset-0 z-50 bg-[#050505]"
                         >
                                <AISidebarPanel
                                    isOpen={true}
                                    activeTool={activeTool}
                                    onClose={() => setActiveTool(null)}
                                    onToolChange={setActiveTool}
                                    noteContent={noteContent}
                                />
                         </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
