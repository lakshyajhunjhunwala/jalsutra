import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';

// Read config directly from firebase-applet-config.json
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  measurementId: firebaseConfigData.measurementId || undefined,
};

// Initialize or retrieve Firebase app singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with specified database ID
const customDbId = firebaseConfigData.firestoreDatabaseId;
export const db: Firestore =
  customDbId && customDbId !== '(default)'
    ? getFirestore(app, customDbId)
    : getFirestore(app);

// Test connection on boot as mandated by Firestore guidelines
let isConnectedToFirestore = false;
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Attempting a server read to verify connectivity
    await getDocFromServer(doc(db, '_health', 'ping')).catch((err) => {
      // Permission denied or not-found still validates we reached the Firestore server!
      if (err?.code === 'unavailable' || err?.message?.includes('the client is offline')) {
        throw err;
      }
    });
    isConnectedToFirestore = true;
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline/unreachable:', error.message);
    }
    return false;
  }
}

export function getFirestoreConnectionStatus(): boolean {
  return isConnectedToFirestore;
}

// User Profile representation
export interface JalaSutraUser {
  uid: string;
  isAnonymous: boolean;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Auth State subscriber
export function onUserAuthStateChanged(callback: (user: JalaSutraUser | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        isAnonymous: firebaseUser.isAnonymous,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest Researcher' : 'Researcher'),
        photoURL: firebaseUser.photoURL,
      });
    } else {
      // Auto sign in anonymously so user has an active uid immediately for persistent history
      try {
        const cred = await signInAnonymously(auth);
        callback({
          uid: cred.user.uid,
          isAnonymous: true,
          email: null,
          displayName: 'Guest Researcher',
          photoURL: null,
        });
      } catch (err) {
        console.warn('Anonymous sign-in deferred:', err);
        callback(null);
      }
    }
  });
}

// Google Sign-in Upgrade
export async function signInWithGoogle(): Promise<JalaSutraUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return {
    uid: result.user.uid,
    isAnonymous: false,
    email: result.user.email,
    displayName: result.user.displayName || 'Researcher',
    photoURL: result.user.photoURL,
  };
}

// Sign out / reset to anonymous
export async function signOutUser(): Promise<void> {
  await signOut(auth);
  await signInAnonymously(auth);
}
