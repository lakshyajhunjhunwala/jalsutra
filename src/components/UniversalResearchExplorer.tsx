import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Search,
  BookOpen,
  Layers,
  FileText,
  Copy,
  Check,
  Filter,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Compass,
  Droplets,
  Sprout,
  Activity,
  Share2,
  Loader2,
  AlertCircle,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import {
  StructuredResearchReport,
  StructuredSection,
  CANONICAL_39_SECTION_DEFINITIONS,
  SubjectType,
} from '../types/universalResearch.ts';
import { getApiUrl } from '../services/apiConfig.ts';

export interface UniversalResearchExplorerProps {
  report?: StructuredResearchReport | null;
  content?: string | null;
  subjectTitle?: string;
  subjectCategory?: string;
  subjectType?: SubjectType | string;
  researchId?: string;
  onSendToChat?: (text: string) => void;
  onExportToDrive?: () => void;
}

// 9 Standard Category Groupings mapping the Universal 39 Sections
export const CATEGORY_GROUPS = [
  { id: 'all', label: 'All 39 Sections', icon: Layers },
  { id: 'cat1', label: 'Overview & Identification (1–2)', icon: Compass, range: [1, 2] },
  { id: 'cat2', label: 'History, Builders & Inscriptions (3–7)', icon: BookOpen, range: [3, 7] },
  { id: 'cat3', label: 'Geometry, Components & Materials (8–11)', icon: Layers, range: [8, 11] },
  { id: 'cat4', label: 'Hydraulics, Hydrology & Soil (12–16)', icon: Droplets, range: [12, 16] },
  { id: 'cat5', label: 'Modern Analysis & Geospatial (17–22)', icon: Activity, range: [17, 22] },
  { id: 'cat6', label: 'Socio-Ecological & Epistemology (23–28)', icon: Sprout, range: [23, 28] },
  { id: 'cat7', label: 'Comparative Systems & Sources (29–30)', icon: Share2, range: [29, 30] },
  { id: 'cat8', label: 'Problems vs Solutions Matrix (31–35)', icon: ShieldCheck, range: [31, 35] },
  { id: 'cat9', label: 'Next-Gen Lessons & Verdict (36–39)', icon: Sparkles, range: [36, 39] },
];

function getCategoryGroupId(num: number): { id: string; label: string } {
  if (num <= 2) return { id: 'cat1', label: 'Overview & Identification' };
  if (num <= 7) return { id: 'cat2', label: 'History, Builders & Inscriptions' };
  if (num <= 11) return { id: 'cat3', label: 'Geometry, Components & Materials' };
  if (num <= 16) return { id: 'cat4', label: 'Hydraulics, Hydrology & Soil' };
  if (num <= 22) return { id: 'cat5', label: 'Modern Analysis & Geospatial' };
  if (num <= 28) return { id: 'cat6', label: 'Socio-Ecological & Epistemology' };
  if (num <= 30) return { id: 'cat7', label: 'Comparative Systems & Sources' };
  if (num <= 35) return { id: 'cat8', label: 'Problems vs Solutions Matrix' };
  return { id: 'cat9', label: 'Next-Gen Lessons & Verdict' };
}

// Canonical Section Titles Map
export const CANONICAL_SECTION_TITLES: { [key: number]: string } = Object.fromEntries(
  CANONICAL_39_SECTION_DEFINITIONS.map((d) => [d.number, d.title])
);

// Fallback parser to extract sections from raw markdown text
export function parseSectionsFromMarkdown(markdown: string): StructuredSection[] {
  if (!markdown) return [];

  const sections: StructuredSection[] = [];
  const sectionRegex = /^##\s+(\d+)[\.:\s]+(.*?)(?=\n##\s+\d+[\.:\s]|\n#[^#]|$)/gms;
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(markdown)) !== null) {
    const secNum = parseInt(match[1], 10);
    const rawTitle = match[2].split('\n')[0].trim();
    const sectionBody = match[2].slice(rawTitle.length).trim();
    const def = CANONICAL_39_SECTION_DEFINITIONS.find((d) => d.number === secNum);
    const cleanTitle = def?.title || rawTitle.replace(/\(.*?\)/g, '').trim();
    const catInfo = getCategoryGroupId(secNum);

    const topics: any[] = [];
    const bulletRegex = /(?:^|\n)[\*\-]\s+\*\*(.*?)\*\*[:\-]?\s*([\s\S]*?)(?=(?:\n[\*\-]\s+\*\*)|$)/g;
    let bMatch: RegExpExecArray | null;
    while ((bMatch = bulletRegex.exec(sectionBody)) !== null) {
      const pTitle = bMatch[1].trim();
      const pContent = bMatch[2].trim();
      if (pContent.length > 10) {
        topics.push({
          id: `sec-${secNum}-pt-${topics.length + 1}`,
          title: pTitle,
          content: pContent,
        });
      }
    }

    const words = sectionBody.split(/\s+/).filter(Boolean).length;
    sections.push({
      id: `section-${secNum}`,
      number: secNum,
      title: cleanTitle,
      categoryGroup: catInfo.label,
      categoryGroupId: catInfo.id,
      status: sectionBody.length > 20 ? 'ready' : 'not_loaded',
      content: sectionBody,
      topics: topics.length > 0 ? topics : undefined,
      wordCount: words,
      confidence: 'high',
    });
  }

  return sections;
}

export const UniversalResearchExplorer: React.FC<UniversalResearchExplorerProps> = ({
  report,
  content,
  subjectTitle,
  subjectCategory,
  subjectType = 'other',
  researchId,
  onSendToChat,
  onExportToDrive,
}) => {
  const [viewMode, setViewMode] = useState<'interactive' | 'document'>('interactive');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([1, 2]));
  const [loadingSections, setLoadingSections] = useState<Set<number>>(new Set());
  const [errorSections, setErrorSections] = useState<Map<number, string>>(new Map());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize or update section state
  const [sections, setSections] = useState<StructuredSection[]>(() => {
    if (report && Array.isArray(report.sections) && report.sections.length > 0) {
      return report.sections;
    }
    if (content) {
      const parsed = parseSectionsFromMarkdown(content);
      if (parsed.length > 0) return parsed;
    }
    return CANONICAL_39_SECTION_DEFINITIONS.map((def) => ({
      id: `section-${def.number}`,
      number: def.number,
      title: def.title,
      categoryGroup: def.categoryGroup,
      categoryGroupId: def.categoryGroupId,
      status: 'not_loaded',
      content: '',
      topics: [
        {
          id: `section-${def.number}-topic-1`,
          title: def.defaultTopicTitle,
          content: '',
        },
      ],
      sources: [],
    }));
  });

  // Keep sections synced when report or content changes
  useEffect(() => {
    if (report && Array.isArray(report.sections) && report.sections.length > 0) {
      setSections(report.sections);
      return;
    }
    if (content) {
      const parsed = parseSectionsFromMarkdown(content);
      if (parsed.length > 0) {
        // Merge with existing canonical list so all 39 sections exist
        const merged: StructuredSection[] = CANONICAL_39_SECTION_DEFINITIONS.map((def) => {
          const found = parsed.find((p) => p.number === def.number);
          if (found) return found;
          return {
            id: `section-${def.number}`,
            number: def.number,
            title: def.title,
            categoryGroup: def.categoryGroup,
            categoryGroupId: def.categoryGroupId,
            status: 'not_loaded',
            content: '',
            topics: [
              {
                id: `section-${def.number}-topic-1`,
                title: def.defaultTopicTitle,
                content: '',
              },
            ],
            sources: [],
          };
        });
        setSections(merged);
      }
    }
  }, [report, content]);

  const displayTitle = subjectTitle || report?.subject || 'Research Dossier';

  // Detect subject category badge
  const detectedCategory = useMemo(() => {
    if (subjectCategory) return subjectCategory;
    if (report?.subjectCategory) return report.subjectCategory;
    const lower = (String(content || '') + ' ' + displayTitle).toLowerCase();
    if (lower.includes('soil') || lower.includes('bhumi-pariksha') || lower.includes('texture')) return '🌾 Soil Science & Texture';
    if (lower.includes('channel') || lower.includes('canal') || lower.includes('tusaspha')) return '🌊 Water Channels & Aqueducts';
    if (lower.includes('drainage') || lower.includes('sewer') || lower.includes('mohenjo')) return '💧 Drainage & Subsurface Sanitation';
    if (lower.includes('flood') || lower.includes('spillway') || lower.includes('inundation')) return '🛡️ Flood Management & Diversion Weirs';
    if (lower.includes('irrigation') || lower.includes('command area') || lower.includes('cascade tank') || lower.includes('eri')) return '🌿 Irrigation Networks & Cascade Tanks';
    if (lower.includes('dam') || lower.includes('reservoir') || lower.includes('anicut') || lower.includes('bund')) return '🏛️ Dams & Reservoirs';
    return '🔬 Integrated Water & Environmental Systems';
  }, [content, displayTitle, subjectCategory, report?.subjectCategory]);

  const effectiveSubjectType = report?.subjectType || subjectType || 'other';
  const effectiveResearchId = report?.id || researchId || 'current';

  // Fetch a section on demand from backend API
  const fetchSectionContent = async (secNum: number, secTitle: string) => {
    setLoadingSections((prev) => new Set(prev).add(secNum));
    setErrorSections((prev) => {
      const next = new Map(prev);
      next.delete(secNum);
      return next;
    });

    try {
      const url = getApiUrl(
        `/api/research/${effectiveResearchId}/sections/section-${secNum}?subject=${encodeURIComponent(
          displayTitle
        )}&subjectType=${encodeURIComponent(effectiveSubjectType)}`
      );

      let res = await fetch(url);
      if (!res.ok) {
        // Fallback to POST /api/research/section
        res = await fetch(getApiUrl('/api/research/section'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            researchId: effectiveResearchId,
            sectionId: `section-${secNum}`,
            sectionNumber: secNum,
            sectionTitle: secTitle,
            subject: displayTitle,
            subjectType: effectiveSubjectType,
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data: StructuredSection = await res.json();

      setSections((prev) =>
        prev.map((s) => (s.number === secNum ? { ...s, ...data, status: 'ready' } : s))
      );
    } catch (err: any) {
      console.error(`Failed to load section ${secNum}:`, err);
      const msg = err.message || 'Failed to research this section. Click retry.';
      setErrorSections((prev) => new Map(prev).set(secNum, msg));
      setSections((prev) =>
        prev.map((s) => (s.number === secNum ? { ...s, status: 'error', error: msg } : s))
      );
    } finally {
      setLoadingSections((prev) => {
        const next = new Set(prev);
        next.delete(secNum);
        return next;
      });
    }
  };

  // Toggle a section's accordion
  const toggleSection = async (secNum: number) => {
    // If open, close it
    if (expandedSections.has(secNum)) {
      setExpandedSections((prev) => {
        const next = new Set(prev);
        next.delete(secNum);
        return next;
      });
      return;
    }

    // Expand it
    setExpandedSections((prev) => new Set(prev).add(secNum));

    // Check if content already cached
    const sec = sections.find((s) => s.number === secNum);
    if (!sec) return;

    if (sec.status === 'ready' && sec.content && sec.content.trim().length > 30) {
      return; // Already loaded and cached
    }

    // Not loaded yet — trigger on-demand research
    await fetchSectionContent(secNum, sec.title);
  };

  // Expand / collapse all
  const handleExpandAll = async () => {
    const allNums = new Set(sections.map((s) => s.number));
    setExpandedSections(allNums);

    // Find un-loaded sections
    const unLoaded = sections.filter(
      (s) => s.status !== 'ready' || !s.content || s.content.trim().length < 30
    );

    // Load un-loaded sections with controlled concurrency (3 at a time)
    for (let i = 0; i < unLoaded.length; i += 3) {
      const chunk = unLoaded.slice(i, i + 3);
      await Promise.allSettled(chunk.map((s) => fetchSectionContent(s.number, s.title)));
    }
  };

  const handleCollapseAll = () => {
    setExpandedSections(new Set());
    setExpandedSubtopics(new Set());
  };

  // Toggle subtopic point
  const toggleSubtopic = (subId: string) => {
    setExpandedSubtopics((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) {
        next.delete(subId);
      } else {
        next.add(subId);
      }
      return next;
    });
  };

  // Copy helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter sections by category and search query
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      // Category filter
      if (categoryFilter !== 'all' && sec.categoryGroupId !== categoryFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = sec.title.toLowerCase().includes(q);
        const matchesContent = (sec.content || '').toLowerCase().includes(q);
        const matchesTopics = (sec.topics || []).some(
          (sub) => sub.title.toLowerCase().includes(q) || (sub.content || '').toLowerCase().includes(q)
        );
        return matchesTitle || matchesContent || matchesTopics;
      }
      return true;
    });
  }, [sections, categoryFilter, searchQuery]);

  // Total ready word count
  const readySectionsCount = useMemo(() => {
    return sections.filter((s) => s.status === 'ready' && s.content && s.content.length > 30).length;
  }, [sections]);

  // Full assembled report text for document view
  const fullDocumentMarkdown = useMemo(() => {
    if (content && content.length > 500) return content;
    const parts = [`# ${displayTitle.toUpperCase()} — COMPLETE RESEARCH REPORT\n`];
    sections.forEach((s) => {
      parts.push(`## ${s.number}. ${s.title}`);
      if (s.content && s.content.trim()) {
        parts.push(s.content);
      } else {
        parts.push(`*(Section ${s.number} research pending on-demand investigation)*\n`);
      }
    });
    return parts.join('\n\n');
  }, [content, displayTitle, sections]);

  return (
    <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl overflow-hidden shadow-xs space-y-0">
      {/* ── Explorer Header Bar ────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 bg-[#F5EFE3] border-b border-[#E8E0D2] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#8B3A1C] text-white shadow-2xs">
              {detectedCategory}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#EAE1D1] text-[#695847] border border-[#D8CCBA] text-[11px] font-mono">
              Universal 39-Section Protocol
            </span>
            <span className="px-2 py-0.5 rounded bg-[#FAF4EB] text-[#8B3A1C] border border-[#E2D2BE] text-[11px] font-semibold">
              {readySectionsCount} / 39 Sections Researched
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2A2117] tracking-tight">
            {displayTitle}
          </h2>
          <p className="text-xs text-[#706253]">
            Click any section heading or arrow below to investigate verified 200–300-word engineering analyses, primary inscriptions, and soil physics directly on this page.
          </p>
        </div>

        {/* View Mode & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg border border-[#D5CABB] bg-white p-0.5 shadow-2xs text-xs">
            <button
              type="button"
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1 rounded font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'interactive'
                  ? 'bg-[#8B3A1C] text-white shadow-xs'
                  : 'text-[#635343] hover:text-[#251C15]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive Explorer</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('document')}
              className={`px-3 py-1 rounded font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'document'
                  ? 'bg-[#8B3A1C] text-white shadow-xs'
                  : 'text-[#635343] hover:text-[#251C15]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Document View</span>
            </button>
          </div>

          {/* Copy Full Dossier */}
          <button
            type="button"
            onClick={() => handleCopy('full-dossier', fullDocumentMarkdown)}
            className="px-2.5 py-1.5 text-xs rounded bg-white hover:bg-[#FAF6EE] text-[#4F3F30] border border-[#D5CABB] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Copy entire research report"
          >
            {copiedId === 'full-dossier' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#8B3A1C]" />
                <span>Copy All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE EXPLORER VIEW ──────────────────────────────────── */}
      {viewMode === 'interactive' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Toolbar: Category Filters, Search, Expand/Collapse, Metrics */}
          <div className="space-y-3 pb-3 border-b border-[#ECE3D4]">
            {/* Search and Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Live Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7D6E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics, civil physics, soil horizons, or inscriptions..."
                  className="w-full bg-white border border-[#D5CABB] focus:border-[#8B3A1C] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#2A2118] placeholder-[#9C8F80] outline-none transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8A7969] hover:text-[#251B13]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Metrics & Expand/Collapse Controls */}
              <div className="flex items-center gap-2 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-2.5 py-1 text-xs rounded bg-white hover:bg-[#F8F4EB] text-[#47382B] border border-[#D5CABB] flex items-center gap-1 font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#8B3A1C]" />
                  <span>Expand All</span>
                </button>

                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-2.5 py-1 text-xs rounded bg-white hover:bg-[#F8F4EB] text-[#47382B] border border-[#D5CABB] flex items-center gap-1 font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-[#8B3A1C]" />
                  <span>Collapse All</span>
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[#847363] text-[11px] font-semibold shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#8B3A1C]" />
                Filter:
              </span>
              {CATEGORY_GROUPS.map((cat) => {
                const Icon = cat.icon;
                const isActive = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 text-[11px] font-medium border ${
                      isActive
                        ? 'bg-[#8B3A1C] text-white border-[#8B3A1C] shadow-2xs'
                        : 'bg-white text-[#574A3D] border-[#DDD2C0] hover:bg-[#F7F1E6]'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Empty search state */}
          {filteredSections.length === 0 && (
            <div className="p-8 text-center bg-white rounded-lg border border-dashed border-[#D5CABB] text-xs text-[#7A6C5D] space-y-2">
              <p className="font-semibold text-sm text-[#382D22]">No research points match "{searchQuery}"</p>
              <p>Try clearing your search query or selecting a different category filter.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                className="mt-2 px-3 py-1 bg-[#8B3A1C] text-white rounded font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* ── ACCORDION LIST: 39 SECTIONS WITH ON-DEMAND EXPANSION ────────── */}
          <div className="space-y-3">
            {filteredSections.map((sec) => {
              const isSecOpen = expandedSections.has(sec.number);
              const isLoading = loadingSections.has(sec.number);
              const isError = errorSections.has(sec.number) || sec.status === 'error';
              const isReady = sec.status === 'ready' && !!sec.content && sec.content.trim().length > 20;
              const hasSubtopics = Array.isArray(sec.topics) && sec.topics.length > 1;

              return (
                <div
                  key={sec.number}
                  className={`border rounded-lg overflow-hidden transition-all shadow-2xs ${
                    isSecOpen ? 'border-[#C8B8A2] bg-[#FCFBF8]' : 'border-[#DFD6C7] bg-white hover:border-[#8B3A1C]/50'
                  }`}
                >
                  {/* Section Main Header (Clickable Accordion Row) */}
                  <div
                    onClick={() => toggleSection(sec.number)}
                    className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                      isSecOpen ? 'bg-[#FAF4EB] border-b border-[#ECE2D2]' : 'hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded bg-[#F2EAE0] text-[#8B3A1C] font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-[#E0D4C2]">
                        {sec.number}
                      </span>
                      <h3 className="font-serif font-bold text-sm sm:text-base text-[#271E15] truncate">
                        {sec.title}
                      </h3>
                      <span className="hidden sm:inline-block text-[10px] text-[#8E7E6E] bg-[#F7F2E8] px-1.5 py-0.5 rounded border border-[#E5DAC8] shrink-0 font-medium">
                        {sec.categoryGroup}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* State Badges */}
                      {isLoading ? (
                        <span className="text-[11px] font-medium text-[#8B3A1C] bg-[#FAF1E9] px-2 py-0.5 rounded-full border border-[#EED7C8] flex items-center gap-1 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Investigating...</span>
                        </span>
                      ) : isError ? (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Needs Retry</span>
                        </span>
                      ) : isReady ? (
                        <span className="text-[10px] text-[#7C6C5B] font-mono bg-[#EFE8DC] px-2 py-0.5 rounded border border-[#DFD4C2]">
                          ~{sec.wordCount || sec.content?.split(/\s+/).filter(Boolean).length || 250} words
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8C7D6D] italic">
                          Click to investigate
                        </span>
                      )}

                      {/* Expand / Collapse Indicator */}
                      <div className="p-1 rounded text-[#706050] hover:bg-[#EAE0D1] transition-transform">
                        {isSecOpen ? (
                          <ChevronDown className="w-4 h-4 text-[#8B3A1C]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#8B3A1C]" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Body (Visible when expanded) */}
                  {isSecOpen && (
                    <div className="p-4 sm:p-5 bg-white space-y-4 animate-in fade-in duration-150">
                      {/* 1. Loading State */}
                      {isLoading && (
                        <div className="p-6 bg-[#FAF7F0] border border-[#E4DACB] rounded-lg flex items-center justify-center gap-3 text-xs text-[#8B3A1C]">
                          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                          <div className="space-y-0.5">
                            <p className="font-semibold text-sm text-[#2F241A]">
                              Investigating Section {sec.number}: {sec.title}...
                            </p>
                            <p className="text-[11px] text-[#78695A]">
                              Querying primary epigraphs, geotechnical data, and hydraulic principles for "{displayTitle}".
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 2. Error State with Retry */}
                      {!isLoading && isError && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2.5">
                          <div className="flex items-center gap-2 font-semibold text-amber-800 text-sm">
                            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>Research request encountered an error</span>
                          </div>
                          <p className="text-xs text-amber-800 leading-relaxed">
                            {errorSections.get(sec.number) || sec.error || 'Could not retrieve research data for this section.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => fetchSectionContent(sec.number, sec.title)}
                            className="px-3.5 py-1.5 bg-[#8B3A1C] hover:bg-[#722E15] text-white rounded font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retry Section Research</span>
                          </button>
                        </div>
                      )}

                      {/* 3. Ready State: Detailed Researched Content (200-300 words) */}
                      {!isLoading && isReady && (
                        <div className="space-y-4">
                          {/* Case A: Multiple Subtopics exist */}
                          {hasSubtopics ? (
                            <div className="space-y-2.5">
                              {sec.topics!.map((sub) => {
                                const isSubOpen = expandedSubtopics.has(sub.id);
                                return (
                                  <div
                                    key={sub.id}
                                    className="border border-[#E4DACB] rounded-md bg-[#FCFBF8] overflow-hidden transition-all shadow-2xs"
                                  >
                                    <div
                                      onClick={() => toggleSubtopic(sub.id)}
                                      className={`px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer select-none transition-colors ${
                                        isSubOpen ? 'bg-[#FAF4EB] border-b border-[#E8DDCC]' : 'hover:bg-[#FAF7F0]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[#8B3A1C] font-bold text-xs select-none">
                                          {isSubOpen ? '▼' : '▶'}
                                        </span>
                                        <span className="font-sans font-semibold text-xs sm:text-sm text-[#2C2219] truncate">
                                          {sub.title}
                                        </span>
                                      </div>
                                    </div>

                                    {isSubOpen && (
                                      <div className="p-3.5 sm:p-4 text-xs sm:text-sm text-[#30251B] leading-relaxed bg-white">
                                        <MarkdownRenderer content={sub.content} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}

                          {/* Primary 200–300 words Narrative Content */}
                          <div className="prose prose-stone max-w-none text-xs sm:text-sm text-[#2E2319] leading-relaxed p-3.5 sm:p-4 bg-[#FCFBF8] rounded-lg border border-[#E8DFD1]">
                            <MarkdownRenderer content={sec.content || ''} />
                          </div>

                          {/* Verified Source Citations */}
                          {sec.sources && sec.sources.length > 0 && (
                            <div className="p-3 rounded-lg bg-[#F7F2E7] border border-[#E5DAC7] space-y-1.5 text-xs">
                              <span className="font-semibold text-[#8B3A1C] flex items-center gap-1.5 text-[11px]">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Verified Research Citations:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {sec.sources.map((src, srcIdx) => (
                                  <a
                                    key={srcIdx}
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#DACFBD] text-[#3E3326] text-[11px] hover:text-[#8B3A1C] hover:border-[#8B3A1C] transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3 text-[#8B3A1C]" />
                                    <span>{src.title || src.url}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Uncertainties & Evidence Limitations Note */}
                          {sec.limitations && (
                            <p className="text-[11px] text-[#786959] italic px-1">
                              <strong>Evidence Note:</strong> {sec.limitations}
                            </p>
                          )}

                          {/* Section Action Footer Bar */}
                          <div className="pt-2.5 border-t border-[#EFE7D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#7C6C5C]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] bg-[#EAE1D1] px-1.5 py-0.5 rounded text-[#5C4D3E]">
                                Section #{sec.number}
                              </span>
                              <span className="text-[11px]">
                                Evidence Confidence: <strong>{sec.confidence ? sec.confidence.toUpperCase() : 'HIGH'}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {/* Copy Section */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(
                                    `sec-${sec.number}`,
                                    `## ${sec.number}. ${sec.title}\n\n${sec.content}`
                                  )
                                }
                                className="px-2.5 py-1 rounded bg-white hover:bg-[#F8F4EB] text-[#47382B] border border-[#D5CABB] flex items-center gap-1 font-medium transition-colors cursor-pointer text-xs"
                              >
                                {copiedId === `sec-${sec.number}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-[#8B3A1C]" />
                                    <span>Copy Section</span>
                                  </>
                                )}
                              </button>

                              {/* Discuss Section in Chat (Only this section) */}
                              {onSendToChat && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSendToChat(
                                      `Regarding Section ${sec.number} (${sec.title}) for "${displayTitle}":\n\n${(sec.content || '').slice(
                                        0,
                                        450
                                      )}...\n\nCan you analyze the technical civil engineering and historical evidence for this specific topic further?`
                                    )
                                  }
                                  className="px-3 py-1 rounded bg-[#FAF1E9] hover:bg-[#F3E5D7] text-[#8B3A1C] border border-[#E8D4C8] flex items-center gap-1.5 font-medium transition-colors cursor-pointer text-xs"
                                  title="Send only this section to chat for specific follow-up questions"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Discuss Section in Chat →</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. Not Loaded Placeholder (if somehow opened before request starts) */}
                      {!isLoading && !isReady && !isError && (
                        <div className="p-5 text-center bg-[#FAF7F0] rounded-lg border border-dashed border-[#DDD2BF] space-y-2">
                          <p className="text-xs text-[#6F5F4F]">
                            Detailed research content for Section {sec.number} has not been generated yet.
                          </p>
                          <button
                            type="button"
                            onClick={() => fetchSectionContent(sec.number, sec.title)}
                            className="px-3 py-1.5 bg-[#8B3A1C] text-white rounded text-xs font-semibold cursor-pointer shadow-2xs hover:bg-[#722E15] transition-colors"
                          >
                            Investigate Section {sec.number} Now
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FULL DOCUMENT REPORT VIEW ──────────────────────────────────── */}
      {viewMode === 'document' && (
        <div className="p-6 bg-white space-y-4">
          <div className="prose prose-stone max-w-none text-[#2D2319] leading-relaxed">
            <MarkdownRenderer content={fullDocumentMarkdown} />
          </div>
        </div>
      )}
    </div>
  );
};
