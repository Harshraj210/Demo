"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { Note } from '@/store/types';

export function useNote(id: string) {
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNote = useCallback(async () => {
        setNote(null);
        setError(null);
        setLoading(true);

        try {
            if (!id) {
                setError("Invalid ID");
                setLoading(false);
                return;
            }

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Request timed out")), 5000)
            );

            // Race the DB fetch against the timeout
            const fetched = await Promise.race([
                db.notes.get(id),
                timeoutPromise
            ]) as Note | undefined;

            if (!fetched) {
                setError("Note not found");
                setNote(null);
            } else {
                setNote(fetched);
            }
        } catch (err: any) {
            console.error("Failed to fetch note:", err);
            setError(err.message || "Failed to load note");
            setNote(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            setNote(null);
            setError(null);
            setLoading(true);
            
            try {
                if (!id) {
                    if (isMounted) {
                        setError("Invalid ID");
                        setLoading(false);
                    }
                    return;
                }

                // Create a timeout promise
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Request timed out")), 5000)
                );

                // Race the DB fetch against the timeout
                const fetched = await Promise.race([
                    db.notes.get(id),
                    timeoutPromise
                ]) as Note | undefined;

                if (isMounted) {
                    if (!fetched) {
                        setError("Note not found");
                        setNote(null);
                    } else {
                        setNote(fetched);
                    }
                }
            } catch (err: any) {
                console.error("Failed to fetch note:", err);
                if (isMounted) {
                    setError(err.message || "Failed to load note");
                    setNote(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [id]);

    const saveNote = async (updatedNote: Note) => {
        try {
            const toSave = { ...updatedNote, updatedAt: Date.now() };
            await db.notes.put(toSave);
            setNote(toSave);
        } catch (err) {
            console.error("Failed to save note:", err);
            // Optionally set error here if we want to show save errors
        }
    };

    return {
        note,
        loading,
        error,
        saveNote,
        refresh: fetchNote
    };
}
