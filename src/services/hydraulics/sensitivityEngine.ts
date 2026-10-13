import {
  HydraulicCalculationResult,
  HydraulicInputs,
  SensitivityAnalysis,
  SensitivitySweepPoint,
  SimulationCategory,
} from './types.ts';
import { calculateHydraulics } from './engine.ts';

interface ParameterConfig {
  key: keyof HydraulicInputs;
  label: string;
  unit: string;
  min: number;
  max: number;
  steps: number;
  outputKey: string;
  outputLabel: string;
  outputUnit: string;
}

const CATEGORY_SENSITIVITY_CONFIGS: Record<SimulationCategory, ParameterConfig[]> = {
  CHANNELS_CANALS: [
    {
      key: 'discharge',
      label: 'Flow Discharge (Q)',
      unit: 'm³/s',
      min: 0.5,
      max: 25.0,
      steps: 10,
      outputKey: 'Mean Velocity (V)',
      outputLabel: 'Mean Flow Velocity',
      outputUnit: 'm/s',
    },
    {
      key: 'bedSlope',
      label: 'Canal Bed Slope (S)',
      unit: 'm/m',
      min: 0.0001,
      max: 0.005,
      steps: 10,
      outputKey: 'Mean Velocity (V)',
      outputLabel: 'Mean Flow Velocity',
      outputUnit: 'm/s',
    },
    {
      key: 'width',
      label: 'Bottom Bed Width (b)',
      unit: 'm',
      min: 1.0,
      max: 12.0,
      steps: 10,
      outputKey: 'Bank Freeboard',
      outputLabel: 'Available Bank Freeboard',
      outputUnit: 'm',
    },
  ],
  DIVERSION_WEIRS: [
    {
      key: 'discharge',
      label: 'River Flood Inflow',
      unit: 'm³/s',
      min: 100.0,
      max: 2500.0,
      steps: 10,
      outputKey: 'Total Weir Capacity (Q_cap)',
      outputLabel: 'Weir Capacity',
      outputUnit: 'm³/s',
    },
    {
      key: 'upstreamWaterLevel',
      label: 'Weir Crest Head (H₁)',
      unit: 'm',
      min: 0.5,
      max: 5.0,
      steps: 10,
      outputKey: 'Apron Toe Velocity (V_1)',
      outputLabel: 'Downstream Apron Velocity',
      outputUnit: 'm/s',
    },
  ],
  DAMS_EMBANKMENTS: [
    {
      key: 'upstreamWaterLevel',
      label: 'Reservoir Water Level (H_w)',
      unit: 'm',
      min: 2.0,
      max: 15.0,
      steps: 10,
      outputKey: 'Sliding Factor of Safety',
      outputLabel: 'Sliding Factor of Safety',
      outputUnit: 'FOS',
    },
    {
      key: 'height',
      label: 'Embankment Height (H_dam)',
      unit: 'm',
      min: 5.0,
      max: 20.0,
      steps: 10,
      outputKey: 'Freeboard Remaining',
      outputLabel: 'Crest Freeboard Remaining',
      outputUnit: 'm',
    },
  ],
  DRAINAGE_SYSTEMS: [
    {
      key: 'discharge',
      label: 'Storm Inflow (Q_in)',
      unit: 'm³/s',
      min: 0.1,
      max: 3.5,
      steps: 10,
      outputKey: 'Surcharge Ratio',
      outputLabel: 'Sewer Surcharge Ratio',
      outputUnit: 'x',
    },
    {
      key: 'bedSlope',
      label: 'Invert Gradient (S)',
      unit: 'm/m',
      min: 0.0005,
      max: 0.010,
      steps: 10,
      outputKey: 'Conduit Capacity (Q_full)',
      outputLabel: 'Full Pipe Capacity',
      outputUnit: 'm³/s',
    },
  ],
  FLOOD_MANAGEMENT: [
    {
      key: 'peakInflow',
      label: 'Peak Flood Inflow (I_peak)',
      unit: 'm³/s',
      min: 50.0,
      max: 600.0,
      steps: 10,
      outputKey: 'Peak Flood Attenuation',
      outputLabel: 'Peak Attenuation',
      outputUnit: '%',
    },
    {
      key: 'detentionVolumeM3',
      label: 'Detention Capacity',
      unit: 'm³',
      min: 50000.0,
      max: 1200000.0,
      steps: 10,
      outputKey: 'Remaining Freeboard',
      outputLabel: 'Dyke Freeboard Remaining',
      outputUnit: 'm',
    },
  ],
  SLUICES_OUTLETS: [
    {
      key: 'upstreamWaterLevel',
      label: 'Upstream Sump Head (H_us)',
      unit: 'm',
      min: 1.0,
      max: 10.0,
      steps: 10,
      outputKey: 'Torricelli Jet Velocity (V)',
      outputLabel: 'Efflux Jet Velocity',
      outputUnit: 'm/s',
    },
    {
      key: 'gateOpening',
      label: 'Gate Opening (w)',
      unit: 'm',
      min: 0.1,
      max: 1.8,
      steps: 10,
      outputKey: 'Sluice Discharge (Q)',
      outputLabel: 'Release Discharge',
      outputUnit: 'm³/s',
    },
  ],
  IRRIGATION_SYSTEMS: [
    {
      key: 'discharge',
      label: 'Headworks Diverted Flow',
      unit: 'm³/s',
      min: 2.0,
      max: 30.0,
      steps: 10,
      outputKey: 'Water Adequacy Ratio',
      outputLabel: 'Crop Adequacy Ratio',
      outputUnit: '%',
    },
    {
      key: 'commandAreaHa',
      label: 'Culturable Command Area',
      unit: 'ha',
      min: 2000.0,
      max: 25000.0,
      steps: 10,
      outputKey: 'Water Adequacy Ratio',
      outputLabel: 'Crop Adequacy Ratio',
      outputUnit: '%',
    },
  ],
  RESERVOIRS_TANKS: [
    {
      key: 'upstreamWaterLevel',
      label: 'Reservoir Water Depth (y)',
      unit: 'm',
      min: 1.0,
      max: 14.0,
      steps: 10,
      outputKey: 'Drought Reserve Duration',
      outputLabel: 'Drought Supply Duration',
      outputUnit: 'days',
    },
    {
      key: 'dailyDomesticDemandM3',
      label: 'Daily Community Draw',
      unit: 'm³/day',
      min: 50.0,
      max: 800.0,
      steps: 10,
      outputKey: 'Drought Reserve Duration',
      outputLabel: 'Drought Supply Duration',
      outputUnit: 'days',
    },
  ],
};

export function getAvailableSensitivityParameters(category: SimulationCategory): ParameterConfig[] {
  return CATEGORY_SENSITIVITY_CONFIGS[category] || CATEGORY_SENSITIVITY_CONFIGS.CHANNELS_CANALS;
}

/**
 * Executes a parameter sensitivity analysis comparing a baseline scenario to a modified scenario,
 * computing percentage shifts, and generating a response curve across the parameter's operating range.
 */
export function runSensitivityAnalysis({
  category,
  baselineInputs,
  parameterKey,
  modifiedValue,
}: {
  category: SimulationCategory;
  baselineInputs: HydraulicInputs;
  parameterKey: keyof HydraulicInputs;
  modifiedValue: number;
}): SensitivityAnalysis {
  const configs = getAvailableSensitivityParameters(category);
  const cfg = configs.find((c) => c.key === parameterKey) || configs[0];

  const baselineVal = Number(baselineInputs[cfg.key] ?? (cfg.min + cfg.max) / 2);
  const modifiedInputs = { ...baselineInputs, [cfg.key]: modifiedValue };

  // 1. Run baseline calculation
  const baselineResult = calculateHydraulics(category, baselineInputs);
  const modifiedResult = calculateHydraulics(category, modifiedInputs);

  // Extract designated primary output
  const findMetric = (res: HydraulicCalculationResult, label: string) => {
    const q = label.toLowerCase();
    const m = res.metrics.find((item) => {
      const l = item.label.toLowerCase();
      const s = (item.symbol || '').toLowerCase();
      return (
        l.includes(q) ||
        q.includes(l) ||
        s === q ||
        (q.includes('velocity') && l.includes('velocity')) ||
        (q.includes('capacity') && l.includes('capacity')) ||
        (q.includes('freeboard') && l.includes('freeboard')) ||
        (q.includes('sliding') && l.includes('sliding')) ||
        (q.includes('surcharge') && l.includes('surcharge')) ||
        (q.includes('attenuation') && l.includes('attenuation')) ||
        (q.includes('reserve') && l.includes('reserve')) ||
        (q.includes('adequacy') && l.includes('adequacy'))
      );
    });
    return m?.rawNumber ?? (res.metrics[0]?.rawNumber ?? 0);
  };

  const baselineOut = findMetric(baselineResult, cfg.outputLabel);
  const modifiedOut = findMetric(modifiedResult, cfg.outputLabel);

  const paramPercentChange = baselineVal !== 0 ? ((modifiedValue - baselineVal) / baselineVal) * 100 : 0;
  const outputPercentChange = baselineOut !== 0 ? ((modifiedOut - baselineOut) / Math.abs(baselineOut)) * 100 : 0;

  // 2. Generate multi-point response curve across range
  const sweepPoints: SensitivitySweepPoint[] = [];
  const pMin = Math.min(cfg.min, Math.min(baselineVal, modifiedValue) * 0.7);
  const pMax = Math.max(cfg.max, Math.max(baselineVal, modifiedValue) * 1.3);
  const stepSize = (pMax - pMin) / cfg.steps;

  for (let i = 0; i <= cfg.steps; i++) {
    const pVal = pMin + i * stepSize;
    const sweepInputs = { ...baselineInputs, [cfg.key]: pVal };
    const sweepResult = calculateHydraulics(category, sweepInputs);
    const outVal = findMetric(sweepResult, cfg.outputLabel);

    sweepPoints.push({
      parameterValue: Number(pVal.toFixed(3)),
      outputValue: Number(outVal.toFixed(3)),
      riskSeverity: sweepResult.overallRiskSeverity,
    });
  }

  // 3. Explain risk transition
  let explanation = '';
  if (modifiedResult.overallRiskSeverity === baselineResult.overallRiskSeverity) {
    explanation = `Changing ${cfg.label} by ${paramPercentChange > 0 ? '+' : ''}${paramPercentChange.toFixed(1)}% altered ${cfg.outputLabel} by ${outputPercentChange > 0 ? '+' : ''}${outputPercentChange.toFixed(1)}% without shifting the overall ${baselineResult.overallRiskSeverity} status.`;
  } else {
    explanation = `Changing ${cfg.label} from ${baselineVal.toFixed(2)} to ${modifiedValue.toFixed(2)} ${cfg.unit} caused the risk severity to transition from ${baselineResult.overallRiskSeverity} to ${modifiedResult.overallRiskSeverity}.`;
  }

  return {
    parameterKey: cfg.key,
    parameterLabel: cfg.label,
    unit: cfg.unit,
    baselineValue: baselineVal,
    modifiedValue,
    percentChange: paramPercentChange,
    baselineOutputValue: baselineOut,
    modifiedOutputValue: modifiedOut,
    outputPercentChange,
    outputLabel: cfg.outputLabel,
    outputUnit: cfg.outputUnit,
    sweepPoints,
    riskShiftExplanation: explanation,
  };
}
