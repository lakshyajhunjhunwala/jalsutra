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
  ArrowRight,
  ShieldCheck,
  Calendar,
  MapPin,
  Loader2,
  LineChart,
  Calculator,
  BookOpen,
  FileText,
  TrendingUp,
  AlertOctagon,
  Layers,
  ChevronDown,
  ChevronRight,
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
import { getApiUrl } from '../services/apiConfig.ts';
import {
  SIMULATION_CATEGORIES,
  SimulationCategory,
  HydraulicInputs,
  EngineeringWarning,
  WarningSeverity,
  CalculationStep,
} from '../services/hydraulics/types.ts';
import { calculateHydraulics } from '../services/hydraulics/engine.ts';
import {
  getAvailableSensitivityParameters,
  runSensitivityAnalysis,
} from '../services/hydraulics/sensitivityEngine.ts';

export interface StructureSnapshot {
  id: string;
  timestamp: string;
  name: string;
  structureId?: string;
  category: SimulationCategory;
  inputs: HydraulicInputs;
  values: SimulationValues;
  primaryMetric: string;
  secondaryMetric: string;
}

const KIND_TO_CATEGORY_MAP: Record<StructureKind, SimulationCategory> = {
  DIVERSION_WEIR: 'DIVERSION_WEIRS',
  EMBANKMENT_DAM: 'DAMS_EMBANKMENTS',
  MASONRY_DAM: 'DAMS_EMBANKMENTS',
  GRAVITY_DAM: 'DAMS_EMBANKMENTS',
  RESERVOIR_TANK: 'RESERVOIRS_TANKS',
  QANAT: 'CHANNELS_CANALS',
  STEPWELL: 'RESERVOIRS_TANKS',
  CANAL: 'CHANNELS_CANALS',
  OTHER_HYDRAULIC_STRUCTURE: 'DAMS_EMBANKMENTS',
};

const CATEGORY_DEFAULT_INPUTS: Record<SimulationCategory, HydraulicInputs> = {
  CHANNELS_CANALS: {
    width: 4.5,
    height: 3.0,
    upstreamWaterLevel: 1.8,
    sideSlope: 1.5,
    bedSlope: 0.0008,
    manningN: 0.022,
    discharge: 8.0,
    length: 2500,
  },
  IRRIGATION_SYSTEMS: {
    commandAreaHa: 12000,
    waterDutyHaPerCumec: 1400,
    discharge: 8.5,
    length: 18000,
    upstreamWaterLevel: 1.6,
    width: 3.5,
    height: 2.4,
  },
  DAMS_EMBANKMENTS: {
    height: 12.0,
    upstreamWaterLevel: 9.5,
    width: 6.0,
    length: 450,
    sideSlope: 2.5,
    materialDensity: 20.0,
    foundationFrictionCoeff: 0.55,
    catchmentAreaKm2: 45,
    spillwayWidth: 30,
    soilPermeability: 0.00002,
  },
  DIVERSION_WEIRS: {
    height: 2.5,
    upstreamWaterLevel: 2.0,
    downstreamWaterLevel: 0.6,
    width: 180,
    discharge: 750,
    gateOpening: 0.8,
    gateWidth: 4.0,
  },
  DRAINAGE_SYSTEMS: {
    pipeDiameter: 1.2,
    width: 1.2,
    height: 1.5,
    upstreamWaterLevel: 0.75,
    bedSlope: 0.0025,
    manningN: 0.016,
    discharge: 1.5,
    length: 600,
  },
  FLOOD_MANAGEMENT: {
    peakInflow: 120,
    floodDurationHours: 12,
    baseflow: 8,
    detentionVolumeM3: 650000,
    spillwayWidth: 25,
    height: 7.0,
    upstreamWaterLevel: 5.0,
  },
  SLUICES_OUTLETS: {
    height: 5.0,
    upstreamWaterLevel: 4.2,
    downstreamWaterLevel: 0.7,
    gateOpening: 0.6,
    gateWidth: 1.5,
    discharge: 15.0,
  },
  RESERVOIRS_TANKS: {
    height: 7.5,
    upstreamWaterLevel: 6.0,
    width: 29,
    length: 73,
    discharge: 40,
    dailyDomesticDemandM3: 150,
    panEvaporationMmDay: 5.0,
  },
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
        <span className="font-mono text-[#8B3A1C] font-semibold bg-[#FAF4EA] px-2 py-0.5 rounded border border-[#E8DCCB]">
          {value.toFixed(step < 0.001 ? 4 : step < 0.1 ? 3 : step < 1 ? 2 : step < 5 ? 1 : 0)} {unit || ''}
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

function syncInputsToValues(inputs: HydraulicInputs, fallback: SimulationValues): SimulationValues {
  return {
    ...fallback,
    height: inputs.height ?? fallback.height,
    length: inputs.length ?? fallback.length,
    width: inputs.width ?? fallback.width,
    upstreamLevel: inputs.upstreamWaterLevel ?? fallback.upstreamLevel,
    downstreamLevel: inputs.downstreamWaterLevel ?? fallback.downstreamLevel,
    riverWidth: inputs.width ?? fallback.riverWidth,
    discharge: inputs.discharge ?? inputs.peakInflow ?? fallback.discharge,
    catchment: inputs.catchmentAreaKm2 ?? fallback.catchment,
    slope: inputs.bedSlope ?? inputs.sideSlope ?? fallback.slope,
    tunnelLength: inputs.length ?? fallback.tunnelLength,
    tunnelDiameter: inputs.tunnelDiameter ?? inputs.pipeDiameter ?? fallback.tunnelDiameter,
    shaftSpacing: inputs.shaftSpacing ?? fallback.shaftSpacing,
    spillwayWidth: inputs.spillwayWidth ?? fallback.spillwayWidth,
    basinDepth: inputs.height ?? fallback.basinDepth,
    basinLength: inputs.length ?? fallback.basinLength,
    basinWidth: inputs.width ?? fallback.basinWidth,
  };
}

export const DynamicDamSimulator: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<SimulationCategory>('DIVERSION_WEIRS');
  const [searchText, setSearchText] = useState('Kallanai Dam');
  const [structure, setStructure] = useState<SimulationStructure>(DEFAULT_SIMULATION_STRUCTURE);
  const [inputs, setInputs] = useState<HydraulicInputs>({ ...CATEGORY_DEFAULT_INPUTS.DIVERSION_WEIRS });
  const [values, setValues] = useState<SimulationValues>({ ...DEFAULT_SIMULATION_STRUCTURE.defaults });
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [sourceModelLabel, setSourceModelLabel] = useState('JalaSutra Curated Epigraphic Database');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SIMULATION' | 'SENSITIVITY' | 'EQUATIONS' | 'DOSSIER'>('SIMULATION');
  const [expandedEquationIndex, setExpandedEquationIndex] = useState<number | null>(0);

  // Sensitivity Analysis Interactive State
  const sensitivityConfigs = useMemo(() => getAvailableSensitivityParameters(activeCategory), [activeCategory]);
  const [selectedSensitivityParamKey, setSelectedSensitivityParamKey] = useState<keyof HydraulicInputs>(
    sensitivityConfigs[0]?.key || 'discharge'
  );
  const [modifiedSensitivityVal, setModifiedSensitivityVal] = useState<number>(() => {
    return Number(inputs[sensitivityConfigs[0]?.key || 'discharge'] ?? 10);
  });

  // Keep sensitivity param in sync when category changes
  useEffect(() => {
    const cfgs = getAvailableSensitivityParameters(activeCategory);
    const firstKey = cfgs[0]?.key || 'discharge';
    setSelectedSensitivityParamKey(firstKey);
    const initialVal = Number(inputs[firstKey] ?? (cfgs[0]?.min + cfgs[0]?.max) / 2);
    setModifiedSensitivityVal(initialVal);
  }, [activeCategory]);

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

  const updateInput = (key: keyof HydraulicInputs, val: number) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: val };
      setValues((prevVals) => syncInputsToValues(next, prevVals));
      return next;
    });
  };

  // Switch category and update defaults
  const handleCategoryChange = (newCat: SimulationCategory) => {
    setActiveCategory(newCat);
    const catDefaults = { ...CATEGORY_DEFAULT_INPUTS[newCat] };
    setInputs(catDefaults);
    setValues((prev) => syncInputsToValues(catDefaults, prev));
    showToast(`Switched to: ${SIMULATION_CATEGORIES[newCat].name}`);
  };

  // Search & Load Pipeline
  const handleLoadStructure = async (queryToLoad = searchText) => {
    const q = queryToLoad.trim();
    if (!q) return;

    setLoadingStage('Analysing historical structure...');
    await new Promise((r) => setTimeout(r, 150));

    const local = findPredefinedStructure(q);

    if (local) {
      setLoadingStage('Identifying hydraulic structure & period...');
      await new Promise((r) => setTimeout(r, 150));
      setLoadingStage('Calibrating engineering parameters...');
      await new Promise((r) => setTimeout(r, 150));

      const detectedCat = local.category ?? KIND_TO_CATEGORY_MAP[local.kind] ?? 'DAMS_EMBANKMENTS';
      const baseDefaults = { ...CATEGORY_DEFAULT_INPUTS[detectedCat] };

      const loadedInputs: HydraulicInputs = {
        ...baseDefaults,
        height: local.defaults.height || baseDefaults.height,
        length: local.defaults.length || baseDefaults.length,
        width: local.defaults.basinWidth || local.defaults.riverWidth || local.defaults.width || baseDefaults.width,
        upstreamWaterLevel: local.defaults.upstreamLevel || baseDefaults.upstreamWaterLevel,
        downstreamWaterLevel: local.defaults.downstreamLevel || baseDefaults.downstreamWaterLevel,
        discharge: local.defaults.discharge || baseDefaults.discharge,
        catchmentAreaKm2: local.defaults.catchment || baseDefaults.catchmentAreaKm2,
        bedSlope: local.defaults.slope && local.defaults.slope < 0.1 ? local.defaults.slope : baseDefaults.bedSlope,
        sideSlope: local.defaults.slope && local.defaults.slope >= 0.1 ? local.defaults.slope : baseDefaults.sideSlope,
        spillwayWidth: local.defaults.spillwayWidth || baseDefaults.spillwayWidth,
        tunnelDiameter: local.defaults.tunnelDiameter || baseDefaults.tunnelDiameter,
        shaftSpacing: local.defaults.shaftSpacing || baseDefaults.shaftSpacing,
      };

      setStructure(local);
      setActiveCategory(detectedCat);
      setInputs(loadedInputs);
      setValues({ ...local.defaults });
      setSourceModelLabel('JalaSutra Curated Epigraphic Database');
      setLoadingStage(null);
      showToast(`Loaded ${local.name} (${SIMULATION_CATEGORIES[detectedCat].shortLabel})`);
      return;
    }

    try {
      setLoadingStage('Consulting AI Epigraphic Historian...');
      const res = await fetch(getApiUrl('/api/structure-identify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) throw new Error('Backend failed to identify');
      const data = await res.json();
      const parsedStructure: SimulationStructure = data.structure;
      const detectedCat = parsedStructure.category ?? KIND_TO_CATEGORY_MAP[parsedStructure.kind] ?? 'DAMS_EMBANKMENTS';
      const baseDefaults = { ...CATEGORY_DEFAULT_INPUTS[detectedCat] };

      const loadedInputs: HydraulicInputs = {
        ...baseDefaults,
        height: parsedStructure.defaults.height || baseDefaults.height,
        length: parsedStructure.defaults.length || baseDefaults.length,
        width: parsedStructure.defaults.width || baseDefaults.width,
        upstreamWaterLevel: parsedStructure.defaults.upstreamLevel || baseDefaults.upstreamWaterLevel,
        downstreamWaterLevel: parsedStructure.defaults.downstreamLevel || baseDefaults.downstreamWaterLevel,
        discharge: parsedStructure.defaults.discharge || baseDefaults.discharge,
      };

      setStructure(parsedStructure);
      setActiveCategory(detectedCat);
      setInputs(loadedInputs);
      setValues({ ...parsedStructure.defaults });
      setSourceModelLabel(data.modelUsed || 'Gemini 3.8 Flash Epigraphic Synthesis');
      setLoadingStage(null);
      showToast(`Identified & Loaded: ${parsedStructure.name}`);
    } catch (err) {
      const fallback = heuristicClassifyStructure(q);
      const detectedCat = fallback.category ?? KIND_TO_CATEGORY_MAP[fallback.kind] ?? 'DAMS_EMBANKMENTS';
      setStructure(fallback);
      setActiveCategory(detectedCat);
      setInputs({ ...CATEGORY_DEFAULT_INPUTS[detectedCat] });
      setValues({ ...fallback.defaults });
      setSourceModelLabel('JalaSutra Heuristic Historical Classifier');
      setLoadingStage(null);
      showToast(`Loaded baseline model for: ${fallback.name}`);
    }
  };

  // Central Dynamic Engineering Calculation
  const calculations = useMemo(() => {
    return calculateHydraulics(activeCategory, inputs);
  }, [activeCategory, inputs]);

  // Sensitivity Analysis Computation
  const sensitivityResult = useMemo(() => {
    return runSensitivityAnalysis({
      category: activeCategory,
      baselineInputs: inputs,
      parameterKey: selectedSensitivityParamKey,
      modifiedValue: modifiedSensitivityVal,
    });
  }, [activeCategory, inputs, selectedSensitivityParamKey, modifiedSensitivityVal]);

  // Snapshot Management
  const handleSaveSnapshot = () => {
    const newSnapshot: StructureSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      name: `${structure.name} [${SIMULATION_CATEGORIES[activeCategory].shortLabel}]`,
      structureId: structure.id,
      category: activeCategory,
      inputs: { ...inputs },
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
    setActiveCategory(s.category);
    setInputs({ ...s.inputs });
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
    const fileName = `JalaSutra_${structure.name.replace(/[^a-zA-Z0-9]/g, '_')}_Hydraulic_Report_${timestamp}.md`;

    let md = `# JalaSutra Hydraulic Engineering Simulation Report\n\n`;
    md += `**Structure Name:** ${structure.name}\n`;
    md += `**Alternative / Epigraphic Designation:** ${structure.alternativeName}\n`;
    md += `**Typology Category:** ${SIMULATION_CATEGORIES[activeCategory].name}\n`;
    md += `**Location:** ${structure.location}\n`;
    md += `**Period & Civilization:** ${structure.civilization} · ${structure.period} (${structure.approximateDate})\n`;
    md += `**Builder / Historical Patron:** ${structure.builder}\n`;
    md += `**Waterway:** ${structure.riverOrWaterBody}\n`;
    md += `**Overall Risk Severity Assessment:** ${calculations.overallRiskSeverity}\n\n`;

    md += `## 1. Governing Hydraulic Theory & Principles\n\n`;
    md += `${calculations.governingTheory}\n\n`;

    md += `## 2. Input Simulation Parameters Modeled\n\n`;
    md += `| Parameter | Modeled Value |\n|---|---|\n`;
    Object.entries(inputs).forEach(([k, v]) => {
      if (v !== undefined) {
        md += `| ${k} | ${v} |\n`;
      }
    });

    md += `\n## 3. Dynamic Hydraulic Physics & Performance Outputs\n\n`;
    md += `| Metric Output | Value | Engineering Significance |\n|---|---|---|\n`;
    calculations.metrics.forEach((m) => {
      md += `| ${m.label} (${m.symbol || ''}) | ${m.value} | ${m.tooltip || 'Calculated hydraulic indicator'} |\n`;
    });

    md += `\n## 4. Engineering Warnings & Risk Diagnostics\n\n`;
    if (calculations.warnings.length === 0) {
      md += `*No critical engineering warnings. Structure operates within safe physical limits.*\n`;
    } else {
      calculations.warnings.forEach((w) => {
        md += `### [${w.severity}] ${w.title}\n`;
        md += `* **Trigger Parameter:** ${w.parameterName} = ${w.currentValue} ${w.unit} (Limit: ${w.criterionLimit})\n`;
        md += `* **Physical Mechanism / Concern:** ${w.concernExplanation}\n`;
        md += `* **Affected Outputs:** ${w.affectedOutputs.join(', ')}\n`;
        md += `* **Engineering Remediation:** ${w.suggestedAction}\n\n`;
      });
    }

    md += `## 5. Step-by-Step Mathematical Calculations & Equation Substitutions\n\n`;
    calculations.calculationSteps.forEach((st) => {
      md += `### ${st.name} (${st.symbol})\n`;
      md += `* **Formula:** \`${st.formulaLatex}\`\n`;
      md += `* **Substitution:** \`${st.substitution}\`\n`;
      md += `* **Computed Result:** **${st.resultValue} ${st.unit}**\n`;
      if (st.notes) md += `* **Notes:** ${st.notes}\n`;
      md += `\n`;
    });

    md += `## 6. Stated Assumptions & Sources of Uncertainty\n\n`;
    md += `### Assumptions\n`;
    calculations.assumptions.forEach((a) => {
      md += `* ${a}\n`;
    });
    md += `\n### Uncertainties\n`;
    calculations.uncertainties.forEach((u) => {
      md += `* ${u}\n`;
    });

    md += `\n---\n*Report generated by JalaSutra Ancient Hydraulic Simulator. Stated engineering equations are mathematically substituted from primary physical laws.*\n`;

    return uploadFileToDrive({
      name: fileName,
      content: md,
      mimeType: 'text/markdown',
      description: `Comprehensive hydraulic simulation report for ${structure.name}`,
      category: 'simulation',
    });
  };

  const getSeverityBadge = (sev: WarningSeverity) => {
    switch (sev) {
      case 'GREEN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">STABLE (GREEN)</span>;
      case 'YELLOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF9C4] text-[#F57F17] border border-[#FFF59D]">ADVISORY (YELLOW)</span>;
      case 'ORANGE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFE0B2] text-[#E65100] border border-[#FFCC80]">WARNING (ORANGE)</span>;
      case 'RED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">CRITICAL (RED)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Typology Switcher Ribbon */}
      <section className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#E8E0D2] pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#8B3A1C] block">
              8 Canonical Hydraulic Engineering Models
            </span>
            <h2 className="text-lg font-serif font-bold text-[#231B15]">
              Hydraulic Structure Typology Selector
            </h2>
          </div>
          <span className="text-xs text-[#706354] font-medium">
            Active: <strong className="text-[#8B3A1C]">{SIMULATION_CATEGORIES[activeCategory].name}</strong>
          </span>
        </div>

        {/* 8 Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {(Object.keys(SIMULATION_CATEGORIES) as SimulationCategory[]).map((catKey) => {
            const cat = SIMULATION_CATEGORIES[catKey];
            const isActive = activeCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleCategoryChange(catKey)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-[#8B3A1C] text-white border-[#8B3A1C] shadow-xs'
                    : 'bg-[#F5EFE3] text-[#4A3D30] border-[#E0D5C3] hover:bg-[#EBE2D2] hover:border-[#8B3A1C]'
                }`}
              >
                <div className="text-base mb-1">{cat.icon}</div>
                <div className="font-semibold text-xs leading-tight">{cat.shortLabel}</div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-[#6B5E50] italic pt-1">
          {SIMULATION_CATEGORIES[activeCategory].description}
        </p>
      </section>

      {/* Search & Archaeological Profile Section */}
      <section className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#E8E0D2]">
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Compass className="w-4 h-4 text-[#8B3A1C]" />
              <label htmlFor="structure-search-input" className="text-xs uppercase tracking-widest font-semibold text-[#8B3A1C]">
                Search & Calibrate Ancient Structure
              </label>
            </div>
            <div className="flex gap-2">
              <input
                id="structure-search-input"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadStructure()}
                placeholder="Search ancient dam, reservoir, anicut, canal, stepwell... (e.g. Kallanai Dam, Dholavira, Qanat)"
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
            Instant Historical Profiles:
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
              <span className="font-semibold text-[#8B3A1C]">Calibrating Physics Model:</span>
              <span>{loadingStage}</span>
            </div>
          </div>
        )}

        {/* Structure Header & Metadata */}
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
                  SIMULATION MODEL
                </span>
                <span className="mt-1 block font-semibold text-[#2F261E]">{SIMULATION_CATEGORIES[activeCategory].shortLabel}</span>
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
                  MATERIAL / MATRIX
                </span>
                <span className="mt-1 block font-medium text-[#2F261E] truncate" title={structure.material}>
                  {structure.material.split(',')[0]}
                </span>
              </div>
              <div className="rounded-lg border border-[#E0D8CB] bg-[#F5EFE3] p-2.5">
                <span className="block text-[10px] font-bold tracking-widest text-[#8B3A1C] uppercase">
                  WATERWAY / SOURCE
                </span>
                <span className="mt-1 block font-medium text-[#2F261E] truncate" title={structure.riverOrWaterBody}>
                  {structure.riverOrWaterBody.split('/')[0]}
                </span>
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
              <span>Dynamic Parametric Cross-Section</span>
              <span className="text-xs font-sans font-semibold uppercase px-2 py-0.5 rounded bg-[#8B3A1C]/10 text-[#8B3A1C]">
                {SIMULATION_CATEGORIES[activeCategory].shortLabel}
              </span>
            </h3>
            <p className="text-xs text-[#706354]">
              Live SVG responding to water levels, velocity, overtopping nappes, and structural geometry.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#706354]">
            <span className="font-mono text-[11px] bg-[#EDE5D6] px-2 py-1 rounded border border-[#DDD3C2]">
              {sourceModelLabel}
            </span>
            <button
              type="button"
              onClick={() => {
                const defaults = { ...CATEGORY_DEFAULT_INPUTS[activeCategory] };
                setInputs(defaults);
                setValues((prev) => syncInputsToValues(defaults, prev));
                showToast('Reset to category defaults');
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
          <StructureSchematic
            category={activeCategory}
            structure={structure}
            values={values}
            calculationResult={calculations}
          />
        </div>
      </section>

      {/* Simulator Navigation Tabs */}
      <div className="flex border-b border-[#D8CEBE] gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('SIMULATION')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'SIMULATION'
              ? 'bg-[#FAF7F0] border-t border-x border-[#D8CEBE] text-[#8B3A1C] -mb-px'
              : 'text-[#6B5E50] hover:text-[#2E241A] hover:bg-[#F2ECE0]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Interactive Simulation</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SENSITIVITY')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'SENSITIVITY'
              ? 'bg-[#FAF7F0] border-t border-x border-[#D8CEBE] text-[#8B3A1C] -mb-px'
              : 'text-[#6B5E50] hover:text-[#2E241A] hover:bg-[#F2ECE0]'
          }`}
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>Parameter Sensitivity Analysis</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('EQUATIONS')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'EQUATIONS'
              ? 'bg-[#FAF7F0] border-t border-x border-[#D8CEBE] text-[#8B3A1C] -mb-px'
              : 'text-[#6B5E50] hover:text-[#2E241A] hover:bg-[#F2ECE0]'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Detailed Physics & Equations ({calculations.calculationSteps.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('DOSSIER')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'DOSSIER'
              ? 'bg-[#FAF7F0] border-t border-x border-[#D8CEBE] text-[#8B3A1C] -mb-px'
              : 'text-[#6B5E50] hover:text-[#2E241A] hover:bg-[#F2ECE0]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Archaeological Dossier</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE SIMULATION & CONTROLS */}
      {activeTab === 'SIMULATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Category-Specific Interactive Controls */}
          <section className="lg:col-span-7 bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E0D2] pb-3">
              <h3 className="font-serif font-bold text-base text-[#231B15] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#8B3A1C]" />
                <span>{SIMULATION_CATEGORIES[activeCategory].name} Controls</span>
              </h3>
              <span className="text-xs text-[#8B3A1C] font-semibold bg-[#F5ECE0] px-2 py-0.5 rounded border border-[#E2D4C0]">
                Live Physical Recalculation
              </span>
            </div>

            <div className="space-y-4">
              {/* CHANNELS_CANALS CONTROLS */}
              {activeCategory === 'CHANNELS_CANALS' && (
                <>
                  <NumberSlider
                    label="Canal Bed Bottom Width (b)"
                    value={inputs.width ?? 4.5}
                    min={0.8}
                    max={25.0}
                    step={0.1}
                    unit="m"
                    onChange={(v) => updateInput('width', v)}
                    note="Bed width of excavated channel prism."
                  />
                  <NumberSlider
                    label="Water Flow Depth (y)"
                    value={inputs.upstreamWaterLevel ?? 1.8}
                    min={0.2}
                    max={8.0}
                    step={0.05}
                    unit="m"
                    onChange={(v) => updateInput('upstreamWaterLevel', v)}
                    note="Operating water depth in the channel reach."
                  />
                  <NumberSlider
                    label="Bank Freeboard Height (H)"
                    value={inputs.height ?? 3.0}
                    min={0.8}
                    max={10.0}
                    step={0.1}
                    unit="m"
                    onChange={(v) => updateInput('height', v)}
                    note="Total channel bank elevation from bed."
                  />
                  <NumberSlider
                    label="Side Slope (z in 1:z H:V)"
                    value={inputs.sideSlope ?? 1.5}
                    min={0.0}
                    max={3.0}
                    step={0.1}
                    onChange={(v) => updateInput('sideSlope', v)}
                    note="0 for vertical rock/masonry; 1.5 for cohesive earthen canal."
                  />
                  <NumberSlider
                    label="Longitudinal Bed Slope (S₀)"
                    value={inputs.bedSlope ?? 0.0008}
                    min={0.0001}
                    max={0.005}
                    step={0.0001}
                    onChange={(v) => updateInput('bedSlope', v)}
                    note="Gravity channel fall gradient (m fall per m distance)."
                  />
                  <NumberSlider
                    label="Manning Roughness (n)"
                    value={inputs.manningN ?? 0.022}
                    min={0.012}
                    max={0.055}
                    step={0.001}
                    onChange={(v) => updateInput('manningN', v)}
                    note="0.015 for ashlar masonry; 0.022 for clay canal; 0.035 for rough boulder."
                  />
                  <NumberSlider
                    label="Design Inflow Discharge (Q)"
                    value={inputs.discharge ?? 8.0}
                    min={0.5}
                    max={50.0}
                    step={0.5}
                    unit="m³/s"
                    onChange={(v) => updateInput('discharge', v)}
                    note="Inflow fed into the conveyance channel."
                  />
                </>
              )}

              {/* IRRIGATION_SYSTEMS CONTROLS */}
              {activeCategory === 'IRRIGATION_SYSTEMS' && (
                <>
                  <NumberSlider
                    label="Culturable Command Area (CCA)"
                    value={inputs.commandAreaHa ?? 12000}
                    min={500}
                    max={60000}
                    step={500}
                    unit="ha"
                    onChange={(v) => updateInput('commandAreaHa', v)}
                    note="Total agricultural acreage irrigated by canal network."
                  />
                  <NumberSlider
                    label="Water Duty at Canal Head"
                    value={inputs.waterDutyHaPerCumec ?? 1400}
                    min={600}
                    max={2800}
                    step={50}
                    unit="ha/(m³/s)"
                    onChange={(v) => updateInput('waterDutyHaPerCumec', v)}
                    note="Area of crops matured per unit continuous cumec flow."
                  />
                  <NumberSlider
                    label="Canal Delivery Discharge (Q_supply)"
                    value={inputs.discharge ?? 8.5}
                    min={0.5}
                    max={40.0}
                    step={0.2}
                    unit="m³/s"
                    onChange={(v) => updateInput('discharge', v)}
                    note="Active headworks delivery into main distributary."
                  />
                  <NumberSlider
                    label="Main Distributary Length (L)"
                    value={inputs.length ?? 18000}
                    min={2000}
                    max={60000}
                    step={1000}
                    unit="m"
                    onChange={(v) => updateInput('length', v)}
                    note="Conveyance distance through agrarian distributaries."
                  />
                </>
              )}

              {/* DAMS_EMBANKMENTS CONTROLS */}
              {activeCategory === 'DAMS_EMBANKMENTS' && (
                <>
                  <NumberSlider
                    label="Dam Crest Height (H)"
                    value={inputs.height ?? 12.0}
                    min={4.0}
                    max={30.0}
                    step={0.5}
                    unit="m"
                    onChange={(v) => updateInput('height', v)}
                    note="Structural height from foundation to crest."
                  />
                  <NumberSlider
                    label="Impounded Reservoir Water Depth (h)"
                    value={inputs.upstreamWaterLevel ?? 9.5}
                    min={1.0}
                    max={28.0}
                    step={0.2}
                    unit="m"
                    onChange={(v) => updateInput('upstreamWaterLevel', v)}
                    note="Water column depth exerting hydrostatic thrust."
                  />
                  <NumberSlider
                    label="Crest Width / Roadway"
                    value={inputs.width ?? 6.0}
                    min={2.0}
                    max={25.0}
                    step={0.5}
                    unit="m"
                    onChange={(v) => updateInput('width', v)}
                    note="Top width of embankment / dam wall."
                  />
                  <NumberSlider
                    label="Dam Longitudinal Crest Length (L)"
                    value={inputs.length ?? 450}
                    min={20}
                    max={1200}
                    step={20}
                    unit="m"
                    onChange={(v) => updateInput('length', v)}
                    note="Total crest length across river gorge."
                  />
                  <NumberSlider
                    label="Catchment Area"
                    value={inputs.catchmentAreaKm2 ?? 45}
                    min={5}
                    max={300}
                    step={5}
                    unit="km²"
                    onChange={(v) => updateInput('catchmentAreaKm2', v)}
                    note="Upstream watershed area feeding peak monsoon floods."
                  />
                  <NumberSlider
                    label="Surplus Spillway Width"
                    value={inputs.spillwayWidth ?? 30}
                    min={10}
                    max={120}
                    step={5}
                    unit="m"
                    onChange={(v) => updateInput('spillwayWidth', v)}
                    note="Overflow spillway / waste weir width."
                  />
                </>
              )}

              {/* DIVERSION_WEIRS CONTROLS */}
              {activeCategory === 'DIVERSION_WEIRS' && (
                <>
                  <NumberSlider
                    label="Weir Crest Height above Riverbed (H_w)"
                    value={inputs.height ?? 2.5}
                    min={0.8}
                    max={6.0}
                    step={0.1}
                    unit="m"
                    onChange={(v) => updateInput('height', v)}
                    note="Masonry crest elevation spanning river."
                  />
                  <NumberSlider
                    label="Upstream Water Head over Bed (H_u)"
                    value={inputs.upstreamWaterLevel ?? 2.0}
                    min={0.5}
                    max={6.0}
                    step={0.1}
                    unit="m"
                    onChange={(v) => updateInput('upstreamWaterLevel', v)}
                    note="Total upstream flood depth approaching weir."
                  />
                  <NumberSlider
                    label="Downstream Tailwater Level (H_d)"
                    value={inputs.downstreamWaterLevel ?? 0.6}
                    min={0.1}
                    max={4.5}
                    step={0.1}
                    unit="m"
                    onChange={(v) => updateInput('downstreamWaterLevel', v)}
                    note="Tailwater controlling submergence and hydraulic jump."
                  />
                  <NumberSlider
                    label="Active River / Weir Crest Length (b)"
                    value={inputs.width ?? 180}
                    min={30}
                    max={450}
                    step={10}
                    unit="m"
                    onChange={(v) => updateInput('width', v)}
                    note="Total effective crest length spanning waterway."
                  />
                  <NumberSlider
                    label="Approaching River Flood Flow (Q)"
                    value={inputs.discharge ?? 750}
                    min={100}
                    max={3500}
                    step={50}
                    unit="m³/s"
                    onChange={(v) => updateInput('discharge', v)}
                    note="Approaching river flood peak."
                  />
                  <NumberSlider
                    label="Scouring Sluice Gate Opening (y_g)"
                    value={inputs.gateOpening ?? 0.8}
                    min={0.2}
                    max={2.5}
                    step={0.1}
                    unit="m"
                    onChange={(v) => updateInput('gateOpening', v)}
                    note="Under-sluice gate height flushing riverbed sand."
                  />
                </>
              )}

              {/* DRAINAGE_SYSTEMS CONTROLS */}
              {activeCategory === 'DRAINAGE_SYSTEMS' && (
                <>
                  <NumberSlider
                    label="Drain Conduit Width / Diameter"
                    value={inputs.width ?? 1.2}
                    min={0.4}
                    max={3.0}
                    step={0.05}
                    unit="m"
                    onChange={(v) => {
                      updateInput('width', v);
                      updateInput('pipeDiameter', v);
                    }}
                    note="Cross-sectional width or internal diameter."
                  />
                  <NumberSlider
                    label="Conduit Internal Height"
                    value={inputs.height ?? 1.5}
                    min={0.5}
                    max={3.5}
                    step={0.05}
                    unit="m"
                    onChange={(v) => updateInput('height', v)}
                    note="Internal vertical height of corbelled box or vault."
                  />
                  <NumberSlider
                    label="Flow Water Depth in Sewer"
                    value={inputs.upstreamWaterLevel ?? 0.75}
                    min={0.1}
                    max={3.0}
                    step={0.05}
                    unit="m"
                    onChange={(v) => updateInput('upstreamWaterLevel', v)}
                    note="Depth of storm & wastewater flow inside drain."
                  />
                  <NumberSlider
                    label="Drain Bed Gradient / Slope (S)"
                    value={inputs.bedSlope ?? 0.0025}
                    min={0.0005}
                    max={0.015}
                    step={0.0002}
                    onChange={(v) => updateInput('bedSlope', v)}
                    note="Longitudinal sewer drop gradient."
                  />
                  <NumberSlider
                    label="Peak Storm Runoff Drainage (Q)"
                    value={inputs.discharge ?? 1.5}
                    min={0.2}
                    max={10.0}
                    step={0.1}
                    unit="m³/s"
                    onChange={(v) => updateInput('discharge', v)}
                    note="Urban runoff collected from paved courtyards."
                  />
                </>
              )}

              {/* FLOOD_MANAGEMENT CONTROLS */}
              {activeCategory === 'FLOOD_MANAGEMENT' && (
                <>
                  <NumberSlider
                    label="Peak Flood Wave Inflow (Q_peak)"
                    value={inputs.peakInflow ?? 120}
                    min={20}
                    max={500}
                    step={10}
                    unit="m³/s"
                    onChange={(v) => updateInput('peakInflow', v)}
                    note="Peak storm hydrograph discharge entering detention facility."
                  />
                  <NumberSlider
                    label="Flood Wave Duration"
                    value={inputs.floodDurationHours ?? 12}
                    min={4}
                    max={48}
                    step={1}
                    unit="hours"
                    onChange={(v) => updateInput('floodDurationHours', v)}
                    note="Total duration of monsoon cloudburst flood wave."
                  />
                  <NumberSlider
                    label="Detention Basin Capacity"
                    value={inputs.detentionVolumeM3 ?? 650000}
                    min={50000}
                    max={2500000}
                    step={25000}
                    unit="m³"
                    onChange={(v) => updateInput('detentionVolumeM3', v)}
                    note="Available flood storage volume in retaining basin."
                  />
                  <NumberSlider
                    label="Emergency Spillway Width"
                    value={inputs.spillwayWidth ?? 25}
                    min={5}
                    max={80}
                    step={2}
                    unit="m"
                    onChange={(v) => updateInput('spillwayWidth', v)}
                    note="Width of surplus relief weir."
                  />
                </>
              )}

              {/* SLUICES_OUTLETS CONTROLS */}
              {activeCategory === 'SLUICES_OUTLETS' && (
                <>
                  <NumberSlider
                    label="Upstream Head above Sluice Sill (H_u)"
                    value={inputs.upstreamWaterLevel ?? 4.2}
                    min={0.8}
                    max={15.0}
                    step={0.2}
                    unit="m"
                    onChange={(v) => updateInput('upstreamWaterLevel', v)}
                    note="Hydrostatic head driving exit discharge."
                  />
                  <NumberSlider
                    label="Sluice Gate Opening Height (y₀)"
                    value={inputs.gateOpening ?? 0.6}
                    min={0.1}
                    max={2.5}
                    step={0.05}
                    unit="m"
                    onChange={(v) => updateInput('gateOpening', v)}
                    note="Vertical gate lift aperture."
                  />
                  <NumberSlider
                    label="Sluice Barrel / Gate Width (W)"
                    value={inputs.gateWidth ?? 1.5}
                    min={0.5}
                    max={5.0}
                    step={0.1}
                    unit="m"
                    onChange={(v) => updateInput('gateWidth', v)}
                    note="Clear width of stone or timber sluice opening."
                  />
                  <NumberSlider
                    label="Downstream Tailwater Depth (y_t)"
                    value={inputs.downstreamWaterLevel ?? 0.7}
                    min={0.1}
                    max={4.0}
                    step={0.1}
                    unit="m"
                    onChange={(v) => updateInput('downstreamWaterLevel', v)}
                    note="Submergence depth in downstream channel."
                  />
                </>
              )}

              {/* RESERVOIRS_TANKS CONTROLS */}
              {activeCategory === 'RESERVOIRS_TANKS' && (
                <>
                  <NumberSlider
                    label="Stored Water Depth in Cistern (h)"
                    value={inputs.upstreamWaterLevel ?? 6.0}
                    min={0.5}
                    max={15.0}
                    step={0.2}
                    unit="m"
                    onChange={(v) => updateInput('upstreamWaterLevel', v)}
                    note="Depth of impounded water in retaining basin."
                  />
                  <NumberSlider
                    label="Basin Excavation Depth (H)"
                    value={inputs.height ?? 7.5}
                    min={2.0}
                    max={20.0}
                    step={0.5}
                    unit="m"
                    onChange={(v) => updateInput('height', v)}
                    note="Total vertical depth from rim to cistern floor."
                  />
                  <NumberSlider
                    label="Basin Top Length (L)"
                    value={inputs.length ?? 73}
                    min={15}
                    max={250}
                    step={5}
                    unit="m"
                    onChange={(v) => updateInput('length', v)}
                    note="Length of stepped retaining reservoir."
                  />
                  <NumberSlider
                    label="Basin Top Width (W)"
                    value={inputs.width ?? 29}
                    min={10}
                    max={120}
                    step={2}
                    unit="m"
                    onChange={(v) => updateInput('width', v)}
                    note="Width of stepped retaining reservoir."
                  />
                  <NumberSlider
                    label="Peak Storm Inflow Runoff"
                    value={inputs.discharge ?? 40}
                    min={5}
                    max={180}
                    step={5}
                    unit="m³/s"
                    onChange={(v) => updateInput('discharge', v)}
                    note="Storm runoff diverted through inlet flume."
                  />
                  <NumberSlider
                    label="Daily Domestic Community Draw"
                    value={inputs.dailyDomesticDemandM3 ?? 150}
                    min={20}
                    max={1000}
                    step={20}
                    unit="m³/day"
                    onChange={(v) => updateInput('dailyDomesticDemandM3', v)}
                    note="Community potable consumption rate."
                  />
                  <NumberSlider
                    label="Daily Pan Evaporation Loss"
                    value={inputs.panEvaporationMmDay ?? 5.0}
                    min={1.0}
                    max={12.0}
                    step={0.5}
                    unit="mm/day"
                    onChange={(v) => updateInput('panEvaporationMmDay', v)}
                    note="Arid open-water surface evaporation rate."
                  />
                </>
              )}
            </div>
          </section>

          {/* Right Column: Dynamic Live Hydraulic Physics & Warnings */}
          <section className="lg:col-span-5 bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b border-[#E8E0D2] pb-3 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#231B15] flex items-center gap-2">
                <span>Live Hydraulic Indicators</span>
              </h3>
              {getSeverityBadge(calculations.overallRiskSeverity)}
            </div>

            {/* Metric Rows */}
            <div className="space-y-2">
              {calculations.metrics.map((m) => (
                <div
                  key={m.label}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#F5EFE3] border border-[#E5DAC8] text-xs"
                >
                  <div>
                    <span className="text-[#5C4F41] font-medium block">
                      {m.label} {m.symbol && <span className="font-mono text-[#8B3A1C]">({m.symbol})</span>}
                    </span>
                    {m.tooltip && <span className="text-[10px] text-[#807263] leading-tight block">{m.tooltip}</span>}
                  </div>
                  <span className="font-mono font-bold text-[#2E241B] text-right shrink-0">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Live Engineering Warning Cards */}
            <div className="space-y-2.5 pt-2 border-t border-[#E8E0D2]">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#695A4B] block">
                Engineering Diagnostics & Warning Engine ({calculations.warnings.length})
              </span>

              {calculations.warnings.length === 0 ? (
                <div className="p-3 bg-[#EFF6F0] border border-[#C3DEC8] rounded-lg flex items-start gap-2.5 text-xs text-[#1D5E32]">
                  <CheckCircle className="w-4 h-4 shrink-0 text-[#2B7D46] mt-0.5" />
                  <div>
                    <strong className="block font-semibold">All Engineering Checks Passed</strong>
                    <span className="opacity-90">Structure operates comfortably within safe hydraulic thresholds without overtopping or scouring.</span>
                  </div>
                </div>
              ) : (
                calculations.warnings.map((w) => (
                  <div
                    key={w.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      w.severity === 'RED'
                        ? 'bg-[#FFEBEE] border-[#FFCDD2] text-[#B71C1C]'
                        : w.severity === 'ORANGE'
                        ? 'bg-[#FFF3E0] border-[#FFE0B2] text-[#E65100]'
                        : w.severity === 'YELLOW'
                        ? 'bg-[#FFFDE7] border-[#FFF9C4] text-[#F57F17]'
                        : 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        {w.severity === 'RED' ? (
                          <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{w.title}</span>
                      </div>
                      <span className="font-mono font-semibold text-[10px] uppercase">{w.severity}</span>
                    </div>

                    <p className="leading-relaxed opacity-95 text-[11px]">{w.concernExplanation}</p>

                    <div className="pt-1 text-[10px] space-y-0.5 border-t border-black/10">
                      <div>
                        <strong>Trigger:</strong> {w.parameterName} = {w.currentValue} {w.unit} (Limit: {w.criterionLimit})
                      </div>
                      <div>
                        <strong>Remediation:</strong> {w.suggestedAction}
                      </div>
                    </div>
                  </div>
                ))
              )}
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
          </section>
        </div>
      )}

      {/* TAB 2: PARAMETER SENSITIVITY ANALYSIS */}
      {activeTab === 'SENSITIVITY' && (
        <section className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E8E0D2] pb-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#231B15] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#8B3A1C]" />
                <span>Parameter Sensitivity Analysis & Operating Response</span>
              </h3>
              <p className="text-xs text-[#706354]">
                Evaluate how variations in upstream flow, geometry, or roughness alter performance and trigger risk transitions.
              </p>
            </div>

            {/* Parameter Choice Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="sensitivity-param-select" className="text-xs font-semibold text-[#544739]">Select Parameter:</label>
              <select
                id="sensitivity-param-select"
                value={selectedSensitivityParamKey}
                onChange={(e) => {
                  const newKey = e.target.value as keyof HydraulicInputs;
                  setSelectedSensitivityParamKey(newKey);
                  const cf = sensitivityConfigs.find((c) => c.key === newKey);
                  if (cf) {
                    const currentVal = Number(inputs[newKey] ?? (cf.min + cf.max) / 2);
                    setModifiedSensitivityVal(currentVal);
                  }
                }}
                className="bg-white border border-[#D5CABB] rounded-lg px-3 py-1.5 text-xs text-[#2E241A] font-medium outline-none focus:border-[#8B3A1C]"
              >
                {sensitivityConfigs.map((cf) => (
                  <option key={cf.key} value={cf.key}>
                    {cf.label} ({cf.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Parameter Slider & Scenario Delta */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[#F5EFE3] p-4 rounded-xl border border-[#E2D8C6]">
            <div className="md:col-span-7 space-y-3">
              <span className="text-[11px] font-bold text-[#8B3A1C] uppercase tracking-wider block">
                Perturb {sensitivityResult.parameterLabel}
              </span>
              <div className="flex items-center justify-between text-xs">
                <span>Baseline: <strong className="font-mono">{sensitivityResult.baselineValue.toFixed(2)} {sensitivityResult.unit}</strong></span>
                <span>Modified: <strong className="font-mono text-[#8B3A1C]">{sensitivityResult.modifiedValue.toFixed(2)} {sensitivityResult.unit}</strong></span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                  sensitivityResult.percentChange > 0 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {sensitivityResult.percentChange > 0 ? '+' : ''}{sensitivityResult.percentChange.toFixed(1)}% shift
                </span>
              </div>

              <input
                type="range"
                min={Math.min(sensitivityResult.baselineValue * 0.3, 0.1)}
                max={Math.max(sensitivityResult.baselineValue * 2.5, 10)}
                step={sensitivityResult.baselineValue > 10 ? 1 : 0.05}
                value={modifiedSensitivityVal}
                onChange={(e) => setModifiedSensitivityVal(Number(e.target.value))}
                className="w-full accent-[#8B3A1C] cursor-pointer h-2 bg-[#E2D8C9] rounded-lg"
              />
            </div>

            {/* Impact Metric Summary */}
            <div className="md:col-span-5 bg-white p-3.5 rounded-lg border border-[#DDD1C0] space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#7A6A5A] block">
                Dependent Output Impact: {sensitivityResult.outputLabel}
              </span>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-[#362A1F]">{sensitivityResult.baselineOutputValue.toFixed(2)} {sensitivityResult.outputUnit}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8B3A1C]" />
                <span className="text-[#8B3A1C]">{sensitivityResult.modifiedOutputValue.toFixed(2)} {sensitivityResult.outputUnit}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#E8DFD0]">
                <span className="text-[#6B5D4E]">Output Delta:</span>
                <span className={`font-mono font-bold ${
                  sensitivityResult.outputPercentChange > 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {sensitivityResult.outputPercentChange > 0 ? '+' : ''}{sensitivityResult.outputPercentChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-3.5 bg-[#FAF3E8] border border-[#E5D7C2] rounded-lg text-xs text-[#524131] leading-relaxed">
            <strong>Hydraulic Risk Sensitivity Transition:</strong> {sensitivityResult.riskShiftExplanation}
          </div>

          {/* SVG Response Curve Graph */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#3E3224] block">
              Multi-Point Response Curve: {sensitivityResult.outputLabel} vs. {sensitivityResult.parameterLabel}
            </span>
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#DED4C4] overflow-x-auto">
              <svg viewBox="0 0 700 240" className="w-full max-w-3xl mx-auto block font-sans">
                {/* Axes and Grid */}
                <line x1="60" y1="20" x2="60" y2="200" stroke="#B8A896" strokeWidth="1.5" />
                <line x1="60" y1="200" x2="660" y2="200" stroke="#B8A896" strokeWidth="1.5" />

                {/* Y-axis Label */}
                <text x="15" y="110" fill="#6E5E4F" fontSize="10" transform="rotate(-90 15 110)" textAnchor="middle">
                  {sensitivityResult.outputLabel} ({sensitivityResult.outputUnit})
                </text>

                {/* X-axis Label */}
                <text x="360" y="230" fill="#6E5E4F" fontSize="10" textAnchor="middle">
                  {sensitivityResult.parameterLabel} ({sensitivityResult.unit})
                </text>

                {/* Plot response curve */}
                {(() => {
                  const pts = sensitivityResult.sweepPoints;
                  if (pts.length < 2) return null;
                  const xMin = pts[0].parameterValue;
                  const xMax = pts[pts.length - 1].parameterValue || 1;
                  const yVals = pts.map((p) => p.outputValue);
                  const yMin = Math.min(0, Math.min(...yVals));
                  const yMax = Math.max(1, Math.max(...yVals) * 1.15);

                  const getX = (val: number) => 60 + ((val - xMin) / (xMax - xMin || 1)) * 580;
                  const getY = (val: number) => 200 - ((val - yMin) / (yMax - yMin || 1)) * 175;

                  const pathD = pts
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.parameterValue).toFixed(1)} ${getY(p.outputValue).toFixed(1)}`)
                    .join(' ');

                  return (
                    <>
                      {/* Grid Lines */}
                      {[0, 0.33, 0.66, 1].map((pct, idx) => (
                        <g key={idx}>
                          <line
                            x1="60"
                            y1={200 - pct * 175}
                            x2="660"
                            y2={200 - pct * 175}
                            stroke="#E5DACB"
                            strokeDasharray="3 3"
                          />
                          <text x="50" y={204 - pct * 175} fill="#8A7A6B" fontSize="9" textAnchor="end">
                            {(yMin + pct * (yMax - yMin)).toFixed(1)}
                          </text>
                        </g>
                      ))}

                      {/* Line */}
                      <path d={pathD} fill="none" stroke="#8B3A1C" strokeWidth="2.5" />

                      {/* Points */}
                      {pts.map((p, i) => {
                        const px = getX(p.parameterValue);
                        const py = getY(p.outputValue);
                        const color =
                          p.riskSeverity === 'RED'
                            ? '#C62828'
                            : p.riskSeverity === 'ORANGE'
                            ? '#E65100'
                            : p.riskSeverity === 'YELLOW'
                            ? '#F57F17'
                            : '#2E7D32';
                        return (
                          <g key={i}>
                            <circle cx={px} cy={py} r="4" fill={color} stroke="#FAF7F2" strokeWidth="1.5" />
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="flex items-center justify-center gap-4 text-[11px] text-[#695B4C] pt-1">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] inline-block" /> Stable (Green)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F57F17] inline-block" /> Advisory (Yellow)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E65100] inline-block" /> Warning (Orange)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#C62828] inline-block" /> Critical (Red)</span>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: DETAILED PHYSICS & EQUATION SUBSTITUTIONS */}
      {activeTab === 'EQUATIONS' && (
        <section className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="border-b border-[#E8E0D2] pb-3">
            <h3 className="font-serif font-bold text-lg text-[#231B15] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#8B3A1C]" />
              <span>Step-by-Step Mathematical Calculations & Equation Substitutions</span>
            </h3>
            <p className="text-xs text-[#706354] mt-1 leading-relaxed">
              Every displayed metric is mathematically traced to governing physical laws with real numerical substitutions.
            </p>
          </div>

          {/* Governing Theory Overview */}
          <div className="p-4 bg-[#F5EFE3] rounded-lg border border-[#E2D8C6] space-y-2 text-xs">
            <span className="text-[10px] font-bold text-[#8B3A1C] uppercase tracking-wider block">
              Governing Physical Theory
            </span>
            <p className="text-[#45372B] leading-relaxed">{calculations.governingTheory}</p>
          </div>

          {/* Expandable Equation Cards */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#3E3224] block">
              Detailed Calculation Steps ({calculations.calculationSteps.length} Steps)
            </span>

            {calculations.calculationSteps.map((step, idx) => {
              const isExpanded = expandedEquationIndex === idx;
              return (
                <div
                  key={step.name}
                  className="rounded-lg border border-[#DFD5C2] bg-white overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedEquationIndex(isExpanded ? null : idx)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#FDFBF7] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#8B3A1C] shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#8A7A6A] shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-xs text-[#2A2118]">
                          {step.name} <span className="font-mono text-[#8B3A1C]">({step.symbol})</span>
                        </span>
                        <span className="block text-[11px] text-[#7A6A5A] font-mono mt-0.5">
                          {step.formulaLatex}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#8B3A1C] bg-[#FAF4EA] px-2.5 py-1 rounded border border-[#E8DCB]">
                      {step.resultValue} {step.unit}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-1 bg-[#FAF7F2] border-t border-[#EDE4D5] text-xs space-y-2.5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="bg-white p-3 rounded border border-[#E0D5C3]">
                          <span className="text-[10px] uppercase font-bold text-[#8A7A6A] block mb-1">
                            Numerical Substitution:
                          </span>
                          <code className="text-xs font-mono text-[#732912] break-all block">
                            {step.substitution}
                          </code>
                        </div>
                        <div className="bg-white p-3 rounded border border-[#E0D5C3]">
                          <span className="text-[10px] uppercase font-bold text-[#8A7A6A] block mb-1">
                            Computed Output:
                          </span>
                          <span className="text-sm font-bold font-mono text-[#2E241A] block">
                            {step.resultValue} {step.unit}
                          </span>
                        </div>
                      </div>

                      {step.notes && (
                        <p className="text-[11px] text-[#5A4B3C] italic leading-relaxed pt-1">
                          <strong>Physical Note:</strong> {step.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Assumptions & Uncertainties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#F7F2E7] p-3.5 rounded-lg border border-[#DFD3C0] text-xs space-y-2">
              <span className="text-[10px] font-bold text-[#8B3A1C] uppercase tracking-wider block">
                Stated Physical Assumptions
              </span>
              <ul className="list-disc list-inside space-y-1 text-[#4F4134] text-[11px]">
                {calculations.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>

            <div className="bg-[#F7F2E7] p-3.5 rounded-lg border border-[#DFD3C0] text-xs space-y-2">
              <span className="text-[10px] font-bold text-[#8B3A1C] uppercase tracking-wider block">
                Sources of Model Uncertainty
              </span>
              <ul className="list-disc list-inside space-y-1 text-[#4F4134] text-[11px]">
                {calculations.uncertainties.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: ARCHAEOLOGICAL & EPIGRAPHIC DOSSIER */}
      {activeTab === 'DOSSIER' && (
        <section className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="border-b border-[#E8E0D2] pb-3">
            <h3 className="font-serif font-bold text-lg text-[#231B15] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#8B3A1C]" />
              <span>Archaeological & Epigraphic Record: {structure.name}</span>
            </h3>
            <p className="text-xs text-[#706354]">
              Distinguishing verified historical inscriptions and excavation records from engineering modeling assumptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Documented Historical Data */}
            <div className="bg-[#F5EFE3] p-4 rounded-xl border border-[#E2D8C6] space-y-3 text-xs">
              <span className="text-[10px] font-bold text-[#8B3A1C] uppercase tracking-wider block flex items-center gap-1.5">
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Documented Archaeological Records</span>
              </span>
              <div className="space-y-2 text-[#4A3D2F]">
                {Object.entries(structure.documented).map(([k, v]) => (
                  <div key={k} className="border-b border-[#E8DCCB] pb-1.5 last:border-b-0">
                    <strong className="capitalize text-[#2E241A] block">{k}:</strong>
                    <span className="text-[11px] leading-relaxed">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation Assumptions */}
            <div className="bg-[#F5EFE3] p-4 rounded-xl border border-[#E2D8C6] space-y-3 text-xs">
              <span className="text-[10px] font-bold text-[#54483C] uppercase tracking-wider block flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#8B3A1C]" />
                <span>Simulation Assumptions & Epigraphic Synthesis</span>
              </span>
              <div className="space-y-2 text-[#4A3D2F]">
                {Object.entries(structure.assumptions).map(([k, v]) => (
                  <div key={k} className="border-b border-[#E8DCCB] pb-1.5 last:border-b-0">
                    <strong className="capitalize text-[#2E241A] block">{k}:</strong>
                    <span className="text-[11px] leading-relaxed">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#F5ECE0] border border-[#E4D5BF] rounded-lg text-[11px] text-[#695847] leading-relaxed">
            <strong>Archaeological Rigor Principle:</strong> All structural dimensions are referenced from published
            excavation reports, epigraphical records, and historical surveys. Where ancient dimensions are partially
            lost to time or erosion, modeling assumptions are explicitly identified and kept distinct from physical inscriptions.
          </div>
        </section>
      )}

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
