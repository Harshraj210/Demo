"use client";

import { useState } from 'react';
import { useNote } from '@/hooks/useNote';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { Loader2, Brain, MessageSquare, BarChart, PanelRightClose, PanelRightOpen, ArrowLeft, Type, Palette, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AISidebarPanel, AIToolType } from '@/components/ai/AISidebarPanel';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';

export function NoteEditor({ id }: { id: string }) {
    const router = useRouter();
    const { note, loading, saveNote } = useNote(id);
    const [activeTool, setActiveTool] = useState<AIToolType>(null); // Default to closed

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!note) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4">
                <h2 className="text-xl font-semibold">Note not found</h2>
                <p className="text-muted-foreground">This note might have been deleted or does not exist.</p>
            </div>
        );
    }

    const noteContent = note.cells.map(c => c.content).join('\n\n');

    const toggleTool = (tool: AIToolType) => {
        if (activeTool === tool) {
            setActiveTool(null);
        } else {
            setActiveTool(tool);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-transparent">
            {/* Top Bar */}
            <div className="h-14 border-b flex items-center justify-between px-4 bg-background/40 backdrop-blur-md shrink-0 z-10 transition-all">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/')}
                        className="h-9 w-9 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="font-semibold text-lg truncate max-w-md transition-[padding]" title={note.title}>
                        {note.title || "Untitled Note"}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Font Size */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                <Type className="h-4 w-4 mr-1" />
                                Size
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => document.execCommand('fontSize', false, '1')}>Small</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.execCommand('fontSize', false, '3')}>Normal</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.execCommand('fontSize', false, '5')}>Large</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.execCommand('fontSize', false, '7')}>Extra Large</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Font Color */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                <Palette className="h-4 w-4 mr-1" />
                                Color
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => document.execCommand('foreColor', false, '#ffffff')}>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: '#ffffff' }}></div>
                                    White
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.execCommand('foreColor', false, '#00d9ff')}>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: '#00d9ff' }}></div>
                                    Cyan
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.execCommand('foreColor', false, '#888888')}>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: '#888888' }}></div>
                                    Gray
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.execCommand('foreColor', false, '#ef4444')}>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: '#ef4444' }}></div>
                                    Red
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Font Family */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                <FileText className="h-4 w-4 mr-1" />
                                Font
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => document.execCommand('fontName', false, 'Arial')}>Arial</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.execCommand('fontName', false, 'Georgia')}>Georgia</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.execCommand('fontName', false, 'Courier New')}>Courier New</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.execCommand('fontName', false, 'Times New Roman')}>Times New Roman</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.execCommand('fontName', false, 'Verdana')}>Verdana</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="w-px h-6 bg-border mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveTool(activeTool ? null : 'chat')}
                        title={activeTool ? "Close AI Panel" : "Open AI Panel"}
                        className={cn("transition-transform duration-200", activeTool && "rotate-180")}
                    >
                        <PanelRightOpen className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto min-w-0">
                    <div className="max-w-4xl mx-auto h-full">
                        <EditorCanvas note={note} onUpdate={saveNote} />
                    </div>
                </div>

                {/* Right Panel - AI Assistant */}
                <AnimatePresence mode="wait">
                    {activeTool && (
                        <AISidebarPanel
                            isOpen={true}
                            activeTool={activeTool}
                            onClose={() => setActiveTool(null)}
                            onToolChange={setActiveTool}
                            noteContent={noteContent}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
