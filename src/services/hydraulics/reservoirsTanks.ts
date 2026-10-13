import {
  CalculationStep,
  HydraulicCalculationResult,
  HydraulicInputs,
  MetricOutput,
} from './types.ts';
import { evaluateWarnings, getWorstSeverity } from './warningEngine.ts';

/**
 * Reservoirs, Stepwells, and Traditional Water Tanks Model
 * Implements stepped inverted-pyramid cistern geometry, subterranean thermal evaporation savings,
 * Brune sediment trap efficiency, and village drought reserve supply calculations.
 */
export function calculateReservoirsTanks(inputs: HydraulicInputs): HydraulicCalculationResult {
  const L = Math.max(10.0, inputs.length ?? 73.0); // Basin length (m)
  const W = Math.max(8.0, inputs.width ?? 29.0); // Basin width (m)
  const H_total = Math.max(2.0, inputs.height ?? 10.0); // Basin/well total depth (m)
  const y_water = Math.max(0.5, Math.min(H_total, inputs.upstreamWaterLevel ?? 7.5)); // Water depth (m)
  const isSubterranean = Boolean((inputs.shaftSpacing && inputs.shaftSpacing > 0) || (inputs.height && inputs.height > 15));

  const inflowQ = Math.max(0.01, inputs.discharge ?? 45.0); // Mean monsoon inflow (m³/s)
  const dailyDemandM3 = Math.max(10.0, inputs.dailyDomesticDemandM3 ?? 180.0); // Daily community draw (m³/day)
  const panEvapMmDay = Math.max(1.0, inputs.panEvaporationMmDay ?? 6.5); // Pan evaporation (mm/day)

  // 1. Water Volume in Stepped / Inverted Trapezoidal Cistern
  // Stepped factor ~0.72 - 0.88 accounting for tiers and inward battered stone courses
  const steppedFormFactor = 0.82;
  const surfaceAreaM2 = L * W;
  const waterVolumeM3 = surfaceAreaM2 * y_water * steppedFormFactor;
  const totalCapacityM3 = surfaceAreaM2 * H_total * steppedFormFactor;
  const storageML = waterVolumeM3 / 1000; // MegaLiters

  // 2. Thermal Evaporation Loss
  // Open surface tank vs Subterranean stepwell (75% thermal reduction)
  const evapReductionCoeff = isSubterranean ? 0.22 : 0.90;
  const dailyEvapVolumeM3 = surfaceAreaM2 * (panEvapMmDay / 1000) * evapReductionCoeff;
  const annualEvapLossM3 = dailyEvapVolumeM3 * 220; // 220 non-monsoon dry days
  const evapLossPercent = Math.min(65, (annualEvapLossM3 / Math.max(1.0, waterVolumeM3)) * 100);

  // 3. Sediment Trap Efficiency (Brune Curve Approximation)
  // Annual inflow volume: Inflow_ann ~ inflowQ * 60 days * 86400
  const annualInflowM3 = Math.max(1000, inflowQ * 45 * 86400);
  const capacityInflowRatio = totalCapacityM3 / Math.max(1000, annualInflowM3);
  // Brune empirical trap efficiency:
  let trapEfficiency = 85.0;
  if (capacityInflowRatio > 0.001) {
    trapEfficiency = Math.min(97.0, Math.max(45.0, 100 * (1 - 0.05 / Math.sqrt(Math.max(0.001, capacityInflowRatio)))));
  }

  // 4. Community Drought Reserve Supply Days
  // Net daily consumption = domestic demand + daily evaporation
  const netDailyDepletionM3 = dailyDemandM3 + dailyEvapVolumeM3;
  const supplyDays = waterVolumeM3 / Math.max(1.0, netDailyDepletionM3);
  const populationSupported = (dailyDemandM3 * 1000) / 40; // ~40 liters/person/day

  const freeboardRemaining = H_total - y_water;
  const isRimOverflow = freeboardRemaining < 0.2;

  const calculationSteps: CalculationStep[] = [
    {
      name: 'Stepped Cistern Stored Volume',
      symbol: 'V_{stored}',
      formulaLatex: 'V = L \\cdot W \\cdot y \\cdot \\phi_{stepped}',
      substitution: `${L.toFixed(1)} \\times ${W.toFixed(1)} \\times ${y_water.toFixed(2)} \\times 0.82`,
      resultValue: waterVolumeM3,
      unit: 'm³',
      notes: 'Water impounded within stepped ashlar stone tiers.',
    },
    {
      name: 'Daily Evaporative Dissipation',
      symbol: 'V_{evap}',
      formulaLatex: 'V_{evap} = A_{surf} \\cdot E_{pan} \\cdot C_{thermal}',
      substitution: `${surfaceAreaM2.toFixed(0)} \\text{ m}^2 \\times (${panEvapMmDay.toFixed(1)}/1000) \\times ${evapReductionCoeff.toFixed(2)}`,
      resultValue: dailyEvapVolumeM3,
      unit: 'm³/day',
      notes: isSubterranean ? 'Subterranean shading preserves ~78% water vs open tank.' : 'Surface evaporative loss under hot arid sun.',
    },
    {
      name: 'Brune Sediment Trap Efficiency',
      symbol: 'E_{trap}',
      formulaLatex: 'E_{trap} = 100 \\left(1 - \\frac{0.05}{\\sqrt{C/I}}\\right)',
      substitution: `100 \\times (1 - 0.05 / \\sqrt{${capacityInflowRatio.toFixed(4)}})`,
      resultValue: trapEfficiency,
      unit: '%',
      notes: 'Percentage of suspended silt settled and clarified before domestic use.',
    },
    {
      name: 'Drought Reserve Supply Duration',
      symbol: 'T_{supply}',
      formulaLatex: 'T_{supply} = \\frac{V_{stored}}{Q_{draw} + V_{evap}}',
      substitution: `\\frac{${waterVolumeM3.toFixed(0)}}{${dailyDemandM3.toFixed(0)} + ${dailyEvapVolumeM3.toFixed(1)}}`,
      resultValue: supplyDays,
      unit: 'days',
      notes: 'Consecutive dry season days sustained without monsoon replenishment.',
    },
  ];

  const metrics: MetricOutput[] = [
    { label: 'Usable Storage Volume', symbol: 'V', value: `${waterVolumeM3.toFixed(0)} m³ (${storageML.toFixed(2)} ML)`, rawNumber: waterVolumeM3, unit: 'm³', highlight: true },
    { label: 'Drought Reserve Duration', symbol: 'T_supply', value: `${supplyDays.toFixed(0)} days of supply`, rawNumber: supplyDays, unit: 'days', highlight: true },
    { label: 'Water Column Depth ($y$)', symbol: 'y', value: `${y_water.toFixed(2)} m / ${H_total.toFixed(1)} m depth`, rawNumber: y_water, unit: 'm' },
    { label: 'Sediment Clarification', symbol: 'E_trap', value: `${trapEfficiency.toFixed(1)}% silt trapped`, rawNumber: trapEfficiency, unit: '%' },
    { label: 'Daily Evaporation Loss', symbol: 'V_evap', value: `${dailyEvapVolumeM3.toFixed(1)} m³/day (${evapLossPercent.toFixed(1)}% annual)`, rawNumber: dailyEvapVolumeM3, unit: 'm³/day' },
    { label: 'Community Supported', symbol: 'Pop', value: `~${populationSupported.toFixed(0)} citizens`, rawNumber: populationSupported, unit: 'people' },
    { label: 'Basin Footprint', symbol: 'Footprint', value: `${L.toFixed(0)}m × ${W.toFixed(0)}m (${surfaceAreaM2.toFixed(0)} m²)`, unit: 'm²' },
  ];

  const warnings = evaluateWarnings('RESERVOIRS_TANKS', {
    supplyDays,
    evapLossPercent,
    isRimOverflow,
  });

  const worstSeverity = getWorstSeverity(warnings);

  return {
    category: 'RESERVOIRS_TANKS',
    primarySummary: `${storageML.toFixed(2)} ML stored (~${supplyDays.toFixed(0)} days reserve)`,
    secondarySummary: `${trapEfficiency.toFixed(0)}% silt clarified (${isSubterranean ? 'Subterranean stepwell' : 'Open reservoir'})`,
    metrics,
    calculationSteps,
    warnings,
    overallRiskSeverity: worstSeverity,
    governingTheory: "Prismoidal Cistern Volumetric Metrology, Brune Sediment Trap Efficiency Curve, and Penman Evaporative Heat Dissipation.",
    assumptions: [
      `Stepped basin footprint ${L.toFixed(1)} m × ${W.toFixed(1)} m with form factor 0.82.`,
      `Pan evaporation rate E = ${panEvapMmDay.toFixed(1)} mm/day with thermal reduction coefficient ${evapReductionCoeff.toFixed(2)}.`,
      `Community domestic draw = ${dailyDemandM3.toFixed(0)} m³/day (~${populationSupported.toFixed(0)} people at 40 L/day).`,
    ],
    uncertainties: [
      'Unexcavated sediment deposition thickness can reduce actual dead storage by 20–35% if un-cleaned.',
      'Groundwater table fluctuation in surrounding aquifers impacts deep percolation ingress into stepped cistern beds.',
    ],
    schematicData: {
      upstreamDepthM: y_water,
      downstreamDepthM: 0.2,
      structureHeightM: H_total,
      crestElevationM: H_total,
      effectiveWidthM: W,
      waterVelocityMs: 0.1,
      isOvertopping: isRimOverflow,
      isSupercritical: false,
      hydraulicJumpOccurred: false,
      froudeNumber: 0.05,
      flowDirection: 'SUBTERRANEAN',
      waterSurfaceProfile: [
        { x: 0, y: y_water },
        { x: 50, y: y_water },
        { x: 100, y: y_water },
      ],
    },
  };
}
