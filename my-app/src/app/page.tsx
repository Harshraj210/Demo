"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotes } from '@/hooks/useNotes';
import { useFolders } from '@/hooks/useFolders';
import { Plus, FileText, Search, Grid, List, MoreVertical, Copy, Trash2, Folder as FolderIcon, FolderPlus, Clock, ArrowLeft, Check, X, FilePlus } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

const TypewriterText = ({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) => (
    <motion.div
        className={cn("flex overflow-hidden", className)}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={{
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: {
                    staggerChildren: 0.1,
                    delayChildren: delay
                }
            },
            exit: {
                opacity: 0,
                transition: {
                    staggerChildren: 0.05,
                    staggerDirection: -1
                }
            }
        }}
    >
        {text.split("").map((char, index) => (
            <motion.span
                key={index}
                variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: {
                        opacity: 1,
                        scale: 1,
                        transition: { type: "spring", damping: 20, stiffness: 300 }
                    },
                    exit: {
                         opacity: 0,
                         scale: 0.5,
                         transition: { duration: 0.2 }
                    }
                }}
            >
                {char === " " ? "\u00A0" : char}
            </motion.span>
        ))}
    </motion.div>
);

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const folderId = searchParams.get('folder');

  // If no folderId and no view=folders, we show Recent Files (all notes)
  const isRecentView = !folderId && view !== 'folders';
  const isFoldersView = view === 'folders';
  const isFolderDetailView = !!folderId;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [sortOption, setSortOption] = useState<'alphabetical' | 'number' | 'date'>('date');

  const [inlineAdding, setInlineAdding] = useState<'note' | 'folder' | null>(null);
  const [inlineName, setInlineName] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Determine the context for useNotes: undefined for All (Global Search or Recent), folderId for specific folder
  const notesContextId = (isRecentView || debouncedSearchQuery) ? undefined : folderId;
  const { notes, createNote, deleteNote, copyNote, loading: notesLoading } = useNotes(notesContextId);
  const { folders, createFolder, deleteFolder, loading: foldersLoading } = useFolders();

  const isLoading = notesLoading || foldersLoading;

  const currentFolder = folders.find(f => f.id === folderId);
  
  const headingText = isRecentView ? "Recent Files" : isFoldersView ? "Folders" : (currentFolder?.name || "Folder");

  // Filter and Sort notes and folders
  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    let result = [...notes];
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(n =>
        n.title?.toLowerCase().includes(query) ||
        n.cells?.some(c => c.content?.toLowerCase().includes(query))
      );
    }
    if (sortOption === 'alphabetical') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortOption === 'number') {
      result.sort((a, b) => {
        const sizeA = a.cells?.reduce((acc, c) => acc + (c.content?.length || 0), 0) || 0;
        const sizeB = b.cells?.reduce((acc, c) => acc + (c.content?.length || 0), 0) || 0;
        return sizeB - sizeA; // Descending size
      });
    } else {
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return result;
  }, [notes, debouncedSearchQuery, sortOption]);

  const filteredFolders = useMemo(() => {
    if (!folders) return [];
    let result = [...folders];
    if (debouncedSearchQuery) {
      result = result.filter(f => f.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
    }
    if (sortOption === 'alphabetical') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    // Default sort for folders (Newest first if not alpha)
    if (sortOption !== 'alphabetical') {
       result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return result;
  }, [folders, debouncedSearchQuery, sortOption]);


  const handleInlineSubmit = async () => {
    const name = inlineName.trim();
    const type = inlineAdding;

    if (!name || !type) {
      setInlineAdding(null);
      setInlineName('');
      return;
    }

    // Immediate cleanup to prevent double-submission and hide input
    setInlineAdding(null);
    setInlineName('');

    try {
      if (type === 'folder') {
        await createFolder(name);
      } else if (type === 'note') {
        // Use current folder ID if we are in a folder detail view or root if not
        await createNote(name, folderId || null);
      }
    } catch (err) {
      console.error("Creation failed:", err);
    }
  };

  const handleInlineCancel = () => {
    setInlineAdding(null);
    setInlineName('');
  };

  const handleOpenNote = (id: string) => {
    router.push(`/notes/${id}`);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-background">
      <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 relative">
        <header className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 pl-12 md:pl-0 transition-[padding]">
              {isFolderDetailView && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/?view=folders')}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <motion.div whileHover={{ x: -2 }}>
                    <ArrowLeft className="h-5 w-5" />
                  </motion.div>
                </Button>
              )}
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white dark:drop-shadow-[0_0_20px_rgba(59,130,246,0.4)] min-h-[40px] flex items-center">
                 <AnimatePresence mode="wait">
                    <TypewriterText key={headingText} text={headingText} className="text-3xl font-extrabold" />
                 </AnimatePresence>
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">

              {isSearchOpen ? (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 240, opacity: 1 }}
                  className="relative flex items-center flex-1 sm:flex-initial"
                >
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!e.target.value) setDebouncedSearchQuery('');
                    }}
                    className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all pl-8 text-foreground"
                  />
                  <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      setDebouncedSearchQuery('');
                    }}
                    className="absolute right-2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="text-muted-foreground hover:text-foreground"><Search className="h-5 w-5" /></Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Grid className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                  <DropdownMenuItem onClick={() => setGridSize('small')} className="flex items-center justify-between">
                    Grid (Small) {gridSize === 'small' && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGridSize('medium')} className="flex items-center justify-between">
                    Grid (Medium) {gridSize === 'medium' && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGridSize('large')} className="flex items-center justify-between">
                    Grid (Large) {gridSize === 'large' && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                  <DropdownMenuItem onClick={() => setSortOption('alphabetical')} className="flex items-center justify-between">
                    Alphabetical {sortOption === 'alphabetical' && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('number')} className="flex items-center justify-between">
                    By Number {sortOption === 'number' && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('date')} className="flex items-center justify-between">
                    Date Added {sortOption === 'date' && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground border-b border-border dark:border-cyan-500/50 pb-2">
            <span className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors capitalize">
              {sortOption === 'date' ? <Clock size={12} className="text-blue-500" /> : null}
              {sortOption === 'alphabetical' ? 'A-Z' : sortOption === 'number' ? 'Size' : 'Date modified'}
            </span>
            <span>|</span>
            <span className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors text-xs opacity-60">
              {sortOption === 'alphabetical' ? 'Ascending' : 'Descending'}
            </span>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4 md:gap-6",
              gridSize === 'small' && "grid-cols-2 xs:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8",
              gridSize === 'medium' && "grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
              gridSize === 'large' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}
          >
            {/* Folders View Grid */}
            {isFoldersView && filteredFolders && (
              <>
                {/* Inline Folder Creation Removed - Direct creation used instead */}

                {filteredFolders.map(folder => (
                  folder && folder.id ? (
                  <div
                    key={folder.id}
                    onClick={() => router.push(`/?folder=${folder.id}`)}
                    className="relative group rounded-2xl p-[1px] overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] duration-300 shadow-sm hover:shadow-md bg-zinc-200 dark:bg-zinc-800"
                  >
                     {/* Moving Border Gradient - Hover Only */}
                     <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#3b82f6_50%,#0000_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#22d3ee_50%,#0000_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                     {/* Inner Card Content */}
                     <div className="relative h-full w-full rounded-2xl bg-white dark:bg-[#02040a] p-3 md:p-4 flex flex-col gap-3 group-hover:bg-zinc-50 dark:group-hover:bg-[#02040a] transition-colors"> 
                    
                      <div className="aspect-4/5 rounded-xl bg-transparent p-0 relative overflow-hidden flex flex-col items-center justify-center">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/60 dark:bg-black/40 backdrop-blur hover:bg-white/80 dark:hover:bg-black/60 text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          <FolderIcon className="w-[85%] h-[85%] text-blue-500/80 dark:text-white stroke-[1]" />
                        </div>
                      </div>
                      <div className="text-center px-1">
                        <h3 className="font-medium text-sm text-foreground truncate">{folder.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Folder</p>
                      </div>
                    </div>
                  </div>
                  ) : null
                ))}
              </>
            )}

            {/* Notes Grid (Recent or Folder Detail) */}
            {(isRecentView || isFolderDetailView) && (
              <>
                {/* Inline Note Creation Removed - Direct creation used instead */}
                {filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => handleOpenNote(note.id)}
                    className="relative group rounded-2xl p-[1px] overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] duration-300 shadow-sm hover:shadow-md bg-zinc-200 dark:bg-zinc-800"
                  >
                    {/* Moving Border Gradient - Hover Only */}
                    <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#3b82f6_50%,#0000_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#22d3ee_50%,#0000_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Inner Card Content */}
                    <div className="relative h-full w-full rounded-2xl bg-white dark:bg-[#0b101b] p-3 md:p-4 flex flex-col gap-3 group-hover:bg-zinc-50 dark:group-hover:bg-[#0b101b] transition-colors">
                      <div className="aspect-4/5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 p-4 relative overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/60 dark:bg-black/40 backdrop-blur hover:bg-white/80 dark:hover:bg-black/60 text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyNote(note, folderId || undefined); }} className="focus:bg-accent focus:text-accent-foreground">
                                <Copy className="h-4 w-4 mr-2" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="h-full w-full overflow-hidden font-mono text-[8px] leading-tight select-none pointer-events-none text-muted-foreground/50">
                          <div className="space-y-1">
                            {note.cells?.[0]?.content.split('\n').slice(0, 15).map((line, i) => (
                              <div key={i} className="truncate">{line || '\u00A0'}</div>
                            ))}
                            {!note.cells?.[0]?.content && (
                              <div className="flex items-center justify-center h-full opacity-20">
                                <FileText className="h-12 w-12" />
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Gradient slightly lighter for light mode */}
                        <div className="absolute inset-0 bg-linear-to-t from-white/80 via-transparent to-transparent dark:from-black/80 dark:via-transparent dark:to-transparent opacity-60" />
                      </div>
                      <div className="text-center px-1">
                        <h3 className="font-medium text-sm text-foreground truncate pr-2" title={note.title}>{note.title || 'Untitled'}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(note.createdAt, 'd MMM')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Empty States */}
            {((isRecentView || isFolderDetailView) && filteredNotes.length === 0 && !inlineAdding) && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-40 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4" />
                <p>No notes found</p>
              </div>
            )}
            {(isFoldersView && filteredFolders.length === 0 && !inlineAdding) && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-40 text-muted-foreground">
                <Plus className="h-12 w-12 mb-4" />
                <p>No folders created</p>
              </div>
            )}
          </div>
        )}
      </div>

        {/* Context-Aware FAB */}
        <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-8 right-8 z-50 pointer-events-auto"
        >
            <Button
            onClick={async () => {
                if (isFoldersView) {
                // Create Folder
                const name = window.prompt("Enter folder name:");
                if (name) {
                    await createFolder(name);
                    router.push(`/?view=folders`); // Refresh or stay
                }
                } else {
                // Create Note
                if (isSearchOpen) {
                    setSearchQuery('');
                }
                const newNote = await createNote("Untitled Note", folderId || undefined);
                if (newNote) {
                    router.push(`/notes/${newNote.id}`);
                }
                }
            }}
            className={cn(
                "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-colors",
                isFoldersView
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
            >
            {isFoldersView ? <FolderPlus className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </Button>
        </motion.div>
    </div>
  );
}



export default function Home() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
      <HomeContent />
    </React.Suspense>
  );
}


