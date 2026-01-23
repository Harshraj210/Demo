"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Note, Cell } from '@/store/types';
import { EditorCell } from './EditorCell';
import { Button } from '@/components/ui/button';
import { Save, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

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

    const handleSave = () => {
        toast.success("Note saved successfully");
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
        <div className="flex flex-col h-full w-full bg-[#050505] text-white relative overflow-hidden transition-all duration-300">

            {/* Toolbar - Floating */}
            {/* Toolbar - Floating */}
            <div className="flex items-center justify-center px-4 py-4 bg-transparent gap-4 shrink-0 transition-all sticky top-0 z-40">
                <div className="relative group rounded-full p-px overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_35px_rgba(6,182,212,0.3)] transition-all duration-500">
                    <div className="absolute inset-0 bg-linear-to-r from-cyan-500/20 via-cyan-400/40 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center gap-2 bg-[#050505]/80 backdrop-blur-xl px-6 py-2 rounded-full z-10 border border-cyan-500/30">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-cyan-500/10 rounded-full text-zinc-400 hover:text-cyan-400 transition-all"
                            onClick={handleSave}
                            title="Save (Ctrl+S)"
                        >
                            <Save className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-4 bg-cyan-500/20 mx-1" />
                        <Button
                            variant="ghost"
                            className="h-8 px-4 gap-2 hover:bg-linear-to-r hover:from-cyan-500/20 hover:to-blue-500/20 rounded-full text-zinc-300 hover:text-cyan-400 text-sm font-bold transition-all border border-transparent hover:border-cyan-500/40"
                            onClick={addCell}
                        >
                            <Plus className="h-4 w-4" /> Add Cell
                        </Button>
                    </div>
                </div>
            </div>

            {/* Notebook Area - Full Surface */}
            <div className="flex-1 overflow-y-auto w-full flex flex-col scrollbar-none z-10 relative">
                <div
                    className="w-full h-full min-h-[calc(100vh-60px)] bg-transparent flex flex-col p-4 md:p-12 transition-transform duration-200 ease-out"
                    style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top left',
                    }}
                >
                    <div className="w-full h-full flex flex-col">
                        {/* Title Area */}
                        <div className="mb-12 border-b border-cyan-500/10 pb-6 relative group">
                            <input
                                type="text"
                                value={note.title}
                                onChange={(e) => onUpdate({ ...note, title: e.target.value })}
                                className="text-6xl font-black bg-transparent border-none outline-none w-full text-white placeholder:text-zinc-900 transition-all drop-shadow-[0_0_12px_rgba(34,211,238,0.4)] focus:drop-shadow-[0_0_18px_rgba(34,211,238,1)] tracking-tighter"
                                placeholder="Untitled Note"
                            />
                            <div className="absolute bottom-0 left-0 h-0.5 bg-cyan-500/50 w-0 group-focus-within:w-full transition-all duration-700" />
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
                </div>
            </div>
        </div>
    );
}
