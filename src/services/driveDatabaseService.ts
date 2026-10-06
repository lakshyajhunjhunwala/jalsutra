/**
 * JalaSutra Dynamic Database & Knowledge Vault Service
 *
 * Provides dynamic persistence for Google Drive files, research dossiers,
 * field notes, excavation reports, and custom water structures.
 *
 * Architecture:
 * - TiDB Serverless / MySQL Cloud: If `DATABASE_URL` or `TIDB_HOST` is configured,
 *   connects directly via TLS/SSL to TiDB Serverless and auto-migrates schema.
 * - Embedded WAL Disk Fallback: If no cloud DB is provided, persists atomically to
 *   `./data/drive_vault.json` (or `/var/data/drive_vault.json` on Render persistent disk).
 * - Zero breaking changes — works immediately both locally and in the cloud!
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type DriveVaultCategory =
  | 'dossier'
  | 'simulation'
  | 'comparison'
  | 'note'
  | 'excavation'
  | 'pdf'
  | 'hydrology'
  | 'other';

export interface DriveVaultItem {
  id: string;                         // UUID or Google Drive file ID
  name: string;                       // Document title / filename
  category: DriveVaultCategory;       // Category classification
  mimeType: string;                   // 'text/markdown', 'application/json', 'application/pdf', etc.
  size?: number;                      // bytes
  driveFileId?: string;               // Google Drive File ID
  driveFolderId?: string;             // Google Drive Folder ID
  webViewLink?: string;               // URL to Google Drive / external source
  downloadUrl?: string;               // Direct download URL
  content?: string;                   // Full text, markdown, or extracted text
  summary?: string;                   // Concise summary / abstract
  tags: string[];                     // Keywords (e.g. ['Kallanai', 'Chola', 'Excavation'])
  structureId?: string;               // Associated structure ID (e.g. 'kallanai', 'sudarshana')
  metadata?: Record<string, any>;     // Flexible arbitrary properties (e.g. coordinates, dynasty, year)
  createdAt: string;                  // ISO 8601 timestamp
  updatedAt: string;                  // ISO 8601 timestamp
}

export interface DriveVaultFilter {
  query?: string;
  category?: string;
  tag?: string;
  structureId?: string;
  sortBy?: 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size';
  limit?: number;
  offset?: number;
}

export interface DriveVaultStats {
  totalItems: number;
  totalSizeBytes: number;
  categories: Record<string, number>;
  databaseType: 'tidb_serverless' | 'render_disk' | 'embedded_json_wal' | 'cloud_database';
  storagePath: string;
  lastUpdated: string;
}

// Storage path helper
function getStorageDirectory(): string {
  if (process.env.RENDER_DISK_PATH && fs.existsSync(process.env.RENDER_DISK_PATH)) {
    return process.env.RENDER_DISK_PATH;
  }
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR);
  }
  return path.resolve(process.cwd(), 'data');
}

const DATA_DIR = getStorageDirectory();
const DB_FILE = path.join(DATA_DIR, 'drive_vault.json');

// In-memory cache for sub-millisecond query latency
let memoryStore: Map<string, DriveVaultItem> = new Map();
let isInitialized = false;

// TiDB Connection Pool
let tidbPool: mysql.Pool | null = null;
let isTidbActive = false;

// Initial seed data with canonical water-engineering primary records
const INITIAL_SEED_ITEMS: DriveVaultItem[] = [
  {
    id: 'seed-kallanai-grand-anicut',
    name: 'Kallanai Grand Anicut — Civil Engineering Field Survey & Hydrology.md',
    category: 'dossier',
    mimeType: 'text/markdown',
    size: 34962,
    webViewLink: 'https://asi.nic.in/epigraphical-publications/',
    tags: ['Kallanai', 'Chola', 'Karikalan', 'Kaveri', 'Anicut', 'Hydrology'],
    structureId: 'kallanai-grand-anicut',
    summary: 'Comprehensive 39-section civil engineering and archaeological research dossier on the Grand Anicut.',
    metadata: {
      dynasty: 'Early Chola (Karikalan)',
      location: 'Thanjavur / Tiruchirappalli, Tamil Nadu',
      coordinates: '10.8306° N, 78.8197° E',
      constructionDate: 'c. 1st–2nd Century CE',
      lengthMeters: 329,
      widthMeters: 20,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-sudarshana-epigraph-record',
    name: 'Sudarshana Lake Dam — Junagadh Inscriptions & Maurya-Gupta Chronology.md',
    category: 'excavation',
    mimeType: 'text/markdown',
    size: 24500,
    webViewLink: 'https://en.wikipedia.org/wiki/Junagadh_rock_inscription_of_Rudradaman',
    tags: ['Sudarshana', 'Maurya', 'Rudradaman', 'Skandagupta', 'Girnar', 'Dam'],
    structureId: 'sudarshana-lake-dam',
    summary: 'Transcription and analysis of the Junagadh rock inscriptions detailing the 150 CE and 456 CE dam restorations.',
    metadata: {
      dynasty: 'Maurya / Western Satraps / Gupta',
      location: 'Junagadh (Girnar), Gujarat',
      coordinates: '21.5200° N, 70.4700° E',
      ruler: 'Chandragupta Maurya, Ashoka, Rudradaman I, Skandagupta',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-dholavira-reservoirs',
    name: 'Dholavira Harappan Water Harvesting Architecture — ASI Monograph.md',
    category: 'dossier',
    mimeType: 'text/markdown',
    size: 28400,
    webViewLink: 'https://asi.nic.in/excavation-in-dholavira/',
    tags: ['Dholavira', 'Harappan', 'Indus Valley', 'Check Dams', 'Reservoirs'],
    structureId: 'dholavira-reservoirs',
    summary: 'Excavation reports by Dr. R.S. Bisht on the 16 interconnected masonry reservoirs and seasonal stream bunds on Mansar and Manhar.',
    metadata: {
      period: 'Mature Harappan (c. 2600–1900 BCE)',
      location: 'Khadir Island, Kutch, Gujarat',
      coordinates: '23.8860° N, 70.2130° E',
      excavator: 'Dr. R.S. Bisht, ASI',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-porumamilla-treatise',
    name: 'Porumamilla Inscription of 1369 CE — The 12 Prerequisites & 6 Fatal Flaws.md',
    category: 'note',
    mimeType: 'text/markdown',
    size: 16800,
    webViewLink: 'https://www.jstor.org/stable/25193047',
    tags: ['Porumamilla', 'Epigraphy', 'Sadhana', 'Dosha', 'Dam Engineering', 'Vijayanagara'],
    summary: 'Codification of ancient Indian dam engineering standards: 12 Sadhanas (essential requirements) and 6 Doshas (fatal rejection criteria).',
    metadata: {
      year: '1369 CE',
      epigraph: 'Epigraphia Indica Vol. XIV',
      patron: 'Prince Bhaskara Bhavadura (Bukkaraya I)',
      location: 'Kadapa District, Andhra Pradesh',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initialize TiDB Serverless if configured
async function initTidbIfConfigured(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL || process.env.TIDB_URL;
  const tidbHost = process.env.TIDB_HOST;

  if (!dbUrl && !tidbHost) return;

  try {
    if (dbUrl && dbUrl.startsWith('mysql')) {
      tidbPool = mysql.createPool({
        uri: dbUrl,
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
      });
    } else if (tidbHost) {
      tidbPool = mysql.createPool({
        host: tidbHost,
        port: Number(process.env.TIDB_PORT) || 4000,
        user: process.env.TIDB_USER || 'root',
        password: process.env.TIDB_PASSWORD || '',
        database: process.env.TIDB_DATABASE || 'test',
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
      });
    }

    if (tidbPool) {
      await tidbPool.execute(`
        CREATE TABLE IF NOT EXISTS drive_vault_items (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(500) NOT NULL,
          category VARCHAR(50) NOT NULL,
          mime_type VARCHAR(100),
          size BIGINT,
          drive_file_id VARCHAR(255),
          drive_folder_id VARCHAR(255),
          web_view_link TEXT,
          download_url TEXT,
          content LONGTEXT,
          summary TEXT,
          tags JSON,
          structure_id VARCHAR(255),
          metadata JSON,
          created_at VARCHAR(50),
          updated_at VARCHAR(50)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Load existing items from TiDB
      const [rows] = await tidbPool.query('SELECT * FROM drive_vault_items');
      const dbItems = rows as any[];

      if (dbItems && dbItems.length > 0) {
        for (const row of dbItems) {
          const item: DriveVaultItem = {
            id: row.id,
            name: row.name,
            category: row.category,
            mimeType: row.mime_type,
            size: Number(row.size) || 0,
            driveFileId: row.drive_file_id,
            driveFolderId: row.drive_folder_id,
            webViewLink: row.web_view_link,
            downloadUrl: row.download_url,
            content: row.content,
            summary: row.summary,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
            structureId: row.structure_id,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
          memoryStore.set(item.id, item);
        }
        console.log(`[TiDB Serverless] Loaded ${dbItems.length} records into cache.`);
      } else {
        // Seed TiDB with initial records
        for (const seed of INITIAL_SEED_ITEMS) {
          await saveToTidb(seed);
        }
        console.log(`[TiDB Serverless] Initialized with ${INITIAL_SEED_ITEMS.length} seed items.`);
      }

      isTidbActive = true;
    }
  } catch (err: any) {
    console.warn('[TiDB] Connection to TiDB Serverless failed, continuing with embedded WAL DB:', err?.message || err);
    tidbPool = null;
    isTidbActive = false;
  }
}

// Async write to TiDB
async function saveToTidb(item: DriveVaultItem): Promise<void> {
  if (!tidbPool || !isTidbActive) return;
  try {
    const query = `
      INSERT INTO drive_vault_items
      (id, name, category, mime_type, size, drive_file_id, drive_folder_id, web_view_link, download_url, content, summary, tags, structure_id, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      category = VALUES(category),
      mime_type = VALUES(mime_type),
      size = VALUES(size),
      drive_file_id = VALUES(drive_file_id),
      drive_folder_id = VALUES(drive_folder_id),
      web_view_link = VALUES(web_view_link),
      download_url = VALUES(download_url),
      content = VALUES(content),
      summary = VALUES(summary),
      tags = VALUES(tags),
      structure_id = VALUES(structure_id),
      metadata = VALUES(metadata),
      updated_at = VALUES(updated_at)
    `;
    await tidbPool.execute(query, [
      item.id,
      item.name,
      item.category,
      item.mimeType || 'text/markdown',
      item.size || 0,
      item.driveFileId || null,
      item.driveFolderId || null,
      item.webViewLink || null,
      item.downloadUrl || null,
      item.content || null,
      item.summary || null,
      JSON.stringify(item.tags || []),
      item.structureId || null,
      JSON.stringify(item.metadata || {}),
      item.createdAt,
      item.updatedAt,
    ]);
  } catch (err) {
    console.warn('[TiDB] Error saving item to TiDB:', err);
  }
}

async function deleteFromTidb(id: string): Promise<void> {
  if (!tidbPool || !isTidbActive) return;
  try {
    await tidbPool.execute('DELETE FROM drive_vault_items WHERE id = ?', [id]);
  } catch (err) {
    console.warn('[TiDB] Error deleting item from TiDB:', err);
  }
}

// Initialize database from disk / seeds
function initDatabase(): void {
  if (isInitialized) return;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed: DriveVaultItem[] = JSON.parse(raw);
      memoryStore = new Map(parsed.map((item) => [item.id, item]));
    } else {
      memoryStore = new Map(INITIAL_SEED_ITEMS.map((item) => [item.id, item]));
      persistDatabase();
    }
  } catch (err) {
    memoryStore = new Map(INITIAL_SEED_ITEMS.map((item) => [item.id, item]));
  }

  isInitialized = true;

  // Asynchronously attempt TiDB connection if configured in environment
  initTidbIfConfigured().catch(() => {});
}

// Persist memory store to disk atomically
function persistDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    const items = Array.from(memoryStore.values());
    fs.writeFileSync(tempFile, JSON.stringify(items, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DriveVault DB] Failed to persist database:', err);
  }
}

// Public Database API
export const driveDatabase = {
  /**
   * List items with optional query, category, tags, and pagination
   */
  list(filter: DriveVaultFilter = {}): { items: DriveVaultItem[]; total: number } {
    initDatabase();
    let results = Array.from(memoryStore.values());

    if (filter.query && filter.query.trim()) {
      const q = filter.query.toLowerCase().trim();
      results = results.filter((item) =>
        item.name.toLowerCase().includes(q) ||
        (item.summary && item.summary.toLowerCase().includes(q)) ||
        (item.content && item.content.toLowerCase().includes(q)) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filter.category && filter.category !== 'all') {
      results = results.filter((item) => item.category === filter.category);
    }

    if (filter.tag) {
      const t = filter.tag.toLowerCase();
      results = results.filter((item) => item.tags.some((tag) => tag.toLowerCase() === t));
    }

    if (filter.structureId) {
      results = results.filter((item) => item.structureId === filter.structureId);
    }

    const sortBy = filter.sortBy || 'newest';
    results.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
      return 0;
    });

    const total = results.length;
    const offset = filter.offset || 0;
    const limit = filter.limit !== undefined ? filter.limit : 100;
    const paginated = results.slice(offset, offset + limit);

    return { items: paginated, total };
  },

  /**
   * Get single item by ID
   */
  get(id: string): DriveVaultItem | null {
    initDatabase();
    return memoryStore.get(id) || null;
  },

  /**
   * Save (insert or update) an item
   */
  save(itemData: Partial<DriveVaultItem> & { name: string }): DriveVaultItem {
    initDatabase();
    const now = new Date().toISOString();
    const id = itemData.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const existing = memoryStore.get(id);

    const updated: DriveVaultItem = {
      id,
      name: itemData.name,
      category: itemData.category || existing?.category || 'dossier',
      mimeType: itemData.mimeType || existing?.mimeType || 'text/markdown',
      size: itemData.size !== undefined ? itemData.size : (itemData.content?.length || existing?.size || 0),
      driveFileId: itemData.driveFileId || existing?.driveFileId,
      driveFolderId: itemData.driveFolderId || existing?.driveFolderId,
      webViewLink: itemData.webViewLink || existing?.webViewLink,
      downloadUrl: itemData.downloadUrl || existing?.downloadUrl,
      content: itemData.content !== undefined ? itemData.content : existing?.content,
      summary: itemData.summary || existing?.summary,
      tags: itemData.tags || existing?.tags || [],
      structureId: itemData.structureId || existing?.structureId,
      metadata: { ...(existing?.metadata || {}), ...(itemData.metadata || {}) },
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    memoryStore.set(id, updated);
    persistDatabase();

    // Async sync to TiDB if active
    saveToTidb(updated).catch(() => {});

    return updated;
  },

  /**
   * Delete an item by ID
   */
  delete(id: string): boolean {
    initDatabase();
    const existed = memoryStore.delete(id);
    if (existed) {
      persistDatabase();
      deleteFromTidb(id).catch(() => {});
    }
    return existed;
  },

  /**
   * Bulk import items
   */
  bulkImport(items: Array<Partial<DriveVaultItem> & { name: string }>): { imported: number; total: number } {
    initDatabase();
    let count = 0;
    for (const item of items) {
      this.save(item);
      count++;
    }
    return { imported: count, total: memoryStore.size };
  },

  /**
   * Get database statistics
   */
  getStats(): DriveVaultStats {
    initDatabase();
    const items = Array.from(memoryStore.values());
    const totalSizeBytes = items.reduce((sum, item) => sum + (item.size || (item.content?.length || 0)), 0);

    const categories: Record<string, number> = {};
    for (const item of items) {
      categories[item.category] = (categories[item.category] || 0) + 1;
    }

    const databaseType: DriveVaultStats['databaseType'] = isTidbActive
      ? 'tidb_serverless'
      : process.env.RENDER_DISK_PATH
      ? 'render_disk'
      : 'embedded_json_wal';

    return {
      totalItems: items.length,
      totalSizeBytes,
      categories,
      databaseType,
      storagePath: isTidbActive ? 'TiDB Serverless Cloud (MySQL Protocol)' : DB_FILE,
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Search relevant items for Gemini prompt grounding
   */
  searchGroundingContext(query: string, maxSnippets = 3): string {
    initDatabase();
    if (!query || query.length < 3) return '';

    const { items } = this.list({ query, limit: maxSnippets });
    if (!items || items.length === 0) return '';

    const lines: string[] = ['[LOCAL KNOWLEDGE VAULT GROUNDING FROM USER DRIVE DATA:]'];
    for (const item of items) {
      lines.push(`- Document: "${item.name}" (${item.category}, tags: ${item.tags.join(', ')})`);
      if (item.summary) lines.push(`  Summary: ${item.summary}`);
      if (item.content) {
        const snippet = item.content.slice(0, 400).replace(/\n+/g, ' ');
        lines.push(`  Excerpt: "${snippet}..."`);
      }
    }
    return lines.join('\n');
  },
};
