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
        <div className="flex flex-col h-full w-full bg-black text-white">
            {/* Toolbar - Floating */}
            {/* Toolbar - Floating */}
            <div className="flex items-center justify-center px-4 py-3 bg-black/90 backdrop-blur-sm gap-4 shrink-0 transition-all border-b border-cyan-500/20 sticky top-0 z-40">
                <div className="relative group rounded-full p-px overflow-hidden shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-shadow duration-500">
                    <div className="absolute inset-0 bg-cyan-500 group-hover:bg-cyan-400 transition-colors duration-300" />
                    <div className="relative flex items-center gap-2 bg-black/90 px-5 py-1.5 rounded-full z-10">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors" onClick={handleSave} title="Save (Ctrl+S)">
                            <Save className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-4 bg-cyan-500/30 mx-1" />
                        <Button variant="ghost" className="h-8 px-3 gap-2 hover:bg-zinc-800 rounded-full text-zinc-300 hover:text-white text-sm font-medium transition-colors" onClick={addCell}>
                            <Plus className="h-4 w-4" /> Add Cell
                        </Button>
                    </div>
                </div>
            </div>

            {/* Notebook Area - Full Screen */}
            <div className="flex-1 overflow-y-auto w-full flex flex-col items-center scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <div
                    className="w-full h-full min-h-[calc(100vh-60px)] bg-black flex flex-col p-4 md:p-8 transition-transform duration-200 ease-out"
                    style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top center',
                        width: `${100 / zoomLevel}%` // Compensate width if scaling down/up to keep centered? Actually just scale is fine if we accept it shrinks.
                        // Better: Apply scale to the inner content wrapper so it stays centered.
                    }}
                >
                    <div className="w-full max-w-[1800px] mx-auto h-full flex flex-col">
                        {/* Title Area */}
                        <div className="mb-8 border-b border-cyan-500/20 pb-4">
                            <input
                                type="text"
                                value={note.title}
                                onChange={(e) => onUpdate({ ...note, title: e.target.value })}
                                className="text-5xl font-bold bg-transparent border-none outline-none w-full text-white placeholder:text-zinc-800 transition-all"
                                placeholder="Untitled Note"
                            />
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
