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
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<MarkdownDB>> | null = null;

export const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<MarkdownDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                // Notes Store
                if (!db.objectStoreNames.contains('notes')) {
                    const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                    notesStore.createIndex('folderId', 'folderId');
                    notesStore.createIndex('updatedAt', 'updatedAt');
                } else {
                    const notesStore = transaction.objectStore('notes');
                    if (!notesStore.indexNames.contains('folderId')) {
                        notesStore.createIndex('folderId', 'folderId');
                    }
                    if (!notesStore.indexNames.contains('updatedAt')) {
                        notesStore.createIndex('updatedAt', 'updatedAt');
                    }
                }

                // Folders Store
                if (!db.objectStoreNames.contains('folders')) {
                    const foldersStore = db.createObjectStore('folders', { keyPath: 'id' });
                    foldersStore.createIndex('parentId', 'parentId');
                } else {
                    const foldersStore = transaction.objectStore('folders');
                    if (!foldersStore.indexNames.contains('parentId')) {
                        foldersStore.createIndex('parentId', 'parentId');
                    }
                }

                // User Store
                if (!db.objectStoreNames.contains('user')) {
                    db.createObjectStore('user', { keyPath: 'id' });
                }
            },
            blocked() {
                console.error("Database upgrade blocked. Please close other tabs of this application.");
            },
            blocking() {
                console.warn("Database blocking subsequent connections. Closing...");
                dbPromise?.then(db => db.close());
                dbPromise = null;
            },
            terminated() {
                 console.error("Database connection terminated.");
                 dbPromise = null;
            }
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
            const dbInstance = await getDB();
            // Robust fallback: Get all and filter in memory to ignore missing indexes
            const all = await dbInstance.getAll('notes');
            if (!folderId) {
                return all.filter(n => !n.folderId);
            }
            return all.filter(n => n.folderId === folderId);
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
