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
    <div className="h-screen overflow-y-auto overflow-x-hidden">
      <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 relative">
        <header className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 pl-12 md:pl-0 transition-[padding]">
              {isFolderDetailView && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/?view=folders')}
                  className="h-8 w-8"
                >
                  <motion.div whileHover={{ x: -2 }}>
                    <ArrowLeft className="h-5 w-5" />
                  </motion.div>
                </Button>
              )}
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.4)] min-h-[40px] flex items-center">
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all pl-8"
                  />
                  <Search className="absolute left-2.5 h-4 w-4 text-white/40" />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      setDebouncedSearchQuery('');
                    }}
                    className="absolute right-2 text-white/40 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="text-white/60 hover:text-white"><Search className="h-5 w-5" /></Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white/60 hover:text-white"><Grid className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0a0a1a] border-white/10 text-white">
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
                  <Button variant="ghost" size="icon" className="text-white/60 hover:text-white"><MoreVertical className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0a0a1a] border-white/10 text-white">
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

          <div className="flex items-center gap-2 text-sm text-muted-foreground border-b border-white/5 pb-2">
            <span className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors capitalize">
              {sortOption === 'date' ? <Clock size={12} className="text-blue-400" /> : null}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
                    className="relative group rounded-2xl p-[1px] overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] duration-300"
                  >
                     {/* Moving Border Gradient */}
                     <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#22d3ee_50%,#0000_100%)] opacity-100" />
                    
                     {/* Inner Card Content */}
                     <div className="relative h-full w-full rounded-2xl bg-[#0b101b] p-4 flex flex-col gap-3 group-hover:bg-[#0b101b]/90 transition-colors"> 
                        {/* Note: using fixed bg color to match card theme from globals.css or hardcoded in page previously used white/3 which is transparent. To make the border visible we need opaque background OR mask. Using opaque card bg #0b101b (from globals dark --card) + small opacity for texture if needed? 
                        Let's use bg-black/90 or similar to allow *some* transparency but hide the gradient center. 
                        Actually, the user wants the border to move. If I use a solid background, the border is just the padding. 
                        */}
                    
                      <div className="aspect-4/5 rounded-xl bg-white/5 border border-white/5 p-4 relative overflow-hidden flex flex-col items-center justify-center">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/40 backdrop-blur hover:bg-black/60">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0a0a1a] border-cyan-400/20 text-white">
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                className="text-red-400 focus:text-red-300 focus:bg-red-950/30"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="p-6 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                          <FolderIcon className="h-12 w-12 opacity-80" />
                        </div>
                        <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-center px-1">
                        <h3 className="font-medium text-sm text-foreground/90 truncate">{folder.name}</h3>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">Folder</p>
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
                    className="relative group rounded-2xl p-[1px] overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] duration-300"
                  >
                    {/* Moving Border Gradient */}
                    <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#22d3ee_50%,#0000_100%)] opacity-100" />
                    
                    {/* Inner Card Content */}
                    <div className="relative h-full w-full rounded-2xl bg-[#0b101b] p-4 flex flex-col gap-3 group-hover:bg-[#0b101b]/90 transition-colors">
                      <div className="aspect-4/5 rounded-xl bg-white/5 border border-white/5 p-4 relative overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/40 backdrop-blur hover:bg-black/60">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0a0a1a] border-cyan-400/20">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyNote(note, folderId || undefined); }} className="text-white/70 focus:text-white">
                                <Copy className="h-4 w-4 mr-2" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="text-red-400 focus:text-red-300 focus:bg-red-950/30">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="h-full w-full opacity-40 overflow-hidden font-mono text-[8px] leading-tight select-none pointer-events-none text-cyan-100/50">
                          <div className="space-y-1">
                            {note.cells?.[0]?.content.split('\n').slice(0, 15).map((line, i) => (
                              <div key={i} className="truncate">{line || '\u00A0'}</div>
                            ))}
                            {!note.cells?.[0]?.content && (
                              <div className="flex items-center justify-center h-full opacity-10">
                                <FileText className="h-12 w-12" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60" />
                      </div>
                      <div className="text-center px-1">
                        <h3 className="font-medium text-sm text-foreground/90 truncate pr-2" title={note.title}>{note.title || 'Untitled'}</h3>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
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
              <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-40 text-white">
                <FileText className="h-12 w-12 mb-4" />
                <p>No notes found</p>
              </div>
            )}
            {(isFoldersView && filteredFolders.length === 0 && !inlineAdding) && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-40 text-white">
                <Plus className="h-12 w-12 mb-4" />
                <p>No folders created</p>
              </div>
            )}
          </div>
        )}

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
                // Direct creation for folders
                try {
                  const newFolder = await createFolder("Untitled Folder");
                  if (newFolder) {
                    router.push(`/?folder=${newFolder.id}`);
                  }
                } catch (error) {
                  console.error("Failed to create folder:", error);
                }
                setSearchQuery('');
              } else {
                // Direct creation for notes
                try {
                  const newNote = await createNote("Untitled Note", folderId || null);
                  if (newNote) {
                    router.push(`/notes/${newNote.id}`);
                  }
                } catch (error) {
                  console.error("Failed to create note:", error);
                }
              }
            }}
            size="lg"
            className="h-14 min-w-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] border-none transition-all flex items-center justify-center gap-2 px-4 group"
          >
            {isFoldersView ? (
              <>
                <FolderPlus className="h-6 w-6" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 font-medium whitespace-nowrap">Folder</span>
              </>
            ) : (
              <>
                <Plus className="h-6 w-6" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 font-medium whitespace-nowrap">Note</span>
              </>
            )}
          </Button>
        </motion.div>
      </div>
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


