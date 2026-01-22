"use client";

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Note, Cell } from '@/store/types';
import { EditorCell } from './EditorCell';
import { Button } from '@/components/ui/button';

import {
    Plus,
    Scissors,
    Copy,
    Clipboard,
    Trash2,
    Save,
    Undo,
    Redo,
    ChevronUp,
    ChevronDown,
    File as FileIcon,
    Settings,
    MoreVertical,
    Type,
    Palette,
    FileText
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuShortcut
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface EditorCanvasProps {
    note: Note;
    onUpdate: (note: Note) => void;
}

export function EditorCanvas({ note, onUpdate }: EditorCanvasProps) {
    const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
    const [clipboard, setClipboard] = useState<Cell | null>(null);

    const [past, setPast] = useState<Note[]>([]);
    const [future, setFuture] = useState<Note[]>([]);
    const historyTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Helper to update note and manage history
    const updateNote = (newNote: Note, addToHistory: boolean = true) => {
        if (addToHistory) {
            setPast(prev => [...prev, note]);
            setFuture([]);
        }
        onUpdate(newNote);
    };

    // Corrected Text Change Strategy
    const isTypingRef = React.useRef(false);

    const updateNoteWithDebounce = (newNote: Note) => {
        if (!isTypingRef.current) {
            setPast(prev => [...prev, note]);
            setFuture([]);
            isTypingRef.current = true;
        }

        onUpdate(newNote);

        if (historyTimeoutRef.current) {
            clearTimeout(historyTimeoutRef.current);
        }

        historyTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
        }, 1000);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }

            // New Shortcuts (when not editing a cell)
            const isEditing = document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT';

            if (!isEditing) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                    e.preventDefault();
                    addCell();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
                    e.preventDefault();
                    handleCut();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                    e.preventDefault();
                    handleCopy();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                    e.preventDefault();
                    handlePaste();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [note, past, future]); // Dep on past/future for undo/redo closures

    const handleUndo = () => {
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        setFuture(prev => [note, ...prev]);
        setPast(newPast);
        onUpdate(previous);
    };

    const handleRedo = () => {
        if (future.length === 0) return;
        const next = future[0];
        const newFuture = future.slice(1);

        setPast(prev => [...prev, note]);
        setFuture(newFuture);
        onUpdate(next);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = note.cells.findIndex((c) => c.id === active.id);
            const newIndex = note.cells.findIndex((c) => c.id === over.id);

            const newCells = arrayMove(note.cells, oldIndex, newIndex);
            updateNote({ ...note, cells: newCells }); // Immediate history
        }
    };

    const handleCellChange = (id: string, newContent: string) => {
        const newCells = note.cells.map(c => c.id === id ? { ...c, content: newContent } : c);
        updateNoteWithDebounce({ ...note, cells: newCells }); // Debounced history
    };

    const handleDeleteCell = (id: string) => {
        const newCells = note.cells.filter(c => c.id !== id);
        updateNote({ ...note, cells: newCells });
        if (selectedCellId === id) setSelectedCellId(null);
    };

    const addCell = (index?: number) => {
        const newCell: Cell = {
            id: uuidv4(),
            type: 'markdown',
            content: ''
        };

        let newCells = [...note.cells];
        if (typeof index === 'number') {
            newCells.splice(index, 0, newCell);
        } else {
            newCells.push(newCell);
        }

        updateNote({ ...note, cells: newCells });
        setSelectedCellId(newCell.id);
    };

    // Actions
    const handleSave = () => {
        // In a real app, this might trigger a server save or check status
        toast.success("Note saved successfully");
    };

    const handleCut = () => {
        if (!selectedCellId) return;
        const cell = note.cells.find(c => c.id === selectedCellId);
        if (cell) {
            setClipboard(cell);
            // We want to use our wrapper to ensure history is tracked
            // But handleDeleteCell already uses updateNote
            handleDeleteCell(cell.id);
            toast.info("Cell cut to clipboard");
        }
    };

    const handleCopy = () => {
        if (!selectedCellId) return;
        const cell = note.cells.find(c => c.id === selectedCellId);
        if (cell) {
            setClipboard({ ...cell }); // Deep copy if needed, but shallow is fine for now
            toast.info("Cell copied to clipboard");
        }
    };

    const handlePaste = () => {
        if (!clipboard) return;
        const newCell = { ...clipboard, id: uuidv4() };

        // Paste after selected or at end
        let newCells = [...note.cells];
        const index = selectedCellId ? note.cells.findIndex(c => c.id === selectedCellId) : note.cells.length - 1;

        if (index !== -1) {
            newCells.splice(index + 1, 0, newCell);
        } else {
            newCells.push(newCell);
        }

        updateNote({ ...note, cells: newCells });
        setSelectedCellId(newCell.id);
        toast.info("Cell pasted");
    };

    const handleMove = (direction: 'up' | 'down') => {
        if (!selectedCellId) return;
        const index = note.cells.findIndex(c => c.id === selectedCellId);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            const newCells = arrayMove(note.cells, index, index - 1);
            updateNote({ ...note, cells: newCells });
        } else if (direction === 'down' && index < note.cells.length - 1) {
            const newCells = arrayMove(note.cells, index, index + 1);
            updateNote({ ...note, cells: newCells });
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-full bg-transparent">
            {/* Menu Bar removed as per user request */}

            {/* Toolbar */}
            <div className="flex items-center px-4 py-2 border-b bg-background/40 backdrop-blur-md gap-1 shrink-0 overflow-x-auto">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave} title="Save (Ctrl+S)">
                    <Save className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => addCell()} title="Add Cell">
                    <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCut} disabled={!selectedCellId} title="Cut Cell">
                    <Scissors className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy} disabled={!selectedCellId} title="Copy Cell">
                    <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePaste} disabled={!clipboard} title="Paste Cell">
                    <Clipboard className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMove('up')} disabled={!selectedCellId} title="Move Cell Up">
                    <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMove('down')} disabled={!selectedCellId} title="Move Cell Down">
                    <ChevronDown className="h-4 w-4" />
                </Button>

                <div className="w-px h-4 bg-border mx-1" />

                {/* Font Size */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Font Size">
                            <Type className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="font-size: 12px">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}>Small</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="font-size: 16px">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}>Normal</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="font-size: 20px">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}>Large</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="font-size: 24px">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}>Extra Large</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>


                {/* Font Color - Inline Swatches */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="color: #ffffff">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}
                        className="h-6 w-6 rounded-full border-2 border-border hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: '#ffffff' }}
                        title="White"
                    />
                    <button
                        onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="color: #00d9ff">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}
                        className="h-6 w-6 rounded-full border-2 border-border hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: '#00d9ff' }}
                        title="Cyan"
                    />
                    <button
                        onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="color: #fbbf24">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}
                        className="h-6 w-6 rounded-full border-2 border-border hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: '#fbbf24' }}
                        title="Yellow"
                    />
                    <button
                        onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="color: #ef4444">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}
                        className="h-6 w-6 rounded-full border-2 border-border hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: '#ef4444' }}
                        title="Red"
                    />
                    <button
                        onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="color: #888888">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}
                        className="h-6 w-6 rounded-full border-2 border-border hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: '#888888' }}
                        title="Gray"
                    />
                </div>

                {/* Font Family */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Font Family">
                            <FileText className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="font-family: Arial">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}>Arial</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="font-family: Georgia">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}>Georgia</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="font-family: 'Courier New'">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}>Courier New</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="font-family: 'Times New Roman'">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}>Times New Roman</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            const activeElement = document.activeElement as HTMLTextAreaElement;
                            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                                const start = activeElement.selectionStart;
                                const end = activeElement.selectionEnd;
                                const selectedText = activeElement.value.substring(start, end);
                                if (selectedText) {
                                    const wrappedText = `<span style="font-family: Verdana">${selectedText}</span>`;
                                    const newValue = activeElement.value.substring(0, start) + wrappedText + activeElement.value.substring(end);
                                    const event = new Event('input', { bubbles: true });
                                    activeElement.value = newValue;
                                    activeElement.dispatchEvent(event);
                                }
                            }
                        }}>Verdana</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
                <div className="max-w-3xl mx-auto py-8 px-4 pb-32">
                    <div className="mb-8 px-1 flex justify-center">
                        <input
                            type="text"
                            value={note.title}
                            onChange={(e) => onUpdate({ ...note, title: e.target.value })}
                            className="text-5xl font-extrabold bg-transparent border-none outline-none w-full text-center placeholder:text-muted-foreground/40 focus:placeholder:text-muted-foreground/20 transition-all"
                            placeholder="Untitled Note"
                        />
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={note.cells.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {note.cells.map(cell => (
                                <EditorCell
                                    key={cell.id}
                                    cell={cell}
                                    isActive={selectedCellId === cell.id}
                                    onSelect={() => setSelectedCellId(cell.id)}
                                    onChange={(content) => handleCellChange(cell.id, content)}
                                    onDelete={() => handleDeleteCell(cell.id)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    <div className="mt-4 flex justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Button variant="ghost" onClick={() => addCell()} className="gap-2">
                            <Plus className="h-4 w-4" /> Add Cell
                        </Button>
                    </div>

                    {note.cells.length === 0 && (
                        <div className="mt-8 flex justify-center">
                            <Button onClick={() => addCell()}>Start Writing</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
