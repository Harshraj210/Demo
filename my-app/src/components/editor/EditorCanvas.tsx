"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Note, Cell } from '@/store/types';
import { EditorCell } from './EditorCell';
import { Button } from '@/components/ui/button';
import { Save, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EditorCanvasProps {
    note: Note;
    onUpdate: (note: Note) => void;
    zoomLevel: number;
    onCursorMove: (line: number, col: number) => void;
}

export function EditorCanvas({ note, onUpdate, zoomLevel, onCursorMove }: EditorCanvasProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Ensure there is at least one cell on load
    useEffect(() => {
        if (!note.cells || note.cells.length === 0) {
            const newCell: Cell = {
                id: uuidv4(),
                type: 'markdown',
                content: ''
            };
            onUpdate({ ...note, cells: [newCell] });
        }
    }, [note.cells, onUpdate]);

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        toast.success("Note saved successfully");
        setTimeout(() => setIsSaving(false), 2000);
    };

    const handleCellChange = (id: string, newContent: string) => {
        const newCells = note.cells.map(c => c.id === id ? { ...c, content: newContent } : c);
        onUpdate({ ...note, cells: newCells });
    };

    const handleDeleteCell = (id: string) => {
        // Prevent deleting the last cell
        if (note.cells.length <= 1) {
            handleCellChange(id, ''); // Just clear content
            return;
        }
        const newCells = note.cells.filter(c => c.id !== id);
        onUpdate({ ...note, cells: newCells });
    };

    const addCell = () => {
        const newCell: Cell = {
            id: uuidv4(),
            type: 'markdown',
            content: ''
        };
        const currentCells = note.cells || [];
        const newCells = [...currentCells, newCell];
        onUpdate({ ...note, cells: newCells });

        // Scroll to bottom after adding
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    return (
        <div className="flex flex-col h-full w-full bg-black text-white">
            {/* Toolbar - Floating */}
            <div className="flex items-center justify-center px-4 py-3 bg-black/60 backdrop-blur-md gap-4 shrink-0 transition-all border-b border-cyan-500/10 sticky top-0 z-40">
                <motion.div
                    whileHover="hover"
                    initial="idle"
                    className="relative flex items-center gap-4 bg-[#050505] backdrop-blur-xl px-5 py-2 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)] overflow-hidden transition-all duration-500"
                >
                    {/* Scanning Shimmer Effect */}
                    <motion.div
                        variants={{
                            hover: { x: ['-200%', '200%'] },
                            idle: { x: '-200%' }
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 z-0 bg-linear-to-r from-transparent via-cyan-500/10 to-transparent skew-x-12"
                    />

                    <div className="relative z-10 flex items-center gap-4">
                        <motion.button
                            onClick={handleSave}
                            whileTap={{ scale: 0.95 }}
                            className="group relative h-9 w-9 flex items-center justify-center rounded-full transition-all"
                            title="Save (Ctrl+S)"
                        >
                            <motion.div
                                animate={isSaving ? {
                                    scale: [1, 1.2, 1],
                                    filter: ['drop-shadow(0 0 0px #22d3ee)', 'drop-shadow(0 0 10px #22d3ee)', 'drop-shadow(0 0 0px #22d3ee)']
                                } : {}}
                                transition={{ duration: 0.5 }}
                            >
                                <Save className={cn(
                                    "h-5 w-5 transition-all duration-300",
                                    isSaving ? "text-cyan-400" : "text-white/70 group-hover:text-cyan-400 drop-shadow-[0_0_2px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                                )} />
                            </motion.div>
                        </motion.button>

                        <div className="w-px h-4 bg-white/10 opacity-50" />

                        <button
                            onClick={addCell}
                            className="group relative flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-cyan-500/5 transition-all active:scale-95 overflow-hidden"
                        >
                            <motion.div
                                variants={{
                                    hover: { scale: 1.2, rotate: 90 },
                                    idle: { scale: 1, rotate: 0 }
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <Plus className="h-4 w-4 text-cyan-400" />
                            </motion.div>
                            <span className="text-cyan-400 font-bold text-xs tracking-wider uppercase">Add Cell</span>
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Notebook Area - Full Screen */}
            <div className="flex-1 overflow-y-auto w-full flex flex-col items-center scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <AnimatePresence>
                    <motion.div
                        key="canvas-content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="w-full h-full min-h-[calc(100vh-60px)] bg-black flex flex-col p-4 md:p-8 transition-transform duration-200 ease-out"
                        style={{
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'top center',
                            width: `${100 / zoomLevel}%`
                        }}
                    >
                        <div className="w-full max-w-[1800px] mx-auto h-full flex flex-col">
                            {/* Title Area */}
                            <div className="mb-12 border-b border-cyan-500/10 pb-6 relative group">
                                <input
                                    type="text"
                                    value={note.title}
                                    onChange={(e) => onUpdate({ ...note, title: e.target.value })}
                                    className="text-6xl font-black bg-transparent border-none outline-none w-full text-white placeholder:text-zinc-900 transition-all tracking-tight drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]"
                                    placeholder="Untitled Note"
                                />
                                <div className="absolute bottom-0 left-0 w-32 h-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                            </div>

                            {/* Cells */}
                            <div className="space-y-4 flex-1">
                                {note.cells && note.cells.map((cell) => (
                                    <EditorCell
                                        key={cell.id}
                                        cell={cell}
                                        onChange={(content) => handleCellChange(cell.id, content)}
                                        onDelete={() => handleDeleteCell(cell.id)}
                                        isActive={false}
                                        onCursorMove={onCursorMove}
                                    />
                                ))}
                                <div ref={bottomRef} className="h-20" />
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
