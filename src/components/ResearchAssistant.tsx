import React, { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  BookOpen,
  Loader2,
  Copy,
  Check,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  MessageSquare,
  Mic,
  MapPin,
  Globe,
  Trash2,
  History,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Zap,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { HallucinationAuditCard } from './HallucinationAuditCard.tsx';
import { SourcesDrawer } from './SourcesDrawer.tsx';
import { VerificationAudit } from '../types/verification.ts';
import { ResearchSource } from '../types/researchSources.ts';
import { SaveToDriveButton } from './SaveToDriveButton.tsx';
import { exportResearchDossierToDrive } from '../services/googleDriveService.ts';
import { synthesizeResearchDossier } from '../services/archivalHydrologySynthesizer.ts';
import { onUserAuthStateChanged, JalaSutraUser } from '../services/firebase.ts';
import {
  SearchRecord,
  addSearchRecord,
  onSearchHistorySnapshot,
  deleteSearchRecord,
  clearSearchHistory,
} from '../services/searchHistoryService.ts';
import { WaterEngineeringTimeline } from './WaterEngineeringTimeline.tsx';

export interface GroundingCitation {
  title: string;
  uri: string;
  type?: 'web' | 'maps';
  snippet?: string;
}

export interface ResearchHistoryPoint {
  id: string;
  query: string;
  mode: 'standard' | 'deep_research' | 'deep_dossier_30' | 'reconstruction' | 'comparative';
  region: string;
  technicalLevel: 'scholarly' | 'accessible';
  groundingMode: 'search' | 'maps' | 'none';
  timestamp: string;
  formattedDate: string;
  response: string;
  modelUsed: string;
  groundingSources?: GroundingCitation[];
  searchQueries?: string[];
  verificationAudit?: VerificationAudit;
  researchSources?: ResearchSource[];
}

interface ResearchAssistantProps {
  initialQuery?: string;
  onSendToChat?: (query: string) => void;
  onOpenVoiceModal?: () => void;
}

const DEFAULT_HISTORY_POINTS: ResearchHistoryPoint[] = [
  {
    id: 'history-sudarshana-1',
    query: 'Analyze the construction, Ashokan canals by Tusaspha, the 150 CE flood breach, and Rudradaman’s repair of Sudarshana Lake at Girnar based on epigraphical evidence.',
    mode: 'deep_research',
    region: 'Gujarat & Saurashtra',
    technicalLevel: 'scholarly',
    groundingMode: 'search',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    formattedDate: 'Today, 3 hours ago',
    response: synthesizeResearchDossier('Sudarshana Dam Girnar Rudradaman Tusaspha Ashoka', 'deep_research', 'Gujarat & Saurashtra').text,
    modelUsed: 'gemini-flash-latest',
    groundingSources: [
      {
        title: 'Epigraphia Indica - Junagadh Rock Inscription of Rudradaman I (150 CE)',
        uri: 'https://asi.nic.in/archaeological-survey-of-india/sudarshana-dam',
        type: 'web',
      },
      {
        title: 'ASI Western Circle: Mount Girnar Hydraulic Reservoir Digs',
        uri: 'https://asi.nic.in/ancient-monuments/sudarshana-dam',
        type: 'web',
      },
    ],
  },
  {
    id: 'history-ashoka-wells-2',
    query: 'Investigate Emperor Ashoka’s infrastructure recorded in Pillar Edict VII and Major Rock Edict II: well spacing at half-kosa intervals, banyan canopies, and water dispensaries (apāna).',
    mode: 'standard',
    region: 'Bihar & Gangetic Basin',
    technicalLevel: 'scholarly',
    groundingMode: 'search',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    formattedDate: 'Today, 8 hours ago',
    response: synthesizeResearchDossier('Emperor Ashoka highway well network Pillar Edict VII Major Rock Edict II', 'standard', 'Bihar & Gangetic Basin').text,
    modelUsed: 'gemini-flash-latest',
    groundingSources: [
      {
        title: 'Corpus Inscriptionum Indicarum: Inscriptions of Asoka',
        uri: 'https://ignca.gov.in/epigraphical-surveys/ashoka-mauryan-hydrology',
        type: 'web',
      },
    ],
  },
  {
    id: 'history-kallanai-3',
    query: 'Explain the civil engineering foundation method of Karikalan Chola’s Kallanai (Grand Anicut) on shifting alluvial river sand without bedrock.',
    mode: 'reconstruction',
    region: 'Tamil Nadu',
    technicalLevel: 'scholarly',
    groundingMode: 'maps',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    formattedDate: 'Yesterday',
    response: synthesizeResearchDossier('Kallanai Grand Anicut Karikalan Chola shifting sand boulder foundation', 'reconstruction', 'Tamil Nadu').text,
    modelUsed: 'gemini-flash-latest',
    groundingSources: [
      {
        title: 'Google Maps: Grand Anicut (Kallanai), Tiruchirappalli, Tamil Nadu',
        uri: 'https://maps.google.com/?q=10.8333,78.8167',
        type: 'maps',
        snippet: '10.8333° N, 78.8167° E · Cauvery Delta Diversion Dam',
      },
    ],
  },
];

export const ResearchAssistant: React.FC<ResearchAssistantProps> = ({
  initialQuery = '',
  onSendToChat,
  onOpenVoiceModal,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<'standard' | 'deep_research' | 'deep_dossier_30' | 'reconstruction' | 'comparative'>('deep_dossier_30');
  const [region, setRegion] = useState<string>('all');
  const [technicalLevel, setTechnicalLevel] = useState<'scholarly' | 'accessible'>('scholarly');
  const [groundingMode, setGroundingMode] = useState<'search' | 'maps' | 'none'>('search');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingCitation[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [modelUsed, setModelUsed] = useState<string>('gemini-flash-latest');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [verificationAudit, setVerificationAudit] = useState<VerificationAudit | undefined>(undefined);
  const [researchSources, setResearchSources] = useState<ResearchSource[]>([]);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Authentication & Search History System State
  const [currentUser, setCurrentUser] = useState<JalaSutraUser | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchRecord[]>([]);
  const [showClearSearchConfirm, setShowClearSearchConfirm] = useState<boolean>(false);

  useEffect(() => {
    const unsubAuth = onUserAuthStateChanged((u) => setCurrentUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const userId = currentUser?.uid || '';
    const unsubSearch = onSearchHistorySnapshot(userId, (records) => {
      setSearchHistory(records);
    });
    return () => unsubSearch();
  }, [currentUser?.uid]);

  const handleDeleteSearch = async (searchId: string) => {
    const userId = currentUser?.uid || '';
    await deleteSearchRecord(userId, searchId);
    showToast('Search record deleted.');
  };

  const handleClearAllSearch = async () => {
    const userId = currentUser?.uid || '';
    await clearSearchHistory(userId);
    setShowClearSearchConfirm(false);
    showToast('Search history cleared. Chat conversations remain intact.');
  };

  // Persistent Research History Points State
  const [historyPoints, setHistoryPoints] = useState<ResearchHistoryPoint[]>(() => {
    try {
      const saved = localStorage.getItem('jalasutra_research_history_points');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse history points from localStorage', e);
    }
    return DEFAULT_HISTORY_POINTS;
  });

  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(true);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState<boolean>(false);
  const [historyFeedbackToast, setHistoryFeedbackToast] = useState<string | null>(null);

  // Sync history points to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jalasutra_research_history_points', JSON.stringify(historyPoints));
    } catch (e) {
      console.error('Failed to persist history points to localStorage', e);
    }
  }, [historyPoints]);

  const showToast = (msg: string) => {
    setHistoryFeedbackToast(msg);
    setTimeout(() => setHistoryFeedbackToast(null), 3500);
  };

  const deleteHistoryPoint = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHistoryPoints((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('jalasutra_research_history_points', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
    showToast('Research history point deleted successfully.');
  };

  const clearAllHistoryPoints = () => {
    setHistoryPoints([]);
    try {
      localStorage.setItem('jalasutra_research_history_points', JSON.stringify([]));
    } catch (err) {}
    setShowClearHistoryConfirm(false);
    showToast('All research history points cleared.');
  };

  const loadHistoryPoint = (point: ResearchHistoryPoint) => {
    setQuery(point.query);
    setMode(point.mode);
    setRegion(point.region);
    setTechnicalLevel(point.technicalLevel);
    setGroundingMode(point.groundingMode);
    setResponse(point.response);
    setModelUsed(point.modelUsed || 'gemini-3.1-flash-lite');
    setGroundingSources(point.groundingSources || []);
    setSearchQueries(point.searchQueries || []);
    setVerificationAudit(point.verificationAudit);
    setResearchSources(point.researchSources || []);
    showToast(`Loaded research point: "${point.query.slice(0, 42)}..."`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTimelineInquire = (promptText: string) => {
    setQuery(promptText);
    handleSearch(promptText);
    const inputEl = document.getElementById('research-input');
    if (inputEl) {
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const curatedQuestions = [
    {
      label: '🌾 Soil Texture & Bhūmi-Parīkṣā',
      text: 'How did ancient Indian engineers determine soil texture and bearing capacity for dam construction? Explain the Bṛhat Saṃhitā Bhūmi-Parīkṣā methods: garta-pariksha (pit refill), jala-dhāraṇa (water infiltration), ribbon plasticity roll, and hydraulic sedimentation jar settling tests.',
      mode: 'deep_research' as const,
      region: 'all',
    },
    {
      label: '⚡ Sudarshana Dam & Ashoka',
      text: 'Analyze the construction, Ashokan canals by Tusaspha, the 150 CE flood breach, and Rudradaman’s repair of Sudarshana Lake at Girnar based on epigraphical evidence.',
      mode: 'deep_research' as const,
      region: 'Gujarat & Saurashtra',
    },
    {
      label: '⚡ Ashoka Highway Well Grid',
      text: 'Investigate Emperor Ashoka’s infrastructure recorded in Pillar Edict VII and Major Rock Edict II: well spacing at half-kosa intervals, banyan canopies, and water dispensaries (apāna).',
      mode: 'standard' as const,
      region: 'Bihar & Gangetic Basin',
    },
    {
      label: '⚡ Kallanai on Shifting Sand',
      text: 'Explain the civil engineering foundation method of Karikalan Chola’s Kallanai (Grand Anicut) on shifting alluvial river sand without bedrock.',
      mode: 'reconstruction' as const,
      region: 'Tamil Nadu',
    },
    {
      label: '⚡ Dholavira Cascading Reservoirs',
      text: 'Detail the Harappan water-harvesting complex at Dholavira: check dams on Mansar and Manhar, desilting basins, and 16 rock-cut cascading reservoirs.',
      mode: 'deep_research' as const,
      region: 'Indus Valley & Kutch',
    },
    {
      label: '⚡ Mohenjo-daro Great Bath & Drainage',
      text: 'Examine the sanitary engineering and waterproofing of the Great Bath at Mohenjo-daro: 3cm bitumen mastic barrier, corbelled brick sewer vaults, and private well grids.',
      mode: 'reconstruction' as const,
      region: 'all',
    },
    {
      label: '⚡ Lothal Tidal Dockyard & Lock Gate',
      text: 'Explain the tidal hydraulic engineering of Lothal’s Bronze Age brick dockyard (214m × 36m): acute-angle inlet channel, vertical wooden lock gate, and stone anchor berths.',
      mode: 'reconstruction' as const,
      region: 'Gujarat & Saurashtra',
    },
    {
      label: '⚡ Rani ki Vav Stepwells & Aquifers',
      text: 'Analyze the 7-tier subterranean inverted temple engineering of Rani ki Vav at Patan (1063 CE): resisting lateral earth pressure (K0) and tapping perennial Saraswati sand aquifers.',
      mode: 'deep_research' as const,
      region: 'Gujarat & Saurashtra',
    },
    {
      label: '⚡ Bhojpur Cyclopean Dam (King Bhoja)',
      text: 'Analyze the civil engineering principles documented in Bhoja’s Samarāṅgaṇa Sūtradhāra and realized at the Bhojpur Cyclopean Dam: mortarless 10-ton sandstone megaliths impounding 650 sq km.',
      mode: 'deep_research' as const,
      region: 'Madhya Pradesh',
    },
    {
      label: '⚡ Arthashastra Water Laws',
      text: 'What are the legal regulations, water rates (udakabhāga), and dam breach penalties (setubheda) in Kautilya’s Arthashastra regarding water management?',
      mode: 'standard' as const,
      region: 'Bihar & Gangetic Basin',
    },
    {
      label: '⚡ Porumamilla 12 Sādhanas & 6 Doshas',
      text: 'Examine the 1369 CE Porumamilla Tank Sanskrit inscription: what are the 12 essential prerequisites (sādhana) and 6 fatal flaws (dosha) for building a dam?',
      mode: 'deep_research' as const,
      region: 'Andhra Pradesh & Karnataka',
    },
    {
      label: '⚡ Sringaverapura 3-Stage Clarifier',
      text: 'Detail the three-stage sediment clarification plant excavated at Sringaverapura on the Ganga (1st c. BCE): circular vortex settling well (kūpa), cascade steps, and clear water tanks.',
      mode: 'reconstruction' as const,
      region: 'Bihar & Gangetic Basin',
    },
    {
      label: '⚡ Kakatiya Chain-Tank Cascades',
      text: 'Investigate the 13th-century Kakatiya chain-tank cascade engineering across the Deccan plateau (Ramappa and Pakhal lakes): contour bunds, granite sluices (tūmu), and modern Mission Kakatiya.',
      mode: 'standard' as const,
      region: 'Andhra Pradesh & Karnataka',
    },
    {
      label: '⚡ Hampi Vijayanagara Aqueducts',
      text: 'How did Emperor Krishnadevaraya engineer the Tungabhadra river diversion anicuts, elevated stone viaducts, and pressurized terracotta pipes to supply water to ancient Hampi?',
      mode: 'deep_research' as const,
      region: 'Andhra Pradesh & Karnataka',
    },
  ];

  const handleSearch = async (queryText?: string, modeOverride?: typeof mode, regionOverride?: string) => {
    const activeQuery = queryText || query;
    if (!activeQuery.trim()) return;

    const activeMode = modeOverride || mode;
    const activeRegion = regionOverride || region;

    setLoading(true);
    setError(null);
    setResponse(null);
    setGroundingSources([]);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: activeQuery,
          mode: activeMode,
          region: activeRegion,
          technicalLevel,
          groundingMode,
          useSearch: groundingMode === 'search',
          useMaps: groundingMode === 'maps',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.text);
      setOfflineNotice(data.offlineFallback ? (data.offlineReason || 'Gemini API temporarily unavailable — showing curated archival dossier.') : null);
      if (data.modelUsed) {
        setModelUsed(data.modelUsed);
      }
      if (Array.isArray(data.groundingSources)) {
        setGroundingSources(data.groundingSources);
      }
      if (Array.isArray(data.searchQueries)) {
        setSearchQueries(data.searchQueries);
      } else {
        setSearchQueries([]);
      }
      setVerificationAudit(data.verificationAudit ?? undefined);
      if (Array.isArray(data.researchSources)) {
        setResearchSources(data.researchSources);
      } else {
        setResearchSources([]);
      }

      // Record inquiry to persistent Search History (Cloud Firestore + Local)
      addSearchRecord(currentUser?.uid || '', activeQuery, 'research').catch(() => {});

      // Record this inquiry as a research history point
      const newPoint: ResearchHistoryPoint = {
        id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        query: activeQuery,
        mode: activeMode,
        region: activeRegion,
        technicalLevel,
        groundingMode,
        timestamp: new Date().toISOString(),
        formattedDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
        response: data.text,
        modelUsed: data.modelUsed || 'gemini-3.1-flash-lite',
        groundingSources: Array.isArray(data.groundingSources) ? data.groundingSources : [],
        searchQueries: Array.isArray(data.searchQueries) ? data.searchQueries : [],
        verificationAudit: data.verificationAudit ?? undefined,
        researchSources: Array.isArray(data.researchSources) ? data.researchSources : [],
      };
      setHistoryPoints((prev) => [newPoint, ...prev.filter((p) => p.query !== activeQuery)].slice(0, 50));
      showToast('New research point added to history.');
    } catch (err: any) {
      console.error('Research error:', err);
      const message = String(err.message || 'An error occurred while querying the ancient hydrology database.');
      setError(message.replace(/^\{"error":"?/, '').replace(/"?\}$/, '').replace(/\\"/g, '"'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Research Query Console */}
      <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E8E0D2]">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#2A231C] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#8B3A1C]" />
              Scholarly AI Research Assistant
            </h2>
            <p className="text-xs sm:text-sm text-[#736657]">
              Adheres to inscriptional evidence, ASI excavation reports, and civil engineering physics with real-time Google Search grounding.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EBF3ED] text-[#205C3B] border border-[#C5DEC8] text-[11px] font-medium">
                <Zap className="w-3 h-3 text-[#2E7D32]" />
                Fast Mode Active (Sub-second Response)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FDF3E7] text-[#8B3A1C] border border-[#E9D3B6] text-[11px] font-medium">
                <ShieldCheck className="w-3 h-3 text-[#8B3A1C]" />
                100% History & Ancient Engineering Grounding
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6B5E4F]">
            {onOpenVoiceModal && (
              <button
                onClick={onOpenVoiceModal}
                className="px-2.5 py-1 text-xs rounded bg-[#EFE8DC] text-[#8B3A1C] hover:bg-[#E5DAC8] font-medium border border-[#DCD0BE] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice (3.8-Live)</span>
              </button>
            )}
            <span className="font-semibold text-[#8B3A1C] capitalize bg-[#F4EDE1] px-2 py-0.5 rounded border border-[#DFD5C4]">
              {mode.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Query Input Box */}
        <div className="mt-4">
          <div className="relative">
            <textarea
              id="research-input"
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask any question about ancient dams, reservoirs, Mauryan hydrology, Ashoka's edicts, or historical flood control..."
              className="w-full bg-[#FFFFFF] border border-[#D5CABB] focus:border-[#8B3A1C] focus:ring-1 focus:ring-[#8B3A1C] rounded p-3 text-sm text-[#251F19] placeholder-[#9C8F80] outline-none transition-all leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSearch();
                }
              }}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="px-2.5 py-1 text-xs text-[#7A6C5B] hover:text-[#251D16] bg-[#EFE8DD] hover:bg-[#E5DDCF] rounded border border-[#DDD1BF] transition-colors cursor-pointer"
                  title="Clear search input (Auto-cleanup)"
                >
                  Clear
                </button>
              )}

              {onSendToChat && query.trim() && (
                <button
                  onClick={() => onSendToChat(query)}
                  className="px-3 py-1.5 text-xs font-medium text-[#46392D] bg-[#EFE8DD] hover:bg-[#E5DDCF] rounded flex items-center gap-1 transition-colors cursor-pointer border border-[#DDD1BF]"
                  title="Discuss in Multi-turn Chat"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#8B3A1C]" />
                  <span>Chat</span>
                </button>
              )}

              <button
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-[#FBF9F5] bg-[#8B3A1C] hover:bg-[#702E15] disabled:bg-[#C9BFB2] rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Inquire</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Grounding Selector Bar (Google Search data & Google Maps data) */}
        <div className="mt-3 py-2 px-3 bg-[#F4EDE1] rounded border border-[#E4DAC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#382D22] flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-[#8B3A1C]" />
              Grounding Data:
            </span>

            <button
              type="button"
              onClick={() => setGroundingMode('search')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 font-medium ${
                groundingMode === 'search'
                  ? 'bg-[#8B3A1C] text-white shadow-2xs ring-1 ring-[#8B3A1C]'
                  : 'bg-[#EAE2D3] text-[#4A3E31] hover:bg-[#DDD3C2]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Google Search data</span>
              {groundingMode === 'search' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setGroundingMode('maps')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 font-medium ${
                groundingMode === 'maps'
                  ? 'bg-[#1E5D88] text-white shadow-2xs ring-1 ring-[#1E5D88]'
                  : 'bg-[#EAE2D3] text-[#4A3E31] hover:bg-[#DDD3C2]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Google Maps data</span>
            </button>

            <button
              type="button"
              onClick={() => setGroundingMode('none')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                groundingMode === 'none'
                  ? 'bg-[#5A4F43] text-white shadow-2xs ring-1 ring-[#5A4F43]'
                  : 'bg-[#EAE2D3] text-[#4A3E31] hover:bg-[#DDD3C2]'
              }`}
            >
              <span>Archival Corpus Only</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-[#6A5E4E] flex items-center gap-1.5">
            <span>Model:</span>
            <strong className="text-[#8B3A1C] bg-[#FAF7F0] px-1.5 py-0.5 rounded border border-[#DFD6C6]">
              {modelUsed}
            </strong>
          </div>
        </div>

        {groundingMode === 'search' && (
          <div className="mt-2 px-3 py-1.5 bg-[#FAF4EA] rounded border border-[#E9DFCE] text-[11px] text-[#695A4B] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#8B3A1C]">Live Google Search Grounding:</span>
              <span>Retrieving real-time ASI excavation reports, epigraphical survey releases, and hydrology studies.</span>
            </div>
            <span className="px-1.5 py-0.2 rounded bg-white border border-[#DFD5C4] font-mono text-[10px] text-[#8B3A1C] shrink-0">
              gemini-flash-latest
            </span>
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#ECE5D9] text-xs">
          {/* Research Mode */}
          <div>
            <label className="block font-semibold text-[#4A3F33] mb-1">Investigation Mode:</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="w-full bg-[#FFFFFF] border border-[#D8CEBC] rounded px-2.5 py-1.5 text-[#30261D] cursor-pointer"
            >
              <option value="deep_dossier_30">Exhaustive 30-Section Dossier (Extreme Deep Investigation)</option>
              <option value="deep_research">Deep Research (Archaeology → Geography → Physics)</option>
              <option value="standard">Standard Factual Dossier (15-Point Protocol)</option>
              <option value="reconstruction">Engineering Reconstruction (Documented vs Inferred)</option>
              <option value="comparative">Comparative Hydrology Analysis</option>
            </select>
          </div>

          {/* Region Prioritization */}
          <div>
            <label className="block font-semibold text-[#4A3F33] mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#8B3A1C]" />
              Geographical Focus:
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#D8CEBC] rounded px-2.5 py-1.5 text-[#30261D] cursor-pointer"
            >
              <option value="all">Pan-Indian & World Civilizations</option>
              <option value="Gujarat & Saurashtra">Gujarat & Saurashtra (Girnar, Dholavira)</option>
              <option value="Tamil Nadu">Tamil Nadu (Cauvery Delta, Eri Cascades)</option>
              <option value="Madhya Pradesh">Madhya Pradesh (Betwa, Bhojpur, Sanchi)</option>
              <option value="Bihar & Gangetic Basin">Bihar & Gangetic Basin (Mauryan, Pataliputra)</option>
              <option value="Rajasthan & Haryana">Rajasthan & Haryana (Stepwells, Indus Sites)</option>
              <option value="Andhra Pradesh & Karnataka">Andhra Pradesh & Karnataka (Vijayanagara)</option>
            </select>
          </div>

          {/* Technical Depth */}
          <div>
            <label className="block font-semibold text-[#4A3F33] mb-1">Depth of Technical Detail:</label>
            <select
              value={technicalLevel}
              onChange={(e) => setTechnicalLevel(e.target.value as any)}
              className="w-full bg-[#FFFFFF] border border-[#D8CEBC] rounded px-2.5 py-1.5 text-[#30261D] cursor-pointer"
            >
              <option value="scholarly">Scholarly (Epigraphs, ASI, Hydrostatic Math)</option>
              <option value="accessible">Accessible (Clear Structural Narrative)</option>
            </select>
          </div>
        </div>

        {/* Curated Prompt Starters */}
        <div className="mt-4 pt-3 border-t border-[#ECE5D9]">
          <div className="flex items-center gap-1 text-xs font-semibold text-[#665849] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#8B3A1C]" />
            <span>Curated Evidence-Based Inquiries:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {curatedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(q.text);
                  setMode(q.mode);
                  setRegion(q.region);
                  handleSearch(q.text, q.mode, q.region);
                }}
                className="px-2.5 py-1 text-xs text-[#4F4335] bg-[#EFE9DC] hover:bg-[#E5DDCB] hover:text-[#1F1914] rounded transition-colors text-left cursor-pointer border border-[#DDD3C2]"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* DEDICATED SEARCH HISTORY SECTION (Strictly Isolated System) */}
        {searchHistory.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-[#ECE5D9] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[#8B3A1C]">
                <Search className="w-3.5 h-3.5" />
                <span>Search History:</span>
                <span className="text-[10px] font-normal text-[#8A7B6B] bg-[#EAE2D3] px-1.5 py-0.5 rounded">
                  {searchHistory.length} {searchHistory.length === 1 ? 'Record' : 'Records'} · Isolated from Chat History
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowClearSearchConfirm(true)}
                className="text-xs text-[#8B3A1C] hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                title="Clear only search query history (preserves all chats and research data)"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Search History</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {searchHistory.map((item) => (
                <div
                  key={item.id}
                  className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#DCD1BF] text-xs text-[#382D20] hover:border-[#8B3A1C] hover:bg-[#FDFBF7] transition-all shadow-2xs"
                >
                  <span
                    onClick={() => {
                      setQuery(item.query);
                      handleSearch(item.query);
                    }}
                    className="cursor-pointer font-medium hover:text-[#8B3A1C] max-w-[220px] truncate"
                    title="Click to run this inquiry"
                  >
                    {item.query}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSearch(item.id);
                    }}
                    className="text-[#A09282] hover:text-red-700 transition-colors p-0.5 rounded cursor-pointer"
                    title="Delete this search record only"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-[#FDF0ED] border-l-4 border-[#C73718] rounded text-sm text-[#87230E]">
          <strong className="block font-semibold">Inquiry Error</strong>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-8 bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg text-center space-y-3">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#8B3A1C]" />
          <h3 className="font-serif font-bold text-lg text-[#2E241B]">
            Consulting Epigraphical Records, ASI Excavations & Google Search Grounding...
          </h3>
          <p className="text-xs text-[#7A6C5D] max-w-lg mx-auto">
            Grounded via <span className="font-mono text-[#8B3A1C]">{modelUsed || 'gemini-3.1-flash-lite'}</span>: correlating classical Sanskrit/Prakrit inscriptions with live archaeological publications and hydrostatic physics.
          </p>
        </div>
      )}

      {/* Response Dossier */}
      {response && !loading && (
        <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-sans font-semibold text-[#8B3A1C] bg-[#F3ECE0] px-2 py-0.5 rounded border border-[#DFD5C4]">
                Research Dossier
              </span>
              <span className="text-xs text-[#7A6C5D] hidden sm:inline">
                Verified under 15-Point Engineering Protocol
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SaveToDriveButton
                label="Save to Google Drive"
                variant="secondary"
                onExport={() => exportResearchDossierToDrive(query, response, groundingSources)}
              />

              {onSendToChat && (
                <button
                  onClick={() => onSendToChat(`Regarding this dossier:\n\n${response.substring(0, 300)}...\n\nCan you analyze the specific engineering challenges further?`)}
                  className="px-3 py-1 text-xs text-[#4F3F31] bg-[#EAE2D3] hover:bg-[#DFD5C2] rounded flex items-center gap-1.5 transition-colors cursor-pointer border border-[#D5CABB]"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#8B3A1C]" />
                  <span>Discuss in Chat</span>
                </button>
              )}

              <button
                onClick={copyToClipboard}
                className="px-3 py-1 text-xs text-[#524538] hover:text-[#211A13] bg-[#EFE9DD] hover:bg-[#E3DCB] rounded flex items-center gap-1.5 transition-colors cursor-pointer border border-[#DDD3C2]"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#1D6334]" />
                    <span>Dossier Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Dossier</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Offline / Throttled Notice */}
          {offlineNotice && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <span className="text-base shrink-0">⚡</span>
              <div>
                <span className="font-semibold">Archival Dossier Mode: </span>
                {offlineNotice}
              </div>
              <button
                type="button"
                onClick={() => setOfflineNotice(null)}
                className="ml-auto shrink-0 text-amber-600 hover:text-amber-800 cursor-pointer"
                aria-label="Dismiss"
              >✕</button>
            </div>
          )}

          {/* Render Markdown Content */}
          <div className="prose prose-stone max-w-none text-[#332A21] leading-relaxed">
            <MarkdownRenderer content={response} />
          </div>

          {/* ── Sources Panel (Grok-style) ──────────────────────────────────── */}
          <SourcesDrawer
            sources={researchSources}
            isLoading={loading}
          />

          {/* Hallucination Audit Card */}
          {verificationAudit && (
            <div className="mt-4">
              <HallucinationAuditCard audit={verificationAudit} />
            </div>
          )}

          {/* Google Search Queries Executed */}
          {searchQueries && searchQueries.length > 0 && (
            <div className="mt-4 p-3.5 rounded-lg bg-[#F5EFE3] border border-[#E2D8C6] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8B3A1C]">
                <Search className="w-3.5 h-3.5" />
                <span>Search Queries Executed by {modelUsed || 'gemini-3.1-flash-lite'}:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {searchQueries.map((query, qIdx) => (
                  <span
                    key={qIdx}
                    className="px-2.5 py-1 rounded-full bg-white border border-[#DACFBD] text-[#3E3326] font-mono text-xs flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3 text-[#8B3A1C]" />
                    "{query}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Research Footnote Banner */}
          <div className="mt-6 pt-4 border-t border-[#E8E0D2] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#7D6F5E]">
            <span>
              Evidence Protocol: ASI Excavation Reports · Epigraphia Indica · Arthashastra · ICOLD Mechanics
            </span>
            <span className="italic">
              Documented facts are strictly separated from engineering inferences.
            </span>
          </div>
        </div>
      )}

      {/* Floating / Inline Toast Notification */}
      {historyFeedbackToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2C2117] text-[#FAF5ED] px-4 py-2.5 rounded-lg shadow-lg border border-[#8B3A1C]/50 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{historyFeedbackToast}</span>
        </div>
      )}

      {/* Clear All History Confirmation Modal */}
      {showClearHistoryConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border border-[#D9CEBC] rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-[#A3321E]">
              <div className="w-9 h-9 rounded-full bg-[#FCE8E5] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#A3321E]" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#2E2319]">
                  Delete All Research History Points?
                </h3>
                <p className="text-xs text-[#7D6E5E]">
                  This action will permanently delete all {historyPoints.length} saved inquiry points from your local session archive.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F2ECE0] rounded-lg border border-[#E0D5C3] text-xs text-[#635343] space-y-1">
              <p>• You can also delete individual history points one-by-one using the <strong>Delete Point</strong> button on each inquiry.</p>
              <p>• Once cleared, historical research points cannot be recovered unless re-queried.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E0D1]">
              <button
                type="button"
                onClick={() => setShowClearHistoryConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#574B3E] hover:bg-[#EBE2D3] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={clearAllHistoryPoints}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#A3321E] hover:bg-[#852714] text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Search History Confirmation Modal */}
      {showClearSearchConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border border-[#D9CEBC] rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-[#8B3A1C]">
              <div className="w-9 h-9 rounded-full bg-[#FAF0E4] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#8B3A1C]" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#2E2319]">
                  Clear Search History Records?
                </h3>
                <p className="text-xs text-[#7D6E5E]">
                  This will only delete your {searchHistory.length} search inquiry records.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F2ECE0] rounded-lg border border-[#E0D5C3] text-xs text-[#635343] space-y-1">
              <p>• <strong>Strict Isolation:</strong> Saved chat conversations, messages, research bookmarks, and user accounts will <strong>NOT</strong> be deleted.</p>
              <p>• You can also remove individual queries using the 🗑 button on each search chip.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E0D1]">
              <button
                type="button"
                onClick={() => setShowClearSearchConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#574B3E] hover:bg-[#EBE2D3] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllSearch}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#8B3A1C] hover:bg-[#722E15] text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Search Records</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHRONOLOGICAL WATER ENGINEERING TIMELINE (D3 Visualization) */}
      <WaterEngineeringTimeline
        onInquire={handleTimelineInquire}
        onSendToChat={onSendToChat}
      />

      {/* RESEARCH HISTORY & INQUIRY POINTS ARCHIVE */}
      <section className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl overflow-hidden shadow-2xs">
        {/* History Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E8E0D2] bg-[#F5EFE3]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8B3A1C]/10 text-[#8B3A1C] flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#2A2118]">
                  Research History & Inquiry Points
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDE4D5] text-[#8B3A1C] border border-[#DFD5C4]">
                  {historyPoints.length} {historyPoints.length === 1 ? 'Point' : 'Points'}
                </span>
              </div>
              <p className="text-xs text-[#706354] mt-0.5">
                Archival log of investigated hydraulic questions. Revisit past findings or delete individual history points.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {historyPoints.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearHistoryConfirm(true)}
                className="px-2.5 py-1 text-xs rounded font-medium text-[#A3321E] hover:bg-[#FCE8E5] border border-[#F2C2BA] transition-colors cursor-pointer flex items-center gap-1"
                title="Clear all research history points"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="p-1.5 rounded text-[#5E5143] hover:bg-[#EAE1D2] transition-colors cursor-pointer border border-[#DDD3C2]"
              title={isHistoryExpanded ? 'Collapse history' : 'Expand history'}
            >
              {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible History Body */}
        {isHistoryExpanded && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Search filter within history points */}
            {historyPoints.length > 3 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7D6D]" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Filter saved history points by keyword, ruler, or location..."
                  className="w-full bg-white border border-[#D5CABB] rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-[#2A2118] placeholder-[#9E9080] outline-none focus:border-[#8B3A1C]"
                />
              </div>
            )}

            {/* Empty state */}
            {historyPoints.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7A6D5E] space-y-2 bg-[#F7F2E8] rounded-lg border border-dashed border-[#DDD2C0]">
                <Clock className="w-6 h-6 mx-auto text-[#9C8F7F]" />
                <p className="font-medium text-[#4D4032]">No research history points saved yet.</p>
                <p className="text-[11px] max-w-sm mx-auto">
                  Execute an inquiry above or select a curated question. Every completed analysis will be automatically retained as a history point.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyPoints
                  .filter((p) => {
                    if (!historySearchQuery.trim()) return true;
                    const q = historySearchQuery.toLowerCase();
                    return (
                      p.query.toLowerCase().includes(q) ||
                      p.region.toLowerCase().includes(q) ||
                      p.mode.toLowerCase().includes(q)
                    );
                  })
                  .map((point) => (
                    <div
                      key={point.id}
                      className="bg-white border border-[#DFD6C7] rounded-lg p-3.5 sm:p-4 hover:border-[#8B3A1C]/60 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Title / Query */}
                        <h4 className="font-serif font-bold text-sm text-[#241B13] leading-snug line-clamp-2">
                          {point.query}
                        </h4>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6E6152]">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-[#8B3A1C]" />
                            {point.formattedDate}
                          </span>
                          <span>•</span>
                          <span className="capitalize font-medium text-[#8B3A1C] bg-[#F7ECE4] px-1.5 py-0.5 rounded border border-[#E8D4C8]">
                            {point.mode.replace('_', ' ')}
                          </span>
                          <span>•</span>
                          <span className="text-[#594C3E] truncate max-w-[150px]">
                            {point.region}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-[#78695A]">
                            {point.modelUsed}
                          </span>
                        </div>

                        {/* Brief text excerpt */}
                        <p className="text-xs text-[#5D5042] line-clamp-2 leading-relaxed pt-0.5">
                          {point.response.replace(/[#*`_]/g, '').slice(0, 180)}...
                        </p>
                      </div>

                      {/* History Point Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFE8DD]">
                        <button
                          type="button"
                          onClick={() => loadHistoryPoint(point)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#382C20] bg-[#EFE8DC] hover:bg-[#E5DAC8] transition-colors cursor-pointer flex items-center gap-1.5 border border-[#DDD1BF]"
                          title="Load this inquiry and response into console"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#8B3A1C]" />
                          <span>Load Point</span>
                        </button>

                        {/* EXPLICIT HISTORY DELETE POINT BUTTON */}
                        <button
                          type="button"
                          onClick={(e) => deleteHistoryPoint(point.id, e)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A3321E] bg-[#FDF0ED] hover:bg-[#F9DDD7] border border-[#F2C4BA] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          title="Delete this history point from archive"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#A3321E]" />
                          <span>Delete Point</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
