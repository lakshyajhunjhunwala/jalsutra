import React, { useState } from 'react';
import { ANCIENT_WATER_STRUCTURES, ArchaeologicalDossier } from '../data/ancientWaterData.ts';
import { Layers, Loader2, Compass, Check, Search, ShieldCheck, ExternalLink } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { SaveToDriveButton } from './SaveToDriveButton.tsx';
import { exportComparisonToDrive, exportComparativeMatrixTableToDrive } from '../services/googleDriveService.ts';
import { getApiUrl } from '../services/apiConfig.ts';

export const ComparativeTool: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'sudarshana-dam',
    'kallanai-grand-anicut',
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [aiComparison, setAiComparison] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<Array<{ title: string; uri: string; type?: 'web' | 'maps'; snippet?: string }>>([]);
  const [modelUsed, setModelUsed] = useState<string>('gemini-flash-latest');
  const [error, setError] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) {
        setSelectedIds(selectedIds.filter(item => item !== id));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const selectedDossiers = ANCIENT_WATER_STRUCTURES.filter(d => selectedIds.includes(d.id));

  const runAiComparison = async () => {
    setLoading(true);
    setError(null);
    setAiComparison(null);

    try {
      const names = selectedDossiers.map(d => `${d.name} (${d.region}, ${d.period})`);
      const res = await fetch(getApiUrl('/api/compare'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structures: names }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate comparison');
      }

      const data = await res.json();
      setAiComparison(data.text);
      if (Array.isArray(data.groundingSources)) {
        setGroundingSources(data.groundingSources);
      }
      if (data.modelUsed) {
        setModelUsed(data.modelUsed);
      }
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Control Card */}
      <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E0D2]">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#2A231C] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#8B3A1C]" />
              Comparative Hydrology & Engineering Matrix
            </h2>
            <p className="text-xs sm:text-sm text-[#736657] mt-0.5">
              Select 2 or 3 ancient hydraulic structures to analyze structural paradigms, geological challenges, and siltation strategies.
            </p>
          </div>
          <button
            onClick={runAiComparison}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#FBF9F5] bg-[#8B3A1C] hover:bg-[#722F16] disabled:bg-[#C9BFB2] rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Comparing...</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5" />
                <span>Run AI Deep Comparison</span>
              </>
            )}
          </button>
        </div>

        {/* Selection Pills */}
        <div className="mt-3 flex flex-wrap gap-2">
          {ANCIENT_WATER_STRUCTURES.map(d => {
            const isSelected = selectedIds.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleSelect(d.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#8B3A1C] text-white border-[#8B3A1C] shadow-2xs'
                    : 'bg-[#EFE9DC] text-[#4A3F33] border-[#DDD3C2] hover:bg-[#E5DDCB]'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{d.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Curated Matrix Table */}
      <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg p-5 overflow-x-auto shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="font-serif font-bold text-base text-[#2E251D]">
            Direct Archaeological & Hydraulic Parameter Comparison
          </h3>
          <SaveToDriveButton
            label="Save Matrix to Google Drive"
            variant="secondary"
            onExport={() => exportComparativeMatrixTableToDrive(selectedDossiers)}
          />
        </div>

        <table className="min-w-full divide-y divide-[#E0D8CB] text-xs">
          <thead className="bg-[#EDE6D7]">
            <tr>
              <th className="px-4 py-2.5 text-left font-serif font-semibold text-[#3D332A] uppercase tracking-wider w-1/4">
                Hydraulic Parameter
              </th>
              {selectedDossiers.map(d => (
                <th key={d.id} className="px-4 py-2.5 text-left font-serif font-bold text-[#8B3A1C] text-sm">
                  {d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE4D7] bg-[#FDFBF7]">
            {/* Architectural Reconstruction & Cross-Section */}
            <tr>
              <td className="px-4 py-2.5 font-semibold text-[#3B3126] bg-[#F7F3EB]">
                Architectural Cross-Section & Reconstruction
              </td>
              {selectedDossiers.map(d => (
                <td key={d.id} className="px-4 py-2.5 text-[#4D4236] align-top">
                  {d.reconstructionSketch ? (
                    <div className="space-y-1.5">
                      <div className="relative rounded overflow-hidden border border-[#D5C8B4] bg-[#221B14] h-32 w-full shadow-2xs">
                        <img
                          src={d.reconstructionSketch.image}
                          alt={d.reconstructionSketch.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[10px] font-serif font-bold text-white line-clamp-1">
                            {d.reconstructionSketch.title}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-[#6E6152] leading-snug line-clamp-2">
                        {d.reconstructionSketch.caption}
                      </p>
                    </div>
                  ) : (
                    <div className="h-28 rounded bg-[#EFE8DC] border border-[#DDD3C0] flex items-center justify-center text-[11px] text-[#8C7E72] p-2 text-center">
                      Site photographic survey only
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* Period & Ruler */}
            <tr>
              <td className="px-4 py-2.5 font-semibold text-[#3B3126] bg-[#F7F3EB]">Period & Associated Ruler</td>
              {selectedDossiers.map(d => (
                <td key={d.id} className="px-4 py-2.5 text-[#4D4236] align-top">
                  <div className="font-medium text-[#251F19]">{d.period}</div>
                  <div className="text-[11px] text-[#736657] mt-0.5">{d.associatedRulerOrCivilization}</div>
                </td>
              ))}
            </tr>

            {/* River & Basin */}
            <tr>
              <td className="px-4 py-2.5 font-semibold text-[#3B3126] bg-[#F7F3EB]">Water Source & Basin</td>
              {selectedDossiers.map(d => (
                <td key={d.id} className="px-4 py-2.5 text-[#4D4236] align-top">
                  <div className="font-medium">{d.waterSource}</div>
                  <div className="text-[11px] text-[#736657]">{d.riverBasin}</div>
                </td>
              ))}
            </tr>

            {/* Geological Challenge */}
            <tr>
              <td className="px-4 py-2.5 font-semibold text-[#3B3126] bg-[#F7F3EB]">Hydraulic & Terrain Problem</td>
              {selectedDossiers.map(d => (
                <td key={d.id} className="px-4 py-2.5 text-[#4D4236] align-top leading-relaxed">
                  {d.engineeringAnalysis.problem}
                </td>
              ))}
            </tr>

            {/* Structural Design & Materials */}
            <tr>
              <td className="px-4 py-2.5 font-semibold text-[#3B3126] bg-[#F7F3EB]">Construction Method & Materials</td>
              {selectedDossiers.map(d => (
                <td key={d.id} className="px-4 py-2.5 text-[#4D4236] align-top leading-relaxed">
                  <p>{d.structuralDesign}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {d.constructionMaterials.slice(0, 3).map((m, i) => (
                      <span key={i} className="text-[10px] bg-[#EFE9DC] px-1.5 py-0.5 rounded border border-[#DDD3C0]">
                        {m}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            {/* Flood & Siltation Strategy */}
            <tr>
              <td className="px-4 py-2.5 font-semibold text-[#3B3126] bg-[#F7F3EB]">Flood Surplus & Siltation Control</td>
              {selectedDossiers.map(d => (
                <td key={d.id} className="px-4 py-2.5 text-[#4D4236] align-top leading-relaxed">
                  {d.drainageAndFloodControl}
                </td>
              ))}
            </tr>

            {/* Epigraphical Evidence */}
            <tr>
              <td className="px-4 py-2.5 font-semibold text-[#3B3126] bg-[#F7F3EB]">Primary Historical Evidence</td>
              {selectedDossiers.map(d => (
                <td key={d.id} className="px-4 py-2.5 text-[#4D4236] align-top leading-relaxed text-[11px]">
                  <ul className="list-disc ml-3 space-y-1">
                    {d.historicalAndArchaeologicalEvidence.inscriptions.map((ins, i) => (
                      <li key={i}>{ins.substring(0, 140)}...</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Modern Civil Engineering Lesson */}
            <tr>
              <td className="px-4 py-2.5 font-semibold text-[#3B3126] bg-[#F7F3EB]">Modern Relevance & Validation</td>
              {selectedDossiers.map(d => (
                <td key={d.id} className="px-4 py-2.5 text-[#4D4236] align-top leading-relaxed">
                  {d.modernRelevance}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* AI Deep Comparison Output */}
      {error && (
        <div className="p-4 bg-[#FDF0ED] border-l-4 border-[#C73718] rounded text-xs text-[#87230E]">
          {error}
        </div>
      )}

      {aiComparison && (
        <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E0D2]">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-sans font-semibold text-[#8B3A1C] bg-[#F3ECE0] px-2 py-0.5 rounded border border-[#DFD5C4]">
                AI Forensic Comparative Synthesis
              </span>
              <span className="text-xs text-[#7A6C5D] hidden sm:inline">
                Comparing: {selectedDossiers.map(d => d.name).join(' vs ')}
              </span>
            </div>

            <SaveToDriveButton
              label="Save Comparison to Google Drive"
              variant="secondary"
              onExport={() =>
                exportComparisonToDrive(
                  selectedDossiers.map((d) => d.name),
                  aiComparison
                )
              }
            />
          </div>

          <div className="prose prose-stone max-w-none text-[#332A21] leading-relaxed">
            <MarkdownRenderer content={aiComparison} />
          </div>

          {/* Google Search Grounding Sources */}
          {groundingSources.length > 0 && (
            <div className="mt-4 p-3.5 rounded-lg bg-[#F5EFE3] border border-[#E2D8C6] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8B3A1C]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Google Search Grounding Citations:</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#DDD3C2] text-[#554637]">
                  {modelUsed}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {groundingSources.map((source, idx) => (
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
        </div>
      )}
    </div>
  );
};
