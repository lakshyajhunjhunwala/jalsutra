import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.ts';

export interface SearchRecord {
  id: string; // searchId
  query: string;
  timestamp: string;
  createdAt: string;
  category?: 'research' | 'atlas' | 'dossier' | 'general';
}

const LOCAL_STORAGE_SEARCH_HISTORY_KEY = 'jalasutra_search_history_records';

/**
 * Adds a search inquiry to Search History (Firestore + Local Mirror).
 * Automatically removes older duplicates so the latest query stays at the top.
 */
export async function addSearchRecord(
  userId: string,
  searchQuery: string,
  category: 'research' | 'atlas' | 'dossier' | 'general' = 'research'
): Promise<SearchRecord | null> {
  const trimmed = searchQuery.trim();
  if (!trimmed) return null;

  const searchId = `search_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const record: SearchRecord = {
    id: searchId,
    query: trimmed,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: now,
    category,
  };

  // Local storage update
  const local = getLocalSearchHistory();
  // Filter out exact duplicate query strings so list is clean
  const updated = [record, ...local.filter((r) => r.query.toLowerCase() !== trimmed.toLowerCase())].slice(0, 40);
  saveLocalSearchHistory(updated);

  // Firestore update
  if (userId) {
    try {
      const docRef = doc(db, 'users', userId, 'search_history', searchId);
      await setDoc(docRef, record);
    } catch (err) {
      console.warn('Firestore addSearchRecord deferred:', err);
    }
  }

  return record;
}

/**
 * Retrieves all search history records.
 */
export async function getSearchHistory(userId: string): Promise<SearchRecord[]> {
  const local = getLocalSearchHistory();
  if (!userId) return local;

  try {
    const colRef = collection(db, 'users', userId, 'search_history');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return local;

    const items: SearchRecord[] = [];
    snapshot.forEach((d) => {
      items.push(d.data() as SearchRecord);
    });

    saveLocalSearchHistory(items);
    return items;
  } catch (err) {
    console.warn('Firestore getSearchHistory fallback:', err);
    return local;
  }
}

/**
 * Real-time listener for search history.
 */
export function onSearchHistorySnapshot(
  userId: string,
  callback: (records: SearchRecord[]) => void
): () => void {
  if (!userId) {
    callback(getLocalSearchHistory());
    return () => {};
  }

  try {
    const colRef = collection(db, 'users', userId, 'search_history');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const items: SearchRecord[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as SearchRecord);
        });
        saveLocalSearchHistory(items);
        callback(items);
      },
      (err) => {
        console.warn('Search history snapshot error, using local:', err);
        callback(getLocalSearchHistory());
      }
    );
  } catch (e) {
    callback(getLocalSearchHistory());
    return () => {};
  }
}

/**
 * Deletes ONLY the selected search history item.
 * NEVER touches chats, messages, or user data!
 */
export async function deleteSearchRecord(userId: string, searchId: string): Promise<void> {
  // Local deletion
  const local = getLocalSearchHistory().filter((r) => r.id !== searchId);
  saveLocalSearchHistory(local);

  // Firestore deletion
  if (userId) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'search_history', searchId));
    } catch (err) {
      console.warn('Firestore deleteSearchRecord error:', err);
    }
  }
}

/**
 * Clears ALL search history records.
 * NEVER deletes chats, conversations, messages, or user account!
 */
export async function clearSearchHistory(userId: string): Promise<void> {
  // Local clear
  saveLocalSearchHistory([]);

  // Firestore batch clear
  if (userId) {
    try {
      const colRef = collection(db, 'users', userId, 'search_history');
      const snap = await getDocs(colRef);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.warn('Firestore clearSearchHistory error:', err);
    }
  }
}

// ============ Local Storage Helpers ============

function getLocalSearchHistory(): SearchRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SEARCH_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  // Default illustrative research items if fresh session
  return [
    {
      id: 'search-init-1',
      query: 'Sudarshana Dam Girnar',
      timestamp: 'Today',
      createdAt: new Date().toISOString(),
      category: 'research',
    },
    {
      id: 'search-init-2',
      query: 'Ashokan Pillar Edict VII well network',
      timestamp: 'Today',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      category: 'research',
    },
    {
      id: 'search-init-3',
      query: 'Kallanai Grand Anicut shifting sand',
      timestamp: 'Yesterday',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      category: 'research',
    },
  ];
}

function saveLocalSearchHistory(records: SearchRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_SEARCH_HISTORY_KEY, JSON.stringify(records));
  } catch (e) {}
}
