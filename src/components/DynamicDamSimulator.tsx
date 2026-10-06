import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  RotateCcw,
  Search,
  Sliders,
  Waves,
  History,
  Trash2,
  BookmarkPlus,
  Landmark,
  Compass,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MapPin,
  Loader2,
  HardDrive,
} from 'lucide-react';
import {
  ANCIENT_SIMULATION_STRUCTURES,
  DEFAULT_SIMULATION_STRUCTURE,
  findPredefinedStructure,
  heuristicClassifyStructure,
  SimulationStructure,
  SimulationValues,
  StructureKind,
} from '../data/ancientStructureSimulationData.ts';
import { StructureSchematic } from './StructureSchematic.tsx';
import { SaveToDriveButton } from './SaveToDriveButton.tsx';
import { uploadFileToDrive } from '../services/googleDriveService.ts';

export interface StructureSnapshot {
  id: string;
  timestamp: string;
  name: string;
  structureId: string;
  kind: StructureKind;
  values: SimulationValues;
  primaryMetric: string;
  secondaryMetric: string;
}

const KIND_LABELS: Record<StructureKind, string> = {
  DIVERSION_WEIR: 'Diversion Weir / Anicut',
  EMBANKMENT_DAM: 'Embankment Dam',
  MASONRY_DAM: 'Masonry Gravity Dam',
  GRAVITY_DAM: 'Gravity Dam',
  RESERVOIR_TANK: 'Reservoir / Tank Complex',
  QANAT: 'Qanat / Underground Gallery',
  STEPWELL: 'Subterranean Stepwell',
  CANAL: 'Conveyance Canal',
  OTHER_HYDRAULIC_STRUCTURE: 'Hydraulic Structure',
};

const DEMO_QUICK_PICKS = [
  'Kallanai Dam',
  'Sudarshana Lake',
  'Dholavira Reservoirs',
  'Sringaverapura Tank',
  'Bhojpur Lake',
  'Roman Proserpina Dam',
  'Persian Qanat',
  'Great Dam of Marib',
  'Chand Baori Stepwell',
  'Dujiangyan',
  'Porumamilla Tank',
];

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  note,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  note?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-[#3D3328]">{label}</span>
        <span className="font-mono text-[#8B3A1C] font-semibold bg-[#FAF4EA] px-2 py-0.5 rounded border border-[#E8DCB]">
          {value.toFixed(step < 0.1 ? 3 : step < 1 ? 2 : step < 5 ? 1 : 0)} {unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#8B3A1C] cursor-pointer h-1.5 bg-[#E2D8C9] rounded-lg"
      />
      {note && <p className="text-[10px] text-[#7B6E5F] leading-tight italic">{note}</p>}
    </div>
  );
}

export const DynamicDamSimulator: React.FC = () => {
  const [searchText, setSearchText] = useState('Kallanai Dam');
  const [structure, setStructure] = useState<SimulationStructure>(DEFAULT_SIMULATION_STRUCTURE);
  const [values, setValues] = useState<SimulationValues>({ ...DEFAULT_SIMULATION_STRUCTURE.defaults });
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [sourceModelLabel, setSourceModelLabel] = useState('JalaSutra Curated Epigraphic Database');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Snapshots State
  const [snapshots, setSnapshots] = useState<StructureSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('jalasutra_dynamic_snapshots');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('jalasutra_dynamic_snapshots', JSON.stringify(snapshots));
    } catch (e) {}
  }, [snapshots]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const updateValue = (key: keyof SimulationValues, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  // Search & Load Pipeline
  const handleLoadStructure = async (queryToLoad = searchText) => {
    const q = queryToLoad.trim();
    if (!q) return;

    // Check local catalog first
    const local = findPredefinedStructure(q);

    // Multi-stage realistic loading experience
    setLoadingStage('Analysing historical structure...');
    await new Promise((r) => setTimeout(r, 200));

    if (local) {
      setLoadingStage('Identifying hydraulic structure & period...');
      await new Promise((r) => setTimeout(r, 250));
      setLoadingStage('Loading engineering parameters & documented dimensions...');
      await new Promise((r) => setTimeout(r, 200));
      setLoadingStage('Generating dynamic cross-section & hydraulic model...');
      await new Promise((r) => setTimeout(r, 200));

      setStructure(local);
      setValues({ ...local.defaults });
      setSourceModelLabel('JalaSutra Curated Epigraphic Database');
      setLoadingStage(null);
      showToast(`Loaded ${local.name}`);
      return;
    }

    // Call backend structure-identify for unknown/uncataloged query
    try {
      setLoadingStage('Consulting AI Epigraphic Historian...');
      const res = await fetch('/api/structure-identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) throw new Error('Backend failed to identify');
      const data = await res.json();
      const parsedStructure: SimulationStructure = data.structure;

      setLoadingStage('Calibrating hydraulic physics model...');
      await new Promise((r) => setTimeout(r, 300));

      setStructure(parsedStructure);
      setValues({ ...parsedStructure.defaults });
      setSourceModelLabel(data.modelUsed || 'Gemini 3.8 Flash Epigraphic Synthesis');
      setLoadingStage(null);
      showToast(`Identified & Loaded: ${parsedStructure.name}`);
    } catch (err) {
      // Fallback heuristic classification
      const fallback = heuristicClassifyStructure(q);
      setStructure(fallback);
      setValues({ ...fallback.defaults });
      setSourceModelLabel('JalaSutra Heuristic Historical Classifier');
      setLoadingStage(null);
      showToast(`Loaded baseline model for: ${fallback.name}`);
    }
  };

  // Dynamic Engineering Calculation Engine
  const calculations = useMemo(() => {
    const gravity = 9.81;
    const waterDensity = 1000;
    const kind = structure.kind;

    // 1. DIVERSION WEIR / ANICUT
    if (kind === 'DIVERSION_WEIR') {
      const uHead = Math.max(0.1, values.upstreamLevel);
      const dHead = Math.max(0.05, values.downstreamLevel);
      const channelWidth = Math.max(20, values.riverWidth || 180);
      const cd = 1.7; // broad-crested weir discharge coefficient

      // Weir discharge Q = Cd * b * H^(3/2)
      const weirDischarge = cd * channelWidth * Math.pow(uHead, 1.5);
      const approachVelocity = Math.sqrt(2 * gravity * uHead);
      const froudeNumber = approachVelocity / Math.sqrt(gravity * dHead);
      const siltScourVelocity = Math.sqrt(2 * gravity * (uHead + (values.height || 2.5)));
      const deltaHead = Math.max(0, uHead + (values.height || 2.5) - dHead);
      const flowSurplusRatio = weirDischarge / Math.max(1, values.discharge);

      const danger = flowSurplusRatio < 0.75;
      const risk = danger
        ? 'Modeled weir overflow capacity is less than entered river flood discharge; high upstream inundation risk.'
        : flowSurplusRatio > 1.3
        ? 'High overflow discharge headroom; efficient non-dam flood dissipation through weir apron.'
        : 'Stable regulated flow across weir crest and irrigation off-takes.';

      return {
        metrics: [
          { label: 'Weir Crest Head ($H_u$)', value: `${uHead.toFixed(2)} m` },
          { label: 'Weir Overflow Capacity ($Q_w$)', value: `${weirDischarge.toFixed(1)} m³/s` },
          { label: 'Approach Flow Velocity', value: `${approachVelocity.toFixed(2)} m/s` },
          { label: 'Froude Number ($Fr$)', value: `${froudeNumber.toFixed(2)} (${froudeNumber > 1 ? 'Supercritical' : 'Subcritical'})` },
          { label: 'Hydraulic Head Difference ($\Delta H$)', value: `${deltaHead.toFixed(2)} m` },
          { label: 'Bed Silt-Scour Velocity', value: `${siltScourVelocity.toFixed(2)} m/s` },
          { label: 'Active River Width Modeled', value: `${channelWidth.toFixed(0)} m` },
        ],
        danger,
        risk,
        primarySummary: `${weirDischarge.toFixed(0)} m³/s overflow capacity`,
        secondarySummary: `${approachVelocity.toFixed(1)} m/s approach flow`,
      };
    }

    // 2. QANAT
    if (kind === 'QANAT') {
      const slope = Math.max(0.0002, values.slope || 0.0012);
      const dia = Math.max(0.6, values.tunnelDiameter || 1.4);
      const depth = Math.max(0.1, Math.min(dia * 0.8, values.upstreamLevel || 0.6));
      const radius = dia / 2;
      const angle = 2 * Math.acos(Math.max(-1, Math.min(1, (radius - depth) / radius)));
      const area = (radius * radius * (angle - Math.sin(angle))) / 2;
      const wettedP = radius * angle;
      const hydRadius = Math.max(0.05, area / Math.max(0.1, wettedP));

      const manningN = 0.024; // excavated rock / clay gallery
      const velocity = (1 / manningN) * Math.pow(hydRadius, 2 / 3) * Math.sqrt(slope);
      const dischargeCumecs = area * velocity;
      const dischargeLps = dischargeCumecs * 1000;
      const dailyYieldM3 = dischargeCumecs * 86400;

      const tunnelLen = values.tunnelLength || 3500;
      const shaftSpacing = Math.max(10, values.shaftSpacing || 35);
      const shaftCount = Math.round(tunnelLen / shaftSpacing);
      const transitHours = tunnelLen / (velocity * 3600);
      const irrigatedHectares = (dailyYieldM3 / 45).toFixed(0); // ~45 m3/ha/day duty

      return {
        metrics: [
          { label: 'Tunnel Hydraulic Slope ($S$)', value: `${(slope * 100).toFixed(3)}% (${(slope * 1000).toFixed(1)} m/km)` },
          { label: 'Continuous Gravity Discharge', value: `${dischargeLps.toFixed(1)} L/s (${dischargeCumecs.toFixed(3)} m³/s)` },
          { label: 'Average Flow Velocity', value: `${velocity.toFixed(2)} m/s` },
          { label: 'Daily Potable & Irrigation Yield', value: `${dailyYieldM3.toFixed(0)} m³/day` },
          { label: 'Gallery Transit Time', value: `${transitHours.toFixed(1)} hours` },
          { label: 'Vertical Ventilation Shafts Required', value: `${shaftCount} shafts` },
          { label: 'Arid Farmland Supportable', value: `~${irrigatedHectares} hectares` },
        ],
        danger: velocity < 0.25 || velocity > 1.8,
        risk: velocity < 0.25
          ? 'Velocity below 0.25 m/s risks tunnel sedimentation and blockage.'
          : velocity > 1.8
          ? 'High velocity risks scouring unlined gallery walls.'
          : 'Ideal laminar gravity flow without hydraulic erosion or excessive silting.',
        primarySummary: `${dischargeLps.toFixed(1)} L/s continuous yield`,
        secondarySummary: `${shaftCount} ventilation shafts`,
      };
    }

    // 3. STEPWELL
    if (kind === 'STEPWELL') {
      const wellDepth = Math.max(8, values.basinDepth || values.height || 30);
      const waterHead = Math.max(1, values.upstreamLevel || 12);
      const side = Math.max(15, values.basinWidth || values.width || 35);
      const tiers = Math.max(5, values.tiers || 13);

      // Volume of stepped pyramid cistern
      const volumeM3 = (1 / 3) * side * side * (waterHead / wellDepth) * wellDepth * 0.65;
      const dailyPercolationYield = (side * 4 * waterHead * 0.18 * 24); // Darcy percolation estimate
      const supplyDays = (volumeM3 / 45).toFixed(0); // 45 m3/day community draw
      const evaporationSavingsPercent = 75; // subterranean thermal isolation

      return {
        metrics: [
          { label: 'Water Column in Sump', value: `${waterHead.toFixed(1)} meters` },
          { label: 'Stored Usable Volume', value: `${volumeM3.toFixed(0)} m³ (${(volumeM3 / 1000).toFixed(2)} ML)` },
          { label: 'Aquifer Infiltration Yield', value: `~${dailyPercolationYield.toFixed(0)} m³/day` },
          { label: 'Tiered Step Access Count', value: `${tiers} distinct tiers (~3,500 steps)` },
          { label: 'Subterranean Evaporation Reduction', value: `~${evaporationSavingsPercent}% saved vs surface tank` },
          { label: 'Estimated Village Drought Reserve', value: `~${supplyDays} days of supply` },
        ],
        danger: waterHead < 2.5,
        risk: waterHead < 2.5
          ? 'Water column critically low; regional groundwater table depression.'
          : 'Subterranean groundwater reservoir securely impounded with minimal evaporation loss.',
        primarySummary: `${volumeM3.toFixed(0)} m³ stored`,
        secondarySummary: `${tiers} tiers of steps`,
      };
    }

    // 4. RESERVOIR / TANK COMPLEX (Dholavira / Sringaverapura)
    if (kind === 'RESERVOIR_TANK') {
      const basinD = Math.max(2, values.basinDepth || values.height || 7.5);
      const basinL = Math.max(20, values.basinLength || values.length || 73);
      const basinW = Math.max(10, values.basinWidth || values.width || 29);
      const waterH = Math.max(0.5, Math.min(basinD, values.upstreamLevel || 6.2));

      const volumeM3 = basinL * basinW * waterH * 0.88; // trapezoidal stepped allowance
      const inflowQ = Math.max(1, values.discharge || 80);
      const retentionHours = (volumeM3 / (inflowQ * 3600)).toFixed(2);
      const settlingEfficiency = Math.min(96, Math.max(65, 88 + (basinL / 10) - inflowQ * 0.1));
      const sluiceDischarge = 0.62 * (0.8 * 0.8) * Math.sqrt(2 * gravity * waterH);
      const populationSupport = ((volumeM3 * 1000) / (50 * 180)).toFixed(0); // 50L/day for 180 dry days

      return {
        metrics: [
          { label: 'Basin Stored Volume', value: `${volumeM3.toFixed(0)} m³ (${(volumeM3 / 1000).toFixed(2)} ML)` },
          { label: 'Current Retention Depth', value: `${waterH.toFixed(2)} m / ${basinD.toFixed(1)} m capacity` },
          { label: 'Sediment Trap Efficiency', value: `~${settlingEfficiency.toFixed(1)}% silt clarified` },
          { label: 'Inflow Retention Duration', value: `${retentionHours} hours` },
          { label: 'Sluice Release Capacity', value: `${sluiceDischarge.toFixed(2)} m³/s` },
          { label: 'Urban Population Supported (6 mo)', value: `~${populationSupport} citizens` },
        ],
        danger: waterH > basinD - 0.4,
        risk: waterH > basinD - 0.4
          ? 'Basin approaching rim level; diversion weir bypass must be opened to prevent urban wall erosion.'
          : 'Cascading reservoir actively settling suspended silt and impounding potable reserve.',
        primarySummary: `${(volumeM3 / 1000).toFixed(1)} ML capacity`,
        secondarySummary: `${settlingEfficiency.toFixed(0)}% silt settled`,
      };
    }

    // 5. MASONRY GRAVITY DAM (Bhojpur / Proserpina)
    if (kind === 'MASONRY_DAM' || kind === 'GRAVITY_DAM') {
      const damH = Math.max(4, values.height || 14);
      const baseW = Math.max(4, values.width || 8);
      const damL = Math.max(10, values.length || 600);
      const waterH = Math.max(0.5, Math.min(damH - 0.4, values.upstreamLevel || 12));

      // Hydrostatic thrust P = 0.5 * rho * g * h^2
      const thrustPerMeterKN = (0.5 * waterDensity * gravity * waterH * waterH) / 1000;
      const totalThrustMN = (thrustPerMeterKN * damL) / 1000;

      // Gravity self-weight (sandstone ~24.5 kN/m3)
      const unitWeight = 24.5;
      const crossSection = (baseW + baseW * 0.35) * 0.5 * damH;
      const totalWeightMN = (crossSection * damL * unitWeight) / 1000;

      // Uplift force
      const upliftMN = (0.5 * waterDensity * gravity * waterH * baseW * damL * 0.6) / 1000000;
      const netWeightMN = Math.max(0.1, totalWeightMN - upliftMN);

      // Sliding safety factor
      const mu = 0.65;
      const factorOfSafetySliding = (mu * netWeightMN) / Math.max(0.1, totalThrustMN);

      // Overturning safety factor
      const resistingMoment = netWeightMN * (baseW * 0.55);
      const overturningMoment = totalThrustMN * (waterH / 3);
      const factorOfSafetyOverturning = resistingMoment / Math.max(0.1, overturningMoment);

      // Middle-third eccentricity rule
      const e = Math.abs((baseW / 2) - (resistingMoment - overturningMoment) / netWeightMN);
      const middleThirdOk = e <= baseW / 6;

      const danger = factorOfSafetySliding < 1.5 || !middleThirdOk;
      const risk = factorOfSafetySliding < 1.5
        ? 'Sliding safety factor below 1.5x threshold; high shear risk at bedrock contact.'
        : !middleThirdOk
        ? 'Resultant thrust falls outside middle-third of base; tension at upstream heel.'
        : 'High gravity stability with robust shear resistance and compression across foundation.';

      return {
        metrics: [
          { label: 'Hydrostatic Horizontal Thrust', value: `${totalThrustMN.toFixed(2)} MN (${thrustPerMeterKN.toFixed(1)} kN/m)` },
          { label: 'Dam Deadweight Resistance', value: `${totalWeightMN.toFixed(2)} MN` },
          { label: 'Foundation Uplift Force', value: `${upliftMN.toFixed(2)} MN` },
          { label: 'Sliding Factor of Safety', value: `${factorOfSafetySliding.toFixed(2)}x (Min: 1.5x)` },
          { label: 'Overturning Factor of Safety', value: `${factorOfSafetyOverturning.toFixed(2)}x (Min: 2.0x)` },
          { label: 'Middle-Third Rule Check', value: middleThirdOk ? '✅ Compliant (No tension at heel)' : '⚠️ Tension at heel' },
        ],
        danger,
        risk,
        primarySummary: `FS = ${factorOfSafetySliding.toFixed(2)}x sliding`,
        secondarySummary: `${totalThrustMN.toFixed(1)} MN thrust`,
      };
    }

    // 6. EMBANKMENT DAM (Sudarshana, Porumamilla, Marib)
    const damH = Math.max(3, values.height || 10);
    const waterH = Math.max(0.5, Math.min(damH - 0.5, values.upstreamLevel || 8.5));
    const damL = Math.max(10, values.length || 450);
    const crestW = Math.max(2, values.width || 5);
    const uSlope = Math.max(1.5, values.slope || 2.5);
    const dSlope = 2.0;
    const baseW = crestW + (uSlope + dSlope) * damH;
    const freeboard = damH - waterH;

    const thrustPerMeterKN = (0.5 * waterDensity * gravity * waterH * waterH) / 1000;
    const totalThrustMN = (thrustPerMeterKN * damL) / 1000;

    const crossSection = ((crestW + baseW) / 2) * damH;
    const unitWeight = 20.0; // composite clay-stone kN/m3
    const totalWeightMN = (crossSection * damL * unitWeight) / 1000;

    const mu = 0.52;
    const factorOfSafetySliding = (mu * totalWeightMN) / Math.max(0.1, totalThrustMN);

    // Storage and flood
    const catchment = Math.max(1, values.catchment || 40);
    const estimatedStorageMCM = ((catchment * 0.1 * 1000000) * waterH * 0.35) / 1000000;
    const ryvesC = 550;
    const peakFloodCumecs = (ryvesC * Math.pow(catchment, 2 / 3)) / 35.315;
    const spillwayW = Math.max(10, values.spillwayWidth || 25);
    const spillwayCapacityCumecs = 1.7 * spillwayW * Math.pow(1.5, 1.5);
    const floodSafetyRatio = spillwayCapacityCumecs / Math.max(1, peakFloodCumecs);
    const isOvertoppingRisk = freeboard < 1.0 || floodSafetyRatio < 0.85;

    return {
      metrics: [
        { label: 'Hydrostatic Force on Embankment', value: `${totalThrustMN.toFixed(2)} MN (${thrustPerMeterKN.toFixed(1)} kN/m)` },
        { label: 'Embankment Deadweight', value: `${totalWeightMN.toFixed(2)} MN` },
        { label: 'Sliding Factor of Safety', value: `${factorOfSafetySliding.toFixed(2)}x` },
        { label: 'Freeboard Remaining', value: `${freeboard.toFixed(2)} m (Min: 1.5m)` },
        { label: 'Estimated Storage Volume', value: `${estimatedStorageMCM.toFixed(2)} Million m³ (MCM)` },
        { label: 'Peak Monsoon Flood (Ryves)', value: `${peakFloodCumecs.toFixed(1)} m³/s` },
        { label: 'Spillway Capacity', value: `${spillwayCapacityCumecs.toFixed(1)} m³/s` },
      ],
      danger: isOvertoppingRisk,
      risk: isOvertoppingRisk
        ? 'Overtopping Risk in catastrophic monsoon flood: Freeboard is critical or spillway capacity is insufficient.'
        : 'Stable earthen embankment with adequate freeboard, clay core containment, and flood relief.',
      primarySummary: `FS = ${factorOfSafetySliding.toFixed(2)}x sliding`,
      secondarySummary: `${estimatedStorageMCM.toFixed(1)} MCM storage`,
    };
  }, [structure, values]);

  // Snapshot Management
  const handleSaveSnapshot = () => {
    const newSnapshot: StructureSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      name: `${structure.name} (${KIND_LABELS[structure.kind]})`,
      structureId: structure.id,
      kind: structure.kind,
      values: { ...values },
      primaryMetric: calculations.primarySummary,
      secondaryMetric: calculations.secondarySummary,
    };
    setSnapshots((prev) => [newSnapshot, ...prev].slice(0, 30));
    showToast(`Saved simulation snapshot for "${structure.name}"`);
  };

  const handleRestoreSnapshot = (s: StructureSnapshot) => {
    const matched = ANCIENT_SIMULATION_STRUCTURES.find((st) => st.id === s.structureId) || structure;
    setStructure(matched);
    setValues({ ...s.values });
    setSearchText(matched.name);
    showToast(`Restored snapshot: ${s.name}`);
  };

  const handleDeleteSnapshot = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSnapshots((prev) => prev.filter((p) => p.id !== id));
    showToast('Snapshot removed');
  };

  // Google Drive Export
  const handleExportReportToDrive = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const fileName = `JalaSutra_${structure.name.replace(/[^a-zA-Z0-9]/g, '_')}_Engineering_Report_${timestamp}.md`;

    let md = `# JalaSutra Ancient Hydrology & Engineering Simulation Report\n\n`;
    md += `**Structure:** ${structure.name}\n`;
    md += `**Alternative / Epigraphic Name:** ${structure.alternativeName}\n`;
    md += `**Typology:** ${structure.typeLabel} (${KIND_LABELS[structure.kind]})\n`;
    md += `**Location:** ${structure.location}\n`;
    md += `**Civilization & Period:** ${structure.civilization} · ${structure.period} (${structure.approximateDate})\n`;
    md += `**Builder / Patron:** ${structure.builder}\n`;
    md += `**Water Source:** ${structure.riverOrWaterBody}\n`;
    md += `**Current Archaeological Status:** ${structure.currentStatus}\n\n`;

    md += `## 1. Documented Historical Records vs. Simulation Assumptions\n\n`;
    md += `### Documented Historical Facts (Archaeology & Epigraphy)\n`;
    Object.entries(structure.documented).forEach(([k, v]) => {
      md += `* **${k.toUpperCase()}:** ${v}\n`;
    });
    md += `\n### Simulation Assumptions & Engineering Modeling Parameters\n`;
    Object.entries(structure.assumptions).forEach(([k, v]) => {
      md += `* **${k}:** ${v}\n`;
    });

    md += `\n## 2. Live Simulation Parameters\n\n`;
    md += `| Parameter | Modeled Value |\n|---|---|\n`;
    Object.entries(values).forEach(([k, v]) => {
      if (typeof v === 'number' && v > 0) {
        md += `| ${k} | ${v} |\n`;
      }
    });

    md += `\n## 3. Dynamic Hydraulic Physics & Structural Assessment\n\n`;
    md += `| Calculation / Indicator | Ancient Design Result |\n|---|---|\n`;
    calculations.metrics.forEach((m) => {
      md += `| ${m.label} | ${m.value} |\n`;
    });

    md += `\n**Hydraulic & Risk Assessment:** ${calculations.risk}\n\n`;
    md += `---\n*Educational analytical estimate generated by JalaSutra Ancient Hydrology Simulator. Stated assumptions and historical records are kept distinct.*\n`;

    return uploadFileToDrive({
      name: fileName,
      content: md,
      mimeType: 'text/markdown',
      description: `Hydraulic simulation report for ${structure.name}`,
      category: 'simulation',
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & Load Section */}
      <section className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#E8E0D2]">
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Compass className="w-4 h-4 text-[#8B3A1C]" />
              <label htmlFor="structure-search-input" className="text-xs uppercase tracking-widest font-semibold text-[#8B3A1C]">
                Search & Load Ancient Hydraulic Structure
              </label>
            </div>
            <div className="flex gap-2">
              <input
                id="structure-search-input"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadStructure()}
                placeholder="Search ancient dam, reservoir, anicut, qanat, stepwell... (e.g. Kallanai Dam, Dholavira, Qanat)"
                className="min-w-0 flex-1 rounded-lg border border-[#D5CABB] bg-white px-3.5 py-2.5 text-sm text-[#2E241A] placeholder-[#8F8172] outline-none focus:border-[#8B3A1C] focus:ring-1 focus:ring-[#8B3A1C] shadow-2xs"
              />
              <button
                type="button"
                onClick={() => handleLoadStructure()}
                disabled={!!loadingStage}
                className="rounded-lg bg-[#8B3A1C] hover:bg-[#732E15] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loadingStage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Load Structure</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[#7A6D5E]">
              Searches the curated epigraphic catalog or uses Gemini to identify uncataloged ancient structures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SaveToDriveButton
              label="Save Report to Google Drive"
              variant="secondary"
              onExport={handleExportReportToDrive}
            />
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="px-3 py-2 text-xs font-medium text-[#4A3D30] bg-[#EFE8DC] hover:bg-[#E4DACB] rounded-lg border border-[#D5CABB] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-[#8B3A1C]" />
              <span>Save Snapshot</span>
            </button>
          </div>
        </div>

        {/* Demo Quick-Pick Chips */}
        <div>
          <span className="text-[11px] uppercase tracking-wider text-[#8A7C6E] font-semibold block mb-2">
            Instant Curated Profiles:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_QUICK_PICKS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setSearchText(name);
                  handleLoadStructure(name);
                }}
                className={`px-2.5 py-1 text-xs rounded-md border transition-all cursor-pointer ${
                  structure.name.toLowerCase().includes(name.toLowerCase().slice(0, 6))
                    ? 'bg-[#8B3A1C] text-white border-[#8B3A1C] shadow-2xs font-medium'
                    : 'bg-[#F2ECE0] text-[#554738] border-[#DED3C2] hover:bg-[#E8DFCFA] hover:border-[#8B3A1C]'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Multi-Step Animation Banner */}
        {loadingStage && (
          <div className="p-3.5 bg-[#FAF3E8] border border-[#E4D1B5] rounded-lg flex items-center gap-3 animate-pulse">
            <Loader2 className="w-4 h-4 text-[#8B3A1C] animate-spin shrink-0" />
            <div className="text-xs text-[#523F2E] font-medium flex items-center gap-2">
              <span className="font-semibold text-[#8B3A1C]">Generating Structure Simulation:</span>
              <span>{loadingStage}</span>
            </div>
          </div>
        )}

        {/* Structure Identification Dashboard */}
        <div className="pt-2 space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-[#8B3A1C]" />
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#231B15] tracking-tight">
                  {structure.name}
                </h2>
              </div>
              <p className="mt-1 text-sm text-[#5C4F41]">
                <span className="font-medium">{structure.alternativeName}</span>
                <span className="mx-2 text-[#A89C8E]">·</span>
                <span className="text-[#8B3A1C] font-semibold">{structure.typeLabel}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs min-w-0 xl:min-w-[580px]">
              <div className="rounded-lg border border-[#E0D8CB] bg-[#F5EFE3] p-2.5">
                <span className="block text-[10px] font-bold tracking-widest text-[#8B3A1C] uppercase">
                  STRUCTURE TYPE
                </span>
                <span className="mt-1 block font-semibold text-[#2F261E]">{KIND_LABELS[structure.kind]}</span>
              </div>
              <div className="rounded-lg border border-[#E0D8CB] bg-[#F5EFE3] p-2.5">
                <span className="block text-[10px] font-bold tracking-widest text-[#8B3A1C] uppercase">
                  PERIOD / ERA
                </span>
                <span className="mt-1 block font-medium text-[#2F261E] truncate" title={structure.period}>
                  {structure.approximateDate || structure.period}
                </span>
              </div>
              <div className="rounded-lg border border-[#E0D8CB] bg-[#F5EFE3] p-2.5">
                <span className="block text-[10px] font-bold tracking-widest text-[#8B3A1C] uppercase">
                  CONSTRUCTION MATERIAL
                </span>
                <span className="mt-1 block font-medium text-[#2F261E] truncate" title={structure.material}>
                  {structure.material.split(',')[0]}
                </span>
              </div>
              <div className="rounded-lg border border-[#E0D8CB] bg-[#F5EFE3] p-2.5">
                <span className="block text-[10px] font-bold tracking-widest text-[#8B3A1C] uppercase">
                  RIVER / WATERWAY
                </span>
                <span className="mt-1 block font-medium text-[#2F261E] truncate" title={structure.riverOrWaterBody}>
                  {structure.riverOrWaterBody.split('/')[0]}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#524436] bg-[#F7F2E7] p-3 rounded-lg border border-[#E5DAC9]">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#8B3A1C] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#362A1F]">Location:</strong> {structure.location}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Landmark className="w-3.5 h-3.5 text-[#8B3A1C] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#362A1F]">Builder / Patron:</strong> {structure.builder}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8B3A1C] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#362A1F]">Status:</strong> {structure.currentStatus}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dynamic Engineering Schematic Section */}
      <section className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E0D2]">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#231B15] flex items-center gap-2">
              <span>Structure-Specific Cross-Section</span>
              <span className="text-xs font-sans font-semibold uppercase px-2 py-0.5 rounded bg-[#8B3A1C]/10 text-[#8B3A1C]">
                {KIND_LABELS[structure.kind]}
              </span>
            </h3>
            <p className="text-xs text-[#706354]">
              Parametric SVG cross-section adapting live to historical profile, water heads, and geometry.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#706354]">
            <span className="font-mono text-[11px] bg-[#EDE5D6] px-2 py-1 rounded border border-[#DDD3C2]">
              {sourceModelLabel}
            </span>
            <button
              type="button"
              onClick={() => {
                setValues({ ...structure.defaults });
                showToast('Reset to structure defaults');
              }}
              className="px-2.5 py-1 rounded bg-[#EDE5D6] hover:bg-[#E2D8C6] border border-[#DDD3C2] text-[#42362A] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Dynamic Parameterized SVG Canvas */}
        <div className="rounded-lg border border-[#DCD0BE] bg-[#F2EDE2] p-3 overflow-x-auto shadow-inner">
          <StructureSchematic structure={structure} values={values} />
        </div>
      </section>

      {/* Two Column Grid: Controls & Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Structure-Specific Controls */}
        <section className="lg:col-span-7 bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E8E0D2] pb-3">
            <h3 className="font-serif font-bold text-base text-[#231B15] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#8B3A1C]" />
              <span>Structure-Specific Interactive Controls</span>
            </h3>
            <span className="text-xs text-[#8B3A1C] font-semibold bg-[#F5ECE0] px-2 py-0.5 rounded border border-[#E2D4C0]">
              Live Physics Recalculation
            </span>
          </div>

          <div className="space-y-4">
            {/* DIVERSION WEIR CONTROLS */}
            {structure.kind === 'DIVERSION_WEIR' && (
              <>
                <NumberSlider
                  label="Upstream River Water Level / Head ($H_u$)"
                  value={values.upstreamLevel}
                  min={0.5}
                  max={6.0}
                  step={0.1}
                  unit="m"
                  onChange={(v) => updateValue('upstreamLevel', v)}
                  note="Water depth overflowing the weir crest during flow season."
                />
                <NumberSlider
                  label="Weir Crest Height from Riverbed ($H_w$)"
                  value={values.height}
                  min={1.0}
                  max={6.0}
                  step={0.1}
                  unit="m"
                  onChange={(v) => updateValue('height', v)}
                  note={structure.assumptions.weirHead || 'Effective masonry weir height above alluvial bed.'}
                />
                <NumberSlider
                  label="Active River Channel Width ($b$)"
                  value={values.riverWidth}
                  min={40}
                  max={450}
                  step={10}
                  unit="m"
                  onChange={(v) => updateValue('riverWidth', v)}
                  note="Width of active watercourse spanned by the diversion weir."
                />
                <NumberSlider
                  label="River Flood Discharge ($Q_{\text{river}}$)"
                  value={values.discharge}
                  min={100}
                  max={3500}
                  step={50}
                  unit="m³/s"
                  onChange={(v) => updateValue('discharge', v)}
                  note="Cauvery / river flood flow approaching the anicut."
                />
                <NumberSlider
                  label="Downstream Tailwater Level ($H_d$)"
                  value={values.downstreamLevel}
                  min={0.1}
                  max={4.0}
                  step={0.1}
                  unit="m"
                  onChange={(v) => updateValue('downstreamLevel', v)}
                  note="Tailwater height controlling submerged flow and hydraulic jump."
                />
              </>
            )}

            {/* QANAT CONTROLS */}
            {structure.kind === 'QANAT' && (
              <>
                <NumberSlider
                  label="Gallery Hydraulic Gradient / Slope ($S$)"
                  value={values.slope}
                  min={0.0002}
                  max={0.005}
                  step={0.0001}
                  onChange={(v) => updateValue('slope', v)}
                  note="Slope of gravity tunnel (typical ancient range: 1–2m drop per km = 0.001–0.002)."
                />
                <NumberSlider
                  label="Water Depth in Gallery"
                  value={values.upstreamLevel}
                  min={0.2}
                  max={1.2}
                  step={0.05}
                  unit="m"
                  onChange={(v) => updateValue('upstreamLevel', v)}
                  note="Steady-state gravity water depth inside the subterranean tunnel."
                />
                <NumberSlider
                  label="Tunnel Gallery Diameter"
                  value={values.tunnelDiameter}
                  min={0.8}
                  max={2.5}
                  step={0.1}
                  unit="m"
                  onChange={(v) => updateValue('tunnelDiameter', v)}
                  note="Hand-excavated tunnel width and height."
                />
                <NumberSlider
                  label="Total Conveyance Gallery Length"
                  value={values.tunnelLength}
                  min={500}
                  max={35000}
                  step={500}
                  unit="m"
                  onChange={(v) => updateValue('tunnelLength', v)}
                  note="Distance from mother well (aquifer) to surface daylight point (*mazhar*)."
                />
                <NumberSlider
                  label="Vertical Ventilation Shaft Spacing"
                  value={values.shaftSpacing}
                  min={15}
                  max={60}
                  step={5}
                  unit="m"
                  onChange={(v) => updateValue('shaftSpacing', v)}
                  note="Distance between vertical excavation and ventilation access shafts."
                />
              </>
            )}

            {/* STEPWELL CONTROLS */}
            {structure.kind === 'STEPWELL' && (
              <>
                <NumberSlider
                  label="Water Column Depth in Sump"
                  value={values.upstreamLevel}
                  min={1.0}
                  max={28.0}
                  step={0.5}
                  unit="m"
                  onChange={(v) => updateValue('upstreamLevel', v)}
                  note="Height of groundwater column impounded in bottom sump."
                />
                <NumberSlider
                  label="Overall Stepwell Excavation Depth"
                  value={values.basinDepth || values.height}
                  min={10}
                  max={35}
                  step={1}
                  unit="m"
                  onChange={(v) => {
                    updateValue('basinDepth', v);
                    updateValue('height', v);
                  }}
                  note="Total vertical depth from surface ground level to deepest cistern floor."
                />
                <NumberSlider
                  label="Surface Ground Width"
                  value={values.basinWidth || values.width}
                  min={15}
                  max={50}
                  step={1}
                  unit="m"
                  onChange={(v) => {
                    updateValue('basinWidth', v);
                    updateValue('width', v);
                  }}
                  note="Outer square dimensions of stepwell at ground level."
                />
                <NumberSlider
                  label="Number of Stepped Architectural Tiers"
                  value={values.tiers || 13}
                  min={5}
                  max={13}
                  step={1}
                  onChange={(v) => updateValue('tiers', v)}
                  note="Documented tiered stages of geometric steps."
                />
              </>
            )}

            {/* RESERVOIR / TANK CONTROLS */}
            {structure.kind === 'RESERVOIR_TANK' && (
              <>
                <NumberSlider
                  label="Stored Water Depth in Basin"
                  value={values.upstreamLevel}
                  min={0.5}
                  max={12.0}
                  step={0.2}
                  unit="m"
                  onChange={(v) => updateValue('upstreamLevel', v)}
                  note="Current impounded depth in stepped retaining basin."
                />
                <NumberSlider
                  label="Basin Excavation Depth"
                  value={values.basinDepth || values.height}
                  min={2.0}
                  max={15.0}
                  step={0.5}
                  unit="m"
                  onChange={(v) => {
                    updateValue('basinDepth', v);
                    updateValue('height', v);
                  }}
                  note="Total excavated depth of rock-cut or stone retaining walls."
                />
                <NumberSlider
                  label="Basin Length"
                  value={values.basinLength || values.length}
                  min={30}
                  max={250}
                  step={5}
                  unit="m"
                  onChange={(v) => {
                    updateValue('basinLength', v);
                    updateValue('length', v);
                  }}
                  note="Length of primary reservoir basin."
                />
                <NumberSlider
                  label="Basin Width"
                  value={values.basinWidth || values.width}
                  min={15}
                  max={90}
                  step={2}
                  unit="m"
                  onChange={(v) => {
                    updateValue('basinWidth', v);
                    updateValue('width', v);
                  }}
                  note="Width of primary reservoir basin."
                />
                <NumberSlider
                  label="Storm Runoff Inflow Rate"
                  value={values.discharge}
                  min={10}
                  max={200}
                  step={5}
                  unit="m³/s"
                  onChange={(v) => updateValue('discharge', v)}
                  note="Peak storm inflow through inlet desilting flume."
                />
              </>
            )}

            {/* MASONRY GRAVITY DAM CONTROLS */}
            {(structure.kind === 'MASONRY_DAM' || structure.kind === 'GRAVITY_DAM') && (
              <>
                <NumberSlider
                  label="Reservoir Water Level ($h$)"
                  value={values.upstreamLevel}
                  min={1.0}
                  max={28.0}
                  step={0.5}
                  unit="m"
                  onChange={(v) => updateValue('upstreamLevel', v)}
                  note="Head of impounded reservoir against masonry gravity face."
                />
                <NumberSlider
                  label="Gravity Dam Wall Height ($H$)"
                  value={values.height}
                  min={5.0}
                  max={30.0}
                  step={0.5}
                  unit="m"
                  onChange={(v) => updateValue('height', v)}
                  note="Total structural height from bedrock shear key to crest."
                />
                <NumberSlider
                  label="Base Width / Thickness ($B$)"
                  value={values.width}
                  min={3.0}
                  max={30.0}
                  step={0.5}
                  unit="m"
                  onChange={(v) => updateValue('width', v)}
                  note="Base masonry footprint resisting overturning and sliding."
                />
                <NumberSlider
                  label="Catchment Area"
                  value={values.catchment}
                  min={10}
                  max={300}
                  step={5}
                  unit="km²"
                  onChange={(v) => updateValue('catchment', v)}
                  note="Upstream river watershed feeding reservoir."
                />
                <NumberSlider
                  label="Spillway Overflow Width"
                  value={values.spillwayWidth || 30}
                  min={10}
                  max={80}
                  step={5}
                  unit="m"
                  onChange={(v) => updateValue('spillwayWidth', v)}
                  note="Width of surplus crest weir."
                />
              </>
            )}

            {/* EMBANKMENT DAM CONTROLS */}
            {structure.kind === 'EMBANKMENT_DAM' && (
              <>
                <NumberSlider
                  label="Reservoir Water Level ($h$)"
                  value={values.upstreamLevel}
                  min={1.0}
                  max={20.0}
                  step={0.2}
                  unit="m"
                  onChange={(v) => updateValue('upstreamLevel', v)}
                  note="Current stored water height impounded by earthen bund."
                />
                <NumberSlider
                  label="Embankment Crest Height ($H$)"
                  value={values.height}
                  min={4.0}
                  max={22.0}
                  step={0.5}
                  unit="m"
                  onChange={(v) => updateValue('height', v)}
                  note="Total height of earthen bund above foundation bedrock."
                />
                <NumberSlider
                  label="Crest Width"
                  value={values.width}
                  min={2.0}
                  max={12.0}
                  step={0.5}
                  unit="m"
                  onChange={(v) => updateValue('width', v)}
                  note="Width of top roadway / crest bund."
                />
                <NumberSlider
                  label="Upstream Slope (1:m)"
                  value={values.slope}
                  min={1.5}
                  max={3.5}
                  step={0.1}
                  onChange={(v) => updateValue('slope', v)}
                  note="Upstream embankment slope gradient (1:2.5 is typical historical ratio)."
                />
                <NumberSlider
                  label="Catchment Area"
                  value={values.catchment}
                  min={5}
                  max={200}
                  step={5}
                  unit="km²"
                  onChange={(v) => updateValue('catchment', v)}
                  note="Mountain gorge catchment area."
                />
                <NumberSlider
                  label="Surplus Spillway Width"
                  value={values.spillwayWidth || 25}
                  min={10}
                  max={60}
                  step={2}
                  unit="m"
                  onChange={(v) => updateValue('spillwayWidth', v)}
                  note="Rock-cut side waste weir capacity."
                />
              </>
            )}
          </div>

          {/* Historical Facts vs Simulation Assumptions Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#E8E0D2]">
            <div className="rounded-lg border border-[#DDD3C1] bg-[#F7F2E7] p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#8B3A1C] font-semibold text-[11px] uppercase tracking-wider">
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Documented Historical Data</span>
              </div>
              <div className="space-y-1 text-[#4F4134] text-[11px]">
                {Object.entries(structure.documented).map(([k, v]) => (
                  <div key={k} className="leading-snug">
                    <strong className="capitalize text-[#362A1F]">{k}:</strong> {v}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#DDD3C1] bg-[#F7F2E7] p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#4D4236] font-semibold text-[11px] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-[#8B3A1C]" />
                <span>Simulation Assumptions</span>
              </div>
              <div className="space-y-1 text-[#54483C] text-[11px]">
                {Object.entries(structure.assumptions).map(([k, v]) => (
                  <div key={k} className="leading-snug">
                    <strong className="capitalize text-[#362A1F]">{k}:</strong> {v}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Dynamic Live Hydraulic Physics & Calculations */}
        <section className="lg:col-span-5 bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="border-b border-[#E8E0D2] pb-3">
            <h3 className="font-serif font-bold text-base text-[#231B15] flex items-center justify-between">
              <span>Live Hydraulic Indicators</span>
              <span className="text-xs font-sans text-[#706354] font-normal">
                {KIND_LABELS[structure.kind]} Physics
              </span>
            </h3>
          </div>

          {/* Metric Rows */}
          <div className="space-y-2">
            {calculations.metrics.map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#F5EFE3] border border-[#E5DAC8] text-xs"
              >
                <span className="text-[#5C4F41] font-medium">{m.label}</span>
                <span className="font-mono font-bold text-[#2E241B] text-right">{m.value}</span>
              </div>
            ))}
          </div>

          {/* Safety & Risk Condition Banner */}
          <div
            className={`p-3.5 rounded-lg border text-xs ${
              calculations.danger
                ? 'bg-[#FDF0ED] border-[#ECC0B5] text-[#8F2713]'
                : 'bg-[#EFF6F0] border-[#C3DEC8] text-[#1D5E32]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {calculations.danger ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#C73718] mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0 text-[#2B7D46] mt-0.5" />
              )}
              <div className="space-y-0.5">
                <strong className="font-semibold block">
                  {calculations.danger ? 'Hydraulic Alert / Vulnerability Trigger' : 'Stable Modeled Hydraulic Range'}
                </strong>
                <p className="leading-relaxed opacity-90">{calculations.risk}</p>
              </div>
            </div>
          </div>

          {/* Simulation Snapshots Card */}
          <div className="pt-2 border-t border-[#E8E0D2] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#45372B] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#8B3A1C]" />
                <span>Saved Snapshots ({snapshots.length})</span>
              </span>
              {snapshots.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSnapshots([]);
                    showToast('Cleared all snapshots');
                  }}
                  className="text-[10px] text-[#8F7F70] hover:text-red-700 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {snapshots.length === 0 ? (
              <p className="text-[11px] text-[#8F8071] italic">
                Click &quot;Save Snapshot&quot; above to capture parameter comparisons.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {snapshots.slice(0, 5).map((snap) => (
                  <div
                    key={snap.id}
                    onClick={() => handleRestoreSnapshot(snap)}
                    className="p-2 rounded border border-[#DFD5C2] bg-[#F7F2E8] hover:bg-[#EFE7D8] cursor-pointer transition-colors flex items-center justify-between text-xs text-[#45372B]"
                  >
                    <div>
                      <span className="font-medium block truncate max-w-[200px]">{snap.name}</span>
                      <span className="text-[10px] text-[#7A6C5D] font-mono">{snap.primaryMetric}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                      className="p-1 text-[#9E8E7E] hover:text-red-700 transition-colors"
                      title="Delete snapshot"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Educational Disclaimer */}
          <div className="p-3 bg-[#F5ECE0] border border-[#E4D5BF] rounded-lg flex items-start gap-2 text-[11px] text-[#695847] leading-relaxed">
            <Info className="w-3.5 h-3.5 text-[#8B3A1C] shrink-0 mt-0.5" />
            <span>
              <strong>Educational Disclaimer:</strong> Simulation results are analytical estimates based on historical
              records and stated assumptions. They are intended for educational and archaeological research, not for
              real-world dam engineering certification.
            </span>
          </div>
        </section>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#241C15] text-[#FAF7F2] px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium border border-[#4D3C2E] flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
