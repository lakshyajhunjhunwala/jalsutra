import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive,
  FolderPlus,
  Search,
  FileText,
  Sliders,
  Layers,
  ExternalLink,
  Trash2,
  Download,
  Eye,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  LogOut,
  Folder,
  FolderOpen,
  FileCode,
  BookOpen,
  Upload,
  Copy,
  Check,
  ChevronRight,
  ArrowUpDown,
  Database,
  Sparkles,
} from 'lucide-react';
import {
  DriveUser,
  DriveFileItem,
  onDriveAuthStateChanged,
  connectWithAccessToken,
  connectWithGoogleIdentityServices,
  disconnectDrive,
  listDriveFiles,
  deleteDriveFile,
  getDriveFileContent,
  uploadFileToDrive,
  createFolderInDriveOrWorkspace,
  exportAllStructuresToDrive,
  getCustomClientId,
  setCustomClientId,
} from '../services/googleDriveService.ts';
import { ANCIENT_WATER_STRUCTURES } from '../data/ancientWaterData.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';

interface GoogleDriveWorkspaceProps {
  onNavigateToResearch?: (topic: string) => void;
  onNavigateToSimulator?: () => void;
  onNavigateToChat?: (prompt: string) => void;
}

export const GoogleDriveWorkspace: React.FC<GoogleDriveWorkspaceProps> = ({
  onNavigateToResearch,
  onNavigateToSimulator,
  onNavigateToChat,
}) => {
  const [user, setUser] = useState<DriveUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc'>('newest');

  // Folder Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'JalaSutra Archive' },
  ]);

  // Connect Dialog & Token modal state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [clientIdInput, setClientIdInput] = useState<string>(getCustomClientId());
  const [authConnecting, setAuthConnecting] = useState<boolean>(false);

  // File Preview Modal
  const [previewFile, setPreviewFile] = useState<DriveFileItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'rendered' | 'raw'>('rendered');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [copiedContent, setCopiedContent] = useState<boolean>(false);

  // Create New Note Modal
  const [showNewNoteModal, setShowNewNoteModal] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteCategory, setNoteCategory] = useState<'dossier' | 'simulation' | 'comparison' | 'note'>('note');
  const [noteContent, setNoteContent] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  // Create New Folder Modal
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  // Batch Export State
  const [isBatchExporting, setIsBatchExporting] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; name: string } | null>(null);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to Drive Auth changes
  useEffect(() => {
    const unsubscribe = onDriveAuthStateChanged((newUser, newToken) => {
      setUser(newUser);
      setToken(newToken);
    });
    return () => unsubscribe();
  }, []);

  // Fetch files whenever user/token, folder, or search changes
  useEffect(() => {
    loadFiles();
  }, [user, token, currentFolderId, searchQuery]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listDriveFiles(currentFolderId || undefined, searchQuery);
      setFiles(items);
    } catch (err: any) {
      console.error('Error loading drive files:', err);
      setError(err.message || 'Failed to load files from Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWithGsi = async () => {
    setAuthConnecting(true);
    setError(null);
    try {
      if (clientIdInput.trim()) {
        setCustomClientId(clientIdInput.trim());
      }
      await connectWithGoogleIdentityServices(clientIdInput.trim() || undefined);
      setShowAuthModal(false);
      setSuccessBanner('Successfully connected to Google Drive!');
      setTimeout(() => setSuccessBanner(null), 4000);
      await loadFiles();
    } catch (err: any) {
      setError(err.message || 'Google Drive authentication failed');
    } finally {
      setAuthConnecting(false);
    }
  };

  const handleConnectManualToken = async () => {
    if (!manualTokenInput.trim()) {
      setError('Please provide a valid OAuth Access Token');
      return;
    }
    setAuthConnecting(true);
    setError(null);
    try {
      await connectWithAccessToken(manualTokenInput.trim());
      setShowAuthModal(false);
      setManualTokenInput('');
      setSuccessBanner('Successfully authenticated with Google Drive token!');
      setTimeout(() => setSuccessBanner(null), 4000);
      await loadFiles();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with token');
    } finally {
      setAuthConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectDrive();
    setSuccessBanner('Disconnected from Google Drive.');
    setTimeout(() => setSuccessBanner(null), 3000);
    loadFiles();
  };

  const handleNavigateIntoFolder = (folder: DriveFileItem) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateToBreadcrumb = (index: number) => {
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleOpenFilePreview = async (file: DriveFileItem) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      handleNavigateIntoFolder(file);
      return;
    }

    setPreviewFile(file);
    setPreviewLoading(true);
    setCopiedContent(false);
    setPreviewMode('rendered');
    try {
      const content = await getDriveFileContent(file.id);
      setPreviewContent(content);
    } catch (err: any) {
      setPreviewContent(`*Error loading file content: ${err.message}*`);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Delete Confirmation Modal State
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState<boolean>(false);

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeletingFile(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      if (previewFile?.id === fileToDelete.id) {
        setPreviewFile(null);
        setPreviewContent(null);
      }
      setSuccessBanner(`Deleted "${fileToDelete.name}" successfully.`);
      setTimeout(() => setSuccessBanner(null), 3000);
      setFileToDelete(null);
    } catch (err: any) {
      setError(`Could not delete file: ${err.message}`);
    } finally {
      setIsDeletingFile(false);
    }
  };

  const handleDelete = (file: DriveFileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setFileToDelete({ id: file.id, name: file.name });
  };

  const handleDownload = async (file: DriveFileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const content = await getDriveFileContent(file.id);
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.endsWith('.md') ? file.name : `${file.name}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Could not download file: ${err.message}`);
    }
  };

  const handleCopyPreview = () => {
    if (!previewContent) return;
    navigator.clipboard.writeText(previewContent);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2500);
  };

  const handleSaveNewNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      alert('Please enter both a title and content.');
      return;
    }
    setIsSavingNote(true);
    try {
      const cleanName = noteTitle.endsWith('.md') ? noteTitle : `${noteTitle}.md`;
      await uploadFileToDrive({
        name: cleanName,
        content: noteContent,
        mimeType: 'text/markdown',
        category: noteCategory,
        folderId: currentFolderId || undefined,
        description: `Archaeological field note on ${noteTitle}`,
      });
      setShowNewNoteModal(false);
      setNoteTitle('');
      setNoteContent('');
      setSuccessBanner(`Saved "${cleanName}" to Google Drive workspace!`);
      setTimeout(() => setSuccessBanner(null), 3500);
      await loadFiles();
    } catch (err: any) {
      alert(`Failed to save note: ${err.message}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please provide a folder name.');
      return;
    }
    setIsCreatingFolder(true);
    try {
      await createFolderInDriveOrWorkspace(newFolderName.trim(), currentFolderId || undefined);
      setShowNewFolderModal(false);
      setNewFolderName('');
      setSuccessBanner(`Folder "${newFolderName.trim()}" created!`);
      setTimeout(() => setSuccessBanner(null), 3500);
      await loadFiles();
    } catch (err: any) {
      alert(`Failed to create folder: ${err.message}`);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        let category: DriveFileItem['category'] = 'note';
        const nameLower = file.name.toLowerCase();
        if (nameLower.includes('dossier') || nameLower.includes('research')) category = 'dossier';
        else if (nameLower.includes('simulation') || nameLower.includes('dam')) category = 'simulation';
        else if (nameLower.includes('compare') || nameLower.includes('matrix')) category = 'comparison';

        await uploadFileToDrive({
          name: file.name,
          content,
          mimeType: file.type || 'text/markdown',
          folderId: currentFolderId || undefined,
          category,
          description: `Uploaded archaeological record: ${file.name}`,
        });

        setSuccessBanner(`Uploaded "${file.name}" to Google Drive!`);
        setTimeout(() => setSuccessBanner(null), 3500);
        await loadFiles();
      } catch (err: any) {
        alert(`Failed to upload file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBatchExportAllDossiers = async () => {
    if (isBatchExporting) return;
    setIsBatchExporting(true);
    try {
      await exportAllStructuresToDrive(ANCIENT_WATER_STRUCTURES, (current, total, name) => {
        setBatchProgress({ current, total, name });
      });
      setSuccessBanner(`All ${ANCIENT_WATER_STRUCTURES.length} classical water dossiers exported to Google Drive!`);
      setTimeout(() => setSuccessBanner(null), 4000);
      await loadFiles();
    } catch (err: any) {
      alert(`Batch export failed: ${err.message}`);
    } finally {
      setIsBatchExporting(false);
      setBatchProgress(null);
    }
  };

  // Filter & Sort
  const filteredFiles = files.filter((f) => {
    if (categoryFilter === 'all') return true;
    return f.category === categoryFilter;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    // Keep folders first
    const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
    const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;

    if (sortBy === 'newest') {
      return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime();
    }
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Google Drive Status & Connection Bar */}
      <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#EFE9DC] border border-[#D5CABB] flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                <path d="M8.27 3.5h7.46l5.77 10-3.73 6.5H2.5l3.73-6.5h2.04" fill="none" />
                <path d="M15.73 3.5L22 14.5l-3.73 6.5H10.8l7.46-13H8.27L12 1.5l3.73 2z" fill="#4285F4" />
                <path d="M8.27 3.5L2 14.5h7.46L15.73 3.5H8.27z" fill="#0F9D58" />
                <path d="M2 14.5l3.73 6.5h14.94l-3.73-6.5H2z" fill="#FFBB00" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-[#231B15]">
                  Google Drive Workspace
                </h2>
                {user ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    Drive Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                    <HardDrive className="w-3 h-3" />
                    Workspace Archive
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-800 border border-indigo-200" title="All documents and notes are dynamically persisted in the backend database">
                  <Database className="w-3 h-3" />
                  Dynamic DB Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C5042] mt-0.5">
                {user
                  ? `Synced to ${user.email} • Target Folder: "JalaSutra Ancient Hydrology Archive"`
                  : 'Store, view, access, and organize ancient hydraulic research dossiers, embankment simulations, and comparative matrices.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EFE8DA] border border-[#DDD3C2] text-xs">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#8B3A1C] text-white flex items-center justify-center font-bold text-[10px]">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-[#2F261D] max-w-[140px] truncate">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-[#6A2312] bg-[#F7E7E3] hover:bg-[#F0D5CF] border border-[#E9BCB2] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#8B3A1C] hover:bg-[#742E15] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <HardDrive className="w-4 h-4" />
                <span>Connect Google Drive</span>
              </button>
            )}

            {/* Upload File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".md,.txt,.json,.csv"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload existing Markdown or text file"
              className="px-3 py-2 rounded-md text-xs font-medium text-[#3E342A] bg-[#EFE8DA] hover:bg-[#E4DBC9] border border-[#D5CABB] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#8B3A1C]" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            <button
              onClick={() => setShowNewFolderModal(true)}
              title="Create a new folder in Google Drive"
              className="px-3 py-2 rounded-md text-xs font-medium text-[#3E342A] bg-[#EFE8DA] hover:bg-[#E4DBC9] border border-[#D5CABB] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#8B3A1C]" />
              <span className="hidden sm:inline">New Folder</span>
            </button>

            <button
              onClick={() => setShowNewNoteModal(true)}
              className="px-3 py-2 rounded-md text-xs font-medium text-[#3E342A] bg-[#EFE8DA] hover:bg-[#E4DBC9] border border-[#D5CABB] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#8B3A1C]" />
              <span>Create Note</span>
            </button>

            <button
              onClick={handleBatchExportAllDossiers}
              disabled={isBatchExporting}
              title="Export all 7 ancient hydraulic structures into your Drive"
              className="px-3 py-2 rounded-md text-xs font-medium text-[#8B3A1C] bg-[#F7EFE4] hover:bg-[#EFE3D0] border border-[#E5D7C2] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isBatchExporting ? 'Exporting...' : 'Batch Seed 7 Sites'}
              </span>
            </button>

            <button
              onClick={loadFiles}
              disabled={loading}
              title="Refresh Drive files"
              className="p-2 rounded-md text-[#5A4E41] hover:text-[#28211A] bg-[#EFE8DA] hover:bg-[#E4DBC9] border border-[#D5CABB] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Batch Progress Banner */}
        {batchProgress && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#8B3A1C]" />
              <span>
                Exporting ({batchProgress.current}/{batchProgress.total}): {batchProgress.name}...
              </span>
            </div>
            <span className="font-semibold text-[#8B3A1C]">
              {Math.round((batchProgress.current / batchProgress.total) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Folder Breadcrumbs */}
      <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-1.5 text-xs text-[#5E5143] overflow-x-auto">
        <Folder className="w-4 h-4 text-[#8B3A1C] shrink-0" />
        <span className="font-semibold text-[#30261E]">Path:</span>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id || 'root'}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#9C8F80] shrink-0" />}
            <button
              onClick={() => handleNavigateToBreadcrumb(idx)}
              className={`hover:underline cursor-pointer truncate max-w-[160px] ${
                idx === breadcrumbs.length - 1
                  ? 'font-bold text-[#8B3A1C]'
                  : 'text-[#5E5143] hover:text-[#251E17]'
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
        {currentFolderId && (
          <button
            onClick={() => handleNavigateToBreadcrumb(breadcrumbs.length - 2)}
            className="ml-auto text-[11px] text-[#8B3A1C] hover:underline font-medium cursor-pointer"
          >
            ↑ Back to Parent
          </button>
        )}
      </div>

      {/* Search, Filter, Sort & Quick Stats Toolbar */}
      <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#887B6E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dossier titles, simulations, or notes..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md text-xs bg-[#FFFFFF] border border-[#D8CEBF] text-[#221A14] placeholder-[#887B6E] focus:outline-none focus:border-[#8B3A1C]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Files', count: files.length },
            { id: 'dossier', label: 'Dossiers', count: files.filter((f) => f.category === 'dossier').length },
            { id: 'simulation', label: 'Simulations', count: files.filter((f) => f.category === 'simulation').length },
            { id: 'comparison', label: 'Comparisons', count: files.filter((f) => f.category === 'comparison').length },
            { id: 'note', label: 'Field Notes', count: files.filter((f) => f.category === 'note').length },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer font-medium flex items-center gap-1.5 ${
                categoryFilter === cat.id
                  ? 'bg-[#8B3A1C] text-white'
                  : 'bg-[#EFE8DA] text-[#4A3E31] hover:bg-[#E5DDCB]'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  categoryFilter === cat.id
                    ? 'bg-white/20 text-white'
                    : 'bg-[#DCD2C1] text-[#4A3E31]'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#7A6C5D]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#D8CEBF] text-[#2A2219] focus:outline-none focus:border-[#8B3A1C] cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Files Display: Grid or Empty State */}
      {loading ? (
        <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-12 text-center text-sm text-[#5C5042] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#8B3A1C]" />
          <span>Synchronizing with Google Drive archive...</span>
        </div>
      ) : sortedFiles.length === 0 ? (
        <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#EFE8DA] text-[#8B3A1C] flex items-center justify-center mx-auto">
            <HardDrive className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-serif font-bold text-lg text-[#251E17]">
              No files in this view
            </h3>
            <p className="text-xs text-[#5E5144]">
              Generate dossiers in the Research Assistant, simulate dam stability, or seed your archive with the 7 classical ancient water structures.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={handleBatchExportAllDossiers}
              disabled={isBatchExporting}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#8B3A1C] text-white hover:bg-[#742E15] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Export 7 Pre-loaded Sites to Drive</span>
            </button>
            {onNavigateToResearch && (
              <button
                onClick={() => onNavigateToResearch('Sudarshana Dam Girnar Rudradaman')}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#EFE8DA] text-[#332A21] hover:bg-[#E4DBC9] border border-[#D5CABB] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Generate Dossier</span>
              </button>
            )}
            {onNavigateToSimulator && (
              <button
                onClick={onNavigateToSimulator}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#EFE8DA] text-[#332A21] hover:bg-[#E4DBC9] border border-[#D5CABB] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulate Embankment</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFiles.map((file) => {
            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

            return (
              <div
                key={file.id}
                onClick={() => handleOpenFilePreview(file)}
                className={`bg-[#FAF7F0] border rounded-xl p-4.5 cursor-pointer flex flex-col justify-between group transition-all ${
                  isFolder
                    ? 'border-[#D9CDBB] hover:border-[#8B3A1C] hover:bg-[#F6EFE2] shadow-2xs'
                    : 'border-[#E0D8CB] hover:border-[#8B3A1C]/50 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#EFE8DA] border border-[#DCD1BF] flex items-center justify-center shrink-0 text-[#8B3A1C]">
                        {isFolder ? (
                          <Folder className="w-4 h-4 fill-[#8B3A1C]/20" />
                        ) : file.category === 'dossier' ? (
                          <FileText className="w-4 h-4" />
                        ) : file.category === 'simulation' ? (
                          <Sliders className="w-4 h-4" />
                        ) : file.category === 'comparison' ? (
                          <Layers className="w-4 h-4" />
                        ) : (
                          <FileCode className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-sans uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#EAE2D3] text-[#55473A]">
                          {isFolder ? 'Folder' : file.category || 'file'}
                        </span>
                        {file.isLocalOnly && (
                          <span className="ml-1 text-[10px] font-sans px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Workspace Archive
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open directly in Google Drive"
                          className="p-1 rounded hover:bg-[#EAE2D3] text-[#5B4F43] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {!isFolder && (
                        <button
                          onClick={(e) => handleDownload(file, e)}
                          title="Download file"
                          className="p-1 rounded hover:bg-[#EAE2D3] text-[#5B4F43] transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(file, e)}
                        title="Delete from archive"
                        className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-base text-[#241D17] line-clamp-2 leading-snug group-hover:text-[#8B3A1C] transition-colors">
                      {file.name.replace(/\.md$/, '').replace(/_/g, ' ')}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#786B5E] mt-1.5">
                      <span>{isFolder ? 'Directory' : file.size || '3.5 KB'}</span>
                      <span>•</span>
                      <span>
                        {new Date(file.modifiedTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#EDE5D6] flex items-center justify-between text-xs text-[#8B3A1C] font-semibold">
                  <span className="flex items-center gap-1">
                    {isFolder ? (
                      <>
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Open Folder</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read in App</span>
                      </>
                    )}
                  </span>
                  <span className="text-[11px] text-[#86786A] font-normal">
                    {isFolder ? 'Google Drive Folder' : 'Markdown Doc'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auth & Setup Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border border-[#D5CABB] rounded-xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#EFE8DA] flex items-center justify-center text-[#8B3A1C]">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#251E17]">
                    Connect Google Drive
                  </h3>
                  <p className="text-xs text-[#5E5144]">
                    Link your account to save dossiers and engineering reports
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-[#786C5E] hover:text-[#251E17] text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Option A: Google Identity Services (One-click popup) */}
              <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#8B3A1C] text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#2A2219]">
                    One-Click Google Authentication
                  </h4>
                </div>
                <p className="text-xs text-[#5E5144]">
                  Use the Google Identity OAuth flow to grant permission to read and save files to your Google Drive.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#4A3E32]">
                    OAuth Client ID (Optional for custom GCP project):
                  </label>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                    className="w-full px-3 py-1.5 rounded text-xs bg-[#FAF7F0] border border-[#D0C4B4] text-[#221A14] font-mono focus:outline-none focus:border-[#8B3A1C]"
                  />
                </div>

                <button
                  onClick={handleConnectWithGsi}
                  disabled={authConnecting}
                  className="w-full py-2.5 px-4 rounded-md text-xs font-semibold text-white bg-[#8B3A1C] hover:bg-[#742E15] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#FFF"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#FFF"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FFF"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#FFF"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {authConnecting ? 'Connecting...' : 'Sign In & Connect with Google'}
                  </span>
                </button>
              </div>

              {/* Option B: Direct Access Token */}
              <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#524436] text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#2A2219]">
                    Direct OAuth Access Token
                  </h4>
                </div>
                <p className="text-xs text-[#5E5144]">
                  Paste a valid Google Drive Bearer token (from OAuth 2.0 Playground or Google Cloud Shell) for immediate verified connection.
                </p>

                <input
                  type="password"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="ya29.a0AfH6SM..."
                  className="w-full px-3 py-1.5 rounded text-xs bg-[#FAF7F0] border border-[#D0C4B4] text-[#221A14] font-mono focus:outline-none focus:border-[#8B3A1C]"
                />

                <button
                  onClick={handleConnectManualToken}
                  disabled={authConnecting || !manualTokenInput.trim()}
                  className="w-full py-2 px-3 rounded-md text-xs font-semibold text-[#30261D] bg-[#EFE8DA] hover:bg-[#E4DBC9] border border-[#D5CABB] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Verify and Connect Token</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-[#736657] text-center">
              Files are saved under your Google account inside the{' '}
              <strong className="text-[#3A2F24]">
                "JalaSutra Ancient Hydrology Archive"
              </strong>{' '}
              folder.
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border border-[#D5CABB] rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E3DACB] flex items-center justify-between gap-3 bg-[#F4EFE3]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#8B3A1C]" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#251E17] line-clamp-1">
                    {previewFile.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#716355]">
                    <span>Category: {previewFile.category || 'dossier'}</span>
                    <span>•</span>
                    <span>{previewFile.size}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Rendered vs Raw Toggle */}
                <div className="flex items-center rounded-md border border-[#D5CABB] bg-[#EAE2D3] p-0.5 text-xs">
                  <button
                    onClick={() => setPreviewMode('rendered')}
                    className={`px-2 py-1 rounded transition-colors ${
                      previewMode === 'rendered'
                        ? 'bg-white text-[#8B3A1C] font-semibold shadow-2xs'
                        : 'text-[#5E5143] hover:text-[#251E17]'
                    }`}
                  >
                    Rendered
                  </button>
                  <button
                    onClick={() => setPreviewMode('raw')}
                    className={`px-2 py-1 rounded transition-colors ${
                      previewMode === 'raw'
                        ? 'bg-white text-[#8B3A1C] font-semibold shadow-2xs'
                        : 'text-[#5E5143] hover:text-[#251E17]'
                    }`}
                  >
                    Raw Source
                  </button>
                </div>

                <button
                  onClick={handleCopyPreview}
                  title="Copy content to clipboard"
                  className="p-1.5 rounded-md hover:bg-[#E8E0D1] text-[#6A5E51] transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  {copiedContent ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {previewFile.webViewLink && (
                  <a
                    href={previewFile.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#E8E0D1] hover:bg-[#DDD3C2] text-[#33291F] flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Drive</span>
                  </a>
                )}

                <button
                  onClick={() => {
                    setPreviewFile(null);
                    setPreviewContent(null);
                  }}
                  className="p-1.5 rounded-md hover:bg-[#E8E0D1] text-[#6A5E51] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-[#FAF7F0]">
              {previewLoading ? (
                <div className="py-12 text-center text-sm text-[#5C5042] flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#8B3A1C]" />
                  <span>Loading file content from Google Drive...</span>
                </div>
              ) : previewMode === 'raw' ? (
                <pre className="text-xs font-mono text-[#251F19] bg-[#FFFFFF] p-4 rounded-lg border border-[#E0D8CB] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {previewContent || 'Empty document.'}
                </pre>
              ) : (
                <div className="prose prose-sm max-w-none text-[#241D17]">
                  <MarkdownRenderer content={previewContent || 'Empty document.'} />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#E3DACB] bg-[#F4EFE3] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6A5E51]">
              <div className="flex items-center gap-2">
                {onNavigateToResearch && (
                  <button
                    onClick={() => {
                      const cleanTitle = previewFile.name.replace(/\.md$/, '').replace(/_/g, ' ');
                      onNavigateToResearch(cleanTitle);
                      setPreviewFile(null);
                    }}
                    className="px-2.5 py-1 rounded bg-[#EAE2D3] hover:bg-[#DFD6C4] text-[#4A3D30] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#8B3A1C]" />
                    <span>Investigate in Research Engine</span>
                  </button>
                )}

                {onNavigateToChat && (
                  <button
                    onClick={() => {
                      onNavigateToChat(
                        `Regarding this archived document "${previewFile.name}":\n\n${(previewContent || '').slice(0, 400)}...\n\nCan you explain the structural and hydraulic mechanisms involved?`
                      );
                      setPreviewFile(null);
                    }}
                    className="px-2.5 py-1 rounded bg-[#EAE2D3] hover:bg-[#DFD6C4] text-[#4A3D30] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#8B3A1C]" />
                    <span>Discuss in AI Chat</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDelete(previewFile, e)}
                  className="px-3 py-1.5 rounded bg-[#FCECE9] text-[#A3321E] hover:bg-[#F8D6D0] border border-[#F2C2BA] transition-colors flex items-center gap-1 cursor-pointer font-medium text-xs"
                  title="Delete this file from archive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete File</span>
                </button>

                <button
                  onClick={(e) => handleDownload(previewFile, e)}
                  className="px-3.5 py-1.5 rounded bg-[#8B3A1C] text-white hover:bg-[#742E15] transition-colors flex items-center gap-1 cursor-pointer font-medium shadow-xs text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border border-[#D5CABB] rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#251E17] flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#8B3A1C]" />
                <span>New Google Drive Folder</span>
              </h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="text-[#6A5E51] hover:text-[#251E17] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#4A3E31] mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Mauryan Embankment Studies"
                  className="w-full px-3 py-2 rounded-md text-xs bg-[#FFFFFF] border border-[#D5CABB] text-[#221A14] focus:outline-none focus:border-[#8B3A1C]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 rounded-md text-xs text-[#524538] hover:bg-[#EAE2D3] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
                className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#8B3A1C] hover:bg-[#742E15] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{isCreatingFolder ? 'Creating...' : 'Create Folder'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Note Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border border-[#D5CABB] rounded-xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#251E17] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#8B3A1C]" />
                <span>Create Field Note or Dossier in Google Drive</span>
              </h3>
              <button
                onClick={() => setShowNewNoteModal(false)}
                className="text-[#6A5E51] hover:text-[#251E17] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#4A3E31] mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Kallanai_Anicut_Scouring_Observations"
                  className="w-full px-3 py-2 rounded-md text-xs bg-[#FFFFFF] border border-[#D5CABB] text-[#221A14] focus:outline-none focus:border-[#8B3A1C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3E31] mb-1">
                  Category
                </label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md text-xs bg-[#FFFFFF] border border-[#D5CABB] text-[#221A14] focus:outline-none focus:border-[#8B3A1C]"
                >
                  <option value="note">Archaeological Field Note</option>
                  <option value="dossier">Hydraulic Engineering Dossier</option>
                  <option value="simulation">Dam Embankment Analysis</option>
                  <option value="comparison">Comparative Study</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3E31] mb-1">
                  Content (Markdown supported)
                </label>
                <textarea
                  rows={8}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record inscriptional details, hydrological observations, water flow measurements, or masonry mortar notes..."
                  className="w-full px-3 py-2 rounded-md text-xs bg-[#FFFFFF] border border-[#D5CABB] text-[#221A14] font-mono focus:outline-none focus:border-[#8B3A1C]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewNoteModal(false)}
                className="px-3 py-1.5 rounded-md text-xs text-[#524538] hover:bg-[#EAE2D3] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewNote}
                disabled={isSavingNote || !noteTitle.trim() || !noteContent.trim()}
                className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#8B3A1C] hover:bg-[#742E15] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>{isSavingNote ? 'Saving to Drive...' : 'Save to Google Drive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal (In-App, No window.confirm) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border border-[#D5CABB] rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-[#A3321E]">
              <div className="w-10 h-10 rounded-full bg-[#FCE8E5] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#A3321E]" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#251E17]">
                  Delete From Archive?
                </h3>
                <p className="text-xs text-[#736555] line-clamp-1 mt-0.5">
                  "{fileToDelete.name}"
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5D5042] bg-[#F2ECE0] p-3 rounded-lg border border-[#E0D5C3] leading-relaxed">
              Are you sure you want to delete this file or dossier from your Google Drive and local workspace archive? This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E0D1]">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#574B3E] hover:bg-[#EBE2D3] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFile}
                disabled={isDeletingFile}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#A3321E] hover:bg-[#852714] text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingFile ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
