import React from 'react';
import { ArchaeologicalDossier } from '../data/ancientWaterData.ts';
import { MapPin, Calendar, Compass, ExternalLink } from 'lucide-react';

interface DossierCardProps {
  dossier: ArchaeologicalDossier;
  onSelect: (dossier: ArchaeologicalDossier) => void;
  onAskResearch: (dossier: ArchaeologicalDossier) => void;
}

export const DossierCard: React.FC<DossierCardProps> = ({ dossier, onSelect, onAskResearch }) => {
  return (
    <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg overflow-hidden flex flex-col hover:border-[#C4B7A2] hover:shadow-sm transition-all group">
      {/* High-Resolution Archaeological Image */}
      <div className="relative h-48 w-full bg-[#E8E1D3] overflow-hidden">
        <img
          src={dossier.image}
          alt={dossier.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          onError={(e) => {
            // Elegant fallback container if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        {/* Architectural Sketch Availability Badge */}
        {dossier.reconstructionSketch && (
          <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1F1710]/85 text-[#F3E8D7] border border-white/20 backdrop-blur-xs flex items-center gap-1 shadow-sm">
            <span>📐 Reconstruction Sketch</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
          <span className="text-[11px] font-sans uppercase tracking-widest text-[#E8E1D3] font-semibold">
            {dossier.region}
          </span>
          <h3 className="font-serif font-bold text-lg text-white leading-tight mt-0.5">
            {dossier.name}
          </h3>
          {dossier.sanskritOrLocalName && (
            <span className="text-xs text-[#DFD6C6] font-serif italic">
              {dossier.sanskritOrLocalName}
            </span>
          )}
        </div>
      </div>

      {/* Metadata & Quick Insights */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2 text-xs text-[#54483C]">
          <div className="flex items-center gap-1.5 text-[#6B5E4F]">
            <MapPin className="w-3.5 h-3.5 text-[#8B3A1C] shrink-0" />
            <span className="truncate">{dossier.state} ({dossier.riverBasin})</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#6B5E4F]">
            <Calendar className="w-3.5 h-3.5 text-[#8B3A1C] shrink-0" />
            <span className="truncate">{dossier.period}</span>
          </div>

          <p className="text-xs text-[#3D3328] line-clamp-2 leading-relaxed pt-1">
            {dossier.purpose}
          </p>

          <div className="flex flex-wrap gap-1 pt-1">
            {dossier.constructionMaterials.slice(0, 2).map((mat, i) => (
              <span key={i} className="text-[11px] bg-[#EFE9DC] text-[#4E4233] px-2 py-0.5 rounded border border-[#DDD3C0]">
                {mat}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#E8E0D2] flex items-center justify-between gap-2">
          <button
            onClick={() => onSelect(dossier)}
            className="flex-1 px-3 py-1.5 text-xs font-semibold text-[#2D241C] bg-[#ECE5D7] hover:bg-[#E0D7C4] rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Full Dossier</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            onClick={() => onAskResearch(dossier)}
            className="px-3 py-1.5 text-xs font-semibold text-[#FBF9F5] bg-[#8B3A1C] hover:bg-[#722F16] rounded transition-colors flex items-center gap-1 cursor-pointer"
            title="Launch Deep Research Inquiry"
          >
            <Compass className="w-3 h-3" />
            <span>Inquire</span>
          </button>
        </div>
      </div>
    </div>
  );
};
