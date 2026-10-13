import {
  CalculationStep,
  HydraulicCalculationResult,
  HydraulicInputs,
  MetricOutput,
} from './types.ts';
import { evaluateWarnings, getWorstSeverity } from './warningEngine.ts';

/**
 * Flood Detention and Management Hydraulic Model
 * Implements time-varying hydrograph routing (Level-Pool / Modified Puls),
 * storage balance ΔS = (I - O)Δt, peak attenuation, and spillway overtopping checks.
 */
export function calculateFloodManagement(inputs: HydraulicInputs): HydraulicCalculationResult {
  const peakInflow = Math.max(1.0, inputs.peakInflow ?? inputs.discharge ?? 250.0); // Peak inflow m³/s
  const baseflow = Math.max(0.1, inputs.baseflow ?? 10.0); // Pre-flood baseflow m³/s
  const durationHours = Math.max(2.0, inputs.floodDurationHours ?? 18.0); // Duration of storm event (hours)
  const detentionVolMax = Math.max(1000.0, inputs.detentionVolumeM3 ?? 450000.0); // Total storage capacity m³
  const spillwayW = Math.max(5.0, inputs.spillwayWidth ?? 20.0); // Emergency spillway width m
  const basinDepthMax = Math.max(1.0, inputs.height ?? 6.0); // Maximum basin embankment height m
  const outletDischargeCap = Math.max(0.5, inputs.width ? inputs.width * 2.5 : 25.0); // Regulated outlet outflow m³/s

  // 1. Synthetic Triangular Inflow Hydrograph
  // Inflow starts at baseflow, peaks at peakInflow at t_peak = 0.35 * duration, then recedes to baseflow
  const timeSteps = 24;
  const dtSec = (durationHours * 3600) / timeSteps;
  const tPeakSec = 0.35 * durationHours * 3600;

  let currentStorage = 0;
  let maxStorageUsed = 0;
  let peakOutflow = baseflow;
  const hydrographPoints: Array<{ tHour: number; inflow: number; outflow: number; storage: number; stage: number }> = [];

  for (let i = 0; i <= timeSteps; i++) {
    const tSec = i * dtSec;
    const tHour = (tSec / 3600);

    // Inflow calculation
    let I_t: number;
    if (tSec <= tPeakSec) {
      I_t = baseflow + (peakInflow - baseflow) * (tSec / tPeakSec);
    } else {
      const recedeRatio = Math.max(0, 1 - (tSec - tPeakSec) / (durationHours * 3600 - tPeakSec));
      I_t = baseflow + (peakInflow - baseflow) * recedeRatio;
    }

    // Outflow calculation: controlled bottom outlet + emergency weir spillway if stage > spillway crest
    const currentStage = Math.min(basinDepthMax * 1.5, Math.pow(currentStorage / Math.max(1.0, detentionVolMax), 0.5) * basinDepthMax);
    const spillwayCrest = basinDepthMax - 1.5;
    const headOverSpillway = Math.max(0, currentStage - spillwayCrest);
    const spillwayQ = 1.7 * spillwayW * Math.pow(headOverSpillway, 1.5);
    const O_t = Math.min(I_t, outletDischargeCap) + spillwayQ;

    // Mass Conservation: ΔS = (I - O) * Δt
    const dS = (I_t - O_t) * dtSec;
    currentStorage = Math.max(0, currentStorage + dS);
    if (currentStorage > maxStorageUsed) maxStorageUsed = currentStorage;
    if (O_t > peakOutflow) peakOutflow = O_t;

    hydrographPoints.push({
      tHour: Number(tHour.toFixed(1)),
      inflow: Number(I_t.toFixed(1)),
      outflow: Number(O_t.toFixed(1)),
      storage: Number(currentStorage.toFixed(0)),
      stage: Number(currentStage.toFixed(2)),
    });
  }

  // Summary Metrics
  const totalInflowVolumeM3 = ((baseflow + peakInflow) / 2) * (durationHours * 3600);
  const peakAttenuationPercent = Math.max(0, ((peakInflow - peakOutflow) / peakInflow) * 100);
  const peakStage = Math.min(basinDepthMax * 1.5, Math.pow(maxStorageUsed / Math.max(1.0, detentionVolMax), 0.5) * basinDepthMax);
  const freeboardRemaining = basinDepthMax - peakStage;
  const isOvertopping = freeboardRemaining < 0;

  const calculationSteps: CalculationStep[] = [
    {
      name: 'Total Flood Inflow Volume',
      symbol: 'V_{in}',
      formulaLatex: 'V_{in} = \\int I(t) dt \\approx \\frac{1}{2} (I_{base} + I_{peak}) \\cdot T_{flood}',
      substitution: `0.5 \\times (${baseflow.toFixed(1)} + ${peakInflow.toFixed(1)}) \\times (${durationHours.toFixed(1)} \\times 3600)`,
      resultValue: totalInflowVolumeM3,
      unit: 'm³',
      notes: 'Total hydrological runoff delivered to detention structure by monsoon pulse.',
    },
    {
      name: 'Peak Flood Attenuation',
      symbol: '\\eta_{att}',
      formulaLatex: '\\eta_{att} = \\frac{I_{peak} - O_{peak}}{I_{peak}} \\times 100\\%',
      substitution: `\\frac{${peakInflow.toFixed(1)} - ${peakOutflow.toFixed(1)}}{${peakInflow.toFixed(1)}} \\times 100\\%`,
      resultValue: peakAttenuationPercent,
      unit: '%',
      notes: 'Percentage reduction in downstream flood peak due to temporary ponding retention.',
    },
    {
      name: 'Maximum Sump Retention Level',
      symbol: 'h_{max}',
      formulaLatex: 'h_{max} = H_{basin} \\sqrt{\\frac{S_{max}}{S_{capacity}}}',
      substitution: `${basinDepthMax.toFixed(2)} \\times \\sqrt{${maxStorageUsed.toFixed(0)} / ${detentionVolMax.toFixed(0)}}`,
      resultValue: peakStage,
      unit: 'm',
      notes: 'Peak flood water elevation reached within the detention reservoir.',
    },
  ];

  const metrics: MetricOutput[] = [
    { label: 'Peak Inflow Rate ($I_{peak}$)', symbol: 'I_peak', value: `${peakInflow.toFixed(1)} m³/s`, rawNumber: peakInflow, unit: 'm³/s' },
    { label: 'Attenuated Outflow ($O_{peak}$)', symbol: 'O_peak', value: `${peakOutflow.toFixed(1)} m³/s`, rawNumber: peakOutflow, unit: 'm³/s', highlight: true },
    { label: 'Peak Flood Attenuation', symbol: 'eta_att', value: `${peakAttenuationPercent.toFixed(1)}% attenuated`, rawNumber: peakAttenuationPercent, unit: '%', highlight: true },
    { label: 'Peak Stage Elevation', symbol: 'h_max', value: `${peakStage.toFixed(2)} m / ${basinDepthMax.toFixed(1)} m`, rawNumber: peakStage, unit: 'm' },
    { label: 'Remaining Freeboard', symbol: 'FB', value: `${freeboardRemaining.toFixed(2)} m`, rawNumber: freeboardRemaining, unit: 'm' },
    { label: 'Max Storage Consumed', symbol: 'S_max', value: `${(maxStorageUsed / 1000).toFixed(1)}k m³ (${((maxStorageUsed / detentionVolMax) * 100).toFixed(0)}%)`, rawNumber: maxStorageUsed, unit: 'm³' },
    { label: 'Detention Capacity', symbol: 'S_cap', value: `${(detentionVolMax / 1000).toFixed(1)}k m³`, rawNumber: detentionVolMax, unit: 'm³' },
  ];

  const warnings = evaluateWarnings('FLOOD_MANAGEMENT', {
    peakInflow,
    peakOutflow,
    maxStorageUsed,
    detentionCapacity: detentionVolMax,
    isOvertopping,
  });

  const worstSeverity = getWorstSeverity(warnings);

  return {
    category: 'FLOOD_MANAGEMENT',
    primarySummary: `${peakAttenuationPercent.toFixed(0)}% peak attenuation (${peakInflow.toFixed(0)} → ${peakOutflow.toFixed(0)} m³/s)`,
    secondarySummary: `${freeboardRemaining > 0 ? `${freeboardRemaining.toFixed(2)} m freeboard` : 'OVERFLOW BREACH RISK'}`,
    metrics,
    calculationSteps,
    warnings,
    overallRiskSeverity: worstSeverity,
    governingTheory: 'Continuity Storage Equation (dStorage/dt = Inflow - Outflow) and Level-Pool Routing with Broad-Crested Emergency Spillway.',
    assumptions: [
      `Synthetic triangular storm runoff hydrograph over ${durationHours.toFixed(1)} hours duration.`,
      `Detention storage capacity S_cap = ${(detentionVolMax / 1000).toFixed(1)} thousand m³.`,
      `Emergency spillway width = ${spillwayW.toFixed(1)} m activated at depth > ${(basinDepthMax - 1.5).toFixed(1)} m.`,
    ],
    uncertainties: [
      'Secondary back-to-back storm events arriving before the basin drains will find zero residual storage.',
      'Siltation accumulation progressively reduces active flood detention volume each monsoon season.',
    ],
    schematicData: {
      upstreamDepthM: peakStage,
      downstreamDepthM: 0.8,
      structureHeightM: basinDepthMax,
      crestElevationM: basinDepthMax,
      effectiveWidthM: 35.0,
      waterVelocityMs: 1.2,
      isOvertopping,
      isSupercritical: false,
      hydraulicJumpOccurred: false,
      froudeNumber: 0.3,
      flowDirection: 'LEFT_TO_RIGHT',
      waterSurfaceProfile: [
        { x: 0, y: peakStage },
        { x: 50, y: peakStage },
        { x: 100, y: isOvertopping ? peakStage : 0.8 },
      ],
    },
  };
}
