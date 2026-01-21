import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { Note, Folder, UserStats } from '@/store/types';

interface MarkdownDB extends DBSchema {
    notes: {
        key: string;
        value: Note;
        indexes: { 'folderId': string; 'updatedAt': number };
    };
    folders: {
        key: string;
        value: Folder;
        indexes: { 'parentId': string };
    };
    user: {
        key: string;
        value: UserStats;
    };
}

const DB_NAME = 'markdown-notes-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MarkdownDB>> | null = null;

export const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<MarkdownDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('notes')) {
                    const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                    notesStore.createIndex('folderId', 'folderId');
                    notesStore.createIndex('updatedAt', 'updatedAt');
                }
                if (!db.objectStoreNames.contains('folders')) {
                    const foldersStore = db.createObjectStore('folders', { keyPath: 'id' });
                    foldersStore.createIndex('parentId', 'parentId');
                }
                if (!db.objectStoreNames.contains('user')) {
                    db.createObjectStore('user', { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
};

// Data Access Layer Helpers
export const db = {
    notes: {
        getAll: async () => (await getDB()).getAll('notes'),
        get: async (id: string) => (await getDB()).get('notes', id),
        put: async (note: Note) => (await getDB()).put('notes', note),
        delete: async (id: string) => (await getDB()).delete('notes', id),
        getByFolder: async (folderId: string | null) => {
            // Since folderId can be null, we need to handle it. 
            // IDB indexes might not index nulls reliably depending on impl, but usually fine. 
            // Alternatively, we filter manually for small datasets or use a specific string for root.
            // For now, let's assume we can query.
            if (folderId === null) {
                // Get all and filter? Or use a special "root" index?
                // "root" folderId convention might be better, but let's try raw getAll (small scale).
                const all = await (await getDB()).getAll('notes');
                return all.filter(n => n.folderId === null);
            }
            return (await getDB()).getAllFromIndex('notes', 'folderId', folderId);
        }
    },
    folders: {
        getAll: async () => (await getDB()).getAll('folders'),
        put: async (folder: Folder) => (await getDB()).put('folders', folder),
        delete: async (id: string) => (await getDB()).delete('folders', id),
    },
    user: {
        get: async () => (await getDB()).get('user', 'current-user'),
        put: async (stats: UserStats) => (await getDB()).put('user', stats),
    }
};
