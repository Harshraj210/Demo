"use client";

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Cell } from '@/store/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, Sparkles, AlertCircle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LintService, LintError } from '@/lib/lint-service';

import { motion } from 'framer-motion';

interface EditorCellProps {
    cell: Cell;
    onChange: (content: string) => void;
    onDelete: () => void;
    onSelect?: () => void;
    isActive?: boolean;
}

export function EditorCell({ cell, onChange, onDelete, onSelect, isActive }: EditorCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [lintErrors, setLintErrors] = useState<LintError[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ... (rest of hook logic remains same until return)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: cell.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Auto-resize textarea
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [cell.content, isEditing]);

    // Run linting when editing
    useEffect(() => {
        if (isEditing) {
            const timer = setTimeout(() => {
                const errors = LintService.lint(cell.content);
                setLintErrors(errors);
            }, 500); // Debounce
            return () => clearTimeout(timer);
        } else {
            setLintErrors([]); // Clear errors when not editing/view mode
        }
    }, [cell.content, isEditing]);

    const handleFocus = () => {
        setIsEditing(true);
        if (onSelect) onSelect();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            ref={setNodeRef}
            style={style}
            role="button"
            tabIndex={0}
            onClick={() => {
                if (onSelect) onSelect();
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    if (onSelect) onSelect();
                    setIsEditing(true);
                }
            }}
            className={cn(
                "group relative mb-4 rounded-xl border border-transparent bg-card/50 transition-all duration-200 outline-none",
                // Hover state
                "hover:border-border/50 hover:bg-card hover:shadow-sm",
                // Active/Editing state
                isActive && "border-primary/50 shadow-[0_0_20px_-3px_rgba(124,58,237,0.1)] ring-1 ring-primary/20 bg-card",
                isEditing && "border-primary ring-1 ring-primary shadow-md bg-background"
            )}
        >
            {/* Drag Handle & Actions - Visible on Hover/Focus - HIDDEN ON MOBILE */}
            <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 hidden sm:flex flex-col gap-1 transition-opacity duration-200">
                <div {...attributes} {...listeners} className="cursor-grab p-1.5 hover:bg-muted rounded-md transition-colors active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground/70" />
                </div>
                <button onClick={onDelete} className="p-1.5 hover:bg-destructive/10 text-muted-foreground/70 hover:text-destructive rounded-md transition-colors">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {/* Mobile Actions (Visible when active) */}
            <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 sm:hidden transition-opacity z-10">
                 <button onClick={onDelete} className="p-1.5 bg-background shadow-sm border rounded-full text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3 w-3" />
                </button>
            </div>

            {/* Content Area */}
            <div
                className="min-h-[3rem] p-4 w-full cursor-text"
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
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={() => setIsEditing(false)}
                            className="w-full bg-transparent resize-none outline-none font-mono text-sm leading-relaxed"
                            placeholder="Type markdown..."
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
                    <div className="prose dark:prose-invert max-w-none">
                        {cell.content ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {cell.content}
                            </ReactMarkdown>
                        ) : (
                            <span className="text-muted-foreground/40 italic text-sm select-none">
                                Click to edit...
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* AI Action Hint */}
            {isEditing && (
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-2 top-2"
                >
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10" title="AI Assist">
                        <Sparkles className="h-3 w-3" />
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}
