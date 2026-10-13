import {
  CalculationStep,
  HydraulicCalculationResult,
  HydraulicInputs,
  MetricOutput,
} from './types.ts';
import { evaluateWarnings, getWorstSeverity } from './warningEngine.ts';

/**
 * Irrigation Distribution Systems Hydraulic Model
 * Implements command area water balance, crop duty (D) and delta (Δ) relationships,
 * canal network delivery efficiency, rotational turn allocation, and tail-end deficit.
 */
export function calculateIrrigationSystems(inputs: HydraulicInputs): HydraulicCalculationResult {
  const Q_head = Math.max(0.1, inputs.discharge ?? 12.5); // Canal headworks discharge (m³/s)
  const commandHa = Math.max(10.0, inputs.commandAreaHa ?? 8500.0); // Total culturable command area (hectares)
  const dutyHaPerCumec = Math.max(100.0, inputs.waterDutyHaPerCumec ?? 750.0); // Historical crop duty (ha per m³/s)
  const canalLengthKm = Math.max(1.0, (inputs.length ?? 45000) / 1000); // Main canal length (km)
  const basePeriodDays = 120.0; // Crop base period (paddy/sugarcane)

  // 1. Canal Conveyance Efficiency (η_c)
  // Loss of ~0.4% to 0.7% per kilometer of unlined earthen canal
  const lossRatePerKm = 0.005;
  const conveyanceEfficiency = Math.max(0.45, Math.min(0.95, 1.0 - (lossRatePerKm * canalLengthKm)));
  const Q_field_delivered = Q_head * conveyanceEfficiency;

  // 2. Crop Delta (Depth of water required over base period in meters)
  // Standard agronomic formula: Delta = 8.64 * B / D (in meters)
  const deltaM = (8.64 * basePeriodDays) / dutyHaPerCumec;
  const deltaCm = deltaM * 100;

  // 3. Supported Command Area vs Actual Target Area
  const supportedHa = Q_field_delivered * dutyHaPerCumec;
  const adequacyRatio = supportedHa / commandHa;
  const tailEndDeficitHa = Math.max(0, commandHa - supportedHa);

  // 4. Daily Volume Delivered (m³/day)
  const dailyVolumeM3 = Q_field_delivered * 86400;

  // 5. Agrarian Rotational Turn (*Murai* / *Warabandi*)
  const hoursPerHectare = ((dailyVolumeM3 * 7) / (commandHa * (deltaM / 17))).toFixed(1);

  const calculationSteps: CalculationStep[] = [
    {
      name: 'Canal Conveyance Efficiency',
      symbol: '\\eta_c',
      formulaLatex: '\\eta_c = 1.0 - (k_{loss} \\cdot L_{km})',
      substitution: `1.0 - (0.005 \\times ${canalLengthKm.toFixed(1)} \\text{ km})`,
      resultValue: conveyanceEfficiency,
      unit: 'ratio',
      notes: 'Percentage of water diverted at headworks surviving seepage & evaporation to field.',
    },
    {
      name: 'Delivered Field Discharge',
      symbol: 'Q_{field}',
      formulaLatex: 'Q_{field} = Q_{head} \\cdot \\eta_c',
      substitution: `${Q_head.toFixed(2)} \\text{ m}^3/\\text{s} \\times ${conveyanceEfficiency.toFixed(3)}`,
      resultValue: Q_field_delivered,
      unit: 'm³/s',
      notes: 'Net effective discharge reaching village distributary network.',
    },
    {
      name: 'Crop Water Delta Depth',
      symbol: '\\Delta',
      formulaLatex: '\\Delta = \\frac{8.64 \\cdot B}{D}',
      substitution: `\\frac{8.64 \\times ${basePeriodDays.toFixed(0)}}{${dutyHaPerCumec.toFixed(0)}}`,
      resultValue: deltaM,
      unit: 'm',
      notes: 'Total seasonal depth of irrigation water required across crop base period.',
    },
    {
      name: 'Irrigation Adequacy Ratio',
      symbol: 'R_{adeq}',
      formulaLatex: 'R_{adeq} = \\frac{Q_{field} \\cdot D}{A_{command}}',
      substitution: `\\frac{${Q_field_delivered.toFixed(2)} \\times ${dutyHaPerCumec.toFixed(0)}}{${commandHa.toFixed(0)}}`,
      resultValue: adequacyRatio,
      unit: 'ratio',
      notes: adequacyRatio >= 1.0 ? 'Full command water security achieved.' : 'Water deficit! Tail-end villages face drought.',
    },
  ];

  const metrics: MetricOutput[] = [
    { label: 'Water Adequacy Ratio', symbol: 'R_adeq', value: `${(adequacyRatio * 100).toFixed(1)}% (${adequacyRatio >= 1 ? 'Surplus' : 'Deficit'})`, rawNumber: adequacyRatio, unit: '%', highlight: true },
    { label: 'Command Area Supported', symbol: 'A_supp', value: `${supportedHa.toFixed(0)} hectares (of ${commandHa.toFixed(0)} ha)`, rawNumber: supportedHa, unit: 'ha', highlight: true },
    { label: 'Headworks Diverted Flow ($Q_{head}$)', symbol: 'Q_head', value: `${Q_head.toFixed(2)} m³/s`, rawNumber: Q_head, unit: 'm³/s' },
    { label: 'Delivered Field Flow ($Q_{field}$)', symbol: 'Q_field', value: `${Q_field_delivered.toFixed(2)} m³/s`, rawNumber: Q_field_delivered, unit: 'm³/s' },
    { label: 'Conveyance Efficiency ($\\eta_c$)', symbol: 'eta_c', value: `${(conveyanceEfficiency * 100).toFixed(1)}%`, rawNumber: conveyanceEfficiency, unit: '%' },
    { label: 'Seasonal Crop Delta ($\\Delta$)', symbol: 'Delta', value: `${deltaCm.toFixed(1)} cm (${deltaM.toFixed(3)} m)`, rawNumber: deltaM, unit: 'm' },
    { label: 'Crop Water Duty ($D$)', symbol: 'D', value: `${dutyHaPerCumec.toFixed(0)} ha/(m³/s)`, rawNumber: dutyHaPerCumec, unit: 'ha/(m³/s)' },
    { label: 'Tail-End Deficit Area', symbol: 'A_def', value: `${tailEndDeficitHa.toFixed(0)} ha at risk`, rawNumber: tailEndDeficitHa, unit: 'ha' },
    { label: 'Daily Delivered Volume', symbol: 'V_day', value: `${(dailyVolumeM3 / 1000).toFixed(1)}k m³/day`, rawNumber: dailyVolumeM3, unit: 'm³/day' },
  ];

  const warnings = evaluateWarnings('IRRIGATION_SYSTEMS', {
    adequacyRatio,
    tailEndDeficit: tailEndDeficitHa,
    discharge: Q_head,
  });

  const worstSeverity = getWorstSeverity(warnings);

  return {
    category: 'IRRIGATION_SYSTEMS',
    primarySummary: `${(adequacyRatio * 100).toFixed(0)}% crop water adequacy (${supportedHa.toFixed(0)} / ${commandHa.toFixed(0)} ha)`,
    secondarySummary: `${(conveyanceEfficiency * 100).toFixed(0)}% conveyance efficiency over ${canalLengthKm.toFixed(0)} km`,
    metrics,
    calculationSteps,
    warnings,
    overallRiskSeverity: worstSeverity,
    governingTheory: "Agronomic Duty-Delta Water Balance, Canal Seepage Transmission Losses, and Command Area Distribution Equations.",
    assumptions: [
      `Culturable command area = ${commandHa.toFixed(0)} ha with design duty = ${dutyHaPerCumec.toFixed(0)} ha/(m³/s).`,
      `Base period B = ${basePeriodDays.toFixed(0)} days for wetland paddy / mixed crops.`,
      `Transmission seepage loss rate = ${(lossRatePerKm * 100).toFixed(2)}% per km along main distribution artery.`,
    ],
    uncertainties: [
      'Tail-end water theft, unauthorized canal breaches (*Setubheda*), and weed friction can increase actual transmission loss to over 35%.',
      'Monsoon rainfall variability alters effective crop duty requirement by ±25% across crop growth cycles.',
    ],
    schematicData: {
      upstreamDepthM: 1.8,
      downstreamDepthM: 1.0,
      structureHeightM: 2.2,
      crestElevationM: 2.2,
      effectiveWidthM: 6.0,
      waterVelocityMs: 0.8,
      isOvertopping: false,
      isSupercritical: false,
      hydraulicJumpOccurred: false,
      froudeNumber: 0.25,
      flowDirection: 'LEFT_TO_RIGHT',
      waterSurfaceProfile: [
        { x: 0, y: 1.8 },
        { x: 50, y: 1.4 },
        { x: 100, y: 1.0 },
      ],
    },
  };
}
