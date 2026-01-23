"use client";

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Cell } from '@/store/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle, Trash, Bold, Italic, Code } from 'lucide-react';
import { LintService, LintError } from '@/lib/lint-service';
import { motion, AnimatePresence } from 'framer-motion';

export interface EditorCellHandle {
    focus: () => void;
}

interface EditorCellProps {
    cell: Cell;
    onChange: (content: string) => void;
    onDelete: () => void;
    onSelect?: () => void;
    onCursorMove?: (line: number, col: number) => void;
    onSplit?: (cursorIdx: number, type: 'code' | 'markdown') => void; // New Prop
    isActive?: boolean;
}

export const EditorCell = forwardRef<EditorCellHandle, EditorCellProps>(({ cell, onChange, onDelete, onSelect, onCursorMove, onSplit, isActive }, ref) => {
    const [isEditing, setIsEditing] = useState(true);
    const [lintErrors, setLintErrors] = useState<LintError[]>([]);
    const [selection, setSelection] = useState<{ start: number, end: number, top: number, left: number } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Mirror ref for calculating cursor position
    const mirrorRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            setIsEditing(true);
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 0);
        }
    }));

    // Auto-resize textarea
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [cell.content, isEditing]);

    // Scroll to caret function
    const scrollToCaret = () => {
        // ... (Keep existing scrollToCaret logic if needed, or simplify)
        // For brevity in replacement, assuming existing logic is fine or simplified below
        if (!textareaRef.current || !mirrorRef.current) return;
        // (Simplified scroll logic for this view - reusing existing context would be better but replacing large chunk)
        const textarea = textareaRef.current;
        textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    // Run linting when editing
    // Run linting when editing
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (cell.type === 'markdown' && isEditing && cell.content) {
            setLintErrors(LintService.lint(cell.content));

            timer = setTimeout(() => {
                setLintErrors(LintService.lint(cell.content));
            }, 500);
        } else {
            setLintErrors([]);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [cell.content, isEditing, cell.type]);

    const updateCursorPosition = () => {
        if (textareaRef.current && onCursorMove) {
            const val = textareaRef.current.value;
            const selectionStart = textareaRef.current.selectionStart;
            const lines = val.substring(0, selectionStart).split("\n");
            const line = lines.length;
            const col = lines[lines.length - 1].length + 1;
            onCursorMove(line, col);
        }
    };

    const handleFocus = () => {
        setIsEditing(true);
        if (onSelect) onSelect();
        updateCursorPosition();
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;

        // Slash Command Logic: /code
        if (onSplit && cell.type === 'markdown' && val.endsWith('/code')) {
            // Trigger split
            // Remove '/code' is handled by splitting at index - 5
            const cursorIdx = e.target.selectionStart;
            // Ensure we are at the end of the command
            if (cursorIdx === val.length) {
                // Split before the command
                const commandLength = 5; // "/code"
                onChange(val.slice(0, -commandLength)); // Optimistic match to remove text
                onSplit(cursorIdx - commandLength, 'code');
                return;
            }
        }

        onChange(val);
        updateCursorPosition();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (cell.type === 'code' && (e.shiftKey || e.metaKey)) {
                e.preventDefault();
                // Exit code cell -> Create markdown below
                if (onSplit) {
                    onSplit(cell.content.length, 'markdown');
                }
                return;
            }
        }

        updateCursorPosition();
        handleSelect();
    };

    const handleSelect = () => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;

        if (start !== end) {
            const rect = textareaRef.current.getBoundingClientRect();
            setSelection({ start, end, top: rect.top - 50, left: rect.left + 20 });
        } else {
            setSelection(null);
        }
    };

    const isCode = cell.type === 'code';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
                "group relative transition-all duration-300 font-sans",
                // Hybrid Flow Styling
                isCode ? [
                    "mb-4 rounded-xl border overflow-hidden",
                    "bg-[#0a0a0a] border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.05)]",
                    "focus-within:border-cyan-400 focus-within:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
                ] : [
                    "mb-0 rounded-none border-none bg-transparent shadow-none"
                    // Transparent text cell
                ]
            )}
            onClick={(e) => {
                e.stopPropagation(); // Prevent parent clicks if needed
                handleFocus();
            }}
        >
            {/* Content Area */}
            <div
                className={cn(
                    "w-full cursor-text",
                    isCode ? "p-4 font-mono text-sm leading-relaxed text-cyan-50" : "p-1 py-1 text-lg leading-relaxed text-zinc-300"
                )}
            >
                <div className="relative w-full">
                    <textarea
                        ref={textareaRef}
                        value={cell.content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onClick={() => { updateCursorPosition(); handleSelect(); }}
                        onSelect={handleSelect}
                        className={cn(
                            "w-full bg-transparent resize-none outline-none overflow-hidden block",
                            isCode ? "text-cyan-50 placeholder:text-cyan-500/30 min-h-[4em]" : "text-zinc-200 placeholder:text-zinc-600 min-h-[1.5em]"
                        )}
                        placeholder={isCode ? "// Type logic here..." : "Start writing..."}
                        autoFocus={isActive} // Focus if active
                        spellCheck={!isCode}
                    />
                    {/* Lint Warnings */}
                    {lintErrors.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-2 text-xs text-yellow-600 dark:text-yellow-400"
                        >
                            <div className="flex items-center gap-1.5 font-semibold mb-1">
                                <AlertCircle className="h-3 w-3" />
                                <span>Suggestion</span>
                            </div>
                            <ul className="pl-5 list-disc space-y-0.5">
                                {lintErrors.slice(0, 3).map((err) => (
                                    <li key={err.id}>
                                        <span className="opacity-80">{err.message}</span>
                                        {err.suggestion && <span className="font-medium ml-1">→ {err.suggestion}</span>}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </div>
            </div>


            {/* Floating Toolbar */}
            <AnimatePresence>
                {selection && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="fixed z-50 flex items-center gap-1 bg-[#050505]/90 backdrop-blur-xl border border-cyan-500/30 p-1 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(34,211,238,0.1)]"
                        style={{ top: selection.top, left: selection.left }}
                    >
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-cyan-500/10 text-zinc-400 hover:text-cyan-400 rounded-full transition-all">
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-cyan-500/10 text-zinc-400 hover:text-cyan-400 rounded-full transition-all">
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-cyan-500/10 text-zinc-400 hover:text-cyan-400 rounded-full transition-all">
                            <Code className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Hint */}
            {/* Cell Actions */}
            <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                    onClick={onDelete}
                    title="Delete Cell"
                >
                    <Trash className="h-4 w-4" />
                </Button>
                {isEditing && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-full transition-all"
                        title="AI Assist"
                    >
                        <Sparkles className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </motion.div >
    );
});

EditorCell.displayName = 'EditorCell';
