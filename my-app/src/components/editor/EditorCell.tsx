"use client";

import React, { useState, useRef, useEffect } from 'react';
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

interface FloatingToolbarProps {
    position: { top: number; left: number } | null;
    onAction: (action: string) => void;
}

function FloatingToolbar({ position, onAction }: FloatingToolbarProps) {
    if (!position) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed z-[100] bg-[#050505]/90 backdrop-blur-xl border border-cyan-500/50 rounded-full p-1 flex items-center gap-1 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            style={{
                top: position.top - 50,
                left: position.left,
                transform: 'translateX(-50%)'
            }}
        >
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                onClick={() => onAction('bold')}
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                onClick={() => onAction('italic')}
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                onClick={() => onAction('code')}
            >
                <Code className="h-4 w-4" />
            </Button>
        </motion.div>
    );
}

interface EditorCellProps {
    cell: Cell;
    onChange: (content: string) => void;
    onDelete: () => void;
    onSelect?: () => void;
    onCursorMove?: (line: number, col: number) => void;
    isActive?: boolean;
}

export function EditorCell({ cell, onChange, onDelete, onSelect, onCursorMove, isActive }: EditorCellProps) {
    const [isEditing, setIsEditing] = useState(true); // Default to true
    const [lintErrors, setLintErrors] = useState<LintError[]>([]);
    const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Handle text selection for floating toolbar
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim() && textareaRef.current && document.activeElement === textareaRef.current) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                setToolbarPos({
                    top: rect.top + window.scrollY,
                    left: rect.left + rect.width / 2 + window.scrollX
                });
            } else {
                setToolbarPos(null);
            }
        };

        document.addEventListener('selectionchange', handleSelection);
        return () => document.removeEventListener('selectionchange', handleSelection);
    }, []);

    const handleToolbarAction = (action: string) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = cell.content;
        const selected = text.substring(start, end);

        let newText = text;
        if (action === 'bold') newText = text.substring(0, start) + `**${selected}**` + text.substring(end);
        if (action === 'italic') newText = text.substring(0, start) + `*${selected}*` + text.substring(end);
        if (action === 'code') newText = text.substring(0, start) + `\`${selected}\`` + text.substring(end);

        onChange(newText);
        setToolbarPos(null);
    };

    // Auto-resize textarea
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [cell.content, isEditing]);

    // Run linting when editing
    useEffect(() => {
        if (isEditing) {
            if (cell.content) {
                const errors = LintService.lint(cell.content);
                setLintErrors(errors);
            }
            const timer = setTimeout(() => {
                const errors = LintService.lint(cell.content);
                setLintErrors(errors);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setLintErrors([]);
        }
    }, [cell.content, isEditing]);

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
        onChange(e.target.value);
        updateCursorPosition();
    };

    return (
        <div
            className={cn(
                "group relative mb-6 rounded-2xl border transition-all duration-500 overflow-hidden",
                "backdrop-blur-xl bg-[#050505]/80",
                "border-cyan-500/20 hover:border-cyan-500/40",
                // Focus state
                "focus-within:border-cyan-400 focus-within:shadow-[0_0_30px_rgba(34,211,238,0.2)]",
                isActive && "border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
            )}
            onClick={() => {
                if (onSelect) onSelect();
            }}
        >
            <AnimatePresence>
                {toolbarPos && <FloatingToolbar position={toolbarPos} onAction={handleToolbarAction} />}
            </AnimatePresence>
            {/* Content Area */}
            <div
                className="min-h-[1.5em] p-4 w-full cursor-text text-gray-200"
                onClick={(e) => {
                    e.stopPropagation();
                    handleFocus();
                }}
            >
                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            ref={textareaRef}
                            value={cell.content}
                            onChange={handleChange}
                            onKeyUp={updateCursorPosition}
                            onMouseUp={updateCursorPosition}
                            onClick={updateCursorPosition}
                            className="w-full bg-transparent resize-none outline-none font-mono text-lg leading-relaxed min-h-[1.5em] overflow-hidden text-zinc-100 placeholder:text-zinc-800"
                            placeholder="Start writing..."
                            autoFocus
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
                ) : (
                    <div className="prose dark:prose-invert max-w-none text-lg">
                        {cell.content ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {cell.content}
                            </ReactMarkdown>
                        ) : (
                            <span className="text-muted-foreground/40 italic text-lg select-none">
                                Start writing...
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* AI Hint */}
            {/* Cell Actions */}
            <div className="absolute right-0 top-0 flex gap-1 p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-cyan-500/5 backdrop-blur-md rounded-bl-2xl border-l border-b border-cyan-500/20 translate-y-[-10px] group-hover:translate-y-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" onClick={onDelete} title="Delete Cell">
                    <Trash className="h-4 w-4" />
                </Button>
                {isEditing && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors" title="AI Assist">
                        <Sparkles className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
