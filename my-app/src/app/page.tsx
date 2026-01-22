"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotes } from '@/hooks/useNotes';
import { useFolders } from '@/hooks/useFolders';
import { Plus, FileText, Search, Grid, MoreVertical, Copy, Trash2, FolderPlus, Clock, ArrowLeft, Check, X } from 'lucide-react';
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

  const notesContextId = (isRecentView || isFoldersView || debouncedSearchQuery) ? undefined : folderId;
  const { notes, createNote, deleteNote, copyNote, loading: notesLoading } = useNotes(notesContextId);
  const { folders, createFolder, deleteFolder, loading: foldersLoading } = useFolders();

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!notes) return counts;
    notes.forEach(note => {
      if (note.folderId) {
        counts[note.folderId] = (counts[note.folderId] || 0) + 1;
      }
    });
    return counts;
  }, [notes]);

  const isLoading = notesLoading || foldersLoading;
  const currentFolder = folders.find(f => f.id === folderId);
  const headingText = isRecentView ? "Recent Files" : isFoldersView ? "Folders" : (currentFolder?.name || "Folder");

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
        return sizeB - sizeA;
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
    } else {
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return result;
  }, [folders, debouncedSearchQuery, sortOption]);

  const handleOpenNote = (id: string) => {
    router.push(`/notes/${id}`);
  };

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-background">
      <div className="p-4 md:p-8 pb-32 relative">
        <header className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 pl-12 md:pl-0">
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
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white dark:drop-shadow-[0_0_20px_rgba(34,211,238,0.4)] min-h-[40px] flex items-center">
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all pl-8 text-foreground"
                  />
                  <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
                  <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setDebouncedSearchQuery(''); }} className="absolute right-2 text-muted-foreground hover:text-foreground">
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
                <DropdownMenuContent align="end">
                  {['small', 'medium', 'large'].map((size) => (
                    <DropdownMenuItem key={size} onClick={() => setGridSize(size as any)} className="flex items-center justify-between capitalize">
                      Grid ({size}) {gridSize === size && <Check className="h-4 w-4 ml-2" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOption('alphabetical')}>Alphabetical {sortOption === 'alphabetical' && <Check className="h-4 w-4 ml-2" />}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('number')}>By Size {sortOption === 'number' && <Check className="h-4 w-4 ml-2" />}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('date')}>Date Added {sortOption === 'date' && <Check className="h-4 w-4 ml-2" />}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-b border-border dark:border-cyan-500/50 pb-2">
            <span className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors capitalize">
              {sortOption === 'date' && <Clock size={12} className="text-cyan-500" />}
              {sortOption === 'alphabetical' ? 'A-Z' : sortOption === 'number' ? 'Size' : 'Date modified'}
            </span>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <div className={cn(
            "grid gap-4 md:gap-6",
            gridSize === 'small' && "grid-cols-2 xs:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8",
            gridSize === 'medium' && "grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
            gridSize === 'large' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {isFoldersView && filteredFolders.map(folder => (
              folder?.id && (
                <div key={folder.id} onClick={() => router.push(`/?folder=${folder.id}`)} className="group relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                  <div className="relative w-full aspect-4/3 mb-4 perspective-[1000px] flex items-center justify-center">
                    <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/40 backdrop-blur text-white rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="text-red-500"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {/* Folder 3D Body */}
                    <div className="absolute w-[80%] h-[70%] bg-linear-to-br from-cyan-600 to-cyan-800 rounded-xl rounded-tl-none shadow-inner transition-transform duration-500">
                      <div className="absolute -top-[15%] left-0 w-[40%] h-[20%] bg-cyan-600 rounded-t-lg" />
                    </div>
                    {/* Animated Paper */}
                    <div className="absolute w-[70%] h-[60%] bg-white/90 rounded-md shadow-sm transition-transform duration-500 ease-out group-hover:-translate-y-8 z-0" />
                    {/* Animated Front Flap */}
                    <div className="absolute w-[80%] h-[70%] bg-linear-to-br from-cyan-400 to-cyan-500 rounded-xl shadow-lg border-t border-white/20 transition-all duration-500 ease-in-out origin-bottom group-hover:transform-[rotateX(-45deg)] group-hover:brightness-110 z-10">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-[2px] bg-black/30 rounded-full" />
                    </div>
                  </div>
                  <div className="text-center w-full px-2">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight truncate">{folder.name}</h3>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-0.5">
                      {folderCounts[folder.id] || 0} {folderCounts[folder.id] === 1 ? 'File' : 'Files'}
                    </p>
                  </div>
                </div>
              )
            ))}

            {(isRecentView || isFolderDetailView) && filteredNotes.map(note => (
              <div key={note.id} onClick={() => handleOpenNote(note.id)} className="relative group rounded-[32px] overflow-hidden cursor-pointer transition-all hover:scale-[1.02] duration-300 bg-[#050505] border-[1.5px] border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] aspect-3/4 flex flex-col">
                <div className="flex-1 w-full p-6 flex flex-col items-center justify-center relative">
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"><MoreVertical className="h-5 w-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyNote(note, folderId || undefined); }}><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="text-red-500"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex-1 flex items-center justify-center w-full">
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                      <FileText className="relative h-24 w-24 text-cyan-400 stroke-[0.8] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    </div>
                  </div>
                  <div className="w-full text-center mt-4">
                    <h3 className="font-bold text-xl text-white tracking-tight mb-1 truncate px-2">{note.title || 'Untitled Project'}</h3>
                    <p className="text-xs text-zinc-500 font-medium">Last edited {format(note.createdAt, 'd MMM, yyyy')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <motion.div initial={{ scale: 0, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} whileHover={{ scale: 1.05 }} className="fixed bottom-8 right-8 z-50">
        <Button onClick={async () => {
          if (isFoldersView) {
            const name = window.prompt("Enter folder name:");
            if (name) await createFolder(name);
          } else {
            const newNote = await createNote("Untitled Note", folderId || undefined);
            if (newNote) router.push(`/notes/${newNote.id}`);
          }
        }} className="h-14 w-14 rounded-full shadow-lg bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center">
          {isFoldersView ? <FolderPlus className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </motion.div>
    </div>
  );
}

export default function Home() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div></div>}>
      <HomeContent />
    </React.Suspense>
  );
}