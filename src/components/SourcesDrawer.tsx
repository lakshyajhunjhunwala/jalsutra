import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  ExternalLink,
  Search,
  Filter,
  BookOpen,
  Scroll,
  Globe,
  FileText,
  Landmark,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { ResearchSource, SourceType } from '../types/researchSources.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | SourceType;

interface SourcesDrawerProps {
  sources: ResearchSource[];
  isLoading?: boolean;
  onCitationHighlight?: (citationId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

function getSourceTypeLabel(type: SourceType): string {
  const map: Record<SourceType, string> = {
    primary_epigraphical: 'Epigraphical Record',
    primary_manuscript: 'Classical Treatise',
    archaeological_report: 'Archaeological Report',
    academic_paper: 'Academic Paper',
    book: 'Book',
    government: 'Government Source',
    web: 'Web Source',
    other: 'Reference',
  };
  return map[type] || 'Reference';
}

function getSourceTypeIcon(type: SourceType, className = 'w-3 h-3') {
  switch (type) {
    case 'primary_epigraphical': return <Landmark className={className} />;
    case 'primary_manuscript':   return <Scroll className={className} />;
    case 'archaeological_report': return <Landmark className={className} />;
    case 'academic_paper':       return <GraduationCap className={className} />;
    case 'book':                 return <BookOpen className={className} />;
    case 'government':           return <FileText className={className} />;
    case 'web':                  return <Globe className={className} />;
    default:                     return <FileText className={className} />;
  }
}

function getSourceTypeBadgeColors(type: SourceType): string {
  switch (type) {
    case 'primary_epigraphical': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'primary_manuscript':   return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'archaeological_report': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'academic_paper':       return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'book':                 return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'government':           return 'bg-green-100 text-green-800 border-green-300';
    case 'web':                  return 'bg-slate-100 text-slate-700 border-slate-300';
    default:                     return 'bg-stone-100 text-stone-700 border-stone-300';
  }
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'primary_epigraphical', label: 'Epigraphical' },
  { key: 'primary_manuscript', label: 'Treatises' },
  { key: 'archaeological_report', label: 'ASI Reports' },
  { key: 'academic_paper', label: 'Academic' },
  { key: 'book', label: 'Books' },
  { key: 'government', label: 'Government' },
  { key: 'web', label: 'Web' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SourceCard
// ─────────────────────────────────────────────────────────────────────────────

const SourceCard: React.FC<{ source: ResearchSource; index: number }> = ({ source, index }) => {
  const [imgError, setImgError] = useState(false);
  const domain = source.domain || extractDomain(source.url);
  const faviconUrl = source.favicon || getFaviconUrl(domain);

  return (
    <div className="group rounded-lg border border-[#E2D8C8] bg-white hover:border-[#C8B89A] hover:shadow-md transition-all duration-200">
      <div className="p-3.5 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            {/* Favicon */}
            <div className="shrink-0 mt-0.5">
              {!imgError ? (
                <img
                  src={faviconUrl}
                  alt=""
                  className="w-4 h-4 rounded-sm object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <Globe className="w-4 h-4 text-[#8B6B4A]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-[#8B6040] font-medium truncate">{domain}</div>
              <div className="text-xs font-semibold text-[#2C2118] leading-snug mt-0.5 line-clamp-2">
                {source.title}
              </div>
            </div>
          </div>
          {/* Citation ref badge */}
          {source.citationIds && source.citationIds.length > 0 && (
            <div className="shrink-0 flex gap-1 flex-wrap justify-end">
              {source.citationIds.slice(0, 3).map((cid) => (
                <span
                  key={cid}
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F5EFE3] border border-[#DDD0BC] text-[#8B3A1C]"
                >
                  [{cid}]
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Source type + primary badge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${getSourceTypeBadgeColors(source.sourceType)}`}>
            {getSourceTypeIcon(source.sourceType)}
            {getSourceTypeLabel(source.sourceType)}
          </span>
          {source.isPrimary && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Primary Source
            </span>
          )}
          {source.publishedAt && (
            <span className="text-[10px] text-[#7A6550]">{source.publishedAt}</span>
          )}
          {source.author && (
            <span className="text-[10px] text-[#7A6550] truncate max-w-[130px]">{source.author}</span>
          )}
        </div>

        {/* Snippet */}
        {source.snippet && (
          <p className="text-[11px] text-[#5A4A38] leading-relaxed italic line-clamp-3">
            "{source.snippet}"
          </p>
        )}

        {/* Relevance note */}
        {source.relevanceNote && (
          <p className="text-[10px] text-[#7A6550] leading-snug">{source.relevanceNote}</p>
        )}

        {/* Confidence & Evidence Trail */}
        {(source.confidence !== undefined || (source.evidenceTrail && source.evidenceTrail.length > 0)) && (
          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#EDE4D5]">
            {source.confidence !== undefined && (
              <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                🎯 Confidence: {source.confidence}%
              </span>
            )}
            {source.evidenceTrail && source.evidenceTrail.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-[#6E5A47]">
                <span className="font-semibold">🧩 Trail:</span>
                <span title={source.evidenceTrail.join(' · ')}>
                  {source.evidenceTrail.map((t) => t.split(' ')[0]).join(' ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Justification */}
        {source.justification && (
          <div className="text-[10px] text-[#4F4133] bg-[#FAF7F0] p-1.5 rounded border border-[#E8DFCFA0] leading-relaxed">
            <span className="font-semibold text-[#8B3A1C]">🔎 Justification: </span>
            <span>{source.justification}</span>
          </div>
        )}

        {/* Uncertainty */}
        {source.uncertainty && (
          <div className="text-[10px] text-amber-900 bg-amber-50/80 p-1.5 rounded border border-amber-200 leading-relaxed">
            <span className="font-semibold text-amber-800">⚠️ Uncertainty: </span>
            <span>{source.uncertainty}</span>
          </div>
        )}

        {/* Read source button */}
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8B3A1C] hover:text-[#6B2A0C] transition-colors mt-0.5"
        >
          <ExternalLink className="w-3 h-3" />
          Read source
        </a>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SourcesButton (the pill shown below the research response)
// ─────────────────────────────────────────────────────────────────────────────

export const SourcesButton: React.FC<{
  count: number;
  isLoading?: boolean;
  onClick: () => void;
}> = ({ count, isLoading, onClick }) => {
  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F5EFE3] border border-[#E0D4C0] text-[#8B6040] text-xs font-medium animate-pulse">
        <Circle className="w-3 h-3 text-[#C07820] fill-current" />
        <span>Collecting sources…</span>
      </div>
    );
  }

  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF7F0] hover:bg-[#F0E8D8] active:bg-[#E8DCC8] border border-[#D8CCBA] hover:border-[#C0A888] text-[#4A3728] text-sm font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group"
      title={`View all ${count} sources used in this research`}
    >
      <span className="relative flex items-center">
        <Circle className="w-3.5 h-3.5 text-[#8B3A1C] fill-current opacity-80 group-hover:opacity-100 transition-opacity" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FAF7F0]" />
        </span>
      </span>
      <span className="font-semibold">{count} sources</span>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SourcesDrawer (right side panel on desktop, bottom sheet on mobile)
// ─────────────────────────────────────────────────────────────────────────────

export const SourcesDrawer: React.FC<SourcesDrawerProps> = ({
  sources,
  isLoading,
  onCitationHighlight,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Deduplicate sources by URL
  const dedupedSources = useMemo(() => {
    const seen = new Set<string>();
    return sources.filter((s) => {
      if (seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    });
  }, [sources]);

  // Available filter tabs (only show tabs with matching sources)
  const availableFilters = useMemo(() => {
    const typesPresent = new Set(dedupedSources.map((s) => s.sourceType));
    return FILTER_TABS.filter((f) => f.key === 'all' || typesPresent.has(f.key as SourceType));
  }, [dedupedSources]);

  // Filtered + searched sources
  const filteredSources = useMemo(() => {
    return dedupedSources.filter((s) => {
      const matchesFilter = activeFilter === 'all' || s.sourceType === activeFilter;
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || (
        s.title.toLowerCase().includes(q) ||
        (s.domain || '').toLowerCase().includes(q) ||
        (s.snippet || '').toLowerCase().includes(q) ||
        (s.author || '').toLowerCase().includes(q)
      );
      return matchesFilter && matchesSearch;
    });
  }, [dedupedSources, activeFilter, searchTerm]);

  const count = dedupedSources.length;

  return (
    <>
      {/* Sources trigger button */}
      <div className="mt-5 pt-4 border-t border-[#E8DFCF] flex items-center gap-3">
        <SourcesButton
          count={count}
          isLoading={isLoading}
          onClick={() => setIsOpen(true)}
        />
        {count > 0 && (
          <span className="text-[11px] text-[#8B7060]">
            {dedupedSources.filter((s) => s.isPrimary).length} primary ·{' '}
            {dedupedSources.filter((s) => !s.isPrimary).length} secondary
          </span>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`fixed z-50 bg-[#FAF7F0] border-[#DDD0BC] shadow-2xl transition-transform duration-300 ease-in-out
          /* Desktop: right-side panel */
          top-0 right-0 h-full w-full sm:w-[480px] lg:w-[520px] border-l
          /* Mobile: slide up from bottom */
          sm:translate-y-0 sm:translate-x-0
          ${isOpen
            ? 'translate-x-0 sm:translate-x-0'
            : 'translate-x-full sm:translate-x-full'
          }`}
        role="dialog"
        aria-modal="true"
        aria-label="Research Sources Panel"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="shrink-0 px-5 py-4 border-b border-[#E2D8C8] bg-[#F5F0E8]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#2C2118] font-serif">Sources</h2>
                <p className="text-xs text-[#7A6550] mt-0.5">
                  {count} unique {count === 1 ? 'source' : 'sources'} used in this research
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#E8DFCF] transition-colors text-[#5A4A38] hover:text-[#2C2118] cursor-pointer"
                aria-label="Close sources panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search bar */}
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B7060]" />
              <input
                type="text"
                placeholder="Search sources…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#D8CCBA] bg-white focus:outline-none focus:ring-2 focus:ring-[#C0A068]/30 focus:border-[#C0A068] text-[#2C2118] placeholder-[#A09080]"
              />
            </div>

            {/* Filter tabs */}
            {availableFilters.length > 2 && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 text-[11px] text-[#7A6550] hover:text-[#4A3728] font-medium transition-colors cursor-pointer"
                >
                  <Filter className="w-3 h-3" />
                  Filter by type
                  {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showFilters && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {availableFilters.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveFilter(tab.key)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                          activeFilter === tab.key
                            ? 'bg-[#8B3A1C] text-white border-[#8B3A1C]'
                            : 'bg-white text-[#5A4A38] border-[#D8CCBA] hover:border-[#C0A888]'
                        }`}
                      >
                        {tab.label}
                        {tab.key !== 'all' && (
                          <span className="ml-1 opacity-70">
                            ({dedupedSources.filter((s) => s.sourceType === tab.key).length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Source list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-[#8B7060]">
                <Circle className="w-6 h-6 animate-pulse text-[#C07820] fill-current" />
                <span className="text-sm">Collecting sources…</span>
              </div>
            ) : filteredSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-[#8B7060]">
                <AlertCircle className="w-6 h-6 text-[#B0906A]" />
                <span className="text-sm font-medium">
                  {searchTerm || activeFilter !== 'all'
                    ? 'No sources match your filter'
                    : 'Sources unavailable'}
                </span>
                <span className="text-xs text-center max-w-[220px]">
                  {searchTerm
                    ? 'Try a different search term or clear the filter.'
                    : 'This research did not retrieve verifiable source URLs. Try switching to Search grounding mode.'}
                </span>
              </div>
            ) : (
              <>
                {searchTerm || activeFilter !== 'all' ? (
                  <p className="text-[11px] text-[#8B7060] pb-1">
                    Showing {filteredSources.length} of {count} sources
                  </p>
                ) : null}
                {filteredSources.map((source, idx) => (
                  <SourceCard key={source.id} source={source} index={idx + 1} />
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-5 py-3 border-t border-[#E2D8C8] bg-[#F5F0E8]">
            <p className="text-[10px] text-[#9A8070] leading-relaxed">
              Sources are classified as Primary (original inscriptions, treaties, excavation reports) or
              Secondary (books, academic papers, websites). Do not cite AI-generated summaries as primary evidence.
              All source URLs open directly in a new tab.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SourcesDrawer;
