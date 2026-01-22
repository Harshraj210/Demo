"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNote } from '@/hooks/useNote';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { Loader2, PanelRightOpen, ArrowLeft, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AISidebarPanel, AIToolType } from '@/components/ai/AISidebarPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function NoteEditor({ id }: { id: string }) {
    const router = useRouter();
    const { note, loading, saveNote } = useNote(id);
    const [activeTool, setActiveTool] = useState<AIToolType>(null);
    const [sidebarWidth, setSidebarWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

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

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    if (!note) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4 bg-black text-white">
                <h2 className="text-xl font-semibold">Note not found</h2>
                <p className="text-zinc-500">This note might have been deleted or does not exist.</p>
            </div>
        );
    }

    const noteContent = note.cells.map(c => c.content).join('\n\n');

    return (
        <div className="flex flex-col h-full overflow-hidden bg-black select-none">
            {/* Top Bar */}
            <div className="flex-none h-14 border-b border-cyan-500/20 flex items-center justify-between px-4 bg-black z-20">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/')}
                        className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-900"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="font-semibold text-lg text-white truncate max-w-md" title={note.title}>
                        {note.title || "Untitled Note"}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTool(activeTool ? null : 'chat')}
                        className={cn("text-zinc-400 hover:text-white hover:bg-zinc-900 gap-2", activeTool && "bg-zinc-900 text-white")}
                    >
                        <PanelRightOpen className={cn("h-4 w-4 transition-transform", activeTool && "rotate-180")} />
                        {activeTool ? "Close AI" : "Open AI"}
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Editor Area with Status Bar */}
                <div className="flex-1 flex flex-col min-w-0 bg-black relative">
                    <div className="flex-1 overflow-y-auto scrollbar-none">
                        {/* Correctly passing zoomLevel and onCursorMove */}
                        <EditorCanvas
                            note={note}
                            onUpdate={saveNote}
                            zoomLevel={zoomLevel}
                            onCursorMove={(line, col) => setCursorPos({ line, col })}
                        />
                    </div>

                    {/* Status Bar */}
                    <div className="h-10 bg-black border-t border-cyan-500/20 flex items-center justify-end px-4 text-xs shrink-0 select-none z-30 gap-6">
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
                        <>
                            <div
                                className="w-1.5 bg-zinc-900 hover:bg-blue-500 cursor-col-resize z-50 transition-colors hidden md:block active:bg-blue-600"
                                onMouseDown={startResizing}
                            />
                            <div
                                style={{ width: sidebarWidth }}
                                className="hidden md:flex flex-col border-l border-zinc-800 bg-black h-full shrink-0"
                            >
                                <AISidebarPanel
                                    isOpen={true}
                                    activeTool={activeTool}
                                    onClose={() => setActiveTool(null)}
                                    onToolChange={setActiveTool}
                                    noteContent={noteContent}
                                />
                            </div>
                            <div className="md:hidden absolute inset-0 z-50 bg-black">
                                <AISidebarPanel
                                    isOpen={true}
                                    activeTool={activeTool}
                                    onClose={() => setActiveTool(null)}
                                    onToolChange={setActiveTool}
                                    noteContent={noteContent}
                                />
                            </div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
