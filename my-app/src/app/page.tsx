"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotes } from '@/hooks/useNotes';
import { useFolders } from '@/hooks/useFolders';
import { Plus, FileText, Search, Grid, MoreVertical, Copy, Trash2, FolderPlus, ArrowLeft, Check, X, AlertTriangle } from 'lucide-react';
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

const SmallGridIcon = ({ active }: { active?: boolean }) => (
  <div className={cn("grid grid-cols-3 gap-[2px] w-3.5 h-3.5", active ? "text-cyan-400" : "text-zinc-500")}>
    {[...Array(9)].map((_, i) => (
      <div key={i} className="bg-current rounded-[0.5px]" />
    ))}
  </div>
);

const MediumGridIcon = ({ active }: { active?: boolean }) => (
  <div className={cn("grid grid-cols-2 gap-[2px] w-3.5 h-3.5", active ? "text-cyan-400" : "text-zinc-500")}>
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-current rounded-[0.5px]" />
    ))}
  </div>
);

const LargeGridIcon = ({ active }: { active?: boolean }) => (
  <div className={cn("grid grid-cols-1 gap-[2px] w-3.5 h-3.5", active ? "text-cyan-400" : "text-zinc-500")}>
    {[...Array(2)].map((_, i) => (
      <div key={i} className="bg-current rounded-[0.5px]" />
    ))}
  </div>
);

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

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const gridMenuRef = useRef<HTMLDivElement>(null);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteRequest, setDeleteRequest] = useState<{ id: string, type: 'folder' | 'note', title: string } | null>(null);
  const [hoveredDeleteId, setHoveredDeleteId] = useState<string | null>(null);
  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
      if (gridMenuRef.current && !gridMenuRef.current.contains(event.target as Node)) {
        setIsGridMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleButtonMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

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
              <h1 className="text-3xl font-extrabold tracking-tight !text-black dark:!text-white dark:drop-shadow-[0_0_20px_rgba(34,211,238,0.4)] min-h-[40px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={headingText}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl font-extrabold !text-black dark:!text-white"
                  >
                    {headingText}
                  </motion.span>
                </AnimatePresence>
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-1 justify-end h-10">
              <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes border-shimmer {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
                .shimmer-border {
                  background: linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.5) 50%, transparent 100%);
                  background-size: 200% 100%;
                  animation: border-shimmer 2s infinite linear;
                }
              `}} />

              <motion.div
                layout
                className={cn(
                  "relative flex items-center h-full rounded-xl transition-all duration-500 group overflow-hidden",
                  isSearchOpen ? "flex-1 sm:flex-initial sm:w-64 bg-white/5 backdrop-blur-lg border border-white/5" : "w-10 bg-transparent"
                )}
              >
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={cn(
                    "p-2.5 transition-colors relative z-10",
                    isSearchFocused ? "text-cyan-400" : "text-muted-foreground"
                  )}
                >
                  <Search className={cn("h-5 w-5", isSearchFocused && "animate-pulse")} />
                </button>
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: '100%', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="flex items-center flex-1 h-full pr-8"
                    >
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className="w-full bg-transparent border-none text-sm focus:outline-none transition-all text-foreground font-medium placeholder:text-zinc-500/50 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                      />
                      <button
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setDebouncedSearchQuery(''); }}
                        className="absolute right-2 text-muted-foreground hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Expanding Shimmer Border */}
                <motion.div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-0.5",
                    isSearchFocused ? "shimmer-border bg-cyan-500" : "bg-cyan-500/20"
                  )}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isSearchFocused ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "circOut" }}
                />
              </motion.div>

              <div className="relative group" ref={gridMenuRef}>
                <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
                  onMouseMove={handleButtonMouseMove}
                  className="text-muted-foreground hover:text-foreground relative z-10 overflow-hidden"
                >
                  <Grid className="h-5 w-5" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: `radial-gradient(40px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(34, 211, 238, 0.2), transparent)`
                    }}
                  />
                </Button>

                <AnimatePresence>
                  {isGridMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="absolute top-full right-0 mt-3 w-40 bg-[#050505]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(6,182,212,0.1)] overflow-hidden z-110"
                    >
                      <div className="p-1 space-y-0.5">
                        {[
                          { id: 'small', label: 'Small', icon: (active: boolean) => <SmallGridIcon active={active} /> },
                          { id: 'medium', label: 'Medium', icon: (active: boolean) => <MediumGridIcon active={active} /> },
                          { id: 'large', label: 'Large', icon: (active: boolean) => <LargeGridIcon active={active} /> }
                        ].map((size) => (
                          <button
                            key={size.id}
                            onClick={() => {
                              setGridSize(size.id as 'small' | 'medium' | 'large');
                              setIsGridMenuOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group/item",
                              gridSize === size.id ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                            )}
                          >
                            <span className={cn(
                              "flex items-center gap-2 transition-all",
                              gridSize === size.id && "drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                            )}>
                              {size.icon(gridSize === size.id)}
                              {size.label}
                            </span>
                            {gridSize === size.id && (
                              <motion.div layoutId="gridCheck" initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative group" ref={sortMenuRef}>
                <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10" />
                <AnimatePresence>
                  {!isSortMenuOpen && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        boxShadow: [
                          "0 0 0px rgba(6,182,212,0)",
                          "0 0 15px rgba(6,182,212,0.4)",
                          "0 0 0px rgba(6,182,212,0)"
                        ]
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        opacity: { duration: 0.2 },
                        boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                      }}
                      className="px-3 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/30 hidden sm:flex items-center backdrop-blur-sm shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                    >
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                        {sortOption}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  onMouseMove={handleButtonMouseMove}
                  className="text-muted-foreground hover:text-foreground relative z-10 overflow-hidden"
                >
                  <motion.div
                    animate={{ rotate: isSortMenuOpen ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </motion.div>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: `radial-gradient(40px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(34, 211, 238, 0.2), transparent)`
                    }}
                  />
                </Button>

                <AnimatePresence>
                  {isSortMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, x: 20, y: -20, originX: 1, originY: 0 }}
                      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 20, y: -20 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-[#050505]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-100"
                    >
                      <div className="p-1.5 space-y-1">
                        {[
                          { id: 'alphabetical', label: 'Alphabetical', icon: 'A-Z' },
                          { id: 'number', label: 'By Size', icon: 'Size' },
                          { id: 'date', label: 'Date Added', icon: 'Date' }
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              setSortOption(option.id as 'alphabetical' | 'number' | 'date');
                              setIsSortMenuOpen(false);
                            }}
                            className="w-full relative group flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors overflow-hidden"
                          >
                            {/* Sliding Highlight */}
                            <motion.div
                              className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100"
                              initial={false}
                              whileHover={{ x: [-100, 0] }}
                              transition={{ duration: 0.3 }}
                            />

                            <span className={cn(
                              "relative z-10 font-medium transition-all duration-300",
                              sortOption === option.id ? "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "text-zinc-400 group-hover:text-cyan-400"
                            )}>
                              {option.label}
                            </span>

                            <div className="relative z-10 flex items-center gap-2">
                              <AnimatePresence mode="wait">
                                {sortOption === option.id && (
                                  <motion.div
                                    key="check"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                  >
                                    <Check className="h-4 w-4 text-cyan-500 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-b border-border dark:border-cyan-500/10 pb-2">
            <motion.div
              animate={{
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center gap-1.5"
            >
              <div className="w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-400">
                Active View: <span className="text-cyan-900 dark:text-cyan-400">{headingText}</span>
              </span>
            </motion.div>
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
            <AnimatePresence mode="popLayout">
              {isFoldersView && (
                <>
                  {isCreatingFolder && (
                    <motion.div
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="group relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
                    >
                      <div className="relative w-full aspect-4/3 mb-4 perspective-[1000px] flex items-center justify-center">
                        {/* Folder 3D Body */}
                        <div className="absolute w-[80%] h-[70%] bg-linear-to-br from-cyan-600 to-cyan-800 rounded-xl rounded-tl-none shadow-inner transition-transform duration-500">
                          <div className="absolute -top-[15%] left-0 w-[40%] h-[20%] bg-cyan-600 rounded-t-lg" />
                        </div>
                        {/* Animated Paper */}
                        <div className="absolute w-[70%] h-[60%] bg-white/90 rounded-md shadow-sm z-0" />
                        {/* Animated Front Flap */}
                        <div className="absolute w-[80%] h-[70%] bg-linear-to-br from-cyan-400 to-cyan-500 rounded-xl shadow-lg border-t border-white/20 z-10">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-[2px] bg-black/30 rounded-full" />
                        </div>
                      </div>
                      <div className="text-center w-full px-2">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Folder Name"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onBlur={() => {
                            setIsCreatingFolder(false);
                            setNewFolderName('');
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && newFolderName.trim()) {
                              await createFolder(newFolderName.trim());
                              setIsCreatingFolder(false);
                              setNewFolderName('');
                            } else if (e.key === 'Escape') {
                              setIsCreatingFolder(false);
                              setNewFolderName('');
                            }
                          }}
                          className="w-full bg-transparent text-center font-bold text-lg text-zinc-900 dark:text-white tracking-tight border-b-2 border-cyan-500/50 shadow-[0_4px_10px_-4px_rgba(34,211,238,0.5)] focus:outline-none focus:border-cyan-500 placeholder:text-zinc-500/50 transition-all duration-300"
                        />
                      </div>
                    </motion.div>
                  )}
                  {filteredFolders.length === 0 && !isCreatingFolder ? (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="col-span-full flex flex-col items-center justify-center p-12 text-center"
                    >
                      <div className="w-24 h-24 bg-zinc-900/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-cyan-500/20">
                        <FolderPlus className="w-10 h-10 text-zinc-600" />
                      </div>
                      <h3 className="text-lg font-bold text-zinc-400 mb-2">No folders yet</h3>
                      <p className="text-sm text-zinc-500 max-w-xs">Create a folder to organize your notes and keep things tidy.</p>
                      <Button
                         variant="ghost" 
                         onClick={() => setIsCreatingFolder(true)}
                         className="mt-6 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                       <Plus className="w-4 h-4 mr-2" />
                       Create Folder
                      </Button>
                    </motion.div>
                  ) : (
                    filteredFolders.map(folder => (
                      folder?.id && (
                        <motion.div
                          layout
                          key={folder.id}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          onClick={() => router.push(`/?folder=${folder.id}`)}
                          className={cn(
                            "group relative flex flex-col items-center justify-center cursor-pointer transition-all duration-500",
                            hoveredDeleteId === folder.id && "shadow-[inset_0_0_25px_rgba(239,68,68,0.15)] rounded-2xl animate-pulse"
                          )}
                        >
                          <div className="relative w-full aspect-4/3 mb-4 perspective-[1000px] flex items-center justify-center">
                            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/40 backdrop-blur text-white rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onMouseEnter={() => setHoveredDeleteId(folder.id)}
                                    onMouseLeave={() => setHoveredDeleteId(null)}
                                    onClick={(e) => { e.stopPropagation(); setDeleteRequest({ id: folder.id, type: 'folder', title: folder.name }); }}
                                    className="text-red-500 hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
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
                        </motion.div>
                      )
                    ))
                  )}
                </>
              )}

              {(isRecentView || isFolderDetailView) && (
                filteredNotes.length === 0 ? (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-full flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="w-24 h-24 bg-zinc-900/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-cyan-500/20">
                      <FileText className="w-10 h-10 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-400 mb-2">
                       {debouncedSearchQuery ? 'No matching notes' : 'No notes yet'}
                    </h3>
                    <p className="text-sm text-zinc-500 max-w-xs">
                       {debouncedSearchQuery ? 'Try adjusting your search query.' : 'Create a new note to get started with your ideas.'}
                    </p>
                    {!debouncedSearchQuery && (
                      <Button
                        variant="ghost"
                        onClick={async () => {
                           const newNote = await createNote("Untitled Note", folderId || undefined);
                           if (newNote) router.push(`/notes/${newNote.id}`);
                        }}
                        className="mt-6 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                         <Plus className="w-4 h-4 mr-2" />
                         Create Note
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  filteredNotes.map(note => (
                    <motion.div
                      layout
                      key={note.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={() => handleOpenNote(note.id)}
                      className={cn(
                        "relative group rounded-[32px] overflow-hidden cursor-pointer transition-all hover:scale-[1.02] duration-500 bg-[#050505] border-[1.5px] border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] aspect-3/4 flex flex-col",
                        hoveredDeleteId === note.id && "border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.3)] animate-pulse"
                      )}
                    >
                      <div className="flex-1 w-full p-6 flex flex-col items-center justify-center relative">
                        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"><MoreVertical className="h-5 w-5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyNote(note, folderId || undefined); }}><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                              <DropdownMenuItem
                                onMouseEnter={() => setHoveredDeleteId(note.id)}
                                onMouseLeave={() => setHoveredDeleteId(null)}
                                onClick={(e) => { e.stopPropagation(); setDeleteRequest({ id: note.id, type: 'note', title: note.title || 'Untitled Project' }); }}
                                className="text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
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
                    </motion.div>
                  ))
                )
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {deleteRequest && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setDeleteRequest(null); setHoveredDeleteId(null); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md bg-[#050505] border border-red-500/30 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(239,68,68,0.1)] overflow-hidden"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (deleteRequest.type === 'folder') deleteFolder(deleteRequest.id);
                  else deleteNote(deleteRequest.id);
                  setDeleteRequest(null);
                  setHoveredDeleteId(null);
                } else if (e.key === 'Escape') {
                  setDeleteRequest(null);
                  setHoveredDeleteId(null);
                }
              }}
            >
              <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                  <div className="relative h-20 w-20 flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-full">
                    <AlertTriangle className="h-10 w-10 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  </div>
                </div>

                <h2 className="text-2xl font-black text-white px-2 mb-2 tracking-tight">
                  Destroy this {deleteRequest.type}?
                </h2>
                <p className="text-zinc-500 text-sm mb-8 px-4 leading-relaxed">
                  You are about to delete <span className="text-zinc-300 font-bold">&quot;{deleteRequest.title}&quot;</span>. This action is irreversible and will purge all associated data.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={() => {
                      if (deleteRequest.type === 'folder') deleteFolder(deleteRequest.id);
                      else deleteNote(deleteRequest.id);
                      setDeleteRequest(null);
                      setHoveredDeleteId(null);
                    }}
                    className="flex-1 relative group h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl overflow-hidden transition-all active:scale-95"
                  >
                    <div className="absolute inset-0 shimmer-border bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">Confirm Delete</span>
                  </button>
                  <Button
                    variant="ghost"
                    onClick={() => { setDeleteRequest(null); setHoveredDeleteId(null); }}
                    className="flex-1 h-12 rounded-2xl border border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-zinc-400 hover:text-cyan-400 transition-all font-bold"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ scale: 0, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} whileHover={{ scale: 1.05 }} className="fixed bottom-8 right-8 z-50">
        <Button onClick={async () => {
          if (isFoldersView) {
            setIsCreatingFolder(true);
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