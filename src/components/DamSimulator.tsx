import React, { useState, useEffect } from 'react';
import { Sliders, AlertTriangle, CheckCircle, Info, RefreshCw, Trash2, History, Plus, RotateCcw, Clock, Check } from 'lucide-react';
import { SaveToDriveButton } from './SaveToDriveButton.tsx';
import { exportSimulationToDrive } from '../services/googleDriveService.ts';

export interface SimulationHistoryPoint {
  id: string;
  timestamp: string;
  name: string;
  heightMeters: number;
  crestWidthMeters: number;
  embankmentLengthMeters: number;
  catchmentAreaSqKm: number;
  materialType: 'composite_clay_stone' | 'cyclopean_masonry';
  upstreamSlope: number;
  spillwayWidthMeters: number;
  factorOfSafetySliding: number;
  isOvertoppingRisk: boolean;
  peakFloodDischargeCumecs: number;
  spillwayCapacityCumecs: number;
}

const DEFAULT_SIMULATION_POINTS: SimulationHistoryPoint[] = [
  {
    id: 'sim-point-sudarshana',
    timestamp: 'Today, 2 hours ago',
    name: 'Sudarshana Dam (Girnar Gorge Profile)',
    heightMeters: 10,
    crestWidthMeters: 5,
    embankmentLengthMeters: 450,
    catchmentAreaSqKm: 40,
    materialType: 'composite_clay_stone',
    upstreamSlope: 2.5,
    spillwayWidthMeters: 25,
    factorOfSafetySliding: 1.89,
    isOvertoppingRisk: false,
    peakFloodDischargeCumecs: 185.3,
    spillwayCapacityCumecs: 226.3,
  },
  {
    id: 'sim-point-bhojpur',
    timestamp: 'Yesterday',
    name: 'Bhojpur Cyclopean Sandstone Bund',
    heightMeters: 14,
    crestWidthMeters: 8,
    embankmentLengthMeters: 600,
    catchmentAreaSqKm: 75,
    materialType: 'cyclopean_masonry',
    upstreamSlope: 2.0,
    spillwayWidthMeters: 40,
    factorOfSafetySliding: 2.14,
    isOvertoppingRisk: false,
    peakFloodDischargeCumecs: 282.1,
    spillwayCapacityCumecs: 362.1,
  },
];

export const DamSimulator: React.FC = () => {
  // Input states
  const [heightMeters, setHeightMeters] = useState<number>(10);
  const [crestWidthMeters, setCrestWidthMeters] = useState<number>(5);
  const [upstreamSlope, setUpstreamSlope] = useState<number>(2.5); // 1:2.5
  const [downstreamSlope] = useState<number>(2.0); // 1:2.0
  const [embankmentLengthMeters, setEmbankmentLengthMeters] = useState<number>(450);
  const [catchmentAreaSqKm, setCatchmentAreaSqKm] = useState<number>(40);
  const [materialType, setMaterialType] = useState<'composite_clay_stone' | 'cyclopean_masonry'>('composite_clay_stone');
  const [sluiceOpen, setSluiceOpen] = useState<boolean>(true);
  const [spillwayWidthMeters, setSpillwayWidthMeters] = useState<number>(25);

  // Simulation History Points State
  const [simHistoryPoints, setSimHistoryPoints] = useState<SimulationHistoryPoint[]>(() => {
    try {
      const saved = localStorage.getItem('jalasutra_simulation_history_points');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse simulation history points', e);
    }
    return DEFAULT_SIMULATION_POINTS;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync simulation history points to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jalasutra_simulation_history_points', JSON.stringify(simHistoryPoints));
    } catch (e) {}
  }, [simHistoryPoints]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const deleteHistoryPoint = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSimHistoryPoints((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('jalasutra_simulation_history_points', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
    showToast('Simulation history point deleted.');
  };

  const clearAllHistoryPoints = () => {
    setSimHistoryPoints([]);
    try {
      localStorage.setItem('jalasutra_simulation_history_points', JSON.stringify([]));
    } catch (err) {}
    showToast('All simulation history points deleted.');
  };

  const restorePoint = (p: SimulationHistoryPoint) => {
    setHeightMeters(p.heightMeters);
    setCrestWidthMeters(p.crestWidthMeters);
    setEmbankmentLengthMeters(p.embankmentLengthMeters);
    setCatchmentAreaSqKm(p.catchmentAreaSqKm);
    setMaterialType(p.materialType);
    setUpstreamSlope(p.upstreamSlope);
    setSpillwayWidthMeters(p.spillwayWidthMeters);
    showToast(`Restored parameters from point: "${p.name}"`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derived calculations
  const freeboard = 1.5; // meters
  const waterDepth = Math.max(0.5, heightMeters - freeboard);
  const waterDensity = 1000; // kg/m3
  const gravity = 9.81;

  // Base width = crest + (upstreamSlope * H) + (downstreamSlope * H)
  const baseWidth = crestWidthMeters + (upstreamSlope * heightMeters) + (downstreamSlope * heightMeters);

  // Hydrostatic Force per meter (kN/m) = 0.5 * rho * g * h^2
  const hydrostaticThrustPerMeterKN = (0.5 * waterDensity * gravity * Math.pow(waterDepth, 2)) / 1000;
  const totalThrustMN = (hydrostaticThrustPerMeterKN * embankmentLengthMeters) / 1000; // MegaNewtons

  // Cross section area (m2)
  const crossSectionArea = ((crestWidthMeters + baseWidth) / 2) * heightMeters;
  const unitWeightKNm3 = materialType === 'cyclopean_masonry' ? 24 : 20;
  const totalWeightMN = (crossSectionArea * embankmentLengthMeters * unitWeightKNm3) / 1000;

  // Factor of safety against sliding = (mu * W) / P
  const frictionMu = materialType === 'cyclopean_masonry' ? 0.65 : 0.52;
  const factorOfSafetySliding = (frictionMu * totalWeightMN) / Math.max(0.1, totalThrustMN);

  // Estimated Reservoir Storage Volume (MCM)
  const estimatedSpreadAreaSqKm = Math.min(catchmentAreaSqKm * 0.1, (crossSectionArea * 800) / 1000000);
  const estimatedStorageMCM = estimatedSpreadAreaSqKm * 1000000 * waterDepth * 0.35 / 1000000;

  // Ryves Monsoon Peak Flood Discharge (cumecs)
  const ryvesC = 560;
  const peakFloodDischargeCumecs = (ryvesC * Math.pow(catchmentAreaSqKm, 2 / 3)) / 35.315;

  // Broad-crested surplus weir spillway capacity (cumecs)
  const weirHead = 1.2; // meters over crest
  const spillwayCapacityCumecs = 1.7 * spillwayWidthMeters * Math.pow(weirHead, 1.5);

  // Sluice scouring velocity (m/s)
  const scourVelocityMs = sluiceOpen ? Math.sqrt(2 * gravity * (waterDepth * 0.8)) : 0;

  // Safety assessment
  const floodSafetyRatio = spillwayCapacityCumecs / Math.max(1, peakFloodDischargeCumecs);
  const isOvertoppingRisk = floodSafetyRatio < 0.9;

  // SVG dimensions for cross-section rendering
  const svgWidth = 600;
  const svgHeight = 280;
  const groundY = 220;
  const scale = 12; // pixels per meter

  // Geometric coordinates for cross-section
  const damHeightPx = heightMeters * scale;
  const crestTopY = groundY - damHeightPx;
  const crestWidthPx = crestWidthMeters * scale;
  const usSlopeRunPx = upstreamSlope * heightMeters * scale;
  const dsSlopeRunPx = downstreamSlope * heightMeters * scale;

  const damLeftX = 140; // toe of upstream slope
  const crestLeftX = damLeftX + usSlopeRunPx;
  const crestRightX = crestLeftX + crestWidthPx;
  const damRightX = crestRightX + dsSlopeRunPx; // toe of downstream slope

  const waterLevelY = groundY - (waterDepth * scale);

  return (
    <div className="space-y-6">
      {/* Header explanation */}
      <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E0D2]">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#2A231C]">
              Ancient Hydraulic & Embankment Simulator
            </h2>
            <p className="text-xs sm:text-sm text-[#736657] mt-0.5">
              Empirical modeling of ancient gravity dams, earthen bunds, clay cores, scour sluices (*kalingu*), and surplus weirs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SaveToDriveButton
              label="Save Report to Google Drive"
              variant="secondary"
              onExport={() =>
                exportSimulationToDrive(
                  {
                    heightMeters,
                    crestWidthMeters,
                    embankmentLengthMeters,
                    catchmentAreaSqKm,
                    materialType,
                    upstreamSlope,
                    spillwayWidthMeters,
                  },
                  {
                    hydrostaticThrustPerMeterKN,
                    totalThrustMN,
                    totalWeightMN,
                    factorOfSafetySliding,
                    estimatedStorageMCM,
                    peakFloodDischargeCumecs,
                    spillwayCapacityCumecs,
                    scourVelocityMs,
                    floodSafetyRatio,
                    isOvertoppingRisk,
                  },
                  `Simulated profile of a ${heightMeters}m embankment impounding ${catchmentAreaSqKm} sq km catchment basin. Factor of Safety against sliding is ${factorOfSafetySliding.toFixed(2)}.`
                )
              }
            />

            <button
              type="button"
              onClick={() => {
                const newPoint: SimulationHistoryPoint = {
                  id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  timestamp: 'Just now',
                  name: `${heightMeters}m ${materialType === 'cyclopean_masonry' ? 'Cyclopean' : 'Composite'} Embankment (${catchmentAreaSqKm}km²)`,
                  heightMeters,
                  crestWidthMeters,
                  embankmentLengthMeters,
                  catchmentAreaSqKm,
                  materialType,
                  upstreamSlope,
                  spillwayWidthMeters,
                  factorOfSafetySliding,
                  isOvertoppingRisk,
                  peakFloodDischargeCumecs,
                  spillwayCapacityCumecs,
                };
                setSimHistoryPoints((prev) => [newPoint, ...prev]);
                showToast('Simulation point recorded to history.');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#8B3A1C] hover:bg-[#712E15] rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Record current hydraulic parameters as a history point"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Simulation Point</span>
            </button>

            <button
              onClick={() => {
                setHeightMeters(10);
                setCrestWidthMeters(5);
                setUpstreamSlope(2.5);
                setCatchmentAreaSqKm(40);
                setSpillwayWidthMeters(25);
                setMaterialType('composite_clay_stone');
                setSluiceOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-medium text-[#4D4236] bg-[#EDE6D8] hover:bg-[#E2D9C7] rounded flex items-center gap-1.5 transition-colors cursor-pointer border border-[#D5CABB]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Visual Schematic Diagram */}
        <div className="mt-4 bg-[#F2EDE2] rounded-md p-3 border border-[#DED4C3] overflow-x-auto">
          <div className="text-xs font-serif font-semibold text-[#5A4F43] mb-2 flex items-center justify-between">
            <span>ENGINEERING CROSS-SECTION SCHEMATIC (Profile View)</span>
            <span className="text-[11px] font-sans text-[#7D7061]">Scale: ~1:{scale} • Freeboard: {freeboard}m</span>
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[650px] mx-auto block h-auto select-none">
            <defs>
              <pattern id="clayHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#A88B68" strokeWidth="1" />
              </pattern>
              <pattern id="stonePitching" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="9" height="9" fill="#756D63" rx="1" />
              </pattern>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4A7C9E" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2A5370" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Geological Foundation Bedrock */}
            <rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="#C7BDAE" />
            <line x1="0" y1={groundY} x2={svgWidth} y2={groundY} stroke="#7D7061" strokeWidth="2" strokeDasharray="4 2" />
            <text x="15" y={groundY + 25} fill="#5E5346" fontSize="10" fontFamily="sans-serif">Firm Foundation Bedrock / Hard Clay</text>

            {/* Reservoir Water Body */}
            <path
              d={`M 0 ${groundY} L ${damLeftX} ${groundY} L ${damLeftX + (upstreamSlope * (heightMeters - (waterLevelY < crestTopY ? 0 : (waterLevelY - crestTopY) / scale))) * scale} ${waterLevelY} L 0 ${waterLevelY} Z`}
              fill="url(#waterGradient)"
            />
            {/* Animated Water Surface Line */}
            <line x1="0" y1={waterLevelY} x2={damLeftX + (upstreamSlope * waterDepth * scale)} y2={waterLevelY} stroke="#8EC7EB" strokeWidth="2.5" />
            <text x="25" y={waterLevelY - 6} fill="#1D4C6E" fontSize="10" fontWeight="bold">
              Reservoir Pool ({waterDepth.toFixed(1)}m Head)
            </text>

            {/* Hydrostatic Pressure Triangular Vector Distribution */}
            <polygon
              points={`20,${waterLevelY} 20,${groundY} 70,${groundY}`}
              fill="#D64527"
              fillOpacity="0.25"
              stroke="#D64527"
              strokeWidth="1.2"
            />
            <text x="25" y={groundY - 10} fill="#B03217" fontSize="9" fontWeight="bold">Hydrostatic Pressure (p = ρgh)</text>

            {/* Main Embankment Body */}
            <polygon
              points={`${damLeftX},${groundY} ${crestLeftX},${crestTopY} ${crestRightX},${crestTopY} ${damRightX},${groundY}`}
              fill={materialType === 'cyclopean_masonry' ? '#8F8578' : '#D4C7B4'}
              stroke="#594E41"
              strokeWidth="2"
            />

            {/* Clay Puddle Core (Hearting) */}
            {materialType === 'composite_clay_stone' && (
              <polygon
                points={`
                  ${crestLeftX + (crestWidthPx * 0.25)},${crestTopY + 8}
                  ${crestLeftX + (crestWidthPx * 0.75)},${crestTopY + 8}
                  ${crestLeftX + (crestWidthPx * 0.75) + 30},${groundY}
                  ${crestLeftX + (crestWidthPx * 0.25) - 30},${groundY}
                `}
                fill="url(#clayHatch)"
                stroke="#8A6E4B"
                strokeWidth="1.5"
              />
            )}

            {/* Upstream Stone Rip-Rap Revetment Layer */}
            <line
              x1={damLeftX}
              y1={groundY}
              x2={crestLeftX}
              y2={crestTopY}
              stroke="#4E473F"
              strokeWidth="6"
              strokeDasharray="4 2"
            />

            {/* Phreatic Seepage Line through Dam */}
            <path
              d={`M ${damLeftX + (upstreamSlope * waterDepth * scale)} ${waterLevelY} Q ${crestLeftX + 30} ${waterLevelY + 15}, ${damRightX - 20} ${groundY}`}
              fill="none"
              stroke="#3884B5"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <text x={crestRightX + 15} y={groundY - 15} fill="#275E82" fontSize="8" fontStyle="italic">Phreatic Seepage Line</text>

            {/* Base Sluice Conduit (*kalingu* or *bisokotuwa*) */}
            <rect x={crestLeftX - 10} y={groundY - 12} width={damRightX - crestLeftX + 25} height="12" fill="#3B3228" stroke="#1F1914" strokeWidth="1" />
            <text x={crestLeftX + 5} y={groundY - 3} fill="#FFF8EE" fontSize="7" fontWeight="bold">Stone Sluice Conduit</text>

            {/* Scouring Water Jet out of Sluice */}
            {sluiceOpen && (
              <path
                d={`M ${damRightX + 15} ${groundY - 6} Q ${damRightX + 45} ${groundY - 6}, ${damRightX + 80} ${groundY + 10}`}
                fill="none"
                stroke="#4FA7DE"
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}

            {/* Dimension Lines and Annotations */}
            {/* Height arrow */}
            <line x1={crestRightX + dsSlopeRunPx + 15} y1={crestTopY} x2={crestRightX + dsSlopeRunPx + 15} y2={groundY} stroke="#2B241D" strokeWidth="1" markerEnd="url(#arrow)" />
            <text x={crestRightX + dsSlopeRunPx + 22} y={(crestTopY + groundY) / 2} fill="#2B241D" fontSize="10" fontWeight="bold">H = {heightMeters}m</text>

            {/* Crest label */}
            <line x1={crestLeftX} y1={crestTopY - 8} x2={crestRightX} y2={crestTopY - 8} stroke="#594E41" strokeWidth="1" />
            <text x={(crestLeftX + crestRightX) / 2 - 20} y={crestTopY - 12} fill="#3A3025" fontSize="9" fontWeight="bold">Crest = {crestWidthMeters}m</text>

            {/* Slopes */}
            <text x={damLeftX + (usSlopeRunPx * 0.4)} y={crestTopY + (damHeightPx * 0.7)} fill="#2B231B" fontSize="9" fontWeight="bold">
              1:{upstreamSlope} (Pitching)
            </text>
            <text x={crestRightX + (dsSlopeRunPx * 0.4)} y={crestTopY + (damHeightPx * 0.7)} fill="#2B231B" fontSize="9">
              1:2.0
            </text>
          </svg>
        </div>
      </div>

      {/* Control sliders & Live Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (7 Cols) */}
        <div className="lg:col-span-7 bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D2]">
            <h3 className="font-serif font-bold text-base text-[#2E251D] flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#8B3A1C]" />
              Hydraulic & Structural Controls
            </h3>
            <span className="text-xs text-[#7B6E5F]">Live physics recalculation</span>
          </div>

          {/* Embankment Height */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#453A2F] mb-1">
              <span>Embankment Height (h):</span>
              <span className="font-mono text-[#8B3A1C]">{heightMeters} meters</span>
            </div>
            <input
              type="range"
              min="4"
              max="16"
              step="0.5"
              value={heightMeters}
              onChange={(e) => setHeightMeters(parseFloat(e.target.value))}
              className="w-full accent-[#8B3A1C] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8C8072] mt-0.5">
              <span>4m (Low weir / Eri)</span>
              <span>10m (Sudarshana Lake)</span>
              <span>16m (Bhojpur Cyclopean)</span>
            </div>
          </div>

          {/* Crest Width */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#453A2F] mb-1">
              <span>Crest Width (b):</span>
              <span className="font-mono text-[#8B3A1C]">{crestWidthMeters} meters</span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              step="0.5"
              value={crestWidthMeters}
              onChange={(e) => setCrestWidthMeters(parseFloat(e.target.value))}
              className="w-full accent-[#8B3A1C] cursor-pointer"
            />
          </div>

          {/* Upstream Slope */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#453A2F] mb-1">
              <span>Upstream Slope (1:n):</span>
              <span className="font-mono text-[#8B3A1C]">1:{upstreamSlope.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="3.5"
              step="0.1"
              value={upstreamSlope}
              onChange={(e) => setUpstreamSlope(parseFloat(e.target.value))}
              className="w-full accent-[#8B3A1C] cursor-pointer"
            />
            <span className="text-[10px] text-[#7A6D5E]">Gentler slopes (1:2.5 to 1:3.0) resist soil sliding under saturated conditions.</span>
          </div>

          {/* Catchment Area */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#453A2F] mb-1">
              <span>Catchment Area (A):</span>
              <span className="font-mono text-[#8B3A1C]">{catchmentAreaSqKm} km²</span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={catchmentAreaSqKm}
              onChange={(e) => setCatchmentAreaSqKm(parseFloat(e.target.value))}
              className="w-full accent-[#8B3A1C] cursor-pointer"
            />
          </div>

          {/* Spillway Width */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#453A2F] mb-1">
              <span>Surplus Escape / Spillway Width (L):</span>
              <span className="font-mono text-[#8B3A1C]">{spillwayWidthMeters} meters</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="2"
              value={spillwayWidthMeters}
              onChange={(e) => setSpillwayWidthMeters(parseFloat(e.target.value))}
              className="w-full accent-[#8B3A1C] cursor-pointer"
            />
          </div>

          {/* Material & Sluice Toggles */}
          <div className="pt-2 border-t border-[#E8E0D2] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#453A2F] mb-1">Core Construction Material:</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value as any)}
                className="w-full text-xs bg-[#F2EDE2] border border-[#D5CABB] rounded px-2.5 py-1.5 text-[#30261D] cursor-pointer"
              >
                <option value="composite_clay_stone">Compacted Clay with Stone Pitching</option>
                <option value="cyclopean_masonry">Mortarless Cyclopean Sandstone (Bhojpur style)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#453A2F] mb-1">Scour Sluice (*Kalingu*):</label>
              <button
                onClick={() => setSluiceOpen(!sluiceOpen)}
                className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded border transition-colors cursor-pointer ${
                  sluiceOpen
                    ? 'bg-[#EBF5ED] border-[#B7DEBF] text-[#1E5C2D]'
                    : 'bg-[#FBEBEB] border-[#E8B8B8] text-[#8C2323]'
                }`}
              >
                {sluiceOpen ? 'Sluice Valve OPEN (Flushing Silt)' : 'Sluice Valve CLOSED (Retaining Head)'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Metrics Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Engineering Metrics Card */}
          <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg p-5 space-y-3">
            <h3 className="font-serif font-bold text-base text-[#2E251D] pb-2 border-b border-[#E8E0D2]">
              Live Hydrostatic Calculations
            </h3>

            <div className="space-y-2.5 text-xs text-[#42372D]">
              <div className="flex justify-between py-1 border-b border-[#EAE3D6]">
                <span className="text-[#695D50]">Base Width (Crest + Slopes):</span>
                <span className="font-mono font-semibold">{baseWidth.toFixed(1)} m</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#EAE3D6]">
                <span className="text-[#695D50]">Total Hydrostatic Thrust:</span>
                <span className="font-mono font-semibold text-[#B33519]">{totalThrustMN.toFixed(1)} MN ({hydrostaticThrustPerMeterKN.toFixed(0)} kN/m)</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#EAE3D6]">
                <span className="text-[#695D50]">Factor of Safety (Sliding):</span>
                <span className={`font-mono font-bold ${factorOfSafetySliding >= 1.5 ? 'text-[#1D6334]' : 'text-[#A83216]'}`}>
                  {factorOfSafetySliding.toFixed(2)} (Min standard: 1.50)
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#EAE3D6]">
                <span className="text-[#695D50]">Estimated Reservoir Storage:</span>
                <span className="font-mono font-semibold">{estimatedStorageMCM.toFixed(2)} Million m³</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#EAE3D6]">
                <span className="text-[#695D50]">Ryves Peak Flood (Catchment):</span>
                <span className="font-mono font-semibold">{peakFloodDischargeCumecs.toFixed(1)} m³/s</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#EAE3D6]">
                <span className="text-[#695D50]">Spillway Discharge Capacity:</span>
                <span className="font-mono font-semibold text-[#205C82]">{spillwayCapacityCumecs.toFixed(1)} m³/s</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#EAE3D6]">
                <span className="text-[#695D50]">Sluice Jet Velocity (Scour):</span>
                <span className="font-mono font-semibold">{scourVelocityMs.toFixed(2)} m/s</span>
              </div>
            </div>

            {/* Overtopping Risk Alert */}
            <div className={`p-3 rounded text-xs border ${
              isOvertoppingRisk
                ? 'bg-[#FDF0ED] border-[#ECC0B5] text-[#8F2713]'
                : 'bg-[#EFF6F0] border-[#C3DEC8] text-[#1D5E32]'
            }`}>
              <div className="flex items-start gap-2">
                {isOvertoppingRisk ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block font-semibold">
                    {isOvertoppingRisk ? 'Overtopping Danger Detected!' : 'Surplus Discharge Adequate'}
                  </strong>
                  <p className="mt-0.5 leading-relaxed">
                    {isOvertoppingRisk
                      ? `Peak flood (${peakFloodDischargeCumecs.toFixed(0)} m³/s) exceeds spillway capacity (${spillwayCapacityCumecs.toFixed(0)} m³/s). Dam would overtop and wash out, exactly like Sudarshana Lake breached in 150 CE during cloudbursts.`
                      : `Spillway escape ratio (${floodSafetyRatio.toFixed(2)}x) safely routes peak monsoonal floods through natural rock bypass.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Precedent Match */}
          <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg p-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8B3A1C] uppercase tracking-wider mb-1">
              <Info className="w-3.5 h-3.5" />
              Archaeological Precedent Match
            </div>

            <h4 className="font-serif font-bold text-base text-[#2E251D]">
              {materialType === 'cyclopean_masonry' || heightMeters >= 12
                ? 'Bhojpur Cyclopean Dam (Betwa Basin, 1050 CE)'
                : heightMeters >= 7
                ? 'Sudarshana Lake & Dam (Girnar, 320 BCE - 456 CE)'
                : 'Kallanai & South Indian Cascade Tank Bunds'}
            </h4>

            <p className="text-xs text-[#524639] mt-2 leading-relaxed">
              {materialType === 'cyclopean_masonry' || heightMeters >= 12
                ? 'Your parameters align with King Bhoja’s megalithic dam at Bhojpur: dry cyclopean sandstone blocks, high hydraulic head, reliance on massive dead weight rather than mortar.'
                : heightMeters >= 7
                ? 'Matches the Girnar gorge configuration of Sudarshana Dam: an earthen composite core revetted with stone pitching to throttle seasonal flash floods from Suvarnasikata.'
                : 'Matches the low-head, contour-following earthen bunds of peninsular India designed for gentle flood diversion into paddy networks rather than deep canyon impoundment.'}
            </p>
          </div>
        </div>
      </div>

      {/* Floating / Inline Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2C2117] text-[#FAF5ED] px-4 py-2.5 rounded-lg shadow-lg border border-[#8B3A1C]/50 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ARCHIVAL SIMULATION RUN HISTORY & RECORDED POINTS */}
      <section className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-[#E8E0D2] bg-[#F5EFE3]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8B3A1C]/10 text-[#8B3A1C] flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#2A2118]">
                  Simulation Run History & Recorded Points
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDE4D5] text-[#8B3A1C] border border-[#DFD5C4]">
                  {simHistoryPoints.length} {simHistoryPoints.length === 1 ? 'Point' : 'Points'}
                </span>
              </div>
              <p className="text-xs text-[#706354] mt-0.5">
                Saved empirical configurations. Restore parameters to test against floods, or delete individual simulation points.
              </p>
            </div>
          </div>

          {simHistoryPoints.length > 0 && (
            <button
              type="button"
              onClick={clearAllHistoryPoints}
              className="px-2.5 py-1 text-xs rounded font-medium text-[#A3321E] hover:bg-[#FCE8E5] border border-[#F2C2BA] transition-colors cursor-pointer flex items-center gap-1 self-end sm:self-center"
              title="Delete all simulation history points"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Points</span>
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {simHistoryPoints.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#7A6D5E] space-y-1 bg-[#F7F2E8] rounded-lg border border-dashed border-[#DDD2C0]">
              <Clock className="w-5 h-5 mx-auto text-[#9C8F7F]" />
              <p className="font-medium text-[#4D4032]">No simulation points recorded yet.</p>
              <p className="text-[11px]">Click "Record Simulation Point" in the header to bookmark your current dam profile.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {simHistoryPoints.map((point) => (
                <div
                  key={point.id}
                  className="bg-white border border-[#DFD6C7] rounded-lg p-3.5 hover:border-[#8B3A1C]/60 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-serif font-bold text-sm text-[#261E16] truncate">
                        {point.name}
                      </h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          point.isOvertoppingRisk
                            ? 'bg-[#FDF0ED] text-[#8F2713] border border-[#ECC0B5]'
                            : point.factorOfSafetySliding < 1.5
                            ? 'bg-[#FEF6E7] text-[#965A0E] border border-[#F6DCAD]'
                            : 'bg-[#EFF6F0] text-[#1D5E32] border border-[#C3DEC8]'
                        }`}
                      >
                        {point.isOvertoppingRisk
                          ? 'Overtopping Risk'
                          : point.factorOfSafetySliding < 1.5
                          ? 'Sliding Danger'
                          : 'Stable Gravity Bund'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 bg-[#F9F6F0] rounded text-[11px] text-[#55473A] border border-[#EBE3D5]">
                      <div>
                        <span className="text-[10px] text-[#8A7969] block">Height / Crest</span>
                        <strong className="font-mono">{point.heightMeters}m / {point.crestWidthMeters}m</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8A7969] block">Sliding FOS</span>
                        <strong className={`font-mono ${point.factorOfSafetySliding >= 1.5 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {point.factorOfSafetySliding.toFixed(2)}x
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8A7969] block">Flood / Spillway</span>
                        <strong className="font-mono">{point.peakFloodDischargeCumecs.toFixed(0)} / {point.spillwayCapacityCumecs.toFixed(0)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[#7A6D5E]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8B3A1C]" />
                        {point.timestamp}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{point.materialType.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EFE8DD]">
                    <button
                      type="button"
                      onClick={() => restorePoint(point)}
                      className="px-2.5 py-1 text-xs font-medium text-[#46392C] bg-[#ECE5D8] hover:bg-[#DFD6C7] rounded flex items-center gap-1 transition-colors cursor-pointer border border-[#D5CABB]"
                    >
                      <RotateCcw className="w-3 h-3 text-[#8B3A1C]" />
                      <span>Restore Parameters</span>
                    </button>

                    {/* EXPLICIT SIMULATION HISTORY DELETE POINT BUTTON */}
                    <button
                      type="button"
                      onClick={(e) => deleteHistoryPoint(point.id, e)}
                      className="px-2 py-1 text-xs font-semibold text-[#A3321E] bg-[#FDF0ED] hover:bg-[#FCE8E5] border border-[#F2C2BA] rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Delete this simulation history point"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#A3321E]" />
                      <span>Delete Point</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
