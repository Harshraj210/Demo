"use client";

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Cell } from '@/store/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle } from 'lucide-react';
import { LintService, LintError } from '@/lib/lint-service';
import { motion } from 'framer-motion';

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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
                "group relative mb-4 rounded-lg border bg-zinc-950 transition-all duration-200",
                "border-zinc-800 hover:border-zinc-700",
                // Focus state
                "focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:shadow-lg focus-within:shadow-indigo-500/10",
                isActive && "border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/10"
            )}
            onClick={() => {
                if (onSelect) onSelect();
            }}
        >
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
                            onClick={updateCursorPosition}
                            className="w-full bg-transparent resize-none outline-none font-mono text-lg leading-relaxed min-h-[1.5em] overflow-hidden"
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
            {isEditing && (
                <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" title="AI Assist">
                        <Sparkles className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
