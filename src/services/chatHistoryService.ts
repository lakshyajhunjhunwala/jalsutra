import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.ts';

export interface ChatSession {
  id: string; // chat_id
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  roleId?: 'historian' | 'structural_engineer' | 'field_hydrologist';
  messageCount: number;
}

export interface ChatMessageRecord {
  id: string; // message_id
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  createdAt: string;
  modelUsed?: string;
  searchQueries?: string[];
  groundingSources?: Array<{ title: string; uri: string; type?: 'web' | 'maps'; snippet?: string }>;
}

const LOCAL_STORAGE_CHATS_KEY = 'jalasutra_saved_chats_meta';
const LOCAL_STORAGE_MESSAGES_PREFIX = 'jalasutra_chat_messages_';

/**
 * Intelligent automatic title generator from the user's first prompt.
 * Converts "Tell me about ancient dams in Rajasthan" -> "Ancient Dams in Rajasthan"
 * Converts "Explain Ashoka's inscriptions" -> "Ashoka's Inscriptions"
 */
export function generateChatTitle(firstPrompt: string): string {
  if (!firstPrompt || !firstPrompt.trim()) return 'New Research Session';

  let cleaned = firstPrompt.trim();

  // Strip common conversational preambles
  const preambles = [
    /^tell me about\s+/i,
    /^can you tell me about\s+/i,
    /^please explain\s+/i,
    /^explain\s+/i,
    /^what (is|are|was|were)\s+/i,
    /^how did\s+/i,
    /^give me an analysis of\s+/i,
    /^give me a 5-bullet summary of\s+/i,
    /^search google for\s+/i,
    /^investigate\s+/i,
    /^analyze\s+/i,
    /^describe\s+/i,
  ];

  for (const regex of preambles) {
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, '');
      break;
    }
  }

  // Remove trailing question marks or punctuation
  cleaned = cleaned.replace(/[?.!;,]+$/, '').trim();

  // Title-case the first letter of each significant word
  if (cleaned.length > 0) {
    cleaned = cleaned
      .split(' ')
      .slice(0, 7) // Keep within first 7 words
      .map((word) => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  // Limit length cleanly
  if (cleaned.length > 42) {
    cleaned = cleaned.slice(0, 39).trim() + '...';
  }

  return cleaned || 'Hydraulic Research';
}

/**
 * Creates a new conversation with an isolated unique Chat ID.
 */
export async function createChat(
  userId: string,
  initialTitle: string = 'New Conversation',
  roleId: 'historian' | 'structural_engineer' | 'field_hydrologist' = 'historian'
): Promise<ChatSession> {
  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const newChat: ChatSession = {
    id: chatId,
    title: initialTitle,
    createdAt: now,
    updatedAt: now,
    roleId,
    messageCount: 0,
    lastMessage: 'Ready for historical inquiry...',
  };

  // Local storage mirror
  try {
    const localChats = getLocalChats();
    localChats.unshift(newChat);
    saveLocalChats(localChats);
    saveLocalMessages(chatId, []);
  } catch (e) {
    console.warn('Local storage write skipped:', e);
  }

  // Firestore persistence
  if (userId) {
    try {
      const chatDocRef = doc(db, 'users', userId, 'chats', chatId);
      await setDoc(chatDocRef, newChat);
    } catch (err) {
      console.warn('Firestore createChat deferred:', err);
    }
  }

  return newChat;
}

/**
 * Retrieves all saved chats for the user.
 */
export async function getChats(userId: string): Promise<ChatSession[]> {
  if (!userId) {
    return getLocalChats();
  }

  try {
    const chatsCol = collection(db, 'users', userId, 'chats');
    const q = query(chatsCol, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const local = getLocalChats();
      // If local exists, sync to Firestore
      if (local.length > 0) {
        for (const c of local) {
          await setDoc(doc(db, 'users', userId, 'chats', c.id), c).catch(() => {});
        }
      }
      return local;
    }

    const chats: ChatSession[] = [];
    snapshot.forEach((d) => {
      chats.push(d.data() as ChatSession);
    });

    saveLocalChats(chats);
    return chats;
  } catch (err) {
    console.warn('Firestore getChats fallback to local:', err);
    return getLocalChats();
  }
}

/**
 * Real-time listener for chats.
 */
export function onChatsSnapshot(
  userId: string,
  callback: (chats: ChatSession[]) => void
): () => void {
  if (!userId) {
    callback(getLocalChats());
    return () => {};
  }

  try {
    const chatsCol = collection(db, 'users', userId, 'chats');
    const q = query(chatsCol, orderBy('updatedAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const chats: ChatSession[] = [];
        snapshot.forEach((d) => {
          chats.push(d.data() as ChatSession);
        });
        saveLocalChats(chats);
        callback(chats);
      },
      (error) => {
        console.warn('Chats snapshot error, using local fallback:', error);
        callback(getLocalChats());
      }
    );
  } catch (e) {
    callback(getLocalChats());
    return () => {};
  }
}

/**
 * Retrieves messages for a specific isolated Chat ID in chronological order.
 */
export async function getChatMessages(userId: string, chatId: string): Promise<ChatMessageRecord[]> {
  const local = getLocalMessages(chatId);
  if (!userId) return local;

  try {
    const messagesCol = collection(db, 'users', userId, 'chats', chatId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return local;
    }

    const messages: ChatMessageRecord[] = [];
    snapshot.forEach((d) => {
      messages.push(d.data() as ChatMessageRecord);
    });

    saveLocalMessages(chatId, messages);
    return messages;
  } catch (err) {
    console.warn('Firestore getChatMessages fallback:', err);
    return local;
  }
}

/**
 * Real-time listener for messages in an isolated chat.
 */
export function onChatMessagesSnapshot(
  userId: string,
  chatId: string,
  callback: (messages: ChatMessageRecord[]) => void
): () => void {
  if (!userId || !chatId) {
    callback(getLocalMessages(chatId));
    return () => {};
  }

  try {
    const messagesCol = collection(db, 'users', userId, 'chats', chatId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessageRecord[] = [];
        snapshot.forEach((d) => {
          messages.push(d.data() as ChatMessageRecord);
        });
        saveLocalMessages(chatId, messages);
        callback(messages);
      },
      (err) => {
        console.warn('Messages snapshot listener error, using local:', err);
        callback(getLocalMessages(chatId));
      }
    );
  } catch (e) {
    callback(getLocalMessages(chatId));
    return () => {};
  }
}

/**
 * Saves a message into the conversation thread, updating the chat's updatedAt and preview.
 */
export async function saveMessage(
  userId: string,
  chatId: string,
  message: Omit<ChatMessageRecord, 'createdAt'> & { createdAt?: string }
): Promise<void> {
  const now = message.createdAt || new Date().toISOString();
  const fullMessage: ChatMessageRecord = {
    ...message,
    createdAt: now,
  };

  // Local storage update
  const local = getLocalMessages(chatId);
  local.push(fullMessage);
  saveLocalMessages(chatId, local);

  // Update local chat meta
  const localChats = getLocalChats();
  const chatIndex = localChats.findIndex((c) => c.id === chatId);
  if (chatIndex >= 0) {
    localChats[chatIndex].updatedAt = now;
    localChats[chatIndex].lastMessage = fullMessage.content.slice(0, 100);
    localChats[chatIndex].messageCount = local.length;
    saveLocalChats(localChats);
  }

  // Firestore update
  if (userId) {
    try {
      const msgDocRef = doc(db, 'users', userId, 'chats', chatId, 'messages', fullMessage.id);
      await setDoc(msgDocRef, fullMessage);

      const chatDocRef = doc(db, 'users', userId, 'chats', chatId);
      await updateDoc(chatDocRef, {
        updatedAt: now,
        lastMessage: fullMessage.content.slice(0, 120),
        messageCount: local.length,
      }).catch(async () => {
        // If chat document doesn't exist yet, create it
        await setDoc(chatDocRef, {
          id: chatId,
          title: generateChatTitle(fullMessage.content),
          createdAt: now,
          updatedAt: now,
          lastMessage: fullMessage.content.slice(0, 120),
          messageCount: 1,
        });
      });
    } catch (err) {
      console.warn('Firestore saveMessage deferred:', err);
    }
  }
}

/**
 * Manually rename a conversation.
 */
export async function updateChatTitle(
  userId: string,
  chatId: string,
  newTitle: string
): Promise<void> {
  const title = newTitle.trim() || 'Untitled Research';

  // Local update
  const localChats = getLocalChats();
  const chat = localChats.find((c) => c.id === chatId);
  if (chat) {
    chat.title = title;
    chat.updatedAt = new Date().toISOString();
    saveLocalChats(localChats);
  }

  // Firestore update
  if (userId) {
    try {
      const chatDocRef = doc(db, 'users', userId, 'chats', chatId);
      await updateDoc(chatDocRef, {
        title,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore updateChatTitle deferred:', err);
    }
  }
}

/**
 * Deletes a single conversation and its messages.
 */
export async function deleteChat(userId: string, chatId: string): Promise<void> {
  // Local deletion
  const localChats = getLocalChats().filter((c) => c.id !== chatId);
  saveLocalChats(localChats);
  try {
    localStorage.removeItem(LOCAL_STORAGE_MESSAGES_PREFIX + chatId);
  } catch (e) {}

  // Firestore deletion
  if (userId) {
    try {
      // Delete all messages subcollection docs
      const messagesCol = collection(db, 'users', userId, 'chats', chatId, 'messages');
      const snap = await getDocs(messagesCol);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, 'users', userId, 'chats', chatId));
      await batch.commit();
    } catch (err) {
      console.warn('Firestore deleteChat error:', err);
    }
  }
}

/**
 * Clears all conversations for the user after explicit confirmation.
 * Does NOT touch search history or user account!
 */
export async function clearAllChats(userId: string): Promise<void> {
  const currentChats = getLocalChats();

  // Clean local
  saveLocalChats([]);
  for (const c of currentChats) {
    try {
      localStorage.removeItem(LOCAL_STORAGE_MESSAGES_PREFIX + c.id);
    } catch (e) {}
  }

  // Clean Firestore
  if (userId) {
    try {
      const chatsCol = collection(db, 'users', userId, 'chats');
      const snap = await getDocs(chatsCol);
      for (const d of snap.docs) {
        await deleteChat(userId, d.id);
      }
    } catch (err) {
      console.warn('Firestore clearAllChats error:', err);
    }
  }
}

// ============ Local Storage Helpers ============

function getLocalChats(): ChatSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveLocalChats(chats: ChatSession[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CHATS_KEY, JSON.stringify(chats));
  } catch (e) {}
}

function getLocalMessages(chatId: string): ChatMessageRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MESSAGES_PREFIX + chatId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveLocalMessages(chatId: string, messages: ChatMessageRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_MESSAGES_PREFIX + chatId, JSON.stringify(messages));
  } catch (e) {}
}
