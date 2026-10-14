import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  Loader2,
  FileSearch,
  ZoomIn,
  Filter,
  Trash2,
  Library,
  ExternalLink,
  Sparkles,
  Eye,
  FileCode,
  BookMarked,
  Info,
} from 'lucide-react';
import type {
  EvidenceDocument,
  EvidenceSearchRequest,
  EvidenceSearchResult,
  DocumentCategory,
  SearchMode,
  UploadProgress,
  IndexedPage,
} from '../types/evidenceLibrary.ts';

// ── Utility helpers ────────────────────────────────────────────────────────────

function highlightMatch(text: string, query: string): React.ReactNode[] {
  if (!query.trim() || !text) return [text || ''];
  try {
    const tokens = query.trim().split(/\s+/).filter(Boolean);
    const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(?:-\\s*\\n\\s*|\\s+)');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-[#F5D978] text-[#2A1B0A] font-semibold rounded-[2px] px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  } catch {
    return [text];
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function categoryLabel(cat: DocumentCategory): string {
  const map: Record<DocumentCategory, string> = {
    textbook: 'Textbook',
    archaeological_report: 'Archaeological Report',
    engineering_book: 'Engineering Book',
    epigraphical_collection: 'Epigraphical Collection',
    translated_manuscript: 'Translated Manuscript',
    research_paper: 'Research Paper',
    technical_report: 'Technical Report',
    other: 'Other Reference',
  };
  return map[cat] ?? cat;
}

function matchTypeBadge(mt: EvidenceSearchResult['matchType']): React.ReactNode {
  const styles: Record<string, string> = {
    exact_phrase: 'bg-[#DDEFD8] text-[#285222] border-[#B6DFB0]',
    keyword: 'bg-[#E8EAF6] text-[#2E3660] border-[#B5BBDD]',
    semantic: 'bg-[#FFF3CC] text-[#6B4A00] border-[#F0D870]',
  };
  const labels: Record<string, string> = {
    exact_phrase: 'Exact Phrase Match',
    keyword: 'Keyword Match',
    semantic: 'Semantic Match',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${styles[mt] ?? ''}`}>
      {labels[mt] ?? mt}
    </span>
  );
}

function statusIcon(status: EvidenceDocument['processingStatus']): React.ReactNode {
  switch (status) {
    case 'ready':
      return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
    case 'error':
      return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
    case 'pending':
      return <Clock className="w-3.5 h-3.5 text-[#8C7E6A]" />;
    default:
      return <Loader2 className="w-3.5 h-3.5 text-[#8B3A1C] animate-spin" />;
  }
}

// ── API helpers ────────────────────────────────────────────────────────────────

const API_BASE = '/api/atlas/evidence';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Modal for Full Page & Document Inspection ──────────────────────────────────

interface PageModalProps {
  documentId: string;
  pdfPageIndex: number;
  highlightQuery?: string;
  onClose: () => void;
}

const PageModal: React.FC<PageModalProps> = ({ documentId, pdfPageIndex, highlightQuery, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<{ document: EvidenceDocument; page: IndexedPage } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch<{ document: EvidenceDocument; page: IndexedPage }>(`/documents/${documentId}/pages/${pdfPageIndex + 1}`)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to retrieve page text');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [documentId, pdfPageIndex]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF7F0] border border-[#D5CABB] rounded-xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5DAC8] bg-[#F4ECE1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-[#8B3A1C]" />
            <div>
              <h3 className="font-serif font-bold text-sm text-[#271E15] line-clamp-1">
                {data?.document.title || 'Page Inspection'}
              </h3>
              <p className="text-[11px] text-[#786959]">
                {data?.page.printedPageLabel
                  ? `Printed Page ${data.page.printedPageLabel} · Internal PDF Page Index ${pdfPageIndex + 1}`
                  : `Internal PDF Page Index ${pdfPageIndex + 1} (Printed page not identified)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#E5DAC8] text-[#554739] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 font-serif text-xs leading-relaxed space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-[#6F5E4D]">
              <Loader2 className="w-5 h-5 animate-spin text-[#8B3A1C] mr-2" />
              <span>Retrieving authenticated page text from private evidence index...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
              {error}
            </div>
          )}

          {data && (
            <div>
              {data.page.ocrConfidence !== undefined && data.page.ocrConfidence < 0.9 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-start gap-2 font-sans">
                  <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>OCR Recognition Notice:</strong> This page was scanned from historical letterpress or physical plates. Extracted text is OCR-derived (confidence: {Math.round((data.page.ocrConfidence || 0.65) * 100)}%). Verify against physical plates before definitive historical citation.
                  </div>
                </div>
              )}

              <div className="p-4 bg-white border border-[#E0D8CB] rounded-lg shadow-inner whitespace-pre-wrap text-[#261E16] font-mono text-[12px] leading-relaxed">
                {highlightQuery ? highlightMatch(data.page.rawText, highlightQuery) : data.page.rawText}
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8DFCFA0] flex flex-wrap items-center justify-between text-[11px] font-sans text-[#7A6C5B]">
                <span>Document ID: {data.document.id}</span>
                <span>Original File: {data.document.filename}</span>
                <span>Category: {categoryLabel(data.document.category)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E5DAC8] bg-[#F4ECE1] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#8B3A1C] text-white rounded hover:bg-[#742E15] transition-colors cursor-pointer"
          >
            Close Page Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Evidence Result Card ───────────────────────────────────────────────────────

interface ResultCardProps {
  result: EvidenceSearchResult;
  query: string;
  onOpenPage: (docId: string, pageIndex: number) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, query, onOpenPage }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Citation generation strictly adhering to section 4 & 7
  const citationPageString = result.printedPageLabel
    ? `p. ${result.printedPageLabel} [PDF p. ${result.pdfPageIndex + 1}]`
    : `PDF p. ${result.pdfPageIndex + 1} (printed page unnumbered)`;

  const citation = [
    result.documentAuthor || 'Unknown Author',
    result.documentYear ? `(${result.documentYear})` : '',
    `"${result.documentTitle}"`,
    citationPageString,
  ]
    .filter(Boolean)
    .join(', ');

  const handleCopyCitation = () => {
    const fullCitation = `${citation}.\nEvidence quotation: "${result.matchedText.trim()}"`;
    navigator.clipboard.writeText(fullCitation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg text-xs overflow-hidden shadow-2xs hover:border-[#D5C7B0] transition-all">
      {/* Card Header */}
      <div className="px-4 py-3 border-b border-[#EDE6D8] bg-[#FAF5EC] flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <BookOpen className="w-3.5 h-3.5 text-[#8B3A1C] flex-shrink-0 mt-0.5" />
            <span className="font-serif font-bold text-[#2A231C] text-sm leading-snug">
              {result.documentTitle}
            </span>
            {matchTypeBadge(result.matchType)}
          </div>
          <div className="mt-1 text-[11px] text-[#7A6C5C] flex flex-wrap items-center gap-x-3 gap-y-1">
            {result.documentAuthor && <span>Author: <strong className="text-[#4E3F31]">{result.documentAuthor}</strong></span>}
            {result.documentYear && <span>Year: <strong className="text-[#4E3F31]">{result.documentYear}</strong></span>}
            <span className="font-medium text-[#8B3A1C] bg-[#FAF1E3] px-1.5 py-0.5 rounded border border-[#E8DAC5]">
              {result.printedPageLabel
                ? `Printed page ${result.printedPageLabel}; PDF page ${result.pdfPageIndex + 1}`
                : `PDF page index ${result.pdfPageIndex + 1} (printed page not identified)`}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pt-1 sm:pt-0">
          <button
            onClick={() => onOpenPage(result.documentId, result.pdfPageIndex)}
            title="Open verified page in document viewer"
            className="px-2.5 py-1 rounded bg-[#FAF1E3] hover:bg-[#F2E5D1] border border-[#D8CDB8] text-[#8B3A1C] font-semibold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Eye className="w-3 h-3" />
            <span>Open Page</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse context' : 'Expand surrounding context'}
            className="px-2.5 py-1 rounded bg-[#EFE9DC] hover:bg-[#E5DDCB] border border-[#D8CDB8] text-[#4F4335] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <span>{expanded ? 'Collapse' : 'Expand Context'}</span>
          </button>

          <button
            onClick={handleCopyCitation}
            title="Copy verifiable citation with page number"
            className="px-2.5 py-1 rounded bg-[#EFE9DC] hover:bg-[#E5DDCB] border border-[#D8CDB8] text-[#4F4335] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            {copied ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Citation'}</span>
          </button>
        </div>
      </div>

      {/* Primary Evidence Quotation */}
      <div className="px-4 py-3 bg-[#FFFFF9] border-b border-[#EDE6D8]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8B3A1C] mb-1 flex items-center gap-1">
          <span>Literal Extracted Passage:</span>
        </div>
        <p className="font-serif text-[#271E15] leading-relaxed text-[12.5px] italic pl-2 border-l-2 border-[#8B3A1C]">
          "{highlightMatch(result.matchedText, query)}"
        </p>
      </div>

      {/* Expanded Surrounding Passage Context */}
      {expanded && (
        <div className="px-4 py-3 bg-[#F8F4EC] border-b border-[#EDE6D8] space-y-2 text-[#3D3227] leading-relaxed text-[11px]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6B5C4A] flex items-center gap-1">
            <FileCode className="w-3 h-3" />
            <span>Full Surrounding Contextual Extract:</span>
          </div>
          {result.contextBefore && (
            <p className="text-[#594B3C]">
              …{result.contextBefore}
            </p>
          )}
          <p className="font-serif text-[#241B13] font-medium bg-[#FFF9E6] border border-[#E8DCB8] p-2 rounded">
            {highlightMatch(result.matchedText, query)}
          </p>
          {result.contextAfter && (
            <p className="text-[#594B3C]">
              {result.contextAfter}…
            </p>
          )}
        </div>
      )}

      {/* Card Metadata Footer */}
      <div className="px-4 py-2 bg-[#FAF7F0] flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
        <div className="text-[#7D6E5F]">
          {result.ocrDerived ? (
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              OCR-Derived Text {result.ocrWarning ? `(${result.ocrWarning})` : '— unverified scan, check original'}
            </span>
          ) : (
            <span className="text-[#6E5F50]">{result.relevanceNote}</span>
          )}
        </div>
        <button
          onClick={() => onOpenPage(result.documentId, result.pdfPageIndex)}
          className="text-[#8B3A1C] hover:text-[#5E240F] font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>View Source Document &rarr;</span>
        </button>
      </div>
    </div>
  );
};

// ── Document Row in Uploaded Library ───────────────────────────────────────────

interface DocRowProps {
  doc: EvidenceDocument;
  onRemove: (id: string) => void;
  onInspect: (docId: string) => void;
}

const DocRow: React.FC<DocRowProps> = ({ doc, onRemove, onInspect }) => (
  <div className="flex items-start gap-3 py-2.5 px-3 bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg text-xs hover:border-[#D5CABB] transition-colors">
    <div className="mt-0.5 flex-shrink-0">{statusIcon(doc.processingStatus)}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-serif font-bold text-[#2A231C] truncate">{doc.title}</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EFE9DC] text-[#554739] border border-[#DDD3C0]">
          {categoryLabel(doc.category)}
        </span>
      </div>
      <div className="text-[10.5px] text-[#7A6C5C] flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
        {doc.author && <span>By {doc.author}</span>}
        {doc.publicationYear && <span>({doc.publicationYear})</span>}
        {doc.pageCount && <strong className="text-[#4E3F31]">{doc.pageCount} indexed pages</strong>}
        <span>{formatFileSize(doc.fileSizeBytes)}</span>
        <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
      </div>
      {doc.ocrWarning && (
        <div className="mt-1 text-[10px] text-amber-700 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
          <span>{doc.ocrWarning}</span>
        </div>
      )}
      {doc.processingError && (
        <div className="mt-1 text-[10px] text-red-600 font-medium">{doc.processingError}</div>
      )}
    </div>
    <div className="flex items-center gap-1 flex-shrink-0">
      {doc.processingStatus === 'ready' && (
        <button
          onClick={() => onInspect(doc.id)}
          title="Inspect document text pages"
          className="p-1.5 rounded bg-[#FAF1E3] hover:bg-[#F2E5D1] text-[#8B3A1C] border border-[#E0D0BC] transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={() => onRemove(doc.id)}
        title="Remove document and index"
        className="p-1.5 rounded hover:bg-red-50 text-[#8A7A6B] hover:text-red-600 transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

// ── Main TextbookEvidenceLibrary Component ─────────────────────────────────────

export const TextbookEvidenceLibrary: React.FC = () => {
  // Panel open state (default expanded for instant research discovery)
  const [panelOpen, setPanelOpen] = useState(true);

  // Documents
  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docFilterQuery, setDocFilterQuery] = useState('');

  // Upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadMeta, setUploadMeta] = useState({
    title: '',
    author: '',
    organization: '',
    publicationYear: '',
    category: 'textbook' as DocumentCategory,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('exact');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterYearFrom, setFilterYearFrom] = useState('');
  const [filterYearTo, setFilterYearTo] = useState('');
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | ''>('');
  const [filterPageFrom, setFilterPageFrom] = useState('');
  const [filterPageTo, setFilterPageTo] = useState('');

  // Search Results
  const [results, setResults] = useState<EvidenceSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  // Gemini Grounded Explanation
  const [geminiExplanation, setGeminiExplanation] = useState<{
    explanation: string;
    citedSources: Array<{ documentTitle: string; pageLabel: string }>;
  } | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

  // Page Inspection Modal
  const [modalTarget, setModalTarget] = useState<{ docId: string; pageIndex: number } | null>(null);

  // Load documents on mount
  const loadDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const data = await apiFetch<EvidenceDocument[]>('/documents');
      setDocuments(data);
    } catch (e: any) {
      console.error('Failed to load documents', e);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Polling for documents currently in processing
  useEffect(() => {
    const hasPending = documents.some(
      (d) => d.processingStatus !== 'ready' && d.processingStatus !== 'error'
    );
    if (!hasPending) return;
    const interval = setInterval(() => loadDocuments(), 2500);
    return () => clearInterval(interval);
  }, [documents, loadDocuments]);

  // File Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const valid = files.filter(
      (f) =>
        f.type === 'application/pdf' ||
        f.type.includes('word') ||
        f.type.includes('text') ||
        f.name.endsWith('.pdf') ||
        f.name.endsWith('.docx') ||
        f.name.endsWith('.txt')
    );
    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const progressList: UploadProgress[] = selectedFiles.map((f, i) => ({
      documentId: `pending-${i}`,
      stage: 'uploading',
      percent: 10,
      message: `Uploading ${f.name}...`,
    }));
    setUploadProgress(progressList);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', uploadMeta.title.trim() || file.name.replace(/\.[^.]+$/, ''));
      if (uploadMeta.author) formData.append('author', uploadMeta.author.trim());
      if (uploadMeta.organization) formData.append('organization', uploadMeta.organization.trim());
      if (uploadMeta.publicationYear) formData.append('publicationYear', uploadMeta.publicationYear);
      formData.append('category', uploadMeta.category);

      try {
        setUploadProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, stage: 'extracting', percent: 50, message: `Extracting & indexing pages from ${file.name}...` } : p
          )
        );

        const doc = await fetch(`${API_BASE}/documents`, {
          method: 'POST',
          body: formData,
        }).then(async (r) => {
          if (!r.ok) {
            const err = await r.json().catch(() => ({ error: r.statusText }));
            throw new Error(err.error ?? r.statusText);
          }
          return r.json() as Promise<EvidenceDocument>;
        });

        setUploadProgress((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { documentId: doc.id, stage: 'done', percent: 100, message: `Successfully added to private library!` }
              : p
          )
        );
      } catch (e: any) {
        setUploadProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, stage: 'error', percent: 0, message: e.message || 'Upload failed.' } : p
          )
        );
      }
    }

    // Reset upload state
    setSelectedFiles([]);
    setUploadMeta({ title: '', author: '', organization: '', publicationYear: '', category: 'textbook' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => {
      setUploadProgress([]);
      loadDocuments();
    }, 2500);
  };

  const handleRemoveDocument = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reference document and remove it from search indexes?')) {
      return;
    }
    try {
      await apiFetch(`/documents/${id}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setSelectedDocIds((prev) => prev.filter((did) => did !== id));
    } catch (e: any) {
      alert(`Failed to delete document: ${e.message}`);
    }
  };

  // Search execution
  const handleSearch = async (termToSearch?: string) => {
    const q = (termToSearch !== undefined ? termToSearch : searchQuery).trim();
    if (!q) return;

    setSearchLoading(true);
    setSearchError('');
    setSearchExecuted(true);
    setLastQuery(q);
    setGeminiExplanation(null);

    try {
      const req: EvidenceSearchRequest = {
        query: q,
        mode: searchMode,
        documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
        authorFilter: filterAuthor || undefined,
        yearFrom: filterYearFrom ? Number(filterYearFrom) : undefined,
        yearTo: filterYearTo ? Number(filterYearTo) : undefined,
        categoryFilter: filterCategory || undefined,
        pageFrom: filterPageFrom ? Number(filterPageFrom) : undefined,
        pageTo: filterPageTo ? Number(filterPageTo) : undefined,
        maxResults: 60,
      };

      const data = await apiFetch<EvidenceSearchResult[]>('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      setResults(data);
    } catch (e: any) {
      setSearchError(e.message || 'Evidence search failed');
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setSearchExecuted(false);
    setSearchError('');
    setLastQuery('');
    setGeminiExplanation(null);
  };

  // Trigger Gemini Grounded Explanation
  const handleSynthesizeWithGemini = async () => {
    if (results.length === 0 || !lastQuery) return;
    setGeminiLoading(true);
    try {
      const data = await apiFetch<{
        explanation: string;
        citedSources: Array<{ documentTitle: string; pageLabel: string }>;
      }>('/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: lastQuery, results }),
      });
      setGeminiExplanation(data);
    } catch (e: any) {
      alert(`Gemini analysis error: ${e.message}`);
    } finally {
      setGeminiLoading(false);
    }
  };

  const readyDocs = documents.filter((d) => d.processingStatus === 'ready');
  const filteredDocs = documents.filter((d) => {
    if (!docFilterQuery) return true;
    const q = docFilterQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.author && d.author.toLowerCase().includes(q)) ||
      (d.publicationYear && String(d.publicationYear).includes(q)) ||
      d.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg overflow-hidden shadow-2xs">
      {/* ── Section Title & Toggle Header ────────────────────────── */}
      <div className="p-5 border-b border-[#E8E0D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Library className="w-5 h-5 text-[#8B3A1C] mt-1 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-serif font-bold text-[#2A231C]">
              Historical Textbook &amp; Primary Evidence Search
            </h2>
            <p className="text-xs sm:text-sm text-[#736657] mt-0.5 max-w-3xl">
              Search uploaded historical books, archaeological reports, engineering documents, translations, and primary-source collections to locate exact textual evidence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-[#EFE9DC] border border-[#D8CDB8] text-xs font-semibold text-[#5A4A3A]">
            {readyDocs.length} of {documents.length} Books Ready
          </span>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="p-1.5 rounded-md hover:bg-[#EAE2D2] text-[#8B3A1C] border border-[#DDD3C2] transition-colors cursor-pointer"
            title={panelOpen ? 'Collapse library panel' : 'Expand library panel'}
          >
            {panelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {panelOpen && (
        <div className="p-5 space-y-6">

          {/* ── Keyword Search Panel ────────────────────────────────── */}
          <div className="bg-[#FFFDF9] border border-[#E2D8C6] rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-[#8B3A1C]" />
                <h3 className="font-serif font-bold text-sm text-[#271E15]">
                  Search Historical Textbooks &amp; Archaeological Reports
                </h3>
              </div>
              <span className="text-[11px] text-[#786959] hidden sm:inline">
                Literal, verified page-by-page index retrieval
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7E6C]" />
              <input
                type="text"
                placeholder="Search exact evidence, keywords, phrases, inscriptions, engineering terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-24 py-2.5 bg-white border border-[#D8CDB8] rounded-lg text-sm text-[#2A231C] placeholder-[#9E9080] outline-none focus:border-[#8B3A1C] focus:ring-1 focus:ring-[#8B3A1C]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7A6B] hover:text-[#2A231C] p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Evidence Prompts */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-[#6F5F4E] mr-1">Quick Evidence Terms:</span>
              {[
                'well spacing',
                'silt removal',
                'sluice',
                'water taxation',
                "Ashoka's inscriptions",
                'soil texture',
                'irrigation channel',
                'Pushyagupta',
                'Tusaspha',
              ].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    handleSearch(term);
                  }}
                  className="px-2 py-0.5 rounded bg-[#F4ECE1] hover:bg-[#EBE0D2] border border-[#DDD0BC] text-[#554738] text-[11px] transition-colors cursor-pointer"
                >
                  "{term}"
                </button>
              ))}
            </div>

            {/* Search Modes & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#EDE4D5]">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-[#6F5F4E] mr-1">Search Mode:</span>
                {[
                  { id: 'exact', label: '1. Exact Phrase' },
                  { id: 'keyword', label: '2. Keyword Search' },
                  { id: 'semantic', label: '3. Semantic Search' },
                  { id: 'advanced', label: '4. Advanced Search' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSearchMode(m.id as SearchMode);
                      if (m.id === 'advanced') setShowAdvancedFilters(true);
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                      searchMode === m.id
                        ? 'bg-[#8B3A1C] text-white border-[#8B3A1C] shadow-2xs'
                        : 'bg-white text-[#4A3E31] border-[#D8CDB8] hover:bg-[#F3ECE0]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSearch()}
                  disabled={!searchQuery.trim() || searchLoading || readyDocs.length === 0}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#8B3A1C] hover:bg-[#722F16] text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  {searchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search Evidence</span>
                </button>

                {(searchExecuted || searchQuery) && (
                  <button
                    onClick={handleClearSearch}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#EFE9DC] hover:bg-[#E5DDCB] text-[#4A3E31] border border-[#D8CDB8] rounded transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Document Selection Scope */}
            {readyDocs.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[#EDE4D5]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#5A4A3A] uppercase tracking-wider">
                    Search Scope: {selectedDocIds.length === 0 ? 'All Documents' : `${selectedDocIds.length} Selected Book(s)`}
                  </span>
                  {selectedDocIds.length > 0 && (
                    <button
                      onClick={() => setSelectedDocIds([])}
                      className="text-[#8B3A1C] hover:underline cursor-pointer"
                    >
                      Reset to all documents
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {readyDocs.map((d) => {
                    const isSelected = selectedDocIds.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => {
                          setSelectedDocIds((prev) =>
                            isSelected ? prev.filter((id) => id !== d.id) : [...prev, d.id]
                          );
                        }}
                        className={`px-2.5 py-1 rounded border text-left transition-colors cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#8B3A1C] text-white border-[#8B3A1C]'
                            : 'bg-white text-[#4A3E31] border-[#D8CDB8] hover:bg-[#F3ECE0]'
                        }`}
                      >
                        <BookOpen className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{d.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Advanced Search Filter Drawer */}
            {(searchMode === 'advanced' || showAdvancedFilters) && (
              <div className="p-3 bg-[#F5EFE4] border border-[#E0D8CB] rounded-lg space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#2A231C] flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#8B3A1C]" />
                    Advanced Evidence Metadata Filters
                  </span>
                  <button
                    onClick={() => setShowAdvancedFilters(false)}
                    className="text-[#7A6C5C] hover:text-[#2A231C] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#5A4A3A] uppercase tracking-wider mb-1">
                      Author / Translator
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sengupta, Spooner"
                      value={filterAuthor}
                      onChange={(e) => setFilterAuthor(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-[#D8CDB8] rounded text-[#2A231C] text-xs outline-none focus:border-[#8B3A1C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#5A4A3A] uppercase tracking-wider mb-1">
                      Year From
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1850"
                      value={filterYearFrom}
                      onChange={(e) => setFilterYearFrom(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-[#D8CDB8] rounded text-[#2A231C] text-xs outline-none focus:border-[#8B3A1C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#5A4A3A] uppercase tracking-wider mb-1">
                      Year To
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2000"
                      value={filterYearTo}
                      onChange={(e) => setFilterYearTo(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-[#D8CDB8] rounded text-[#2A231C] text-xs outline-none focus:border-[#8B3A1C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#5A4A3A] uppercase tracking-wider mb-1">
                      Page Range (From / To)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filterPageFrom}
                        onChange={(e) => setFilterPageFrom(e.target.value)}
                        className="w-1/2 px-2 py-1 bg-white border border-[#D8CDB8] rounded text-[#2A231C] text-xs outline-none focus:border-[#8B3A1C]"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filterPageTo}
                        onChange={(e) => setFilterPageTo(e.target.value)}
                        className="w-1/2 px-2 py-1 bg-white border border-[#D8CDB8] rounded text-[#2A231C] text-xs outline-none focus:border-[#8B3A1C]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#5A4A3A] uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as DocumentCategory | '')}
                      className="w-full px-2.5 py-1 bg-white border border-[#D8CDB8] rounded text-[#2A231C] text-xs cursor-pointer outline-none focus:border-[#8B3A1C]"
                    >
                      <option value="">All Categories</option>
                      <option value="textbook">Textbook</option>
                      <option value="archaeological_report">Archaeological Report</option>
                      <option value="engineering_book">Engineering Book</option>
                      <option value="epigraphical_collection">Epigraphical Collection</option>
                      <option value="translated_manuscript">Translated Manuscript</option>
                      <option value="research_paper">Research Paper</option>
                      <option value="technical_report">Technical Report</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Search Results Presentation ─────────────────────────── */}
          {searchExecuted && (
            <div className="space-y-4">
              {searchError ? (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{searchError}</span>
                </div>
              ) : searchLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-xs text-[#5A4A3A]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#8B3A1C]" />
                  <span>Scanning indexed pages for "{lastQuery}"...</span>
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF7F0] border border-dashed border-[#D5C9B5] rounded-xl space-y-2">
                  <ZoomIn className="w-8 h-8 text-[#B0926E] mx-auto" />
                  <p className="font-serif font-bold text-sm text-[#2A2118]">
                    No exact match found in the selected documents.
                  </p>
                  <p className="text-xs text-[#7A6C5C] max-w-md mx-auto">
                    Try switching to <strong>Keyword</strong> or <strong>Semantic search</strong> to retrieve related passages with alternate ancient spellings or translation variations.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E8DFCFA0]">
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#271E15] flex items-center gap-2">
                        <span>Retrieved Evidence Results ({results.length})</span>
                      </h3>
                      <p className="text-xs text-[#7A6C5B] mt-0.5">
                        Query: <strong className="text-[#8B3A1C]">"{lastQuery}"</strong> · Mode: <span className="capitalize">{searchMode}</span> · {results.filter(r => r.matchType === 'exact_phrase').length} exact, {results.filter(r => r.matchType === 'keyword').length} keyword, {results.filter(r => r.matchType === 'semantic').length} semantic
                      </p>
                    </div>

                    <button
                      onClick={handleSynthesizeWithGemini}
                      disabled={geminiLoading}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#8B3A1C] hover:bg-[#742E15] rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
                      title="Ground Gemini 2.5 in retrieved passages without hallucination"
                    >
                      {geminiLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      )}
                      <span>Synthesize Evidence with Gemini</span>
                    </button>
                  </div>

                  {/* Gemini Evidence Synthesis Card */}
                  {geminiExplanation && (
                    <div className="p-4 bg-[#FAF5EA] border border-[#D8C7B0] rounded-xl text-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E8DAC2] pb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#8B3A1C]" />
                          <span className="font-serif font-bold text-sm text-[#271E15]">
                            Gemini Evidence Grounding Analysis
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8B3A1C] bg-white px-2 py-0.5 rounded border border-[#E0D0BC]">
                          Grounded in {geminiExplanation.citedSources.length} Citations
                        </span>
                      </div>
                      <div className="text-[#362A1F] leading-relaxed whitespace-pre-line font-serif text-[12px]">
                        {geminiExplanation.explanation}
                      </div>
                      <div className="pt-2 border-t border-[#E8DAC2] flex flex-wrap gap-2 text-[10.5px] text-[#6E5E4E]">
                        <span className="font-semibold text-[#8B3A1C]">Cited Documents:</span>
                        {geminiExplanation.citedSources.map((cs, idx) => (
                          <span key={idx} className="bg-white px-1.5 py-0.5 rounded border border-[#E0D8CB]">
                            {cs.documentTitle} ({cs.pageLabel})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Results List */}
                  <div className="space-y-3">
                    {results.map((r) => (
                      <ResultCard
                        key={r.resultId}
                        result={r}
                        query={lastQuery}
                        onOpenPage={(docId, pageIndex) => setModalTarget({ docId, pageIndex })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Document Upload Panel ───────────────────────────────── */}
          <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#8B3A1C]" />
                <h3 className="font-serif font-bold text-sm text-[#271E15]">
                  Add Documents to Reference Library
                </h3>
              </div>
              <span className="text-[11px] text-[#786959]">
                PDF (text &amp; scanned), DOCX, TXT · Up to 50 MB
              </span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-[#8B3A1C] bg-[#FDF4EC]'
                  : 'border-[#D5C9B5] bg-[#FDFAF4] hover:border-[#C8A882] hover:bg-[#FAF3E8]'
              }`}
            >
              <Upload className="w-8 h-8 text-[#B0926E] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#4A3E30]">
                Drag and drop books, excavation reports, or translations here, or{' '}
                <span className="text-[#8B3A1C] font-semibold underline">browse files</span>
              </p>
              <p className="text-[11px] text-[#8A7A6B] mt-1">
                Multiple files supported simultaneously. Automatic page-level indexing and OCR extraction.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>

            {/* Selected Files Staging */}
            {selectedFiles.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#5A4A3A] uppercase tracking-wider block">
                  Files Selected for Upload ({selectedFiles.length}):
                </span>
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-[#F5F0E8] border border-[#DDD3C0] rounded-lg px-3 py-2">
                    <FileText className="w-3.5 h-3.5 text-[#8B3A1C] flex-shrink-0" />
                    <span className="flex-1 truncate font-medium text-[#2A231C]">{f.name}</span>
                    <span className="text-[10px] text-[#8A7A6B]">{formatFileSize(f.size)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelectedFile(i);
                      }}
                      className="text-[#8A7A6B] hover:text-red-500 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Metadata Fields Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-1">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-semibold text-[#5A4A3A] uppercase tracking-wider mb-1">
                  Document Title (Optional if named in file)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Archaeological Survey of India Memoir on Pataliputra Moats"
                  value={uploadMeta.title}
                  onChange={(e) => setUploadMeta((m) => ({ ...m, title: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D8CDB8] rounded-md text-[#2A231C] text-xs outline-none focus:border-[#8B3A1C]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#5A4A3A] uppercase tracking-wider mb-1">
                  Source Category
                </label>
                <select
                  value={uploadMeta.category}
                  onChange={(e) => setUploadMeta((m) => ({ ...m, category: e.target.value as DocumentCategory }))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D8CDB8] rounded-md text-[#2A231C] text-xs cursor-pointer outline-none focus:border-[#8B3A1C]"
                >
                  <option value="textbook">Textbook</option>
                  <option value="archaeological_report">Archaeological Excavation Report</option>
                  <option value="engineering_book">Historical Engineering Book</option>
                  <option value="epigraphical_collection">Epigraphical &amp; Inscription Collection</option>
                  <option value="translated_manuscript">Translated Historical Manuscript</option>
                  <option value="research_paper">Research Paper</option>
                  <option value="technical_report">Technical Report</option>
                  <option value="other">Other Reference</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#5A4A3A] uppercase tracking-wider mb-1">
                  Author or Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. D.B. Spooner / ASI"
                  value={uploadMeta.author}
                  onChange={(e) => setUploadMeta((m) => ({ ...m, author: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D8CDB8] rounded-md text-[#2A231C] text-xs outline-none focus:border-[#8B3A1C]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#5A4A3A] uppercase tracking-wider mb-1">
                  Publisher or Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Government Press Calcutta"
                  value={uploadMeta.organization}
                  onChange={(e) => setUploadMeta((m) => ({ ...m, organization: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D8CDB8] rounded-md text-[#2A231C] text-xs outline-none focus:border-[#8B3A1C]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#5A4A3A] uppercase tracking-wider mb-1">
                  Publication Year
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1920"
                  min="1000"
                  max="2100"
                  value={uploadMeta.publicationYear}
                  onChange={(e) => setUploadMeta((m) => ({ ...m, publicationYear: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D8CDB8] rounded-md text-[#2A231C] text-xs outline-none focus:border-[#8B3A1C]"
                />
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0}
              className="px-4 py-2 text-xs font-semibold bg-[#8B3A1C] hover:bg-[#722F16] text-white rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload and Index {selectedFiles.length > 0 ? `(${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''})` : 'Documents'}</span>
            </button>

            {/* Upload Progress Alerts */}
            {uploadProgress.length > 0 && (
              <div className="space-y-1.5">
                {uploadProgress.map((p, i) => (
                  <div key={i} className="text-xs flex items-center gap-2 px-3 py-2 rounded-lg border bg-[#F8F4EE] border-[#DDD3C0]">
                    {p.stage === 'error' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    ) : p.stage === 'done' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 text-[#8B3A1C] animate-spin flex-shrink-0" />
                    )}
                    <span className={p.stage === 'error' ? 'text-red-600 font-medium' : 'text-[#3A3025]'}>
                      {p.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Uploaded Document Library ───────────────────────────── */}
          <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E8DFCFA0]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8B3A1C]" />
                <h3 className="font-serif font-bold text-sm text-[#271E15]">
                  Searchable Private Reference Library ({documents.length})
                </h3>
              </div>

              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C7E6C]" />
                <input
                  type="text"
                  placeholder="Filter uploaded books..."
                  value={docFilterQuery}
                  onChange={(e) => setDocFilterQuery(e.target.value)}
                  className="pl-7 pr-2.5 py-1 text-xs bg-white border border-[#D8CDB8] rounded text-[#2A231C] placeholder-[#9E9080] outline-none focus:border-[#8B3A1C]"
                />
              </div>
            </div>

            {documents.length === 0 && !docsLoading ? (
              <div className="text-center py-8 text-xs text-[#8A7A6B] border border-dashed border-[#D5C9B5] rounded-lg">
                No documents in library yet. Add your first reference book using the upload panel above.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredDocs.map((doc) => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    onRemove={handleRemoveDocument}
                    onInspect={(docId) => setModalTarget({ docId, pageIndex: 0 })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Page Inspection Modal ─────────────────────────────────── */}
      {modalTarget && (
        <PageModal
          documentId={modalTarget.docId}
          pdfPageIndex={modalTarget.pageIndex}
          highlightQuery={lastQuery}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
};
