/**
 * JalSutra Hydraulic Engineering Simulation Engine - Type Definitions
 * Covers 8 major water engineering structure categories with rigorous physical metrics.
 */

export type SimulationCategory =
  | 'CHANNELS_CANALS'
  | 'IRRIGATION_SYSTEMS'
  | 'DAMS_EMBANKMENTS'
  | 'DIVERSION_WEIRS'
  | 'DRAINAGE_SYSTEMS'
  | 'FLOOD_MANAGEMENT'
  | 'SLUICES_OUTLETS'
  | 'RESERVOIRS_TANKS';

export interface CategoryMetadata {
  id: SimulationCategory;
  name: string;
  shortLabel: string;
  icon: string;
  description: string;
  ancientExamples: string[];
}

export const SIMULATION_CATEGORIES: Record<SimulationCategory, CategoryMetadata> = {
  CHANNELS_CANALS: {
    id: 'CHANNELS_CANALS',
    name: 'Open Channels & Canals',
    shortLabel: 'Channels & Canals',
    icon: '🌊',
    description: 'Uniform open-channel flow via Manning equation, normal depth, conveyance, and freeboard analysis.',
    ancientExamples: ['Tusaspha Ashokan Canals', 'Roman Aqua Claudia', 'Grand Canal of China', 'Dujiangyan Baopingkou'],
  },
  IRRIGATION_SYSTEMS: {
    id: 'IRRIGATION_SYSTEMS',
    name: 'Irrigation Distribution Systems',
    shortLabel: 'Irrigation Networks',
    icon: '🌾',
    description: 'Command area hydrology, duty and delta water balance, delivery efficiency, and canal hierarchy.',
    ancientExamples: ['Cauvery Delta Canals', 'Sri Lankan Ela Networks', 'Karez / Aflaj Distribution', 'Nile Basin Flooding'],
  },
  DAMS_EMBANKMENTS: {
    id: 'DAMS_EMBANKMENTS',
    name: 'Dams & Embankments',
    shortLabel: 'Dams & Embankments',
    icon: '🏛️',
    description: 'Hydrostatic thrust, sliding/overturning factors of safety, seepage gradients, and overtopping risks.',
    ancientExamples: ['Sudarshana Lake Dam', 'Bhojpur Cyclopean Dam', 'Proserpina Dam', 'Great Dam of Marib', 'Porumamilla Dam'],
  },
  DIVERSION_WEIRS: {
    id: 'DIVERSION_WEIRS',
    name: 'Diversion Weirs & Anicuts',
    shortLabel: 'Weirs & Anicuts',
    icon: '⚡',
    description: 'Free and submerged weir discharge, approach velocity head, downstream hydraulic jump, and scouring.',
    ancientExamples: ['Kallanai (Grand Anicut)', 'Dujiangyan Yuzui Weir', 'Achaemenid Weirs', 'Bhavani Anicut'],
  },
  DRAINAGE_SYSTEMS: {
    id: 'DRAINAGE_SYSTEMS',
    name: 'Drainage & Sewerage Systems',
    shortLabel: 'Drainage Systems',
    icon: '💧',
    description: 'Gravity storm & waste conveyance, backwater surcharge ratio, flow depth, and street ponding risk.',
    ancientExamples: ['Mohenjo-daro Corbelled Sewers', 'Cloaca Maxima (Rome)', 'Knossos Minoan Drains', 'Lothal Dock Drains'],
  },
  FLOOD_MANAGEMENT: {
    id: 'FLOOD_MANAGEMENT',
    name: 'Flood Detention & Management',
    shortLabel: 'Flood Management',
    icon: '🛡️',
    description: 'Time-varying hydrograph routing, level-pool storage balance, peak discharge attenuation, and spillway capacity.',
    ancientExamples: ['Sringaverapura Flood Clarifier', 'Dholavira Storm Spillways', 'Huaricanga Flood Dykes'],
  },
  SLUICES_OUTLETS: {
    id: 'SLUICES_OUTLETS',
    name: 'Sluices, Gates & Outlets',
    shortLabel: 'Sluices & Outlets',
    icon: '⚙️',
    description: 'Orifice and gate hydraulics, Torricelli scouring jets, silt clearance velocity, and discharge control.',
    ancientExamples: ['Chola Kalingu Sluices', 'Bisokotuwa (Cistern Sluice)', 'Lothal Lock Gates', 'Kakatiya Tumu Sluices'],
  },
  RESERVOIRS_TANKS: {
    id: 'RESERVOIRS_TANKS',
    name: 'Reservoirs & Traditional Tanks',
    shortLabel: 'Reservoirs & Tanks',
    icon: '🏺',
    description: 'Stepped cistern geometry, evaporation mitigation, sediment trap efficiency, and drought reserve days.',
    ancientExamples: ['Dholavira Cascading Reservoirs', 'Chand Baori Stepwell', 'Rani ki Vav', 'Ramappa Lake (Kakatiya)'],
  },
};

// Generic physical parameters input container
export interface HydraulicInputs {
  // Common geometry
  height?: number; // m (dam height, wall height, or stepwell depth)
  length?: number; // m (structure length or canal length)
  width?: number; // m (base width, bed width, or canal bottom width)
  topWidth?: number; // m (crest width or water surface width)
  sideSlope?: number; // horizontal:vertical (z in 1:z, e.g. 1.5, 2.0)
  bedSlope?: number; // m/m (longitudinal bed slope, e.g. 0.0008)
  manningN?: number; // roughness coefficient (e.g. 0.015 for masonry, 0.025 for earth, 0.035 for boulders)

  // Water levels & flow
  upstreamWaterLevel?: number; // m (depth or water elevation upstream)
  downstreamWaterLevel?: number; // m (tailwater depth or downstream level)
  discharge?: number; // m³/s (entered inflow or design flow)

  // Specific components
  spillwayWidth?: number; // m
  spillwayCrestElevation?: number; // m above bed
  gateOpening?: number; // m
  gateWidth?: number; // m
  pipeDiameter?: number; // m (for circular drainage or conduits)
  tunnelDiameter?: number; // m (for qanats)
  shaftSpacing?: number; // m

  // Geotechnical & materials
  materialDensity?: number; // kN/m³ (e.g. 24 for sandstone masonry, 20 for earthen bund)
  soilPermeability?: number; // m/s (Darcy k, e.g. 1e-5 for silty sand, 1e-7 for clay)
  frictionAngle?: number; // degrees (phi, e.g. 30 deg)
  cohesion?: number; // kPa (e.g. 15 kPa)
  foundationFrictionCoeff?: number; // mu (e.g. 0.55 for clay/sand, 0.65 for rock)

  // Catchment & Agrarian context
  catchmentAreaKm2?: number; // km²
  commandAreaHa?: number; // ha
  waterDutyHaPerCumec?: number; // ha/(m³/s)
  dailyDomesticDemandM3?: number; // m³/day
  panEvaporationMmDay?: number; // mm/day

  // Flood hydrograph inputs
  peakInflow?: number; // m³/s
  floodDurationHours?: number; // hours
  baseflow?: number; // m³/s
  detentionVolumeM3?: number; // m³
}

// Structured calculation step documenting governing equation and substitution
export interface CalculationStep {
  name: string;
  symbol: string;
  formulaLatex: string;
  substitution: string;
  resultValue: number;
  unit: string;
  notes?: string;
}

export type WarningSeverity = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface EngineeringWarning {
  id: string;
  severity: WarningSeverity;
  parameterName: string;
  currentValue: number | string;
  unit: string;
  criterionLimit: string;
  title: string;
  concernExplanation: string;
  affectedOutputs: string[];
  suggestedAction: string;
  isFailureCondition?: boolean;
}

export interface MetricOutput {
  label: string;
  symbol?: string;
  value: string;
  rawNumber?: number;
  unit?: string;
  highlight?: boolean;
  tooltip?: string;
}

export interface HydraulicCalculationResult {
  category: SimulationCategory;
  primarySummary: string;
  secondarySummary: string;
  metrics: MetricOutput[];
  calculationSteps: CalculationStep[];
  warnings: EngineeringWarning[];
  overallRiskSeverity: WarningSeverity;
  governingTheory: string;
  assumptions: string[];
  uncertainties: string[];

  // Schematic rendering hints (normalized for SVG display)
  schematicData: {
    upstreamDepthM: number;
    downstreamDepthM: number;
    structureHeightM: number;
    crestElevationM: number;
    effectiveWidthM: number;
    waterVelocityMs: number;
    isOvertopping: boolean;
    isSupercritical: boolean;
    hydraulicJumpOccurred: boolean;
    froudeNumber: number;
    flowDirection: 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT' | 'SUBTERRANEAN';
    waterSurfaceProfile: Array<{ x: number; y: number }>;
  };
}

// Sensitivity sweep model
export interface SensitivitySweepPoint {
  parameterValue: number;
  outputValue: number;
  riskSeverity: WarningSeverity;
}

export interface SensitivityAnalysis {
  parameterKey: keyof HydraulicInputs;
  parameterLabel: string;
  unit: string;
  baselineValue: number;
  modifiedValue: number;
  percentChange: number;
  baselineOutputValue: number;
  modifiedOutputValue: number;
  outputPercentChange: number;
  outputLabel: string;
  outputUnit: string;
  sweepPoints: SensitivitySweepPoint[];
  riskShiftExplanation: string;
}
