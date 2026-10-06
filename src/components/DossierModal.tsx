import React, { useState, useEffect } from 'react';
import { ArchaeologicalDossier } from '../data/ancientWaterData.ts';
import {
  X,
  MapPin,
  Calendar,
  Compass,
  ShieldCheck,
  HelpCircle,
  Bookmark,
  BookmarkCheck,
  Layers,
  Maximize2,
  Eye,
  Sparkles,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Search,
  Globe,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { SaveToDriveButton } from './SaveToDriveButton.tsx';
import { exportResearchDossierToDrive } from '../services/googleDriveService.ts';
import { saveDossierBookmark, removeSavedDossier, getSavedDossiers } from '../services/savedDossierService.ts';
import { onUserAuthStateChanged, JalaSutraUser } from '../services/firebase.ts';

interface DossierModalProps {
  dossier: ArchaeologicalDossier | null;
  onClose: () => void;
  onAskResearch: (queryText: string) => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({ dossier, onClose, onAskResearch }) => {
  const [authUser, setAuthUser] = useState<JalaSutraUser | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [activeImageView, setActiveImageView] = useState<'sketch' | 'site'>('sketch');
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showLightboxAnnotations, setShowLightboxAnnotations] = useState<boolean>(true);

  // Live Google Search Grounding state
  const [searchGroundingLoading, setSearchGroundingLoading] = useState<boolean>(false);
  const [searchGroundingResult, setSearchGroundingResult] = useState<{
    text: string;
    groundingSources: Array<{ title: string; uri: string; type?: 'web' | 'maps'; snippet?: string }>;
    searchQueries: string[];
    modelUsed: string;
  } | null>(null);
  const [showSearchGrounding, setShowSearchGrounding] = useState<boolean>(false);

  useEffect(() => {
    const unsub = onUserAuthStateChanged((u) => setAuthUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!dossier) return;
    const userId = authUser?.uid || '';
    getSavedDossiers(userId).then((items) => {
      setIsSaved(items.some((i) => i.dossierId === dossier.id));
    });
    // If dossier has a reconstruction sketch, default to sketch
    if (dossier.reconstructionSketch) {
      setActiveImageView('sketch');
    } else {
      setActiveImageView('site');
    }
    setZoomLevel(1);
    setSearchGroundingResult(null);
    setSearchGroundingLoading(false);
    setShowSearchGrounding(false);
  }, [dossier, authUser?.uid]);

  const handleFetchLiveSearchGrounding = async () => {
    if (!dossier) return;
    setSearchGroundingLoading(true);
    setShowSearchGrounding(true);
    try {
      const res = await fetch('/api/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${dossier.name} ${dossier.state} archaeological excavation reports epigraphical discoveries conservation`,
          structureName: dossier.name,
          topic: 'Latest ASI Excavation Reports, Epigraphia Indica Citations & Modern Hydrological Surveys',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchGroundingResult(data);
      }
    } catch (err) {
      console.error('Failed to fetch search grounding for dossier:', err);
    } finally {
      setSearchGroundingLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!dossier) return;
    const userId = authUser?.uid || '';
    if (isSaved) {
      await removeSavedDossier(userId, dossier.id);
      setIsSaved(false);
      setSaveToast('Dossier removed from saved research.');
    } else {
      await saveDossierBookmark(userId, dossier.id, dossier.name);
      setIsSaved(true);
      setSaveToast('Dossier saved to personal research archive.');
    }
    setTimeout(() => setSaveToast(null), 3000);
  };

  if (!dossier) return null;

  const currentDisplayedImage =
    activeImageView === 'sketch' && dossier.reconstructionSketch
      ? dossier.reconstructionSketch.image
      : dossier.image;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-fade-in">
      {/* High-Resolution Full-Screen Zoom Lightbox */}
      {isZoomOpen && dossier.reconstructionSketch && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col justify-between p-3 sm:p-6 animate-fade-in select-none"
          onClick={() => {
            setIsZoomOpen(false);
            setZoomLevel(1);
          }}
        >
          {/* Lightbox Header Bar */}
          <div
            className="flex items-center justify-between text-white max-w-7xl w-full mx-auto pb-3 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-[#8B3A1C] text-[11px] font-mono font-semibold tracking-wider uppercase text-white shadow-xs">
                Architectural Reconstruction Drafting
              </span>
              <h4 className="font-serif font-bold text-sm sm:text-base text-[#F4ECE1] hidden sm:block">
                {dossier.reconstructionSketch.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/15">
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.25))}
                  className="p-1.5 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-mono text-white/90">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.25))}
                  className="p-1.5 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors cursor-pointer border-l border-white/20 ml-1"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Toggle Annotations */}
              <button
                type="button"
                onClick={() => setShowLightboxAnnotations(!showLightboxAnnotations)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  showLightboxAnnotations
                    ? 'bg-[#8B3A1C] text-white border-[#8B3A1C]'
                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
                title="Toggle engineering notes"
              >
                Key Notes
              </button>

              {/* Download Sketch */}
              <a
                href={dossier.reconstructionSketch.image}
                download={`${dossier.id}_architectural_reconstruction.jpg`}
                className="p-2 bg-white/10 hover:bg-white/20 text-white/90 hover:text-white rounded-lg transition-colors cursor-pointer border border-white/15"
                title="Download full-resolution reconstruction sketch"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
              </a>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsZoomOpen(false);
                  setZoomLevel(1);
                }}
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer ml-1"
                title="Close lightbox (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Central Image Canvas */}
          <div
            className="flex-1 w-full flex items-center justify-center overflow-auto p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative transition-transform duration-200 ease-out origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={dossier.reconstructionSketch.image}
                alt={dossier.reconstructionSketch.title}
                referrerPolicy="no-referrer"
                className="max-h-[72vh] max-w-[92vw] w-auto object-contain rounded-lg shadow-2xl border border-white/20"
              />
            </div>
          </div>

          {/* Lightbox Footer Bar with Annotations */}
          <div
            className="max-w-6xl w-full mx-auto bg-[#18130E]/90 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/15 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-serif font-bold text-sm text-[#F7EFE2]">
                  {dossier.reconstructionSketch.title}
                </p>
                <p className="text-xs text-[#C5B7A1] mt-0.5 max-w-3xl">
                  {dossier.reconstructionSketch.caption}
                </p>
              </div>
              <span className="px-2 py-1 rounded bg-white/10 text-[11px] font-mono text-[#D7CBBA] self-start sm:self-auto shrink-0 border border-white/10">
                {dossier.reconstructionSketch.architecturalStyle}
              </span>
            </div>

            {/* Collapsible Key Features */}
            {showLightboxAnnotations && (
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {dossier.reconstructionSketch.keyFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-white/5 border border-white/10 text-[#E0D5C3] flex items-start gap-1.5"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#8B3A1C] text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Modal Card */}
      <div className="bg-[#FAF7F0] border border-[#D5CABB] rounded-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Toast */}
        {saveToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-[#251D16] text-[#F9F6F0] text-xs rounded-md shadow-lg border border-[#8B3A1C]/50 flex items-center gap-1.5 animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-[#E68A5C]" />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#231B14]/75 hover:bg-[#231B14] text-white transition-colors cursor-pointer shadow-md"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Hero Image with View Switcher */}
        <div className="relative h-72 sm:h-88 w-full bg-[#241C15] overflow-hidden group">
          <img
            src={currentDisplayedImage}
            alt={dossier.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          {/* Top-Left View Switcher Buttons */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-[#1F1710]/85 backdrop-blur-xs p-1 rounded-lg border border-white/20 shadow-lg">
            {dossier.reconstructionSketch && (
              <button
                type="button"
                onClick={() => setActiveImageView('sketch')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeImageView === 'sketch'
                    ? 'bg-[#8B3A1C] text-white shadow-xs'
                    : 'text-[#E0D5C3] hover:bg-white/10'
                }`}
                title="View Architectural Reconstruction Sketch"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Reconstruction Sketch</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveImageView('site')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeImageView === 'site'
                  ? 'bg-[#8B3A1C] text-white shadow-xs'
                  : 'text-[#E0D5C3] hover:bg-white/10'
              }`}
              title="View Photographic Archaeological Site Remnants"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Site Remnants</span>
            </button>
          </div>

          {/* Quick Enlarge / Lightbox Trigger */}
          {dossier.reconstructionSketch && (
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="absolute top-4 right-16 z-10 px-2.5 py-1.5 rounded-lg bg-[#1F1710]/85 hover:bg-[#8B3A1C] text-white backdrop-blur-xs border border-white/20 transition-colors cursor-pointer flex items-center gap-1 text-xs shadow-md"
              title="Enlarge architectural sketch in full resolution"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inspect High-Res</span>
            </button>
          )}

          {/* Gradient Overlay with Titles */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F1913] via-[#1F1913]/50 to-transparent flex flex-col justify-end p-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans tracking-widest uppercase font-semibold text-[#DFD6C6]">
                {dossier.region} • {dossier.riverBasin}
              </span>
              {activeImageView === 'sketch' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#8B3A1C] text-white uppercase tracking-wider">
                  Architectural Drawing
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
              {dossier.name}
            </h2>
            {dossier.sanskritOrLocalName && (
              <p className="text-sm font-serif italic text-[#DFD6C6] mt-0.5">
                {dossier.sanskritOrLocalName}
              </p>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Quick Specifications Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#EFE8DC] rounded-lg border border-[#DFD6C5] text-xs">
            <div>
              <span className="block text-[#706456] font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#8B3A1C]" />
                Location & Coordinates:
              </span>
              <span className="font-medium text-[#29221B]">{dossier.state} ({dossier.coordinates})</span>
            </div>

            <div>
              <span className="block text-[#706456] font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#8B3A1C]" />
                Period & Ruler:
              </span>
              <span className="font-medium text-[#29221B]">{dossier.period}</span>
            </div>

            <div>
              <span className="block text-[#706456] font-semibold">Associated Dynasty:</span>
              <span className="font-medium text-[#29221B]">{dossier.associatedRulerOrCivilization}</span>
            </div>
          </div>

          {/* DEDICATED ARCHITECTURAL RECONSTRUCTION SKETCH SECTION */}
          {dossier.reconstructionSketch && (
            <div className="bg-[#F8F4EB] border border-[#DDD1BE] rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2D7C5]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#8B3A1C] text-white flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#2A2118]">
                      Architectural Reconstruction Sketch
                    </h3>
                    <span className="text-[11px] text-[#786959]">
                      Historical Civil Engineering & Drafting Analysis
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#EAE0D0] text-[11px] font-mono text-[#57493B] border border-[#DACDB9]">
                    {dossier.reconstructionSketch.architecturalStyle}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsZoomOpen(true)}
                    className="p-1.5 rounded-lg bg-[#EFE7D8] hover:bg-[#E2D7C4] text-[#4A3E31] transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                    title="Enlarge sketch in high-resolution lightbox"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-[#8B3A1C]" />
                    <span>Zoom</span>
                  </button>
                </div>
              </div>

              {/* High-Resolution Reconstruction Sketch Image Card with Interactive Trigger */}
              <div
                className="relative rounded-lg overflow-hidden border border-[#D5C8B4] bg-[#221B14] cursor-pointer group"
                onClick={() => setIsZoomOpen(true)}
              >
                <img
                  src={dossier.reconstructionSketch.image}
                  alt={dossier.reconstructionSketch.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-64 sm:h-80 object-cover group-hover:scale-101 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end justify-between p-4">
                  <div className="text-white text-xs max-w-xl">
                    <p className="font-serif font-bold text-sm sm:text-base text-[#F7EFE2]">
                      {dossier.reconstructionSketch.title}
                    </p>
                    <p className="text-[11px] text-[#DDD0BE] line-clamp-2 mt-0.5">
                      {dossier.reconstructionSketch.caption}
                    </p>
                  </div>
                  <div className="bg-[#8B3A1C] text-white p-2 rounded-lg opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-semibold shadow-md">
                    <Maximize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Inspect Lightbox</span>
                  </div>
                </div>
              </div>

              {/* Architectural Technical Features Breakdown */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#736353] block">
                  Identified Structural & Civil Engineering Components:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {dossier.reconstructionSketch.keyFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#F2EBDE] border border-[#E0D5C3] text-[#3D3327] flex items-start gap-2"
                    >
                      <span className="w-4 h-4 rounded-full bg-[#8B3A1C]/15 text-[#8B3A1C] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Image Switch Strip */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E3D8C6] text-xs text-[#6B5D4E]">
                <span>
                  Viewing mode: <strong>{activeImageView === 'sketch' ? 'Architectural Sketch' : 'Site Remnants'}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveImageView(activeImageView === 'sketch' ? 'site' : 'sketch')}
                    className="text-[#8B3A1C] hover:text-[#5E240F] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Switch to {activeImageView === 'sketch' ? 'Photographic Site Remnants' : 'Reconstruction Sketch'}</span>
                    &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Dimensions & Structural Design */}
          <div>
            <h3 className="text-lg font-serif font-bold text-[#2A221A] pb-1 border-b border-[#E0D7C6]">
              Dimensions & Structural Engineering
            </h3>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {dossier.dimensions.length && (
                <div className="p-2 bg-[#F3EDE2] rounded border border-[#E4DBCB]">
                  <span className="block text-[#6E6152]">Length:</span>
                  <span className="font-mono font-semibold text-[#29211A]">{dossier.dimensions.length}</span>
                </div>
              )}
              {dossier.dimensions.height && (
                <div className="p-2 bg-[#F3EDE2] rounded border border-[#E4DBCB]">
                  <span className="block text-[#6E6152]">Height:</span>
                  <span className="font-mono font-semibold text-[#29211A]">{dossier.dimensions.height}</span>
                </div>
              )}
              {dossier.dimensions.crestWidth && (
                <div className="p-2 bg-[#F3EDE2] rounded border border-[#E4DBCB]">
                  <span className="block text-[#6E6152]">Crest Width:</span>
                  <span className="font-mono font-semibold text-[#29211A]">{dossier.dimensions.crestWidth}</span>
                </div>
              )}
              {dossier.dimensions.storageCapacity && (
                <div className="p-2 bg-[#F3EDE2] rounded border border-[#E4DBCB]">
                  <span className="block text-[#6E6152]">Storage Volume:</span>
                  <span className="font-mono font-semibold text-[#29211A]">{dossier.dimensions.storageCapacity}</span>
                </div>
              )}
            </div>

            <p className="mt-3 text-sm text-[#42372D] leading-relaxed">
              <strong>Structural Design:</strong> {dossier.structuralDesign}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-xs text-[#6B5F50] font-semibold mr-1">Materials:</span>
              {dossier.constructionMaterials.map((m, idx) => (
                <span key={idx} className="text-xs bg-[#EFE9DC] text-[#3D3328] px-2 py-0.5 rounded border border-[#DDD3C2]">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Section 2: Engineering Analysis: Problem -> Solution -> Result */}
          <div className="bg-[#F5F0E6] border border-[#DFD6C6] rounded-lg p-4 space-y-2.5">
            <h3 className="font-serif font-bold text-base text-[#2E251D] flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#8B3A1C]" />
              Engineering Problem-Solving Logic
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-[#8B3A1C]">Hydraulic Problem:</span>
                <p className="text-[#453A2F] leading-relaxed">{dossier.engineeringAnalysis.problem}</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-[#8B3A1C]">Environmental Condition:</span>
                <p className="text-[#453A2F] leading-relaxed">{dossier.engineeringAnalysis.environmentalCondition}</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-[#21613A]">Engineering Solution:</span>
                <p className="text-[#453A2F] leading-relaxed">{dossier.engineeringAnalysis.engineeringSolution}</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-[#21613A]">Construction Method:</span>
                <p className="text-[#453A2F] leading-relaxed">{dossier.engineeringAnalysis.constructionMethod}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-[#E2D8C6] text-xs">
              <span className="font-semibold text-[#251F19]">Historical Result: </span>
              <span className="text-[#42372D]">{dossier.engineeringAnalysis.result}</span>
            </div>
          </div>

          {/* Section 3: Evidence Breakdown: DOCUMENTED vs INFERRED vs HYPOTHETICAL */}
          <div>
            <h3 className="text-lg font-serif font-bold text-[#2A221A] pb-1 border-b border-[#E0D7C6] flex items-center justify-between">
              <span>Separation of Fact from Interpretation</span>
              <span className="text-xs font-sans text-[#706456]">Evidence Hierarchy</span>
            </h3>

            <div className="mt-3 space-y-2 text-xs">
              {/* Documented */}
              <div className="p-3 bg-[#EEF5F0] border-l-4 border-[#246B3C] rounded-r">
                <div className="flex items-center gap-1.5 font-bold text-[#1F5430] uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Documented (Inscriptions, Stratigraphy, Official Texts):</span>
                </div>
                <ul className="list-disc ml-4 space-y-1 text-[#2C4A35]">
                  {dossier.documentedVsInferred.documented.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Inferred */}
              <div className="p-3 bg-[#F0F4F8] border-l-4 border-[#2E5E8A] rounded-r">
                <div className="flex items-center gap-1.5 font-bold text-[#224A70] uppercase tracking-wider mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Inferred (Physical Remains & Hydraulic Physics):</span>
                </div>
                <ul className="list-disc ml-4 space-y-1 text-[#2A445E]">
                  {dossier.documentedVsInferred.inferred.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Hypothetical */}
              {dossier.documentedVsInferred.hypothetical.length > 0 && (
                <div className="p-3 bg-[#FAF3EC] border-l-4 border-[#944D25] rounded-r">
                  <div className="flex items-center gap-1.5 font-bold text-[#733B1D] uppercase tracking-wider mb-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Hypothetical (Conjectural Explanations):</span>
                  </div>
                  <ul className="list-disc ml-4 space-y-1 text-[#5A331E]">
                    {dossier.documentedVsInferred.hypothetical.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Primary Epigraphical Citations */}
          <div>
            <h3 className="text-lg font-serif font-bold text-[#2A221A] pb-1 border-b border-[#E0D7C6]">
              Primary Inscriptions & Archaeological Citations
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              {dossier.historicalAndArchaeologicalEvidence.inscriptions.map((ins, idx) => (
                <div key={idx} className="p-2.5 bg-[#FAF6EE] border border-[#DFD6C6] rounded font-serif italic text-[#3B3025] leading-relaxed">
                  "{ins}"
                </div>
              ))}
            </div>
          </div>

          {/* Section 4b: Live Google Search Grounding (Live ASI Excavation & Epigraphic Reports) */}
          <div className="p-4 bg-[#FAF5EB] rounded-lg border border-[#DECDB8] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E8DFCFA0]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#8B3A1C]" />
                <h4 className="font-serif font-bold text-sm text-[#251E17]">
                  Live Google Search Grounding: Archaeological & Epigraphic Field Updates
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#DFD5C4] text-[#8B3A1C] w-fit">
                gemini-flash-latest (Google Search Grounded)
              </span>
            </div>

            {!searchGroundingResult && !searchGroundingLoading && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5D4E3F]">
                <p className="leading-relaxed">
                  Retrieve live real-time research, recent ASI (Archaeological Survey of India) excavation circulars, and scholarly journal updates for <strong>{dossier.name}</strong> directly from Google Search data.
                </p>
                <button
                  type="button"
                  onClick={handleFetchLiveSearchGrounding}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#8B3A1C] hover:bg-[#742E15] rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Google for Latest Field Updates</span>
                </button>
              </div>
            )}

            {searchGroundingLoading && (
              <div className="py-5 text-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#8B3A1C]" />
                <p className="text-xs text-[#6B5A49] font-medium">
                  Querying live Google Search indexes for {dossier.name} archaeological excavation reports...
                </p>
              </div>
            )}

            {searchGroundingResult && !searchGroundingLoading && (
              <div className="space-y-3 pt-1">
                <div className="prose prose-stone text-xs text-[#332A21] leading-relaxed max-w-none">
                  <MarkdownRenderer content={searchGroundingResult.text} />
                </div>

                {searchGroundingResult.searchQueries && searchGroundingResult.searchQueries.length > 0 && (
                  <div className="pt-2 border-t border-[#E8DFCF] space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#8B3A1C] block">
                      Google Search Queries Grounding:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {searchGroundingResult.searchQueries.map((q, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-white border border-[#DDD3C2] text-[#473B2E] font-mono text-[10px] flex items-center gap-1"
                        >
                          <Globe className="w-2.5 h-2.5 text-[#8B3A1C]" />
                          "{q}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {searchGroundingResult.groundingSources && searchGroundingResult.groundingSources.length > 0 && (
                  <div className="pt-2 border-t border-[#E8DFCF] space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#8B3A1C] block">
                      Verified Google Grounding Citations:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {searchGroundingResult.groundingSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white rounded border border-[#DFD5C2] hover:border-[#8B3A1C] hover:bg-[#FCFAF7] text-xs text-[#352B20] flex items-center justify-between gap-2 transition-all group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Search className="w-3.5 h-3.5 text-[#8B3A1C] shrink-0" />
                            <span className="truncate group-hover:text-[#8B3A1C] font-medium">
                              {source.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3 h-3 text-[#8B3A1C] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleFetchLiveSearchGrounding}
                    className="text-[11px] text-[#8B3A1C] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Search className="w-3 h-3" />
                    <span>Re-query Google Search Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Modern Relevance */}
          <div className="p-3.5 bg-[#F6F1E6] rounded border border-[#DFD6C6] text-xs text-[#3E342A] space-y-1">
            <span className="font-serif font-bold text-sm text-[#251F19] block">
              Modern Civil Engineering Relevance:
            </span>
            <p className="leading-relaxed">{dossier.modernRelevance}</p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E5DCCB] flex flex-wrap items-center justify-between gap-3">
            <SaveToDriveButton
              label="Save Dossier to Google Drive"
              variant="secondary"
              onExport={() => {
                const dossierMarkdown = `
# ${dossier.name} (${dossier.sanskritOrLocalName || ''})
**Location:** ${dossier.state}, ${dossier.region} (${dossier.riverBasin})
**Period:** ${dossier.period}
**Builder:** ${dossier.associatedRulerOrCivilization}
**Primary Purpose:** ${dossier.purpose}
**Water Source:** ${dossier.waterSource}

## Architectural Reconstruction Sketch
- **Sketch Title:** ${dossier.reconstructionSketch?.title || 'N/A'}
- **Drafting Style:** ${dossier.reconstructionSketch?.architecturalStyle || 'N/A'}
- **Caption:** ${dossier.reconstructionSketch?.caption || 'N/A'}
- **Identified Components:**
${dossier.reconstructionSketch?.keyFeatures.map((f, i) => `  ${i + 1}. ${f}`).join('\n') || ''}

## Engineering Problem & Solution
- **Problem:** ${dossier.engineeringAnalysis.problem}
- **Environmental Condition:** ${dossier.engineeringAnalysis.environmentalCondition}
- **Engineering Solution:** ${dossier.engineeringAnalysis.engineeringSolution}
- **Construction Method:** ${dossier.engineeringAnalysis.constructionMethod}
- **Engineering Result:** ${dossier.engineeringAnalysis.result}

## Primary Epigraphical & Archaeological Evidence
${dossier.historicalAndArchaeologicalEvidence.archaeologicalExcavations.map((exc: string) => `- **Excavation**: ${exc}`).join('\n')}

### Historical Inscriptions:
${dossier.historicalAndArchaeologicalEvidence.inscriptions.map((ins: string) => `> "${ins}"`).join('\n\n')}

## Modern Relevance & Lessons
${dossier.modernRelevance}
`;
                return exportResearchDossierToDrive(dossier.name, dossierMarkdown);
              }}
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleSave}
                className={`px-3 py-2 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer border ${
                  isSaved
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-[#ECE5D7] hover:bg-[#E0D7C4] text-[#54483C] border-[#D8CEBD]'
                }`}
                title="Bookmark dossier to personal archive"
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Saved to Archive</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-[#8B3A1C]" />
                    <span>Save Dossier</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleFetchLiveSearchGrounding}
                className="px-3.5 py-2 text-xs font-semibold text-[#8B3A1C] bg-[#FAF3E8] hover:bg-[#F4EADB] border border-[#E2D5C3] rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Search Google for real-time ASI excavations & epigraphical papers"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Google Search Grounding</span>
                <span className="sm:hidden">Google Search</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#54483C] bg-[#ECE5D7] hover:bg-[#E0D7C4] rounded transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  onAskResearch(`Provide deep forensic engineering research on ${dossier.name} (${dossier.region}), detailing its water source, design calculations, failure modes, and modern validation.`);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#8B3A1C] hover:bg-[#722F16] rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Inquire with AI Research Engine</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
