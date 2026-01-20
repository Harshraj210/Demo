"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { Folder } from '@/store/types';
import { v4 as uuidv4 } from 'uuid';

export function useFolders() {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFolders = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const fetched = await db.folders.getAll();
            setFolders(fetched);
        } catch (error) {
            console.error("Failed to fetch folders:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFolders();

        const handleUpdate = () => fetchFolders(true); // Silent update on shared events
        window.addEventListener('app:folders-updated', handleUpdate);
        return () => window.removeEventListener('app:folders-updated', handleUpdate);
    }, [fetchFolders]);

    const createFolder = async (name: string, parentId: string | null = null) => {
        const newFolder: Folder = {
            id: uuidv4(),
            name,
            parentId,
            createdAt: Date.now(),
        };
        // Optimistic update
        setFolders(prev => [newFolder, ...prev]);

        await db.folders.put(newFolder);
        window.dispatchEvent(new CustomEvent('app:folders-updated'));
        return newFolder;
    };

    const deleteFolder = async (id: string) => {
        await db.folders.delete(id);
        await fetchFolders();
        window.dispatchEvent(new CustomEvent('app:folders-updated'));
    };

    const updateFolder = async (folder: Folder) => {
        await db.folders.put(folder);
        await fetchFolders();
        window.dispatchEvent(new CustomEvent('app:folders-updated'));
    };

    return {
        folders,
        loading,
        createFolder,
        deleteFolder,
        updateFolder,
        refresh: fetchFolders
    };
}
