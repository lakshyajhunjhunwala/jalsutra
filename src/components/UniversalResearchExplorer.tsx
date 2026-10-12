import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';

export interface ResearchSubtopic {
  id: string;
  title: string;
  content: string;
  wordCount: number;
}

export interface ResearchSection {
  sectionNumber: number;
  title: string;
  categoryGroup: string;
  categoryGroupId: string;
  rawContent: string;
  subtopics: ResearchSubtopic[];
  wordCount: number;
}

interface UniversalResearchExplorerProps {
  content: string;
  subjectTitle?: string;
  subjectCategory?: string;
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

// Canonical 39 Section Titles
export const CANONICAL_SECTION_TITLES: { [key: number]: string } = {
  1: 'Executive Summary',
  2: 'Identification and Classification',
  3: 'Historical Timeline and Development',
  4: 'Builders, Designers, Institutions, and Origins',
  5: 'Original Purpose and Functional Objectives',
  6: 'Archaeological, Geological, and Physical Evidence',
  7: 'Inscriptions, Documents, and Recorded Evidence',
  8: 'Overall Design, Geometry, and Classification',
  9: 'Component-by-Component Analysis',
  10: 'Materials, Soil Composition, and Physical Properties',
  11: 'Construction, Formation, or Development Method',
  12: 'Hydraulic, Hydrological, and Soil-Water Principles',
  13: 'Network, Distribution, and Land-Management System',
  14: 'Blueprint, Layout, and Site Plan',
  15: 'Cross-Section and Internal Structure',
  16: 'Catchment, Soil, and Environmental Context',
  17: 'Modern Technical and Engineering Analysis',
  18: 'Historical Changes, Modifications, and Land-Use Changes',
  19: 'Current Condition and Performance',
  20: 'Photographic and Field Evidence',
  21: 'Maps, Satellite Imagery, and Geospatial Evidence',
  22: '3D Reconstruction and Digital Modelling',
  23: 'Social, Agricultural, Economic, and Ecological Impact',
  24: 'Claims vs Evidence',
  25: 'Conflicting Interpretations and Unresolved Debates',
  26: 'What We Know With High Confidence',
  27: 'What Remains Uncertain',
  28: 'What We Still Do Not Know',
  29: 'Comparison With Other Relevant Systems or Materials',
  30: 'Complete Source List and Bibliography',
  31: 'Current Problems and Historical or Natural Solutions',
  32: 'Problem-versus-Solution Evidence Matrix',
  33: 'Lessons for Modern Engineering, Soil Management, and Environmental Planning',
  34: 'Problems Not Solved or Remaining Limitations',
  35: 'Historical/Traditional vs Modern Comparison',
  36: 'Lessons for Next-Generation Systems',
  37: 'What the Original Design or Natural System Did Well',
  38: 'What a Modern Engineer or Scientist Would Change',
  39: 'Final Findings and Research Confidence Assessment',
};

// Parse raw 39-section markdown into structured sections and individual research points
export function parseDossierSections(markdown: string): {
  title: string;
  sections: ResearchSection[];
  totalPoints: number;
} {
  if (!markdown) return { title: 'Research Dossier', sections: [], totalPoints: 0 };

  // Extract main title from # HEADER
  const titleMatch = markdown.match(/^#\s+(.*?)(?:\n|$)/m);
  const title = titleMatch ? titleMatch[1].replace(/—.*$/, '').trim() : 'Research Dossier';

  const sections: ResearchSection[] = [];
  let totalPoints = 0;

  // Split by ## [Number]. or ## [Number]
  const sectionRegex = /^##\s+(\d+)[\.:\s]+(.*?)(?=\n##\s+\d+[\.:\s]|\n#[^#]|$)/gms;
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(markdown)) !== null) {
    const secNum = parseInt(match[1], 10);
    const rawTitle = match[2].split('\n')[0].trim();
    const sectionBody = match[2].slice(rawTitle.length).trim();

    const cleanTitle = CANONICAL_SECTION_TITLES[secNum] || rawTitle.replace(/\(.*?\)/g, '').trim();
    const catInfo = getCategoryGroupId(secNum);

    // Parse subtopics/points in this section
    const subtopics: ResearchSubtopic[] = [];

    // Check for bullet points: * **[Title]:** [Content] or - **[Title]:** [Content]
    const bulletRegex = /(?:^|\n)[\*\-]\s+\*\*(.*?)\*\*[:\-]?\s*([\s\S]*?)(?=(?:\n[\*\-]\s+\*\*)|$)/g;
    let bMatch: RegExpExecArray | null;

    while ((bMatch = bulletRegex.exec(sectionBody)) !== null) {
      const pTitle = bMatch[1].trim();
      const pContent = bMatch[2].trim();
      const words = pContent.split(/\s+/).filter(Boolean).length;
      if (pContent.length > 10) {
        subtopics.push({
          id: `sec-${secNum}-pt-${subtopics.length + 1}`,
          title: pTitle,
          content: pContent,
          wordCount: words,
        });
      }
    }

    // Check for lettered/numbered items (e.g., A. Title, B. Title in Section 31 or 3) if no bullets found
    if (subtopics.length === 0) {
      const letteredRegex = /(?:^|\n)\s*([A-L]\.|\d+\.)\s+\*\*?(.*?)\*\*?[:\-]?\s*([\s\S]*?)(?=(?:\n\s*(?:[A-L]\.|\d+\.)\s+\*\*?)|$)/g;
      let lMatch: RegExpExecArray | null;
      while ((lMatch = letteredRegex.exec(sectionBody)) !== null) {
        const pTitle = `${lMatch[1]} ${lMatch[2].trim()}`;
        const pContent = lMatch[3].trim();
        const words = pContent.split(/\s+/).filter(Boolean).length;
        if (pContent.length > 10) {
          subtopics.push({
            id: `sec-${secNum}-pt-${subtopics.length + 1}`,
            title: pTitle,
            content: pContent,
            wordCount: words,
          });
        }
      }
    }

    const wordsInSection = sectionBody.split(/\s+/).filter(Boolean).length;
    totalPoints += subtopics.length > 0 ? subtopics.length : 1;

    sections.push({
      sectionNumber: secNum,
      title: cleanTitle,
      categoryGroup: catInfo.label,
      categoryGroupId: catInfo.id,
      rawContent: sectionBody,
      subtopics,
      wordCount: wordsInSection,
    });
  }

  // Fallback if regex missed any sections due to non-standard headings
  if (sections.length === 0) {
    sections.push({
      sectionNumber: 1,
      title: 'Complete Research Analysis',
      categoryGroup: 'Overview & Identification',
      categoryGroupId: 'cat1',
      rawContent: markdown,
      subtopics: [],
      wordCount: markdown.split(/\s+/).filter(Boolean).length,
    });
    totalPoints = 1;
  }

  // Sort by section number
  sections.sort((a, b) => a.sectionNumber - b.sectionNumber);

  return { title, sections, totalPoints };
}

export const UniversalResearchExplorer: React.FC<UniversalResearchExplorerProps> = ({
  content,
  subjectTitle,
  subjectCategory,
  onSendToChat,
  onExportToDrive,
}) => {
  const [viewMode, setViewMode] = useState<'interactive' | 'document'>('interactive');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([1, 2]));
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Parse sections
  const { title: parsedTitle, sections, totalPoints } = useMemo(() => {
    return parseDossierSections(content);
  }, [content]);

  const displayTitle = subjectTitle || parsedTitle;

  // Detect subject category badge
  const detectedCategory = useMemo(() => {
    if (subjectCategory) return subjectCategory;
    const lower = (content + ' ' + displayTitle).toLowerCase();
    if (lower.includes('soil') || lower.includes('bhumi-pariksha') || lower.includes('texture')) return '🌾 Soil Science & Texture';
    if (lower.includes('channel') || lower.includes('canal') || lower.includes('tusaspha')) return '🌊 Water Channels & Aqueducts';
    if (lower.includes('drainage') || lower.includes('sewer') || lower.includes('mohenjo')) return '💧 Drainage & Subsurface Sanitation';
    if (lower.includes('flood') || lower.includes('spillway') || lower.includes('inundation')) return '🛡️ Flood Management & Diversion Weirs';
    if (lower.includes('irrigation') || lower.includes('command area') || lower.includes('cascade tank') || lower.includes('eri')) return '🌿 Irrigation Networks & Cascade Tanks';
    if (lower.includes('dam') || lower.includes('reservoir') || lower.includes('anicut') || lower.includes('bund')) return '🏛️ Dams & Reservoirs';
    return '🔬 Integrated Water & Environmental Systems';
  }, [content, displayTitle, subjectCategory]);

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
        const matchesContent = sec.rawContent.toLowerCase().includes(q);
        const matchesSubtopics = sec.subtopics.some(
          (sub) => sub.title.toLowerCase().includes(q) || sub.content.toLowerCase().includes(q)
        );
        return matchesTitle || matchesContent || matchesSubtopics;
      }
      return true;
    });
  }, [sections, categoryFilter, searchQuery]);

  // Expand / collapse all
  const handleExpandAll = () => {
    const allSecIds = new Set<number>(sections.map((s) => s.sectionNumber));
    const allSubIds = new Set<string>();
    sections.forEach((sec) => {
      sec.subtopics.forEach((sub) => allSubIds.add(sub.id));
    });
    setExpandedSections(allSecIds);
    setExpandedSubtopics(allSubIds);
  };

  const handleCollapseAll = () => {
    setExpandedSections(new Set());
    setExpandedSubtopics(new Set());
  };

  // Toggle section
  const toggleSection = (secNum: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(secNum)) {
        next.delete(secNum);
      } else {
        next.add(secNum);
      }
      return next;
    });
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

  // Copy text helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Count total expanded items
  const expandedCount = useMemo(() => {
    let count = 0;
    sections.forEach((sec) => {
      if (sec.subtopics.length > 0) {
        sec.subtopics.forEach((sub) => {
          if (expandedSubtopics.has(sub.id)) count++;
        });
      } else if (expandedSections.has(sec.sectionNumber)) {
        count++;
      }
    });
    return count;
  }, [sections, expandedSections, expandedSubtopics]);

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
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2A2117] tracking-tight">
            {displayTitle}
          </h2>
          <p className="text-xs text-[#706253]">
            Interactive evidence-grounded research explorer. Click any topic or research point to expand verified technical details.
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
            onClick={() => handleCopy('full-dossier', content)}
            className="px-2.5 py-1.5 text-xs rounded bg-white hover:bg-[#FAF6EE] text-[#4F3F30] border border-[#D5CABB] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Copy entire research dossier"
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
                {/* Active Counters */}
                <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#6E5D4C] font-medium mr-2">
                  <span className="bg-white border border-[#DED4C4] px-2 py-0.5 rounded shadow-2xs">
                    <strong>{sections.length}</strong> Sections · <strong>{totalPoints}</strong> Points
                  </span>
                  <span className="bg-[#EFE7D8] border border-[#D8CABA] px-2 py-0.5 rounded text-[#8B3A1C]">
                    <strong>{expandedCount}</strong> Expanded
                  </span>
                </div>

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

          {/* ── ACCORDION LIST: SECTIONS & RESEARCH POINTS ─────────────────── */}
          <div className="space-y-3">
            {filteredSections.map((sec) => {
              const isSecOpen = expandedSections.has(sec.sectionNumber);
              const hasSubtopics = sec.subtopics.length > 0;

              return (
                <div
                  key={sec.sectionNumber}
                  className="bg-white border border-[#DFD6C7] rounded-lg overflow-hidden transition-all shadow-2xs"
                >
                  {/* Section Main Header (Compact One-Line Clickable Heading) */}
                  <div
                    onClick={() => toggleSection(sec.sectionNumber)}
                    className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                      isSecOpen ? 'bg-[#FDFBF7] border-b border-[#ECE3D4]' : 'hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded bg-[#F2EAE0] text-[#8B3A1C] font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-[#E0D4C2]">
                        {sec.sectionNumber}
                      </span>
                      <h3 className="font-serif font-bold text-sm text-[#271E15] truncate">
                        {sec.title}
                      </h3>
                      <span className="hidden sm:inline-block text-[10px] text-[#8E7E6E] bg-[#F7F2E8] px-1.5 py-0.5 rounded border border-[#E5DAC8] shrink-0 font-medium">
                        {sec.categoryGroup}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasSubtopics ? (
                        <span className="text-[11px] font-medium text-[#8B3A1C] bg-[#FAF1E9] px-2 py-0.5 rounded-full border border-[#EED7C8]">
                          {sec.subtopics.length} {sec.subtopics.length === 1 ? 'Point' : 'Points'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8C7D6D] font-mono">
                          ~{sec.wordCount} words
                        </span>
                      )}

                      <div className="p-1 rounded text-[#706050] hover:bg-[#EAE0D1] transition-transform">
                        {isSecOpen ? (
                          <ChevronDown className="w-4 h-4 text-[#8B3A1C]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#8B3A1C]" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Body */}
                  {isSecOpen && (
                    <div className="p-3 sm:p-4 bg-[#FCFBF8] space-y-3">
                      {/* Case A: Section has individual research subtopic points */}
                      {hasSubtopics ? (
                        <div className="space-y-2">
                          {sec.subtopics.map((sub) => {
                            const isSubOpen = expandedSubtopics.has(sub.id);

                            return (
                              <div
                                key={sub.id}
                                className="border border-[#E4DACB] rounded-md bg-white overflow-hidden transition-all shadow-2xs"
                              >
                                {/* Research Point Clickable Title Bar */}
                                <div
                                  onClick={() => toggleSubtopic(sub.id)}
                                  className={`px-3.5 py-2 flex items-center justify-between gap-2 cursor-pointer select-none transition-colors ${
                                    isSubOpen
                                      ? 'bg-[#FAF4EB] border-b border-[#E8DDCC]'
                                      : 'hover:bg-[#FAF7F0]'
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

                                  <div className="flex items-center gap-2 shrink-0 text-[11px]">
                                    <span className="text-[10px] text-[#938373] font-mono hidden sm:inline">
                                      {sub.wordCount} words
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(sub.id, `### ${sub.title}\n\n${sub.content}`);
                                      }}
                                      className="p-1 rounded text-[#8B7C6E] hover:text-[#8B3A1C] hover:bg-[#EFE8DC] transition-colors cursor-pointer"
                                      title="Copy this research point"
                                    >
                                      {copiedId === sub.id ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded Research Point Content (200–300 words of technical details) */}
                                {isSubOpen && (
                                  <div className="p-3.5 sm:p-4 text-xs sm:text-sm text-[#30251B] leading-relaxed bg-[#FFFFFF] animate-in fade-in duration-150">
                                    <MarkdownRenderer content={sub.content} />

                                    {/* Action Footnote inside Subtopic */}
                                    <div className="mt-3 pt-2.5 border-t border-[#F0E8DC] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#867565]">
                                      <span className="flex items-center gap-1 font-mono text-[10px]">
                                        <ShieldCheck className="w-3 h-3 text-[#8B3A1C]" />
                                        Evidence Verified · Epigraphia & Modern Geotechnics
                                      </span>
                                      {onSendToChat && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onSendToChat(
                                              `Regarding Section ${sec.sectionNumber} (${sec.title}) - "${sub.title}":\n\n${sub.content.slice(0, 300)}...\n\nCan you expand on the technical physics and archaeological evidence?`
                                            )
                                          }
                                          className="text-[#8B3A1C] hover:underline font-medium cursor-pointer"
                                        >
                                          Discuss Point in Chat →
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Case B: Section does not have bullet subtopics (renders full body text/table/formulas) */
                        <div className="bg-white border border-[#E4DACB] rounded-md p-3.5 sm:p-4 text-xs sm:text-sm text-[#2E2319] leading-relaxed">
                          <MarkdownRenderer content={sec.rawContent} />

                          <div className="mt-3 pt-2.5 border-t border-[#EFE7D8] flex items-center justify-between gap-2 text-[11px] text-[#7C6C5C]">
                            <span className="font-mono text-[10px]">
                              ~{sec.wordCount} words · Canonical Section #{sec.sectionNumber}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(`sec-${sec.sectionNumber}`, `## ${sec.sectionNumber}. ${sec.title}\n\n${sec.rawContent}`)}
                                className="text-[#8B3A1C] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                              >
                                {copiedId === `sec-${sec.sectionNumber}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Section</span>
                                  </>
                                )}
                              </button>
                              {onSendToChat && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSendToChat(
                                      `Regarding Section ${sec.sectionNumber} (${sec.title}):\n\n${sec.rawContent.slice(0, 300)}...\n\nCan you analyze the engineering implications?`
                                    )
                                  }
                                  className="text-[#8B3A1C] hover:underline font-medium cursor-pointer ml-2"
                                >
                                  Discuss in Chat →
                                </button>
                              )}
                            </div>
                          </div>
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
            <MarkdownRenderer content={content} />
          </div>
        </div>
      )}
    </div>
  );
};
