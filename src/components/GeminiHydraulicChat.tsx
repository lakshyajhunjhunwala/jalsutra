import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Loader2,
  Trash2,
  Sparkles,
  Search,
  ExternalLink,
  Volume2,
  VolumeX,
  Compass,
  Mic,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Zap,
  BookOpen,
  MapPin,
  Globe,
  History,
  Clock,
  X,
  Plus,
  Edit3,
  MessageSquare,
  AlertCircle,
  Database,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { HallucinationAuditCard } from './HallucinationAuditCard.tsx';
import { VerificationAudit } from '../types/verification.ts';
import { SaveToDriveButton } from './SaveToDriveButton.tsx';
import { uploadFileToDrive } from '../services/googleDriveService.ts';
import {
  onUserAuthStateChanged,
  JalaSutraUser,
} from '../services/firebase.ts';
import {
  ChatSession,
  ChatMessageRecord,
  createChat,
  getChats,
  onChatsSnapshot,
  getChatMessages,
  onChatMessagesSnapshot,
  saveMessage,
  updateChatTitle,
  deleteChat,
  clearAllChats,
  generateChatTitle,
} from '../services/chatHistoryService.ts';
import {
  SearchRecord,
  addSearchRecord,
  getSearchHistory,
  onSearchHistorySnapshot,
  deleteSearchRecord,
  clearSearchHistory,
} from '../services/searchHistoryService.ts';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  roleId?: 'historian' | 'structural_engineer' | 'field_hydrologist';
  modelUsed?: string;
  groundingSources?: Array<{ title: string; uri: string; type?: 'web' | 'maps'; snippet?: string }>;
  searchQueries?: string[];
  verificationAudit?: VerificationAudit;
}

interface GeminiHydraulicChatProps {
  onOpenVoiceModal?: () => void;
  initialPrompt?: string;
  onNavigateToResearch?: (query: string) => void;
}

export const GeminiHydraulicChat: React.FC<GeminiHydraulicChatProps> = ({
  onOpenVoiceModal,
  initialPrompt = '',
  onNavigateToResearch,
}) => {
  // Current user authentication state
  const [currentUser, setCurrentUser] = useState<JalaSutraUser | null>(null);

  // Active Chat Session state
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [currentChatTitle, setCurrentChatTitle] = useState<string>('New Research Session');
  const [savedChats, setSavedChats] = useState<ChatSession[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchRecord[]>([]);

  // UI Drawer / Sidebar Controls
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState<boolean>(false);
  const [historyTab, setHistoryTab] = useState<'chats' | 'search'>('chats');
  const [historySearchFilter, setHistorySearchFilter] = useState<string>('');

  // Modals & Confirmations
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState<string>('');
  const [showClearChatsConfirm, setShowClearChatsConfirm] = useState<boolean>(false);
  const [showClearSearchConfirm, setShowClearSearchConfirm] = useState<boolean>(false);

  // Specialist Configuration
  const [roleId, setRoleId] = useState<'historian' | 'structural_engineer' | 'field_hydrologist'>('historian');
  const [groundingMode, setGroundingMode] = useState<'search' | 'maps' | 'none'>('search');
  const [useSearch, setUseSearch] = useState<boolean>(true);

  // Chat Execution State
  const [input, setInput] = useState<string>(initialPrompt);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Subscribe to Firebase Auth
  useEffect(() => {
    const unsub = onUserAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Saved Chats & Search History
  useEffect(() => {
    const userId = currentUser?.uid || '';
    const unsubChats = onChatsSnapshot(userId, (chats) => {
      setSavedChats(chats);
      // If we don't have an active chat yet, initialize one
      if (chats.length > 0 && !currentChatId) {
        loadChatSession(chats[0].id, chats[0].title);
      } else if (chats.length === 0 && !currentChatId) {
        handleStartNewChat(false);
      }
    });

    const unsubSearch = onSearchHistorySnapshot(userId, (records) => {
      setSearchHistory(records);
    });

    return () => {
      unsubChats();
      unsubSearch();
    };
  }, [currentUser?.uid]);

  // 3. Load or Subscribe to Messages of the current chat
  useEffect(() => {
    if (!currentChatId) return;

    const userId = currentUser?.uid || '';
    const unsubMessages = onChatMessagesSnapshot(userId, currentChatId, (records) => {
      if (records.length > 0) {
        const formatted: ChatMessage[] = records.map((r) => ({
          id: r.id,
          role: r.role === 'assistant' ? 'model' : 'user',
          text: r.content,
          timestamp: r.timestamp,
          modelUsed: r.modelUsed,
          searchQueries: r.searchQueries,
          groundingSources: r.groundingSources,
        }));
        setMessages(formatted);
      } else {
        // Welcome message for a fresh empty conversation
        setMessages([getWelcomeMessage(currentChatId, roleId)]);
      }
    });

    return () => unsubMessages();
  }, [currentChatId, currentUser?.uid]);

  // 4. Handle initial prompt passed via props
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() !== '') {
      setInput(initialPrompt);
      // If starting fresh from external prompt, prepare new chat
      if (!currentChatId || (messages.length > 1 && messages[0].id !== 'welcome-init')) {
        handleStartNewChat(false, initialPrompt);
      }
    }
  }, [initialPrompt]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const getWelcomeMessage = (chatId: string, role: typeof roleId): ChatMessage => ({
    id: `welcome-${chatId || 'fresh'}`,
    role: 'model',
    text: `### Welcome to JalaSutra Gemini LLM
**Active Model:** \`gemini-3.1-flash-lite\` equipped with real-time **Google Search data grounding** and **Google Maps spatial verification**:

1. **🏛️ Archaeological Historian & Epigraphist**: Correlates epigraphical records (Girnar Rudradaman 150 CE, Ashokan highway well network) with live Google Search archaeological reports.
2. **📐 Senior Hydraulic Structural Engineer**: Hydrostatic pressure equations, sliding factor of safety, and surplus weir modeling.
3. **📍 Field Hydrologist & Rapid Inspector**: Rapid diagnostic summaries, unit conversions (kosa, danda, yojana), and swift site assessments.

Choose your specialist persona, enable Google Search Grounding for live citations, or select a starter inquiry below.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    roleId: role,
    modelUsed: 'gemini-3.1-flash-lite',
    searchQueries: ['ancient Indian hydraulic engineering', 'Sudarshana lake Girnar inscriptions'],
  });

  // START A COMPLETELY NEW CONVERSATION
  const handleStartNewChat = async (notify: boolean = true, customFirstPrompt?: string) => {
    const userId = currentUser?.uid || '';
    const initialTitle = customFirstPrompt ? generateChatTitle(customFirstPrompt) : 'New Research Conversation';
    const newChat = await createChat(userId, initialTitle, roleId);

    setCurrentChatId(newChat.id);
    setCurrentChatTitle(newChat.title);
    setMessages([getWelcomeMessage(newChat.id, roleId)]);
    setError(null);
    if (!customFirstPrompt) {
      setInput('');
    }

    if (notify) {
      showToast('Started new conversation with unique Chat ID.');
    }
  };

  // LOAD AN EXISTING CONVERSATION FROM HISTORY
  const loadChatSession = async (chatId: string, title: string) => {
    const userId = currentUser?.uid || '';
    setCurrentChatId(chatId);
    setCurrentChatTitle(title);
    setError(null);

    const msgs = await getChatMessages(userId, chatId);
    if (msgs.length > 0) {
      setMessages(
        msgs.map((r) => ({
          id: r.id,
          role: r.role === 'assistant' ? 'model' : 'user',
          text: r.content,
          timestamp: r.timestamp,
          modelUsed: r.modelUsed,
          searchQueries: r.searchQueries,
          groundingSources: r.groundingSources,
        }))
      );
    } else {
      setMessages([getWelcomeMessage(chatId, roleId)]);
    }

    showToast(`Loaded conversation: "${title.slice(0, 32)}..."`);
  };

  // RENAME CONVERSATION
  const handleStartRename = (chat: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitleValue(chat.title);
  };

  const handleSaveRename = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingChatId || !editTitleValue.trim()) return;

    const userId = currentUser?.uid || '';
    await updateChatTitle(userId, editingChatId, editTitleValue.trim());

    if (editingChatId === currentChatId) {
      setCurrentChatTitle(editTitleValue.trim());
    }

    setEditingChatId(null);
    setEditTitleValue('');
    showToast('Conversation renamed.');
  };

  // DELETE SINGLE CHAT
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = currentUser?.uid || '';
    await deleteChat(userId, chatId);

    // If deleting currently active chat, switch to another or start new
    if (chatId === currentChatId) {
      const remaining = savedChats.filter((c) => c.id !== chatId);
      if (remaining.length > 0) {
        loadChatSession(remaining[0].id, remaining[0].title);
      } else {
        handleStartNewChat(false);
      }
    }
    showToast('Conversation deleted.');
  };

  // CLEAR ALL CHATS
  const handleClearAllChats = async () => {
    const userId = currentUser?.uid || '';
    await clearAllChats(userId);
    setShowClearChatsConfirm(false);
    handleStartNewChat(false);
    showToast('All chat conversations cleared.');
  };

  // DELETE SINGLE SEARCH RECORD
  const handleDeleteSearchRecord = async (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = currentUser?.uid || '';
    await deleteSearchRecord(userId, searchId);
    showToast('Search record deleted.');
  };

  // CLEAR ALL SEARCH RECORDS
  const handleClearAllSearchHistory = async () => {
    const userId = currentUser?.uid || '';
    await clearSearchHistory(userId);
    setShowClearSearchConfirm(false);
    showToast('Search history cleared. Chat conversations remain intact.');
  };

  // ROLES DEFINITION
  const roles = [
    {
      id: 'historian' as const,
      name: 'Archaeological Historian & Epigraphist',
      model: 'gemini-3.1-flash-lite',
      icon: BookOpen,
      tag: '⚡ Ultra-Fast · Live ASI Epigraphy Grounded',
      badgeColor: 'bg-[#8B3A1C] text-white',
      desc: 'Instant epigraphical correlation with Junagadh inscriptions, Ashokan edicts, Arthashastra, and ASI excavations.',
      starterPrompts: [
        'How did ancient Indian engineers find soil texture (Bhūmi-Parīkṣā) in Varāhamihira’s Bṛhat Saṃhitā and King Bhoja’s treatises?',
        'Analyze Emperor Ashoka’s highway well grid and botanicals in Pillar Edict VII.',
        'What does the 150 CE Junagadh rock inscription record about Sudarshana Lake’s breach?',
      ],
    },
    {
      id: 'structural_engineer' as const,
      name: 'Senior Hydraulic Architect & Structural Analysis',
      model: 'gemini-3.1-flash-lite',
      icon: Cpu,
      tag: '⚡ Fast Physics · Hydrostatic Mechanics',
      badgeColor: 'bg-[#25465C] text-white',
      desc: 'Solves complex hydrostatic equations, Ryves flood discharge, dam sliding safety factors, and sluice shear.',
      starterPrompts: [
        'Analyze geotechnical soil texture mechanics: Darcy seepage through clay cores and Stokes settling in ancient desilting basins.',
        'Derive the factor of safety against sliding for an 8m stone gravity bund under maximum flood head.',
        'Calculate the Ryves peak discharge for a 35 sq km catchment with C=550.',
      ],
    },
    {
      id: 'field_hydrologist' as const,
      name: 'Field Hydrologist & Rapid Inspector',
      model: 'gemini-3.1-flash-lite',
      icon: Zap,
      tag: '⚡ Sub-Second Response · Field Inspections',
      badgeColor: 'bg-[#3A6B48] text-white',
      desc: 'Instant diagnostic summaries, unit conversions (kosa, danda, yojana), and rapid field evaluations.',
      starterPrompts: [
        'How can I determine soil texture right now using the 1-cubit pit refill test (Gartā-Parīkṣā) and jar test?',
        'What are the 6 fatal flaws (doshas) for building a reservoir in the Porumamilla inscription?',
        'Search Google for the latest field reports on the condition of Kallanai Grand Anicut.',
      ],
    },
  ];

  const currentRole = roles.find((r) => r.id === roleId) || roles[0];

  // SEND MESSAGE
  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    // Ensure we have an active Chat ID
    let chatId = currentChatId;
    const userId = currentUser?.uid || '';
    if (!chatId) {
      const newChat = await createChat(userId, generateChatTitle(textToSend), roleId);
      chatId = newChat.id;
      setCurrentChatId(chatId);
      setCurrentChatTitle(newChat.title);
    }

    const userMessageId = `msg_user_${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: textToSend,
      timestamp: userTimestamp,
    };

    // Save user message to Firestore & local state
    await saveMessage(userId, chatId, {
      id: userMessageId,
      chatId,
      role: 'user',
      content: textToSend,
      timestamp: userTimestamp,
    });

    // Automatically update title from first meaningful user question
    if (messages.length <= 1 && (!currentChatTitle || currentChatTitle.startsWith('New Research') || currentChatTitle === 'New Conversation')) {
      const autoTitle = generateChatTitle(textToSend);
      setCurrentChatTitle(autoTitle);
      await updateChatTitle(userId, chatId, autoTitle);
    }

    // Automatically add to Search History
    await addSearchRecord(userId, textToSend, 'research');

    const newMessages = [...messages.filter((m) => !m.id.startsWith('welcome-')), userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Build conversation context isolated to this Chat ID
      const formattedHistory = newMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedHistory,
          roleId,
          useSearch: groundingMode === 'search' || useSearch,
          groundingMode,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const modelMessageId = `msg_model_${Date.now()}`;
      const modelTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const assistantMessage: ChatMessage = {
        id: modelMessageId,
        role: 'model',
        text: data.text,
        timestamp: modelTimestamp,
        roleId,
        modelUsed: data.modelUsed,
        groundingSources: data.groundingSources,
        searchQueries: data.searchQueries,
        verificationAudit: data.verificationAudit,
      };

      // Save model message to Firestore
      await saveMessage(userId, chatId, {
        id: modelMessageId,
        chatId,
        role: 'assistant',
        content: data.text,
        timestamp: modelTimestamp,
        modelUsed: data.modelUsed,
        groundingSources: data.groundingSources,
        searchQueries: data.searchQueries,
      });

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to receive response from Gemini LLM.');
    } finally {
      setLoading(false);
    }
  };

  // Text-to-Speech
  const handlePlayTTS = async (messageId: string, text: string) => {
    if (playingMessageId === messageId) {
      if (currentAudioSourceRef.current) {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current = null;
      }
      setPlayingMessageId(null);
      return;
    }

    try {
      setPlayingMessageId(messageId);
      const res = await fetch('/api/live/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Zephyr' }),
      });

      if (!res.ok) throw new Error('Failed to generate speech');
      const data = await res.json();

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const binaryString = atob(data.audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);
      const audioBuffer = ctx.createBuffer(1, int16Array.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }

      if (currentAudioSourceRef.current) {
        currentAudioSourceRef.current.stop();
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      currentAudioSourceRef.current = source;

      source.onended = () => {
        setPlayingMessageId(null);
        currentAudioSourceRef.current = null;
      };
    } catch (err) {
      console.error('Error playing TTS:', err);
      setPlayingMessageId(null);
    }
  };

  const copyMessageText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group saved chats by Date
  const groupedChats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const filtered = savedChats.filter((c) => {
      if (!historySearchFilter) return true;
      const q = historySearchFilter.toLowerCase();
      return c.title.toLowerCase().includes(q) || (c.lastMessage && c.lastMessage.toLowerCase().includes(q));
    });

    const groups: {
      today: ChatSession[];
      yesterday: ChatSession[];
      previousWeek: ChatSession[];
      older: ChatSession[];
    } = {
      today: [],
      yesterday: [],
      previousWeek: [],
      older: [],
    };

    filtered.forEach((chat) => {
      const d = new Date(chat.updatedAt || chat.createdAt);
      if (d >= today) {
        groups.today.push(chat);
      } else if (d >= yesterday) {
        groups.yesterday.push(chat);
      } else if (d >= sevenDaysAgo) {
        groups.previousWeek.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return groups;
  }, [savedChats, historySearchFilter]);

  const filteredSearchHistory = useMemo(() => {
    if (!historySearchFilter) return searchHistory;
    const q = historySearchFilter.toLowerCase();
    return searchHistory.filter((s) => s.query.toLowerCase().includes(q));
  }, [searchHistory, historySearchFilter]);

  return (
    <div className="relative flex flex-col h-[820px] bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl overflow-hidden shadow-sm">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#231B15] text-[#FBF9F5] text-xs font-medium rounded-lg shadow-lg flex items-center gap-2 border border-[#8B3A1C]/50 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-[#E68A5C]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR / CONTROL HEADER (Main Interface Contract) */}
      <div className="bg-[#FAF7F1] border-b border-[#E0D8CB] p-3 sm:p-4 space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Controls: ☰ History, 🔍 Search, + New Chat */}
          <div className="flex items-center gap-2">
            {/* ☰ History Button */}
            <button
              type="button"
              onClick={() => {
                setIsHistorySidebarOpen(!isHistorySidebarOpen);
                setHistoryTab('chats');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isHistorySidebarOpen
                  ? 'bg-[#8B3A1C] text-white border-[#8B3A1C] shadow-xs'
                  : 'bg-[#EFE8DC] text-[#3D3226] border-[#D8CEBD] hover:bg-[#E5DDCB]'
              }`}
              title="Open Conversation History & Search Archives"
            >
              <History className="w-3.5 h-3.5" />
              <span>☰ History</span>
              {savedChats.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#2A2219]/20 font-mono">
                  {savedChats.length}
                </span>
              )}
            </button>

            {/* 🔍 Search History Button */}
            <button
              type="button"
              onClick={() => {
                setIsHistorySidebarOpen(true);
                setHistoryTab('search');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EFE8DC] text-[#3D3226] border border-[#D8CEBD] hover:bg-[#E5DDCB] transition-all cursor-pointer flex items-center gap-1.5"
              title="View Search History Records"
            >
              <Search className="w-3.5 h-3.5 text-[#8B3A1C]" />
              <span>Search History</span>
              {searchHistory.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#8B3A1C]/10 text-[#8B3A1C] font-mono">
                  {searchHistory.length}
                </span>
              )}
            </button>

            {/* + New Chat Button (PROMINENT) */}
            <button
              type="button"
              onClick={() => handleStartNewChat(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#8B3A1C] hover:bg-[#722E15] text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Start a fresh conversation with unique Chat ID"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Chat</span>
            </button>
          </div>

          {/* Current Chat Title & Cloud Status */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-[#544738]">
              <MessageSquare className="w-3.5 h-3.5 text-[#8B3A1C]" />
              <span className="font-semibold max-w-[200px] truncate" title={currentChatTitle}>
                {currentChatTitle}
              </span>
              {currentChatId && (
                <span className="font-mono text-[10px] text-[#8C7D6D] hidden md:inline">
                  ({currentChatId.slice(0, 10)}...)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#716353] bg-[#EFE9DD] px-2 py-1 rounded border border-[#DFD6C6]">
              <Database className="w-3 h-3 text-emerald-600" />
              <span className="hidden sm:inline">Cloud Firestore:</span>
              <span className="text-emerald-700 font-semibold">Active</span>
            </div>
          </div>
        </div>

        {/* Roles and Grounding Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-2 border-t border-[#E8DFCFA0]">
          {/* Persona selector tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 md:pb-0">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = roleId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRoleId(r.id)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? `${r.badgeColor} shadow-xs font-semibold`
                      : 'bg-[#ECE5D8] text-[#554739] hover:bg-[#E0D7C6]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{r.name.split('&')[0].trim()}</span>
                </button>
              );
            })}
          </div>

          {/* Grounding Engine Mode */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-[#665646] flex items-center gap-1 uppercase tracking-wider">
              <Globe className="w-3 h-3 text-[#8B3A1C]" />
              Grounding:
            </span>
            <div className="flex items-center gap-0.5 bg-[#EAE2D3] p-0.5 rounded-md border border-[#D5CABB]">
              <button
                type="button"
                onClick={() => {
                  setGroundingMode('search');
                  setUseSearch(true);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  groundingMode === 'search'
                    ? 'bg-[#8B3A1C] text-white shadow-2xs'
                    : 'text-[#473B2E] hover:bg-[#DDD4C3]'
                }`}
              >
                <Search className="w-2.5 h-2.5" />
                <span>Google Search</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGroundingMode('maps');
                  setUseSearch(false);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  groundingMode === 'maps'
                    ? 'bg-[#8B3A1C] text-white shadow-2xs'
                    : 'text-[#473B2E] hover:bg-[#DDD4C3]'
                }`}
              >
                <MapPin className="w-2.5 h-2.5" />
                <span>Google Maps</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGroundingMode('none');
                  setUseSearch(false);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  groundingMode === 'none'
                    ? 'bg-[#8B3A1C] text-white shadow-2xs'
                    : 'text-[#473B2E] hover:bg-[#DDD4C3]'
                }`}
              >
                Direct LLM
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BODY WORKSPACE (With Collapsible History Sidebar) */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* ================= HISTORY SIDEBAR ================= */}
        {isHistorySidebarOpen && (
          <aside className="absolute inset-y-0 left-0 z-30 w-80 sm:w-88 bg-[#FBF9F5] border-r border-[#E0D8CB] shadow-xl flex flex-col animate-slide-right">
            {/* Sidebar Header */}
            <div className="p-3.5 bg-[#FAF7F1] border-b border-[#E0D8CB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#8B3A1C]" />
                <span className="font-serif font-bold text-sm text-[#231B15]">
                  RESEARCH ARCHIVE
                </span>
              </div>
              <button
                onClick={() => setIsHistorySidebarOpen(false)}
                className="p-1 rounded-md hover:bg-[#EAE2D3] text-[#554739] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Action: + New Chat */}
            <div className="p-3 border-b border-[#E8DFCFA0]">
              <button
                onClick={() => {
                  handleStartNewChat(true);
                  if (window.innerWidth < 640) setIsHistorySidebarOpen(false);
                }}
                className="w-full py-2 px-3 bg-[#8B3A1C] hover:bg-[#742E15] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start New Chat</span>
              </button>

              {/* Search Filter for History */}
              <div className="mt-2.5 relative">
                <Search className="w-3.5 h-3.5 text-[#8C7E70] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter saved history..."
                  value={historySearchFilter}
                  onChange={(e) => setHistorySearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#EFE8DC] border border-[#D5CABB] rounded-md text-[#2B231A] placeholder-[#8C7E70] focus:outline-none focus:ring-1 focus:ring-[#8B3A1C]"
                />
                {historySearchFilter && (
                  <button
                    onClick={() => setHistorySearchFilter('')}
                    className="absolute right-2 top-2 text-[#7C6E5F] hover:text-[#2B231A]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Sub-Tabs: Chats vs Search History */}
            <div className="flex border-b border-[#E0D8CB] bg-[#F4EFE6] text-xs font-medium">
              <button
                onClick={() => setHistoryTab('chats')}
                className={`flex-1 py-2 text-center transition-colors cursor-pointer border-b-2 ${
                  historyTab === 'chats'
                    ? 'border-[#8B3A1C] text-[#8B3A1C] font-semibold bg-[#FBF9F5]'
                    : 'border-transparent text-[#615344] hover:bg-[#EFE8DC]'
                }`}
              >
                Conversations ({savedChats.length})
              </button>
              <button
                onClick={() => setHistoryTab('search')}
                className={`flex-1 py-2 text-center transition-colors cursor-pointer border-b-2 ${
                  historyTab === 'search'
                    ? 'border-[#8B3A1C] text-[#8B3A1C] font-semibold bg-[#FBF9F5]'
                    : 'border-transparent text-[#615344] hover:bg-[#EFE8DC]'
                }`}
              >
                Search History ({searchHistory.length})
              </button>
            </div>

            {/* Sidebar Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* TAB 1: CONVERSATIONS */}
              {historyTab === 'chats' && (
                <div className="space-y-4">
                  {savedChats.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#7A6C5B] space-y-1">
                      <p>No conversations saved yet.</p>
                      <p className="text-[11px] text-[#A09282]">
                        Every turn is automatically backed up to Cloud Firestore.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* TODAY GROUP */}
                      {groupedChats.today.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A7969] px-1">
                            Today
                          </span>
                          {groupedChats.today.map((chat) => renderChatHistoryItem(chat))}
                        </div>
                      )}

                      {/* YESTERDAY GROUP */}
                      {groupedChats.yesterday.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A7969] px-1">
                            Yesterday
                          </span>
                          {groupedChats.yesterday.map((chat) => renderChatHistoryItem(chat))}
                        </div>
                      )}

                      {/* PREVIOUS WEEK GROUP */}
                      {groupedChats.previousWeek.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A7969] px-1">
                            Previous 7 Days
                          </span>
                          {groupedChats.previousWeek.map((chat) => renderChatHistoryItem(chat))}
                        </div>
                      )}

                      {/* OLDER GROUP */}
                      {groupedChats.older.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A7969] px-1">
                            Older
                          </span>
                          {groupedChats.older.map((chat) => renderChatHistoryItem(chat))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: SEARCH HISTORY (Strictly Isolated System) */}
              {historyTab === 'search' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#6E5F4F] pb-1 border-b border-[#E8DFCFA0]">
                    <span>Inquiry Log</span>
                    <span className="text-[10px] text-[#8B7C6E]">Preserved in Firestore</span>
                  </div>

                  {filteredSearchHistory.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#7A6C5B]">
                      No search records found.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredSearchHistory.map((rec) => (
                        <div
                          key={rec.id}
                          onClick={() => {
                            setInput(rec.query);
                            if (window.innerWidth < 640) setIsHistorySidebarOpen(false);
                            showToast(`Copied search query to input: "${rec.query.slice(0, 30)}..."`);
                          }}
                          className="group p-2 rounded-lg bg-[#FAF6EE] hover:bg-[#EFE8DA] border border-[#E5DDCB] transition-colors cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Search className="w-3 h-3 text-[#8B3A1C] shrink-0" />
                            <span className="text-xs text-[#2A2219] font-medium truncate">
                              {rec.query}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] text-[#8C7D6D]">{rec.timestamp}</span>
                            <button
                              onClick={(e) => handleDeleteSearchRecord(rec.id, e)}
                              className="p-1 rounded text-[#998A7B] hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Delete this search record only"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Clear Search History Button */}
                  {searchHistory.length > 0 && (
                    <div className="pt-3 border-t border-[#E8DFCFA0]">
                      <button
                        onClick={() => setShowClearSearchConfirm(true)}
                        className="w-full py-1.5 text-xs font-semibold text-[#8B3A1C] hover:bg-[#8B3A1C]/10 rounded border border-[#8B3A1C]/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear Search History</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            {historyTab === 'chats' && savedChats.length > 0 && (
              <div className="p-3 border-t border-[#E0D8CB] bg-[#FAF7F1]">
                <button
                  onClick={() => setShowClearChatsConfirm(true)}
                  className="w-full py-1.5 text-xs font-semibold text-[#8B3A1C] hover:bg-[#8B3A1C]/10 rounded border border-[#8B3A1C]/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Chat History</span>
                </button>
              </div>
            )}
          </aside>
        )}

        {/* ================= CHAT AREA (Scrollable Thread) ================= */}
        <div className="flex-1 flex flex-col h-full bg-[#FAF7F0] overflow-hidden">
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
          >
            {/* Thread Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-4xl ${
                    isUser ? 'ml-auto' : 'mr-auto'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center gap-2 text-[11px] text-[#786A5A] mb-1 px-1">
                    <span className="font-semibold">
                      {isUser ? 'You (Researcher)' : 'JalaSutra Gemini LLM'}
                    </span>
                    {msg.modelUsed && (
                      <span className="px-1.5 py-0.2 rounded bg-[#E8DFCFA0] font-mono text-[10px] text-[#55493B] border border-[#DDD3C2]">
                        {msg.modelUsed}
                      </span>
                    )}
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-xl p-4 sm:p-5 shadow-2xs border ${
                      isUser
                        ? 'bg-[#8B3A1C] text-white border-[#7A3116] max-w-2xl'
                        : 'bg-[#FDFBF7] text-[#241B14] border-[#E3DACB] w-full'
                    }`}
                  >
                    <MarkdownRenderer content={msg.text} />

                    {/* Hallucination Risk & Grounding Audit (Strictly <= 30%) */}
                    {!isUser && (
                      <HallucinationAuditCard audit={msg.verificationAudit} />
                    )}

                    {/* Google Search Queries Executed by LLM */}
                    {msg.searchQueries && msg.searchQueries.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#DECDB8] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8B3A1C]">
                          <Search className="w-3.5 h-3.5" />
                          <span>Google Search Queries Grounding:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.searchQueries.map((query, qIdx) => (
                            <span
                              key={qIdx}
                              className="px-2 py-0.5 rounded-full bg-[#E8DFCFA0] border border-[#DDD3C2] text-[#473B2E] font-mono text-[10px] flex items-center gap-1"
                            >
                              <Globe className="w-2.5 h-2.5 text-[#8B3A1C]" />
                              "{query}"
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verified Google Grounding Sources */}
                    {msg.groundingSources && msg.groundingSources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#DECDB8] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8B3A1C]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified Google Grounding Citations:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.groundingSources.map((source, sIdx) => (
                            <a
                              key={sIdx}
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#EFE8DB] hover:bg-[#E6DCBC] border border-[#DACFBD] text-[11px] text-[#473A2D] transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 text-[#8B3A1C]" />
                              <span className="font-medium max-w-[240px] truncate">
                                {source.title || source.uri}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions under bubble */}
                  {!isUser && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-[#7B6E5F] px-1">
                      <button
                        onClick={() => handlePlayTTS(msg.id, msg.text)}
                        className={`p-1.5 rounded hover:bg-[#EAE2D3] transition-colors flex items-center gap-1 ${
                          playingMessageId === msg.id ? 'text-[#8B3A1C] font-semibold' : ''
                        }`}
                        title="Read aloud using Neural TTS"
                      >
                        {playingMessageId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span>{playingMessageId === msg.id ? 'Stop Voice' : 'Listen'}</span>
                      </button>

                      <button
                        onClick={() => copyMessageText(msg.id, msg.text)}
                        className="p-1.5 rounded hover:bg-[#EAE2D3] transition-colors flex items-center gap-1"
                        title="Copy markdown text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <SaveToDriveButton
                        onExport={() =>
                          uploadFileToDrive({
                            name: `${currentChatTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${msg.id}.md`,
                            content: msg.text,
                            mimeType: 'text/markdown',
                            category: 'note',
                          })
                        }
                        label="Drive"
                        variant="compact"
                        className="p-1 rounded text-xs text-[#554739] hover:bg-[#EAE2D3]"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[#FAF6ED] border border-[#E0D8CB] text-xs text-[#5C4F40] w-fit">
                <Loader2 className="w-4 h-4 animate-spin text-[#8B3A1C]" />
                <span>
                  Querying <strong>gemini-flash-latest</strong> with live Google Grounding...
                </span>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => handleSend()}
                  className="px-2.5 py-1 text-xs font-semibold bg-red-100 hover:bg-red-200 rounded text-red-900 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Starter Inquiry Chips (When starting fresh or selecting questions) */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 bg-[#FAF7F1] border-t border-[#E8DFCFA0] flex items-center gap-2 overflow-x-auto text-xs shrink-0">
              <span className="text-[11px] font-semibold text-[#8B3A1C] uppercase tracking-wide whitespace-nowrap">
                Starter Questions:
              </span>
              {currentRole.starterPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1 bg-[#EFE8DC] hover:bg-[#E6DCCB] text-[#423629] rounded-full border border-[#D8CEBC] whitespace-nowrap transition-colors cursor-pointer text-xs"
                >
                  {q.slice(0, 48)}...
                </button>
              ))}
            </div>
          )}

          {/* INPUT BAR (Contract: Ask your history question... ➤) */}
          <div className="p-3 sm:p-4 bg-[#FAF7F1] border-t border-[#E0D8CB] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your history question (e.g. Tell me about ancient dams in Rajasthan)..."
                  className="w-full px-4 py-2.5 text-sm bg-white border border-[#D5CABB] rounded-lg text-[#251D16] placeholder-[#8C7D6D] focus:outline-none focus:ring-2 focus:ring-[#8B3A1C] shadow-2xs"
                  disabled={loading}
                />
                {input && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="absolute right-3 top-3 text-[#998A7B] hover:text-[#251D16]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {onOpenVoiceModal && (
                <button
                  type="button"
                  onClick={onOpenVoiceModal}
                  className="p-2.5 rounded-lg bg-[#EFE8DC] hover:bg-[#E5DDCB] text-[#8B3A1C] border border-[#D8CEBD] transition-colors cursor-pointer"
                  title="Open Live Voice Gemini Modal"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 rounded-lg bg-[#8B3A1C] hover:bg-[#722E15] disabled:opacity-50 text-white font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Send inquiry"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL: CLEAR ALL CHATS */}
      {showClearChatsConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border border-[#D5CABB] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-serif font-bold text-lg text-[#2A2118] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Clear All Chat History?
            </h3>
            <p className="text-xs text-[#5C4F40] leading-relaxed">
              This will permanently delete your saved conversation history from Cloud Firestore. Your Search History and research bookmarks will remain intact.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearChatsConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-[#EFE8DC] text-[#423629] hover:bg-[#E5DDCB]"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllChats}
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-red-700 hover:bg-red-800 text-white shadow-xs"
              >
                Clear All Conversations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: CLEAR SEARCH HISTORY */}
      {showClearSearchConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border border-[#D5CABB] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-serif font-bold text-lg text-[#2A2118] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#8B3A1C]" />
              Clear Search History?
            </h3>
            <p className="text-xs text-[#5C4F40] leading-relaxed">
              This will delete only your search inquiry records. It will NOT delete your saved chat conversations, messages, or research dossiers.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearSearchConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-[#EFE8DC] text-[#423629] hover:bg-[#E5DDCB]"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllSearchHistory}
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-[#8B3A1C] hover:bg-[#722E15] text-white shadow-xs"
              >
                Clear Search Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render individual chat items in sidebar
  function renderChatHistoryItem(chat: ChatSession) {
    const isSelected = chat.id === currentChatId;
    const isEditing = chat.id === editingChatId;

    return (
      <div
        key={chat.id}
        onClick={() => {
          if (!isEditing) {
            loadChatSession(chat.id, chat.title);
            if (window.innerWidth < 640) setIsHistorySidebarOpen(false);
          }
        }}
        className={`group p-2.5 rounded-lg border transition-all cursor-pointer relative ${
          isSelected
            ? 'bg-[#EAE2D3] border-[#C8BAA5] shadow-2xs font-semibold'
            : 'bg-[#FAF6EE] hover:bg-[#EFE8DA] border-[#E8DFCFA0]'
        }`}
      >
        {isEditing ? (
          <form
            onSubmit={handleSaveRename}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1"
          >
            <input
              type="text"
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              className="flex-1 text-xs px-2 py-1 bg-white border border-[#8B3A1C] rounded text-[#221A13] focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="p-1 rounded bg-[#8B3A1C] text-white hover:bg-[#742E15]"
              title="Save Title"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setEditingChatId(null)}
              className="p-1 rounded bg-[#E0D7C6] text-[#44382B]"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <MessageSquare
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isSelected ? 'text-[#8B3A1C]' : 'text-[#857666]'
                  }`}
                />
                <span className="text-xs text-[#251D16] truncate font-medium">
                  {chat.title}
                </span>
              </div>

              {/* Action Buttons on Hover */}
              <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => handleStartRename(chat, e)}
                  className="p-1 rounded text-[#7C6E5F] hover:text-[#251D16] hover:bg-[#E5DDCB]"
                  title="Rename Conversation"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="p-1 rounded text-[#7C6E5F] hover:text-red-700 hover:bg-red-50"
                  title="Delete Conversation"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Last message preview */}
            {chat.lastMessage && (
              <p className="text-[11px] text-[#7A6C5B] truncate mt-1 pl-5">
                {chat.lastMessage}
              </p>
            )}

            <div className="flex items-center justify-between text-[10px] text-[#8C7D6C] mt-1 pl-5">
              <span>{new Date(chat.updatedAt || chat.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
              {chat.messageCount > 0 && <span>{chat.messageCount} msgs</span>}
            </div>
          </>
        )}
      </div>
    );
  }
};
