import React, { useState } from 'react';
import { HardDrive, Check, Loader2, ExternalLink } from 'lucide-react';
import { DriveFileItem } from '../services/googleDriveService.ts';

interface SaveToDriveButtonProps {
  onExport: () => Promise<DriveFileItem>;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'compact';
}

export const SaveToDriveButton: React.FC<SaveToDriveButtonProps> = ({
  onExport,
  label = 'Save to Google Drive',
  className = '',
  variant = 'secondary',
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [savedItem, setSavedItem] = useState<DriveFileItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    setError(null);
    try {
      const item = await onExport();
      setSavedItem(item);
      setTimeout(() => {
        setSavedItem(null);
      }, 4000);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Export failed');
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  if (savedItem) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>Saved to Drive!</span>
        {savedItem.webViewLink && (
          <a
            href={savedItem.webViewLink}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 hover:underline ml-1 inline-flex items-center"
            title="Open in Google Drive"
          >
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer"
        title={error}
      >
        <span>Failed (Retry)</span>
      </button>
    );
  }

  const baseStyles =
    variant === 'primary'
      ? 'bg-[#8B3A1C] text-white hover:bg-[#742E15] border-[#8B3A1C]'
      : variant === 'compact'
      ? 'bg-transparent text-[#5B4F42] hover:text-[#8B3A1C] hover:bg-[#EAE2D3] border-transparent p-1'
      : 'bg-[#EFE9DC] text-[#4A3E31] border-[#DED3C2] hover:bg-[#E5DDCB] hover:text-[#251D16]';

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer disabled:opacity-60 ${baseStyles} ${className}`}
      title="Save to your Google Drive account (or local archive)"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <HardDrive className="w-3.5 h-3.5 text-[#8B3A1C]" />
      )}
      <span>{loading ? 'Saving...' : label}</span>
    </button>
  );
};
