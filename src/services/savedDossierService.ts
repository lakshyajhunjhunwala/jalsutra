import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase.ts';

export interface SavedDossierItem {
  id: string; // dossierId
  dossierId: string;
  title: string;
  savedAt: string;
  notes?: string;
}

const LOCAL_STORAGE_SAVED_DOSSIERS_KEY = 'jalasutra_saved_dossiers';

export async function saveDossierBookmark(
  userId: string,
  dossierId: string,
  title: string,
  notes?: string
): Promise<SavedDossierItem> {
  const item: SavedDossierItem = {
    id: dossierId,
    dossierId,
    title,
    savedAt: new Date().toISOString(),
    notes: notes || '',
  };

  const local = getLocalSavedDossiers();
  const updated = [item, ...local.filter((d) => d.dossierId !== dossierId)];
  saveLocalSavedDossiers(updated);

  if (userId) {
    try {
      await setDoc(doc(db, 'users', userId, 'saved_dossiers', dossierId), item);
    } catch (e) {
      console.warn('Firestore saveDossierBookmark deferred:', e);
    }
  }

  return item;
}

export async function removeSavedDossier(userId: string, dossierId: string): Promise<void> {
  const local = getLocalSavedDossiers().filter((d) => d.dossierId !== dossierId);
  saveLocalSavedDossiers(local);

  if (userId) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'saved_dossiers', dossierId));
    } catch (e) {
      console.warn('Firestore removeSavedDossier error:', e);
    }
  }
}

export async function getSavedDossiers(userId: string): Promise<SavedDossierItem[]> {
  const local = getLocalSavedDossiers();
  if (!userId) return local;

  try {
    const colRef = collection(db, 'users', userId, 'saved_dossiers');
    const snap = await getDocs(colRef);
    if (snap.empty) return local;

    const items: SavedDossierItem[] = [];
    snap.forEach((d) => items.push(d.data() as SavedDossierItem));
    saveLocalSavedDossiers(items);
    return items;
  } catch (e) {
    return local;
  }
}

export function onSavedDossiersSnapshot(
  userId: string,
  callback: (items: SavedDossierItem[]) => void
): () => void {
  if (!userId) {
    callback(getLocalSavedDossiers());
    return () => {};
  }

  try {
    const colRef = collection(db, 'users', userId, 'saved_dossiers');
    return onSnapshot(
      colRef,
      (snap) => {
        const items: SavedDossierItem[] = [];
        snap.forEach((d) => items.push(d.data() as SavedDossierItem));
        saveLocalSavedDossiers(items);
        callback(items);
      },
      () => {
        callback(getLocalSavedDossiers());
      }
    );
  } catch (e) {
    callback(getLocalSavedDossiers());
    return () => {};
  }
}

function getLocalSavedDossiers(): SavedDossierItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_DOSSIERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveLocalSavedDossiers(items: SavedDossierItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_SAVED_DOSSIERS_KEY, JSON.stringify(items));
  } catch (e) {}
}
