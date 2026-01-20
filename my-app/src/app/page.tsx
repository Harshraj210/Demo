"use client";

import { useRouter } from 'next/navigation';
import { useNotes } from '@/hooks/useNotes';
import { Plus, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const { notes, createNote, loading } = useNotes(); // Fetching root notes for now

  const handleCreateNote = async () => {
    const newNote = await createNote();
    router.push(`/notes/${newNote.id}`);
  };

  const handleOpenNote = (id: string) => {
    router.push(`/notes/${id}`);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Select a note from the sidebar to start writing.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading notes...</div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <motion.div
            variants={item}
            onClick={handleCreateNote}
            className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center text-muted-foreground transition-all group"
          >
            <div className="h-12 w-12 rounded-full bg-muted group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
              <Plus className="h-6 w-6 group-hover:text-primary transition-colors" />
            </div>
            <span className="font-medium group-hover:text-primary">Create New Note</span>
          </motion.div>

          {notes.map(note => (
            <motion.div
              variants={item}
              key={note.id}
              onClick={() => handleOpenNote(note.id)}
              className="aspect-[3/4] rounded-lg border bg-card p-4 hover:shadow-md transition-all cursor-pointer relative group flex flex-col"
            >
              <div className="flex-1 overflow-hidden relative">
                {/* Preview: shows first cell content roughly */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/90" />
                <p className="text-xs text-muted-foreground line-clamp-6 opacity-50 whitespace-pre-wrap">
                  {note.cells?.[0]?.content || "No content"}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold truncate pr-2 mb-1" title={note.title}>{note.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(note.updatedAt)} ago
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1.5 bg-background/80 backdrop-blur rounded-md shadow-sm border">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
