"use client";

import { useState } from 'react';
import { useNote } from '@/hooks/useNote';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { Loader2, Brain, MessageSquare, BarChart, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AISidebarPanel, AIToolType } from '@/components/ai/AISidebarPanel';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function NoteEditor({ id }: { id: string }) {
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
            <div className="h-14 border-b flex items-center justify-between px-4 bg-background/40 backdrop-blur-md shrink-0 z-10">
                <div className="font-medium truncate max-w-md" title={note.title}>
                    {note.title || "Untitled Note"}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted/50 rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTool('chat')}
                            className={cn("h-8 gap-2", activeTool === 'chat' && "bg-background shadow-sm text-primary")}
                        >
                            <MessageSquare className="h-4 w-4" />
                            <span className="hidden sm:inline">Chat</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTool('summarize')}
                            className={cn("h-8 gap-2", activeTool === 'summarize' && "bg-background shadow-sm text-primary")}
                        >
                            <Brain className="h-4 w-4" />
                            <span className="hidden sm:inline">Summarize</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTool('quiz')}
                            className={cn("h-8 gap-2", activeTool === 'quiz' && "bg-background shadow-sm text-primary")}
                        >
                            <BarChart className="h-4 w-4" />
                            <span className="hidden sm:inline">Quiz</span>
                        </Button>
                    </div>

                    <div className="w-px h-6 bg-border mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveTool(activeTool ? null : 'chat')}
                        title={activeTool ? "Close AI Panel" : "Open AI Panel"}
                    >
                        {activeTool ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
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
                            noteContent={noteContent}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
