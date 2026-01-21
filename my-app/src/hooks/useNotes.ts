"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { Note } from '@/store/types';
import { v4 as uuidv4 } from 'uuid';

export function useNotes(currentFolderId?: string | null) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotes = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            let fetched: Note[];
            if (currentFolderId === undefined) {
                fetched = await db.notes.getAll();
            } else {
                fetched = await db.notes.getByFolder(currentFolderId);
            }
            // Sort by updatedAt desc
            fetched.sort((a, b) => b.updatedAt - a.updatedAt);
            setNotes(fetched);
        } catch (error) {
            console.error("Failed to fetch notes:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [currentFolderId]);

    useEffect(() => {
        fetchNotes();

        const handleUpdate = () => fetchNotes(true); // Silent update on shared events
        window.addEventListener('app:notes-updated', handleUpdate);
        return () => window.removeEventListener('app:notes-updated', handleUpdate);
    }, [fetchNotes]);

    const createNote = async (title: string = 'Untitled Note', targetFolderId?: string | null) => {
        const newNote: Note = {
            id: uuidv4(),
            title,
            folderId: targetFolderId !== undefined ? targetFolderId : (currentFolderId ?? null),
            cells: [{ id: uuidv4(), type: 'markdown', content: '' }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        // Optimistic update
        if (newNote.folderId === (currentFolderId ?? null)) {
            setNotes(prev => [newNote, ...prev]);
        }

        await db.notes.put(newNote);
        window.dispatchEvent(new CustomEvent('app:notes-updated'));
        return newNote;
    };

    const updateNote = async (note: Note) => {
        const updated = { ...note, updatedAt: Date.now() };
        await db.notes.put(updated);
        setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
        window.dispatchEvent(new CustomEvent('app:notes-updated'));
    };

    const deleteNote = async (id: string) => {
        await db.notes.delete(id);
        setNotes(prev => prev.filter(n => n.id !== id));
        window.dispatchEvent(new CustomEvent('app:notes-updated'));
    };

    const copyNote = async (originalNote: Note, targetFolderId: string | null = null) => {
        const newNote: Note = {
            ...originalNote,
            id: uuidv4(),
            folderId: targetFolderId,
            title: `${originalNote.title} (Copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cells: originalNote.cells.map(cell => ({ ...cell, id: uuidv4() }))
        };
        await db.notes.put(newNote);
        await fetchNotes();
        window.dispatchEvent(new CustomEvent('app:notes-updated'));
        return newNote;
    };

    return {
        notes,
        loading,
        createNote,
        updateNote,
        deleteNote,
        copyNote,
        refresh: fetchNotes
    };
}
