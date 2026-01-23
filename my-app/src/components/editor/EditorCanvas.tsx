"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Note, Cell } from '@/store/types';
import { EditorCell, EditorCellHandle } from './EditorCell';
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
    const firstCellRef = useRef<EditorCellHandle>(null);

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
                        <div className="w-px h-4 bg-transparent mx-1" />

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

                        {/* Cells */}
                        <div className="space-y-0.5 flex-1">
                            {note.cells && note.cells.map((cell, index) => (
                                <EditorCell
                                    key={cell.id}
                                    ref={(el) => {
                                        // Store ref in a map or similar if we want to manage focus by index, 
                                        // but for now keeping it simple. We can use the 'autoFocus' on new cells 
                                        // or simple effect logic.
                                        if (index === 0 && !firstCellRef.current) {
                                            // @ts-ignore
                                            firstCellRef.current = el;
                                        }
                                    }}
                                    cell={cell}
                                    onChange={(content) => handleCellChange(cell.id, content)}
                                    onDelete={() => handleDeleteCell(cell.id)}
                                    // New Prop: onSplit
                                    onSplit={(cursorIdx, type) => {
                                        const contentBefore = cell.content.substring(0, cursorIdx);
                                        const contentAfter = cell.content.substring(cursorIdx);

                                        // Remove the slash command from contentBefore if it triggered the split
                                        // The EditorCell will handle the trigger text removal usually, but 
                                        // let's say the trigger was simple.

                                        const newType = type || 'code';

                                        const newCellId = uuidv4();
                                        const remainderCellId = uuidv4();

                                        const updatedCurrentCell = { ...cell, content: contentBefore };
                                        const newCell: Cell = { id: newCellId, type: newType, content: '' };
                                        const remainderCell: Cell = { id: remainderCellId, type: 'markdown', content: contentAfter };

                                        const currentCells = note.cells;
                                        const newCells = [
                                            ...currentCells.slice(0, index),
                                            updatedCurrentCell,
                                            newCell,
                                            remainderCell,
                                            ...currentCells.slice(index + 1)
                                        ];

                                        onUpdate({ ...note, cells: newCells });
                                    }}
                                    isActive={false}
                                    onCursorMove={onCursorMove}
                                />
                            ))}
                            <div ref={bottomRef} className="h-40" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
