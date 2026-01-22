"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { Note } from '@/store/types';

export function useNote(id: string) {
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchNote = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            if (!id) return;
            const fetched = await db.notes.get(id);
            if (fetched) {
                setNote(fetched);
            } else {
                setNote(null);
            }
        } catch (error) {
            console.error("Failed to fetch note:", error);
            setNote(null);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchNote(true);
    }, [fetchNote]);

    const saveNote = async (updatedNote: Note) => {
        // Determine if we should update updatedAt
        // For auto-save, we might want to debounce this outside, but here we just write.
        const toSave = { ...updatedNote, updatedAt: Date.now() };
        await db.notes.put(toSave);
        setNote(toSave);
    };

    return {
        note,
        loading,
        saveNote,
        refresh: fetchNote
    };
}
