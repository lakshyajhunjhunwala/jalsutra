/**
 * Google Drive API v3 Service for JalaSutra
 * Handles authentication, folder management, file uploads, listing, reading, and deletion.
 */

import { getApiUrl } from './apiConfig.ts';

export interface DriveUser {
  name: string;
  email: string;
  picture?: string;
  connectedAt: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: number | string;
  webViewLink?: string;
  iconLink?: string;
  parents?: string[];
  category?: 'dossier' | 'simulation' | 'comparison' | 'note' | 'other';
  content?: string;
  isLocalOnly?: boolean;
}

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

const LOCAL_STORAGE_KEY_FILES = 'jalasutra_drive_local_files_v1';
const LOCAL_STORAGE_KEY_USER = 'jalasutra_drive_user_v1';
const LOCAL_STORAGE_KEY_TOKEN = 'jalasutra_drive_token_v1';
const LOCAL_STORAGE_KEY_CLIENT_ID = 'jalasutra_drive_client_id_v1';
const LOCAL_STORAGE_KEY_FOLDER_ID = 'jalasutra_drive_archive_folder_id_v1';

// In-memory token cache
let cachedAccessToken: string | null = null;
let cachedUser: DriveUser | null = null;
let cachedArchiveFolderId: string | null = null;

// Initialize from session / storage if available
try {
  const savedToken = sessionStorage.getItem(LOCAL_STORAGE_KEY_TOKEN);
  if (savedToken) {
    cachedAccessToken = savedToken;
  }
  const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
  if (savedUser) {
    cachedUser = JSON.parse(savedUser);
  }
  const savedFolder = localStorage.getItem(LOCAL_STORAGE_KEY_FOLDER_ID);
  if (savedFolder) {
    cachedArchiveFolderId = savedFolder;
  }
} catch (e) {
  console.warn('Could not read session storage for Drive token:', e);
}

// Event listeners for auth state changes
type AuthListener = (user: DriveUser | null, token: string | null) => void;
const authListeners: Set<AuthListener> = new Set();

export const onDriveAuthStateChanged = (listener: AuthListener) => {
  authListeners.add(listener);
  listener(cachedUser, cachedAccessToken);
  return () => {
    authListeners.delete(listener);
  };
};

function notifyAuthListeners() {
  authListeners.forEach((listener) => listener(cachedUser, cachedAccessToken));
}

export function getCachedToken(): string | null {
  return cachedAccessToken;
}

export function getCachedUser(): DriveUser | null {
  return cachedUser;
}

export function isDriveConnected(): boolean {
  return Boolean(cachedAccessToken && cachedUser);
}

export function setCustomClientId(clientId: string) {
  localStorage.setItem(LOCAL_STORAGE_KEY_CLIENT_ID, clientId.trim());
}

export function getCustomClientId(): string {
  return localStorage.getItem(LOCAL_STORAGE_KEY_CLIENT_ID) || '';
}

/**
 * Fetch Google User Info using Access Token
 */
export async function fetchUserInfo(accessToken: string): Promise<DriveUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user profile: ${res.statusText}`);
  }

  const data = await res.json();
  const user: DriveUser = {
    name: data.name || data.email || 'Google User',
    email: data.email || '',
    picture: data.picture,
    connectedAt: new Date().toISOString(),
  };

  cachedUser = user;
  localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
  return user;
}

/**
 * Connect using an existing/pasted OAuth Access Token
 */
export async function connectWithAccessToken(token: string): Promise<DriveUser> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new Error('Access token cannot be empty');
  }

  try {
    const user = await fetchUserInfo(cleanToken);
    cachedAccessToken = cleanToken;
    try {
      sessionStorage.setItem(LOCAL_STORAGE_KEY_TOKEN, cleanToken);
    } catch (e) {}

    notifyAuthListeners();
    // Try to ensure the archive folder exists in their Drive
    try {
      await ensureArchiveFolder(cleanToken);
    } catch (e) {
      console.warn('Could not auto-create JalaSutra folder:', e);
    }
    return user;
  } catch (err: any) {
    console.error('Error validating access token:', err);
    throw new Error(`Invalid access token: ${err.message || 'Verification failed'}`);
  }
}

/**
 * Connect with Google Identity Services (GIS) token client popup
 */
export async function connectWithGoogleIdentityServices(clientIdOverride?: string): Promise<DriveUser> {
  return new Promise((resolve, reject) => {
    const clientId = clientIdOverride || getCustomClientId();

    if (!clientId) {
      reject(
        new Error(
          'OAuth Client ID required. Please enter your Google Cloud OAuth Client ID, or provide an Access Token.'
        )
      );
      return;
    }

    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services script not loaded. Check internet connection.'));
      return;
    }

    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPES.join(' '),
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }

        const accessToken = tokenResponse.access_token;
        if (!accessToken) {
          reject(new Error('No access token received from Google'));
          return;
        }

        try {
          const user = await connectWithAccessToken(accessToken);
          resolve(user);
        } catch (e) {
          reject(e);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * Disconnect Google Drive from app
 */
export function disconnectDrive() {
  if (cachedAccessToken && (window as any).google?.accounts?.oauth2?.revoke) {
    try {
      (window as any).google.accounts.oauth2.revoke(cachedAccessToken, () => {});
    } catch (e) {}
  }

  cachedAccessToken = null;
  cachedUser = null;
  cachedArchiveFolderId = null;

  try {
    sessionStorage.removeItem(LOCAL_STORAGE_KEY_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
    localStorage.removeItem(LOCAL_STORAGE_KEY_FOLDER_ID);
  } catch (e) {}

  notifyAuthListeners();
}

/**
 * Ensures "JalaSutra Ancient Hydrology Archive" folder exists in Google Drive
 */
export async function ensureArchiveFolder(token: string): Promise<string> {
  if (cachedArchiveFolderId) return cachedArchiveFolderId;

  // Search if folder already exists
  const query = "mimeType = 'application/vnd.google-apps.folder' and name = 'JalaSutra Ancient Hydrology Archive' and trashed = false";
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      const folderId: string = data.files[0].id;
      cachedArchiveFolderId = folderId;
      localStorage.setItem(LOCAL_STORAGE_KEY_FOLDER_ID, folderId);
      return folderId;
    }
  }

  // Create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'JalaSutra Ancient Hydrology Archive',
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Dedicated archive for ancient water engineering research, dossiers, and dam simulations generated in JalaSutra.',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create JalaSutra archive folder on Google Drive');
  }

  const folderData = await createRes.json();
  const newFolderId: string = folderData.id;
  cachedArchiveFolderId = newFolderId;
  localStorage.setItem(LOCAL_STORAGE_KEY_FOLDER_ID, newFolderId);
  return newFolderId;
}

/**
 * List files from Google Drive
 */
export async function listDriveFiles(
  folderId?: string,
  searchQuery?: string
): Promise<DriveFileItem[]> {
  const token = cachedAccessToken;

  // If not connected to Google Drive live, return local / demo archive files
  if (!token) {
    return getLocalArchiveFiles(searchQuery);
  }

  try {
    let q = "trashed = false";
    if (folderId) {
      q += ` and '${folderId}' in parents`;
    }
    if (searchQuery && searchQuery.trim()) {
      q += ` and name contains '${searchQuery.trim().replace(/'/g, "\\'")}'`;
    }

    const fields = 'files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink, parents, description)';
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=modifiedTime desc&pageSize=50&fields=${encodeURIComponent(fields)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // If 401 Unauthorized, token expired
      if (res.status === 401) {
        disconnectDrive();
        throw new Error('Google Drive session expired. Please reconnect.');
      }
      throw new Error(`Failed to list files from Google Drive (${res.statusText})`);
    }

    const data = await res.json();
    const driveFiles: DriveFileItem[] = (data.files || []).map((file: any) => {
      let category: DriveFileItem['category'] = 'other';
      const name = file.name.toLowerCase();
      if (name.includes('dossier') || name.includes('research')) category = 'dossier';
      else if (name.includes('simulation') || name.includes('hydraulic')) category = 'simulation';
      else if (name.includes('comparison') || name.includes('matrix')) category = 'comparison';
      else if (name.includes('note')) category = 'note';

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        size: file.size ? formatBytes(Number(file.size)) : undefined,
        webViewLink: file.webViewLink,
        iconLink: file.iconLink,
        parents: file.parents,
        category,
      };
    });

    // Merge with backend dynamic database items and local files
    const dbFiles = await fetchDatabaseVaultFiles(searchQuery);
    const localFiles = getLocalArchiveFiles(searchQuery).filter((f) => f.isLocalOnly);

    // Deduplicate by ID (Google Drive > Database Vault > Local)
    const seenIds = new Set(driveFiles.map((f) => f.id));
    const merged = [...driveFiles];
    for (const f of dbFiles) {
      if (!seenIds.has(f.id)) {
        seenIds.add(f.id);
        merged.push(f);
      }
    }
    for (const f of localFiles) {
      if (!seenIds.has(f.id)) {
        seenIds.add(f.id);
        merged.push(f);
      }
    }
    return merged;
  } catch (error: any) {
    console.warn('Drive API error, loading from dynamic database vault and local files:', error);
    const dbFiles = await fetchDatabaseVaultFiles(searchQuery);
    const localFiles = getLocalArchiveFiles(searchQuery);
    const seenIds = new Set(dbFiles.map((f) => f.id));
    const merged = [...dbFiles];
    for (const f of localFiles) {
      if (!seenIds.has(f.id)) {
        seenIds.add(f.id);
        merged.push(f);
      }
    }
    return merged;
  }
}

/**
 * Upload a text or markdown file to Google Drive using multipart upload
 */
export async function uploadFileToDrive({
  name,
  content,
  mimeType = 'text/markdown',
  folderId,
  description,
  category = 'dossier',
}: {
  name: string;
  content: string;
  mimeType?: string;
  folderId?: string;
  description?: string;
  category?: 'dossier' | 'simulation' | 'comparison' | 'note' | 'other';
}): Promise<DriveFileItem> {
  const token = cachedAccessToken;

  // Always keep a local copy in local archive
  const localItem: DriveFileItem = {
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    mimeType,
    modifiedTime: new Date().toISOString(),
    size: formatBytes(new Blob([content]).size),
    category,
    content,
    isLocalOnly: !token,
  };
  saveLocalArchiveFile(localItem);

  if (!token) {
    return localItem;
  }

  try {
    // If no folderId specified, try to put into JalaSutra Archive folder
    let targetFolderId = folderId;
    if (!targetFolderId) {
      try {
        targetFolderId = await ensureArchiveFolder(token);
      } catch (e) {
        console.warn('Could not get archive folder, saving to root:', e);
      }
    }

    const metadata: any = {
      name,
      mimeType,
      description: description || `Created by JalaSutra Ancient Hydrology Research Assistant (${category})`,
    };

    if (targetFolderId) {
      metadata.parents = [targetFolderId];
    }

    const boundary = '-------JALASUTRA_BOUNDARY_' + Math.random().toString(36).substring(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink,iconLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Upload failed with status ${res.status}`);
    }

    const uploaded = await res.json();
    const driveItem: DriveFileItem = {
      id: uploaded.id,
      name: uploaded.name,
      mimeType: uploaded.mimeType,
      modifiedTime: uploaded.modifiedTime,
      size: formatBytes(new Blob([content]).size),
      webViewLink: uploaded.webViewLink,
      iconLink: uploaded.iconLink,
      category,
      content,
      isLocalOnly: false,
    };

    // Update local cache
    saveLocalArchiveFile(driveItem);
    return driveItem;
  } catch (error: any) {
    console.error('Failed to upload directly to Google Drive:', error);
    // Mark as local-only with notice
    localItem.isLocalOnly = true;
    saveLocalArchiveFile(localItem);
    throw error;
  }
}

/**
 * Create a new folder on Google Drive or Workspace local archive
 */
export async function createFolderInDriveOrWorkspace(folderName: string, parentFolderId?: string): Promise<DriveFileItem> {
  const cleanName = folderName.trim() || 'New Folder';
  const token = cachedAccessToken;

  if (!token) {
    const localFolder: DriveFileItem = {
      id: `local_folder_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: cleanName,
      mimeType: 'application/vnd.google-apps.folder',
      modifiedTime: new Date().toISOString(),
      parents: parentFolderId ? [parentFolderId] : undefined,
      category: 'other',
      isLocalOnly: true,
    };
    saveLocalArchiveFile(localFolder);
    return localFolder;
  }

  return createDriveFolder(cleanName, parentFolderId);
}

/**
 * Create a new folder on Google Drive
 */
export async function createDriveFolder(folderName: string, parentFolderId?: string): Promise<DriveFileItem> {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error('Google Drive is not connected');
  }

  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,modifiedTime,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    throw new Error('Failed to create folder');
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    modifiedTime: data.modifiedTime,
    webViewLink: data.webViewLink,
    category: 'other',
  };
}

/**
 * Read content of a file from Google Drive
 */
export async function getDriveFileContent(fileId: string): Promise<string> {
  // Check local archive first
  const localFiles = getLocalArchiveFiles();
  const matched = localFiles.find((f) => f.id === fileId);
  if (matched?.content) {
    return matched.content;
  }

  const token = cachedAccessToken;
  if (!token) {
    throw new Error('Please connect your Google Drive to view this file.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to read file content (${res.statusText})`);
  }

  return await res.text();
}

/**
 * Delete a file from Google Drive
 */
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  // Remove from local cache
  deleteLocalArchiveFile(fileId);

  const token = cachedAccessToken;
  if (!token || fileId.startsWith('local_')) {
    return true;
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.ok;
}

// ----------------- EXPORT HELPERS ----------------- //

/**
 * Export Research Dossier to Google Drive
 */
export async function exportResearchDossierToDrive(
  query: string,
  dossierContent: string,
  groundingSources?: Array<{ title: string; uri: string }>
): Promise<DriveFileItem> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const cleanTitle = query.slice(0, 40).replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'Hydrology_Research';
  const fileName = `JalaSutra_Dossier_${cleanTitle}_${timestamp}.md`;

  let markdown = `# JalaSutra Hydraulic Engineering Dossier\n\n`;
  markdown += `**Research Query:** ${query}\n`;
  markdown += `**Archival Date:** ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}\n`;
  markdown += `**Standard:** 15-Point Epigraphical & Hydraulic Protocol\n\n`;
  markdown += `---\n\n`;
  markdown += dossierContent;

  if (groundingSources && groundingSources.length > 0) {
    markdown += `\n\n---\n\n## Archaeological & Epigraphical References\n\n`;
    groundingSources.forEach((src, idx) => {
      markdown += `${idx + 1}. [${src.title}](${src.uri})\n`;
    });
  }

  markdown += `\n\n---\n*Exported from JalaSutra: Ancient Hydrology & Water Engineering Research Assistant*\n`;

  return uploadFileToDrive({
    name: fileName,
    content: markdown,
    mimeType: 'text/markdown',
    description: `Ancient hydrology research dossier on "${query}"`,
    category: 'dossier',
  });
}

/**
 * Export Dam Embankment Simulation to Google Drive
 */
export async function exportSimulationToDrive(
  inputs: {
    heightMeters: number;
    crestWidthMeters: number;
    embankmentLengthMeters: number;
    catchmentAreaSqKm: number;
    materialType: string;
    upstreamSlope: number;
    spillwayWidthMeters: number;
  },
  hydraulics: {
    hydrostaticThrustPerMeterKN: number;
    totalThrustMN: number;
    totalWeightMN: number;
    factorOfSafetySliding: number;
    estimatedStorageMCM: number;
    peakFloodDischargeCumecs: number;
    spillwayCapacityCumecs: number;
    scourVelocityMs: number;
    floodSafetyRatio: number;
    isOvertoppingRisk: boolean;
  },
  notes?: string
): Promise<DriveFileItem> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const fileName = `JalaSutra_Simulation_${inputs.materialType}_${inputs.heightMeters}m_${timestamp}.md`;

  let markdown = `# JalaSutra Hydraulic Embankment Physics Report\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
  markdown += `**Embankment Profile:** ${inputs.heightMeters}m Height | ${inputs.embankmentLengthMeters}m Crest Length\n\n`;
  markdown += `## 1. Geometric & Catchment Specifications\n\n`;
  markdown += `| Parameter | Value |\n|---|---|\n`;
  markdown += `| Embankment Height | ${inputs.heightMeters} meters |\n`;
  markdown += `| Crest Width | ${inputs.crestWidthMeters} meters |\n`;
  markdown += `| Embankment Length | ${inputs.embankmentLengthMeters} meters |\n`;
  markdown += `| Upstream Slope | 1:${inputs.upstreamSlope} |\n`;
  markdown += `| Construction Material | ${inputs.materialType === 'cyclopean_masonry' ? 'Mortarless Cyclopean Sandstone Blocks' : 'Composite Compacted Clay Core with Rip-Rap'} |\n`;
  markdown += `| Catchment Basin Area | ${inputs.catchmentAreaSqKm} km² |\n`;
  markdown += `| Surplus Spillway Width | ${inputs.spillwayWidthMeters} meters |\n\n`;

  markdown += `## 2. Hydraulic Mechanics & Safety Factors\n\n`;
  markdown += `| Mechanical Calculation | Ancient Design Result | Evaluation |\n|---|---|---|\n`;
  markdown += `| Hydrostatic Thrust per Meter | ${hydraulics.hydrostaticThrustPerMeterKN.toFixed(1)} kN/m | Steady state head |\n`;
  markdown += `| Total Embankment Thrust | ${hydraulics.totalThrustMN.toFixed(2)} MN | Resultant horizontal force |\n`;
  markdown += `| Total Deadweight Resistance | ${hydraulics.totalWeightMN.toFixed(2)} MN | Resisting gravity volume |\n`;
  markdown += `| **Factor of Safety (Sliding)** | **${hydraulics.factorOfSafetySliding.toFixed(2)}** | ${hydraulics.factorOfSafetySliding >= 1.5 ? '✅ Highly Stable (Exceeds modern 1.5 threshold)' : '⚠️ Marginally Stable'} |\n`;
  markdown += `| Estimated Storage Volume | ${hydraulics.estimatedStorageMCM.toFixed(2)} MCM | Millions of cubic meters |\n`;
  markdown += `| Peak Monsoon Inflow (Ryves) | ${hydraulics.peakFloodDischargeCumecs.toFixed(1)} m³/s | Design cloudburst |\n`;
  markdown += `| Surplus Weir Capacity | ${hydraulics.spillwayCapacityCumecs.toFixed(1)} m³/s | Broad-crested discharge |\n`;
  markdown += `| Flood Discharge Ratio | ${hydraulics.floodSafetyRatio.toFixed(2)} | ${hydraulics.isOvertoppingRisk ? '🚨 Overtopping Risk in extreme flood' : '✅ Adequate flood passage'} |\n`;
  markdown += `| Scour Sluice Velocity | ${hydraulics.scourVelocityMs.toFixed(2)} m/s | ${hydraulics.scourVelocityMs >= 2.5 ? 'Active Silt Flushing' : 'Manual Desilting Required'} |\n\n`;

  if (notes) {
    markdown += `## 3. Structural Observations & Failure Mode Analysis\n\n${notes}\n\n`;
  }

  markdown += `---\n*Exported from JalaSutra Ancient Hydrology Simulator to Google Drive*\n`;

  return uploadFileToDrive({
    name: fileName,
    content: markdown,
    mimeType: 'text/markdown',
    description: `Embankment physics report for ${inputs.heightMeters}m dam structure`,
    category: 'simulation',
  });
}

/**
 * Export Comparative Matrix to Google Drive
 */
export async function exportComparisonToDrive(
  structures: string[],
  comparisonMarkdown: string
): Promise<DriveFileItem> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const cleanNames = structures.map((s) => s.split(' ')[0]).join('_vs_');
  const fileName = `JalaSutra_Comparison_${cleanNames}_${timestamp}.md`;

  let content = `# Ancient Hydraulic Engineering Comparative Matrix\n\n`;
  content += `**Compared Structures:** ${structures.join('  •  ')}\n`;
  content += `**Date:** ${new Date().toLocaleDateString()}\n\n`;
  content += `---\n\n`;
  content += comparisonMarkdown;
  content += `\n\n---\n*Exported to Google Drive from JalaSutra Comparative Matrix Engine*\n`;

  return uploadFileToDrive({
    name: fileName,
    content,
    mimeType: 'text/markdown',
    description: `Comparative engineering study: ${structures.join(' vs ')}`,
    category: 'comparison',
  });
}

/**
 * Export a structured Archaeological Dossier to Google Drive
 */
export async function exportArchaeologicalDossierToDrive(
  dossier: {
    name: string;
    sanskritOrLocalName?: string;
    state: string;
    region: string;
    coordinates?: string;
    riverBasin: string;
    period: string;
    associatedRulerOrCivilization: string;
    purpose: string;
    waterSource: string;
    dimensions: {
      length?: string;
      height?: string;
      crestWidth?: string;
      baseWidth?: string;
      reservoirArea?: string;
      storageCapacity?: string;
    };
    constructionMaterials: string[];
    structuralDesign: string;
    waterManagementMethod: string;
    irrigationMethod: string;
    drainageAndFloodControl: string;
    historicalAndArchaeologicalEvidence: {
      inscriptions: string[];
      archaeologicalExcavations: string[];
      writtenTexts?: string[];
    };
    engineeringAnalysis: {
      problem: string;
      environmentalCondition: string;
      engineeringSolution: string;
      constructionMethod: string;
      result: string;
    };
    modernRelevance: string;
  },
  folderId?: string
): Promise<DriveFileItem> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const cleanName = dossier.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const fileName = `JalaSutra_Dossier_${cleanName}_${timestamp}.md`;

  let md = `# ${dossier.name} (${dossier.sanskritOrLocalName || ''})\n\n`;
  md += `**Location:** ${dossier.state}, ${dossier.region} (${dossier.riverBasin})\n`;
  if (dossier.coordinates) md += `**Coordinates:** ${dossier.coordinates}\n`;
  md += `**Period:** ${dossier.period}\n`;
  md += `**Associated Civilization / Ruler:** ${dossier.associatedRulerOrCivilization}\n`;
  md += `**Hydraulic Purpose:** ${dossier.purpose}\n`;
  md += `**Water Source:** ${dossier.waterSource}\n\n`;
  md += `---\n\n`;
  md += `## 1. Physical Specifications & Metrology\n\n`;
  md += `- **Embankment Length:** ${dossier.dimensions.length || 'Contoured terrain alignment'}\n`;
  md += `- **Height:** ${dossier.dimensions.height || 'Variable slope'}\n`;
  md += `- **Crest Width:** ${dossier.dimensions.crestWidth || 'Multi-tier masonry crest'}\n`;
  md += `- **Base Width:** ${dossier.dimensions.baseWidth || 'Wide gravity footings'}\n`;
  md += `- **Reservoir Area / Storage:** ${dossier.dimensions.reservoirArea || 'N/A'} (Est. ${dossier.dimensions.storageCapacity || 'N/A'})\n`;
  md += `- **Construction Materials:** ${dossier.constructionMaterials.join(', ')}\n\n`;
  md += `## 2. Hydraulic Engineering Analysis\n\n`;
  md += `- **Engineering Problem:** ${dossier.engineeringAnalysis.problem}\n`;
  md += `- **Environmental Conditions:** ${dossier.engineeringAnalysis.environmentalCondition}\n`;
  md += `- **Engineering Solution:** ${dossier.engineeringAnalysis.engineeringSolution}\n`;
  md += `- **Construction Method:** ${dossier.engineeringAnalysis.constructionMethod}\n`;
  md += `- **Agrarian Result:** ${dossier.engineeringAnalysis.result}\n\n`;
  md += `## 3. Water Sluice & Flow Mechanics\n\n`;
  md += `- **Water Management / Sluices:** ${dossier.waterManagementMethod}\n`;
  md += `- **Irrigation Channels:** ${dossier.irrigationMethod}\n`;
  md += `- **Drainage & Flood Surplus Weirs:** ${dossier.drainageAndFloodControl}\n\n`;
  md += `## 4. Epigraphical Records & Physical Archaeology\n\n`;
  if (dossier.historicalAndArchaeologicalEvidence.inscriptions.length > 0) {
    md += `### Inscriptions:\n`;
    dossier.historicalAndArchaeologicalEvidence.inscriptions.forEach((ins) => {
      md += `> "${ins}"\n\n`;
    });
  }
  if (dossier.historicalAndArchaeologicalEvidence.archaeologicalExcavations.length > 0) {
    md += `### Archaeological Excavations:\n`;
    dossier.historicalAndArchaeologicalEvidence.archaeologicalExcavations.forEach((exc) => {
      md += `- ${exc}\n`;
    });
  }
  md += `\n## 5. Modern Civil Engineering Relevance\n\n`;
  md += `${dossier.modernRelevance}\n\n`;
  md += `---\n*Exported from JalaSutra Ancient Hydrology Archive to Google Drive*\n`;

  return uploadFileToDrive({
    name: fileName,
    content: md,
    mimeType: 'text/markdown',
    category: 'dossier',
    folderId,
    description: `Complete hydraulic engineering dossier on ${dossier.name}`,
  });
}

/**
 * Export Curated Comparative Table to Google Drive
 */
export async function exportComparativeMatrixTableToDrive(
  dossiers: Array<{
    name: string;
    period: string;
    associatedRulerOrCivilization: string;
    waterSource: string;
    riverBasin: string;
    constructionMaterials: string[];
    waterManagementMethod: string;
    modernRelevance: string;
    engineeringAnalysis: {
      problem: string;
      engineeringSolution: string;
    };
  }>,
  folderId?: string
): Promise<DriveFileItem> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const names = dossiers.map((d) => d.name.split(' ')[0]).join('_vs_');
  const fileName = `JalaSutra_Comparative_Matrix_${names}_${timestamp}.md`;

  let md = `# Ancient Hydrology Curated Engineering Matrix\n\n`;
  md += `**Date:** ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}\n`;
  md += `**Structures Analyzed:** ${dossiers.map((d) => d.name).join(', ')}\n\n`;
  md += `---\n\n`;
  md += `| Parameter | ${dossiers.map((d) => d.name).join(' | ')} |\n`;
  md += `|---|${dossiers.map(() => '---').join('|')}|\n`;
  md += `| **Period & Ruler** | ${dossiers.map((d) => `${d.period} (${d.associatedRulerOrCivilization})`).join(' | ')} |\n`;
  md += `| **Water Source & Basin** | ${dossiers.map((d) => `${d.waterSource} (${d.riverBasin})`).join(' | ')} |\n`;
  md += `| **Hydraulic Challenge** | ${dossiers.map((d) => d.engineeringAnalysis.problem.replace(/\|/g, '-')).join(' | ')} |\n`;
  md += `| **Engineering Solution** | ${dossiers.map((d) => d.engineeringAnalysis.engineeringSolution.replace(/\|/g, '-')).join(' | ')} |\n`;
  md += `| **Materials** | ${dossiers.map((d) => d.constructionMaterials.slice(0, 3).join(', ')).join(' | ')} |\n`;
  md += `| **Sluice / Spillway Method** | ${dossiers.map((d) => d.waterManagementMethod.slice(0, 90).replace(/\|/g, '-')).join(' | ')} |\n`;
  md += `| **Modern Civil Relevance** | ${dossiers.map((d) => d.modernRelevance.slice(0, 120).replace(/\|/g, '-')).join(' | ')} |\n\n`;
  md += `---\n*Exported from JalaSutra Comparative Matrix Engine to Google Drive*\n`;

  return uploadFileToDrive({
    name: fileName,
    content: md,
    mimeType: 'text/markdown',
    category: 'comparison',
    folderId,
    description: `Comparative civil engineering matrix for ${dossiers.length} structures`,
  });
}

/**
 * Export all pre-loaded structures to Google Drive in batch
 */
export async function exportAllStructuresToDrive(
  dossiers: any[],
  onProgress?: (current: number, total: number, name: string) => void
): Promise<DriveFileItem[]> {
  const exported: DriveFileItem[] = [];
  for (let i = 0; i < dossiers.length; i++) {
    const d = dossiers[i];
    if (onProgress) onProgress(i + 1, dossiers.length, d.name);
    try {
      const file = await exportArchaeologicalDossierToDrive(d);
      exported.push(file);
    } catch (e) {
      console.warn(`Could not export ${d.name}:`, e);
    }
  }
  return exported;
}

// ----------------- LOCAL / DEMO ARCHIVE STORAGE ----------------- //

const DEFAULT_ARCHIVE_FILES: DriveFileItem[] = [
  {
    id: 'local_sudarshana_sample',
    name: 'Sudarshana_Lake_Girnar_Engineering_Dossier.md',
    mimeType: 'text/markdown',
    modifiedTime: new Date(Date.now() - 3600000 * 24).toISOString(),
    size: '8.4 KB',
    category: 'dossier',
    isLocalOnly: true,
    content: `# Sudarshana Lake (Girnar, Gujarat) - Comprehensive Hydraulic Dossier

## Historical Context & Chronology
- **Conception:** Pushyagupta (Vaishya governor under Chandragupta Maurya, 4th c. BCE)
- **Canal Expansion:** Tusaspha (Yavana governor under Emperor Ashoka, 3rd c. BCE)
- **1st Reconstruction:** Suvisakha (under Mahakshatrapa Rudradaman I, 150 CE)
- **2nd Reconstruction:** Chakrapalita (under Emperor Skandagupta, 455-456 CE)

## Hydraulic Problem & Solution
The Suvarnasikata and Palasini rivers generated high-velocity torrents during the monsoon down Mount Raivataka. The Mauryan engineers impounded the gap between hills with a massive earthen bund faced with dressed stone, creating a seasonal multi-million cubic meter reservoir feeding irrigation sluices throughout Saurashtra.
`,
  },
  {
    id: 'local_kallanai_sample',
    name: 'Kallanai_Grand_Anicut_Foundation_Mechanics.md',
    mimeType: 'text/markdown',
    modifiedTime: new Date(Date.now() - 3600000 * 12).toISOString(),
    size: '6.2 KB',
    category: 'dossier',
    isLocalOnly: true,
    content: `# Kallanai (Grand Anicut) - Civil Engineering Breakdown

Built by King Karikalan Chola in the 2nd Century CE on the Kaveri River.
- **Foundation Technique:** Unhewn cyclopean granite boulders rolled into the shifting alluvial riverbed. As boulders settled under scouring currents, successive layers were placed and bound with hydraulic clay-lime mortar.
- **Curved Crest Alignment:** 329m serpentine curve dispersing dynamic hydrostatic surge towards the Kollidam spillway.
`,
  },
  {
    id: 'local_dam_physics_sample',
    name: 'Cyclopean_Dam_Bhojpur_Sliding_Analysis.md',
    mimeType: 'text/markdown',
    modifiedTime: new Date(Date.now() - 3600000 * 4).toISOString(),
    size: '4.8 KB',
    category: 'simulation',
    isLocalOnly: true,
    content: `# Bhojpur Cyclopean Dam - Hydrostatic Stability Analysis

- **Embankment Height:** 14.5 meters
- **Crest Width:** 10.0 meters
- **Calculated Factor of Safety against Sliding:** 2.14
- **Failure Mode:** Stood for 350+ years; breached only via intentional destruction during military campaigns in 1434 CE.
`,
  },
];

export function getLocalArchiveFiles(searchQuery?: string): DriveFileItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_FILES);
    let files: DriveFileItem[] = raw ? JSON.parse(raw) : DEFAULT_ARCHIVE_FILES;

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      files = files.filter((f) => f.name.toLowerCase().includes(q));
    }
    return files;
  } catch (e) {
    return DEFAULT_ARCHIVE_FILES;
  }
}

export function saveLocalArchiveFile(file: DriveFileItem) {
  try {
    const current = getLocalArchiveFiles();
    const existingIndex = current.findIndex((f) => f.id === file.id);
    if (existingIndex >= 0) {
      current[existingIndex] = file;
    } else {
      current.unshift(file);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_FILES, JSON.stringify(current));
    // Asynchronously sync to backend dynamic database vault
    saveToDatabaseVault(file);
  } catch (e) {
    console.warn('Failed to save to local archive cache:', e);
  }
}

export function deleteLocalArchiveFile(fileId: string) {
  try {
    const current = getLocalArchiveFiles();
    const filtered = current.filter((f) => f.id !== fileId);
    localStorage.setItem(LOCAL_STORAGE_KEY_FILES, JSON.stringify(filtered));
    // Asynchronously delete from backend dynamic database vault
    deleteFromDatabaseVault(fileId);
  } catch (e) {}
}

// ----------------- BACKEND DYNAMIC DATABASE SYNC ----------------- //

export async function fetchDatabaseVaultFiles(searchQuery?: string): Promise<DriveFileItem[]> {
  try {
    const path = searchQuery ? `/api/drive/items?query=${encodeURIComponent(searchQuery)}` : '/api/drive/items';
    const res = await fetch(getApiUrl(path));
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((dbItem: any) => ({
      id: dbItem.id,
      name: dbItem.name,
      mimeType: dbItem.mimeType || 'text/markdown',
      modifiedTime: dbItem.updatedAt || dbItem.createdAt,
      size: dbItem.size ? formatBytes(dbItem.size) : undefined,
      webViewLink: dbItem.webViewLink,
      category: dbItem.category,
      content: dbItem.content,
      isLocalOnly: false,
    }));
  } catch (e) {
    return [];
  }
}

export async function saveToDatabaseVault(file: DriveFileItem): Promise<void> {
  try {
    await fetch(getApiUrl('/api/drive/items'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: file.id,
        name: file.name,
        category: file.category || 'dossier',
        mimeType: file.mimeType || 'text/markdown',
        size: typeof file.size === 'number' ? file.size : undefined,
        content: file.content,
        webViewLink: file.webViewLink,
        tags: [file.category || 'dossier', 'JalaSutra'],
      }),
    });
  } catch (e) {
    console.warn('Could not sync item to backend dynamic database:', e);
  }
}

export async function deleteFromDatabaseVault(fileId: string): Promise<void> {
  try {
    await fetch(getApiUrl(`/api/drive/items/${fileId}`), { method: 'DELETE' });
  } catch (e) {}
}

export async function fetchDatabaseVaultStats(): Promise<{
  totalItems: number;
  totalSizeBytes: number;
  categories: Record<string, number>;
  databaseType: string;
} | null> {
  try {
    const res = await fetch(getApiUrl('/api/drive/stats'));
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
