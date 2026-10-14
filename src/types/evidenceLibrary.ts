// ============================================================
// Evidence Library Types — JalaSutra Atlas Textbook Search
// ============================================================

export type DocumentCategory =
  | 'textbook'
  | 'archaeological_report'
  | 'engineering_book'
  | 'epigraphical_collection'
  | 'translated_manuscript'
  | 'research_paper'
  | 'technical_report'
  | 'other';

export type ProcessingStatus =
  | 'pending'
  | 'extracting'
  | 'ocr_processing'
  | 'indexing'
  | 'ready'
  | 'error';

export type SearchMode = 'exact' | 'keyword' | 'semantic' | 'advanced';

export type MatchType = 'exact_phrase' | 'keyword' | 'semantic';

// ── Document metadata ─────────────────────────────────────────
export interface EvidenceDocument {
  id: string;
  title: string;
  author?: string;
  organization?: string;
  publicationYear?: number;
  category: DocumentCategory;
  filename: string;
  originalMimeType: string;
  fileSizeBytes: number;
  pageCount?: number;
  processingStatus: ProcessingStatus;
  processingError?: string;
  ocrApplied: boolean;
  ocrWarning?: string;
  uploadedAt: string; // ISO 8601
  indexedAt?: string;
}

// ── Page record stored in the in-memory index ──────────────────
export interface IndexedPage {
  documentId: string;
  pdfPageIndex: number;       // 0-based internal PDF page index
  printedPageLabel?: string;  // printed number as it appears on the page, if detected
  rawText: string;            // exact extracted / OCR text
  ocrConfidence?: number;     // 0–1 if OCR was used
  originalLanguage?: 'tamil' | 'sanskrit' | 'prakrit' | 'english' | string;
  originalText?: string;       // authentic primary text in original script (Tamil, Sanskrit, etc.)
  englishTranslation?: string; // corresponding English scholarly translation
}

// ── Search request ─────────────────────────────────────────────
export interface EvidenceSearchRequest {
  query: string;
  mode: SearchMode;
  documentIds?: string[];     // restrict to subset; empty = search all
  authorFilter?: string;
  yearFrom?: number;
  yearTo?: number;
  categoryFilter?: DocumentCategory;
  pageFrom?: number;
  pageTo?: number;
  maxResults?: number;
  autoTranslateQuery?: boolean; // automatically translate query between English, Tamil, and Sanskrit
}

// ── Single search result ───────────────────────────────────────
export interface EvidenceSearchResult {
  resultId: string;
  documentId: string;
  documentTitle: string;
  documentAuthor?: string;
  documentYear?: number;
  pdfPageIndex: number;
  printedPageLabel?: string;
  matchedText: string;        // exact substring that matched
  contextBefore: string;      // ~300 chars before match
  contextAfter: string;       // ~300 chars after match
  matchType: MatchType;
  relevanceNote: string;
  ocrDerived: boolean;
  ocrWarning?: string;
  originalLanguage?: string;   // 'tamil', 'sanskrit', etc.
  originalText?: string;       // original ancient language text (Tamil/Sanskrit)
  englishTranslation?: string; // English translation of the passage
  translatedQuery?: string;    // translation of query used to locate evidence
}

// ── Upload progress ────────────────────────────────────────────
export interface UploadProgress {
  documentId: string;
  stage: 'uploading' | 'extracting' | 'ocr' | 'indexing' | 'done' | 'error';
  percent: number;
  message: string;
}
