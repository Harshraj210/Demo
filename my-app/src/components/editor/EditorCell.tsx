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
        <div
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
                "group relative mb-4 rounded-lg border border-transparent bg-card transition-all hover:border-border hover:shadow-sm outline-none",
                isActive && "border-primary shadow-[0_0_20px_-3px_rgba(124,58,237,0.4)] dark:shadow-[0_0_25px_-5px_rgba(139,92,246,0.5)] ring-1 ring-primary/20",
                isEditing && "border-primary ring-1 ring-primary shadow-md"
            )}
        >
            {/* Drag Handle & Actions - Visible on Hover/Focus */}
            <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-opacity">
                <div {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-muted rounded">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <button onClick={onDelete} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {/* Content Area */}
            <div
                className="min-h-12 p-4 w-full cursor-text"
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
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-md p-2 text-xs text-yellow-800 dark:text-yellow-200">
                                <div className="flex items-center gap-1.5 font-semibold mb-1">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Writing Suggestions</span>
                                </div>
                                <ul className="pl-5 list-disc space-y-0.5">
                                    {lintErrors.slice(0, 3).map((err) => (
                                        <li key={err.id}>
                                            <span className="opacity-80">{err.message}</span>
                                            {err.suggestion && <span className="font-medium ml-1">→ {err.suggestion}</span>}
                                        </li>
                                    ))}
                                    {lintErrors.length > 3 && (
                                        <li className="list-none opacity-70 italic">+{lintErrors.length - 3} more...</li>
                                    )}
                                </ul>
                            </div>
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
                            <span className="text-muted-foreground italic">Empty cell. Click to edit.</span>
                        )}
                    </div>
                )}
            </div>

            {/* AI Action Hint */}
            {isEditing && (
                <div className="absolute right-2 top-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" title="AI Assist">
                        <Sparkles className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}
